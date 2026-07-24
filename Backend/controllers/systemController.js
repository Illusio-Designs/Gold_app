const { db } = require("../config/db");

// The exact phrase the client must send to authorise a full wipe.
const CONFIRM_PHRASE = "DELETE ALL DATA";

// Tables cleared on a full reset. Admin users are preserved separately below.
// Ordered children-before-parents, but we also disable FK checks to be safe.
const WIPE_TABLES = [
  "account_deletion_requests",
  "product_stock_history",
  "cart_items",
  "orders",
  "notifications",
  "sliders",
  "products",
  "categories",
];

// Run a list of SQL statements in sequence. A missing table (ER_NO_SUCH_TABLE)
// is treated as a no-op so the wipe never fails just because an optional table
// isn't present in this database.
function runSequential(statements, done) {
  let i = 0;
  const next = () => {
    if (i >= statements.length) return done(null);
    const { sql, params = [] } = statements[i++];
    db.query(sql, params, (err) => {
      if (err && err.code !== "ER_NO_SUCH_TABLE") return done(err);
      next();
    });
  };
  next();
}

// POST /api/system/wipe-data  (admin only)
// Body: { confirm: "DELETE ALL DATA" }
// Wipes all business data. Admin users are kept so the dashboard stays usable.
function wipeAllData(req, res) {
  const { confirm } = req.body || {};

  if (confirm !== CONFIRM_PHRASE) {
    return res.status(400).json({
      error: `Confirmation phrase mismatch. Type exactly: ${CONFIRM_PHRASE}`,
    });
  }

  const statements = [
    { sql: "SET FOREIGN_KEY_CHECKS = 0" },
    ...WIPE_TABLES.map((t) => ({ sql: `DELETE FROM \`${t}\`` })),
    // Keep admin accounts so the operator is not locked out.
    { sql: "DELETE FROM `users` WHERE type <> 'admin'" },
    { sql: "SET FOREIGN_KEY_CHECKS = 1" },
  ];

  runSequential(statements, (err) => {
    if (err) {
      // Best-effort: make sure FK checks are re-enabled even on failure.
      db.query("SET FOREIGN_KEY_CHECKS = 1", () => {});
      return res.status(500).json({ error: "Data wipe failed: " + err.message });
    }
    return res.json({
      success: true,
      message: "All business data wiped. Admin accounts were preserved.",
    });
  });
}

module.exports = { wipeAllData };
