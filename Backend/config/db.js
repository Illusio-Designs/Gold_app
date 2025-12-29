const mysql = require("mysql2");
require("dotenv").config();

// Create connection pool for better performance and connection management
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  connectionLimit: 10,
  // mysql2 pool uses `acquireTimeout` only on some APIs; it triggers warnings in newer mysql2.
  // Keeping config minimal avoids future hard errors.
  // Removed deprecated options: timeout, reconnect
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ Database connected successfully");
  console.log("🔧 Connected to:", process.env.DB_NAME);
  connection.release();
});

module.exports = { db };
