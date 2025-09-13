const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});

console.log("🔍 Checking all login request statuses for user 2...");
db.query(
  "SELECT id, user_id, status, created_at FROM login_requests WHERE user_id = 2 ORDER BY created_at DESC",
  (err, results) => {
    if (err) {
      console.error("Error:", err);
      return;
    }

    console.log("📋 All login requests for user 2:");
    results.forEach((req, idx) => {
      console.log(
        `Request ${idx + 1}: ID=${req.id}, Status=${req.status}, Created=${
          req.created_at
        }`
      );
    });

    // Check what the API is looking for
    console.log('\n🔍 API is looking for status = "approved"');
    console.log('🔍 But we have status = "logged_in"');
    console.log(
      '🔍 This is why the API returns "No approved login request found"'
    );

    db.end();
  }
);
