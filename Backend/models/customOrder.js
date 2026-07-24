const { db } = require("../config/db");

// Custom (bespoke) orders. Kept in a dedicated table that auto-creates on
// startup so it deploys over FTP with no manual migration. Each row carries
// order_type = 'B2B Custom' so it can be listed alongside regular orders.
const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS custom_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_type VARCHAR(32) NOT NULL DEFAULT 'B2B Custom',
  images TEXT DEFAULT NULL,
  weight VARCHAR(50) DEFAULT NULL,
  purity VARCHAR(50) DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  delivery_date DATE DEFAULT NULL,
  remark TEXT DEFAULT NULL,
  status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
)`;

function ensureTable() {
  db.query(CREATE_TABLE_SQL, (err) => {
    if (err) {
      console.error("custom_orders table init failed:", err.message);
    }
  });
}
ensureTable();

function createCustomOrder(data, callback) {
  const sql = `INSERT INTO custom_orders
    (user_id, order_type, images, weight, purity, quantity, delivery_date, remark, status)
    VALUES (?, 'B2B Custom', ?, ?, ?, ?, ?, ?, 'pending')`;
  const values = [
    data.user_id,
    data.images ? JSON.stringify(data.images) : null,
    data.weight || null,
    data.purity || null,
    data.quantity || 1,
    data.delivery_date || null,
    data.remark || null,
  ];
  db.query(sql, values, callback);
}

function getByUser(userId, callback) {
  db.query(
    `SELECT * FROM custom_orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    callback
  );
}

function getById(id, callback) {
  db.query(`SELECT * FROM custom_orders WHERE id = ?`, [id], callback);
}

// Admin: all custom orders with the requesting business's details.
function getAll(callback) {
  db.query(
    `SELECT co.*,
            u.name AS user_name,
            u.business_name AS business_name,
            u.email AS user_email,
            u.phone_number AS user_phone
     FROM custom_orders co
     LEFT JOIN users u ON co.user_id = u.id
     ORDER BY co.created_at DESC`,
    callback
  );
}

function updateStatus(id, status, callback) {
  db.query(
    `UPDATE custom_orders SET status = ? WHERE id = ?`,
    [status, id],
    callback
  );
}

module.exports = { createCustomOrder, getByUser, getById, getAll, updateStatus };
