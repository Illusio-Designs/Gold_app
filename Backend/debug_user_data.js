const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});

console.log("🔍 Checking user 2 login request...");
db.query(
  'SELECT * FROM login_requests WHERE user_id = 2 AND status = "logged_in" ORDER BY created_at DESC LIMIT 1',
  (err, results) => {
    if (err) {
      console.error("Error:", err);
      return;
    }

    if (results.length > 0) {
      const request = results[0];
      console.log("📋 Login Request Found:");
      console.log("ID:", request.id);
      console.log("User ID:", request.user_id);
      console.log("Category IDs:", request.category_ids);
      console.log("Status:", request.status);

      // Parse the requested categories
      let requestedCategories = [];
      try {
        requestedCategories = JSON.parse(request.category_ids);
        console.log("📝 Parsed Requested Categories:", requestedCategories);
      } catch (e) {
        console.error("❌ Error parsing category_ids:", e);
      }

      // Check what categories should be returned
      if (requestedCategories.length > 0) {
        const placeholders = requestedCategories.map(() => "?").join(",");
        const sql = `SELECT * FROM categories WHERE id IN (${placeholders}) AND status = 'active' ORDER BY name`;
        console.log("🔍 SQL Query:", sql);
        console.log("🔍 Parameters:", requestedCategories);

        db.query(sql, requestedCategories, (err2, categoryResults) => {
          if (err2) {
            console.error("❌ Category query error:", err2);
          } else {
            console.log(
              "✅ Categories that SHOULD be returned:",
              categoryResults.length
            );
            categoryResults.forEach((cat, idx) => {
              console.log(
                `Category ${idx + 1}: ID=${cat.id}, Name=${cat.name}, Status=${
                  cat.status
                }`
              );
            });
          }

          // Check what products should be returned
          const productSql = `SELECT DISTINCT p.*, c.name as category_name, c.image as category_image FROM products p JOIN categories c ON p.category_id = c.id WHERE p.category_id IN (${placeholders}) AND p.status = 'active' AND c.status = 'active' ORDER BY p.created_at DESC`;
          console.log("🔍 Product SQL Query:", productSql);

          db.query(productSql, requestedCategories, (err3, productResults) => {
            if (err3) {
              console.error("❌ Product query error:", err3);
            } else {
              console.log(
                "✅ Products that SHOULD be returned:",
                productResults.length
              );
              productResults.forEach((prod, idx) => {
                console.log(
                  `Product ${idx + 1}: ID=${prod.id}, Name=${
                    prod.name
                  }, Category ID=${prod.category_id}, Status=${prod.status}`
                );
              });
            }

            db.end();
          });
        });
      } else {
        console.log("❌ No requested categories found");
        db.end();
      }
    } else {
      console.log("❌ No logged_in login request found for user 2");
      db.end();
    }
  }
);
