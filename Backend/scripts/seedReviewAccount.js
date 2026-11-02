// Create (or refresh) the Play Store / App Store reviewer demo account.
//
// The reviewer demo login (phone 7600046416) needs a matching row in the users
// table — if it's missing (e.g. after a "Wipe all data"), the login returns
// "User not found". This script inserts an approved business account for that
// number, idempotently (it won't create a duplicate).
//
// Usage (run where the DB is reachable, with Backend/.env in place):
//   node Backend/scripts/seedReviewAccount.js
//
// Login afterwards: phone 7600046416, OTP 123456 (the app's demo bypass).

const { db } = require("../config/db");
const bcrypt = require("bcrypt");

const REVIEW_PHONE = "7600046416";

async function main() {
  db.query(
    "SELECT id, type, status FROM users WHERE phone_number = ?",
    [REVIEW_PHONE],
    async (err, rows) => {
      if (err) {
        console.error("Lookup failed:", err.message);
        process.exit(1);
      }

      if (rows && rows.length > 0) {
        // Already exists — make sure it's approved so B2B ordering works too.
        db.query(
          "UPDATE users SET status = 'approved' WHERE phone_number = ? AND type = 'business'",
          [REVIEW_PHONE],
          (uErr) => {
            if (uErr) {
              console.error("Update failed:", uErr.message);
              process.exit(1);
            }
            console.log(
              `Review account already exists (id ${rows[0].id}, type ${rows[0].type}). Ensured approved.`
            );
            process.exit(0);
          }
        );
        return;
      }

      // Not found — create an approved business demo account.
      const password = await bcrypt.hash("review-demo-" + Date.now(), 10);
      const sql = `INSERT INTO users (type, name, email, password, phone_number, business_name, status)
                   VALUES ('business', ?, ?, ?, ?, ?, 'approved')`;
      const values = [
        "Store Review",
        `review+${REVIEW_PHONE}@amrutkumargovinddasllp.com`,
        password,
        REVIEW_PHONE,
        "Amrut Jewels (Store Review)",
      ];
      db.query(sql, values, (iErr, result) => {
        if (iErr) {
          console.error("Insert failed:", iErr.message);
          process.exit(1);
        }
        console.log(
          `Review account created (id ${result.insertId}). Login: phone ${REVIEW_PHONE}, OTP 123456.`
        );
        process.exit(0);
      });
    }
  );
}

main().catch((e) => {
  console.error("Unexpected error:", e.message);
  process.exit(1);
});
