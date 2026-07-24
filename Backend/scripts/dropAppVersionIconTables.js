const { db } = require("../config/db");

// One-off cleanup: drop the now-removed dynamic app-version / app-icon tables.
// The app relies on the App Store / Play Store for updates and ships its icon
// in the build, so these server-side tables are no longer used.
//
// Run once against the target database:
//   node scripts/dropAppVersionIconTables.js
//
// Safe to run multiple times (DROP TABLE IF EXISTS is a no-op if absent).
const statements = [
  "SET FOREIGN_KEY_CHECKS = 0",
  "DROP TABLE IF EXISTS app_icons",
  "DROP TABLE IF EXISTS app_versions",
  "SET FOREIGN_KEY_CHECKS = 1",
];

function run(i) {
  if (i >= statements.length) {
    console.log("✅ app_versions and app_icons tables dropped (if they existed).");
    db.end && db.end();
    process.exit(0);
    return;
  }
  db.query(statements[i], (err) => {
    if (err) {
      console.error("❌ Error running:", statements[i], "-", err.message);
      process.exit(1);
      return;
    }
    console.log("• ok:", statements[i]);
    run(i + 1);
  });
}

run(0);
