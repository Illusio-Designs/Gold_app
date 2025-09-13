const { db } = require("../config/db");
const bcrypt = require("bcrypt");

async function createUser(user, callback) {
  try {
    // Check for denied business user with same name and phone_number
    if (user.type === "business") {
      const checkDenied = `SELECT * FROM users WHERE type = 'business' AND name = ? AND phone_number = ? AND status = 'denied'`;
      db.query(
        checkDenied,
        [user.name, user.phone_number],
        async (err, results) => {
          if (err) return callback(err);
          if (results.length > 0) {
            return callback(
              new Error("Registration denied for this name and phone number.")
            );
          }
          // Proceed to create user
          await insertUser(user, callback);
        }
      );
    } else {
      // Admin or other user types
      await insertUser(user, callback);
    }
  } catch (err) {
    callback(err);
  }
}

async function insertUser(user, callback) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const sql = `INSERT INTO users (
    type, name, email, password, image, phone_number, address_line1, address_line2, landmark, state, city, country, gst_number, pan_number, business_name, status, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    user.type,
    user.name,
    user.email,
    hashedPassword,
    user.image || null,
    user.phone_number || null,
    user.address_line1 || null,
    user.address_line2 || null,
    user.landmark || null,
    user.state || null,
    user.city || null,
    user.country || null,
    user.gst_number || null,
    user.pan_number || null,
    user.business_name || null,
    user.status || (user.type === "business" ? "pending" : null),
    user.remarks || null,
  ];
  db.query(sql, values, callback);
}

function getUserById(id, callback) {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [id], callback);
}

module.exports = {
  createUser,
  getUserById,
};
