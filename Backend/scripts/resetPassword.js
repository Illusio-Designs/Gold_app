// One-off password reset for a single account.
//
// Why this exists: accounts created from the dashboard BEFORE the double-hash
// fix have a password that was bcrypt-hashed twice, so they can never log in.
// This script sets a fresh, correctly (single) hashed password for one account.
//
// Usage (run on a machine that can reach the DB, with the Backend/.env in place):
//   node Backend/scripts/resetPassword.js <email> "<newPassword>"
//
// It only touches the one account whose email you pass. It never deletes data.

const { db } = require("../config/db");
const bcrypt = require("bcrypt");

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node Backend/scripts/resetPassword.js <email> "<newPassword>"');
    process.exit(1);
  }
  if (newPassword.length < 6) {
    console.error("Refusing to set a password shorter than 6 characters.");
    process.exit(1);
  }

  // Hash exactly once — matches how the app hashes passwords everywhere now.
  const hashed = await bcrypt.hash(newPassword, 10);

  db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashed, email],
    (err, result) => {
      if (err) {
        console.error("Failed to reset password:", err.message);
        process.exit(1);
      }
      if (result.affectedRows === 0) {
        console.error(`No account found with email: ${email}`);
        process.exit(1);
      }
      console.log(`Password reset for ${email}. They can now log in with the new password.`);
      process.exit(0);
    }
  );
}

main().catch((e) => {
  console.error("Unexpected error:", e.message);
  process.exit(1);
});
