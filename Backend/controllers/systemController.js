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
      db.query("SET FOREIGN_KEY_CHECKS = 1", (e) => { if (e) console.error("[system] re-enable FK checks:", e.message); });
      return res.status(500).json({ error: "Data wipe failed: " + err.message });
    }
    return res.json({
      success: true,
      message: "All business data wiped. Admin accounts were preserved.",
    });
  });
}

// ---------------------------------------------------------------------------
// Reset for store review: clear transactional + user data but KEEP the catalog
// (products, categories, sliders, media) so reviewers see a clean, browsable
// app. Admin accounts are preserved.
const RESET_CONFIRM_PHRASE = "RESET FOR REVIEW";

// Cleared on a review reset. Catalog tables are intentionally NOT here.
const RESET_TABLES = [
  "account_deletion_requests",
  "product_stock_history",
  "cart_items",
  "custom_orders",
  "orders",
  "notifications",
  "login_requests",
  "notification_tokens",
];

// POST /api/system/reset-review  (admin only)
// Body: { confirm: "RESET FOR REVIEW" }
function resetForReview(req, res) {
  const { confirm } = req.body || {};

  if (confirm !== RESET_CONFIRM_PHRASE) {
    return res.status(400).json({
      error: `Confirmation phrase mismatch. Type exactly: ${RESET_CONFIRM_PHRASE}`,
    });
  }

  const statements = [
    { sql: "SET FOREIGN_KEY_CHECKS = 0" },
    ...RESET_TABLES.map((t) => ({ sql: `DELETE FROM \`${t}\`` })),
    // Remove non-admin accounts (wholesalers/consumers); keep admins.
    { sql: "DELETE FROM `users` WHERE type <> 'admin'" },
    // Make the whole catalog available again so reviewers see every product.
    { sql: "UPDATE `products` SET stock_status = 'available'" },
    { sql: "SET FOREIGN_KEY_CHECKS = 1" },
  ];

  runSequential(statements, (err) => {
    if (err) {
      db.query("SET FOREIGN_KEY_CHECKS = 1", (e) => { if (e) console.error("[system] re-enable FK checks:", e.message); });
      return res.status(500).json({ error: "Reset failed: " + err.message });
    }
    return res.json({
      success: true,
      message:
        "Cleared orders, custom orders, carts and non-admin users. Products, categories, sliders and media were kept.",
    });
  });
}

module.exports = { wipeAllData, resetForReview };
