const { db } = require("../config/db");

// Older B2B builds expect an object envelope and optional category filter.
async function getCatalog(req, res) {
  try {
    const category = req.query.category;
    const params = [];
    let sql = `
      SELECT p.*, c.name AS category, c.name AS group_name,
        (p.stock_status = 'available') AS in_stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'active' AND p.stock_status = 'available'`;
    if (typeof category === "string" && category) {
      sql += " AND (CAST(p.category_id AS CHAR) = ? OR c.name = ?)";
      params.push(category, category);
    }
    const [data] = await db.promise().query(sql + " ORDER BY p.created_at DESC", params);
    return res.json({ success: true, data, count: data.length });
  } catch {
    return res.status(500).json({ success: false, error: "Catalog unavailable", data: [] });
  }
}

module.exports = { getCatalog };
