const { db } = require("../config/db");
const bcrypt = require("bcrypt");

// Create database if it doesn't exist
async function createDatabase() {
  const mysql = require("mysql2");
  require("dotenv").config();

  // Create connection without specifying database
  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: "utf8mb4",
  });

  return new Promise((resolve, reject) => {
    const dbName = process.env.DB_NAME || "amrutjewels";

    connection.connect((err) => {
      if (err) {
        console.error("❌ Error connecting to MySQL:", err.message);
        reject(err);
        return;
      }

      console.log("✅ Connected to MySQL server");

      // Create database
      connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
        (err) => {
          if (err) {
            console.error(`❌ Error creating database: ${err.message}`);
            connection.end();
            reject(err);
            return;
          }

          console.log(`✅ Database '${dbName}' ensured`);
          connection.end();
          resolve();
        }
      );
    });
  });
}

async function createTablesAndAdmin() {
  console.log("🚀 Starting database setup...");

  // Step 0: Create database if it doesn't exist
  console.log("🗄️  Creating database if it doesn't exist...");
  await createDatabase();

  // Table definitions in order of dependencies - Only essential tables for jewelry business
  const tableDefinitions = [
    {
      name: "users",
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('admin', 'business') NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        phone_number VARCHAR(20),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        landmark VARCHAR(255),
        state VARCHAR(100),
        city VARCHAR(100),
        country VARCHAR(100),
        gst_number VARCHAR(20),
        pan_number VARCHAR(20),
        business_name VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected', 'denied') DEFAULT 'pending',
        remarks VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    },
    {
      name: "categories",
      sql: `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        status ENUM('draft', 'active') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    },
    {
      name: "login_requests",
      sql: `CREATE TABLE IF NOT EXISTS login_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_ids TEXT NOT NULL,
        status ENUM('pending', 'approved', 'logged_in', 'logged_out', 'expired', 'rejected') DEFAULT 'pending',
        remarks TEXT,
        admin_remarks TEXT,
        session_time_minutes INT DEFAULT 30,
        session_start_time DATETIME NULL,
        session_end_time DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    },
    {
      name: "products",
      sql: `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        net_weight DECIMAL(10,2),
        gross_weight DECIMAL(10,2),
        size VARCHAR(100),
        pieces INT DEFAULT 1,
        attributes TEXT,
        sku VARCHAR(100) UNIQUE,
        purity VARCHAR(255), -- Accepts any stamp value (MG916, 18K, 20K, etc.)
        mark_amount DECIMAL(10,2) DEFAULT 0,
        status ENUM('draft', 'active') DEFAULT 'draft',
        stock_status ENUM('available', 'out_of_stock', 'reserved') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "orders",
      sql: `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        remark TEXT,
        courier_company VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
    },
    {
      name: "cart_items",
      sql: `CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        status ENUM('pending', 'removed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )`,
    },
    {
      name: "product_stock_history",
      sql: `CREATE TABLE IF NOT EXISTS product_stock_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        action ENUM('ordered', 'cancelled', 'returned', 'reserved', 'released') NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        order_id INT NULL,
        user_id INT NULL,
        previous_status ENUM('available', 'out_of_stock', 'reserved') NOT NULL,
        new_status ENUM('available', 'out_of_stock', 'reserved') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "notifications",
      sql: `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "user_notifications",
      sql: `CREATE TABLE IF NOT EXISTS user_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        notification_id INT NOT NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_notification (user_id, notification_id)
      )`,
    },
    {
      name: "notification_tokens",
      sql: `CREATE TABLE IF NOT EXISTS notification_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        token TEXT NOT NULL,
        device_type VARCHAR(50) DEFAULT 'web',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_token (token(255))
      )`,
    },
    {
      name: "app_versions",
      sql: `CREATE TABLE IF NOT EXISTS app_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        build_number INT NOT NULL,
        platform ENUM('ios', 'android', 'both') NOT NULL,
        is_forced BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        release_notes TEXT,
        download_url VARCHAR(500),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "app_icons",
      sql: `CREATE TABLE IF NOT EXISTS app_icons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        priority INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "sliders",
      sql: `CREATE TABLE IF NOT EXISTS sliders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        link_url VARCHAR(500),
        category_id INT,
        priority INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )`,
    },
    {
      name: "media_gallery",
      sql: `CREATE TABLE IF NOT EXISTS media_gallery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        file_url VARCHAR(500) NOT NULL,
        file_type ENUM('image', 'video', 'document') NOT NULL,
        category VARCHAR(100),
        tags TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    },
  ];

  try {
    // Step 1: Create tables in dependency order
    console.log("📋 Creating database tables...");
    for (const tableDef of tableDefinitions) {
      await executeQuery(tableDef.sql, `${tableDef.name} table ensured`);
    }

    // Step 2: Create default admin user
    console.log("👤 Setting up default admin user...");
    await createDefaultAdmin();

    // Step 3: Create indexes for better performance
    console.log("⚡ Creating database indexes...");
    await createIndexes();

    // Step 4: Update existing tables with new fields
    console.log("🔄 Updating existing tables with new fields...");
    await updateExistingTables();

    console.log("✅ Database setup completed successfully!");
    console.log("\n📊 Database Summary:");
    console.log("   • Users table (admin & business users)");
    console.log("   • Categories table (product categories)");
    console.log("   • Login Requests table (access management)");
    console.log("   • Products table (jewelry items with images)");
    console.log("   • Cart Items table (shopping cart with real-time sync)");
    console.log("   • Orders table (business orders with total_amount)");
    console.log("   • Product Stock History table (stock tracking & audit)");
    console.log("   • Notifications table (push notifications)");
    console.log("   • User Notifications table (read status tracking)");
    console.log("   • Notification Tokens table (FCM tokens)");
    console.log("   • App Versions table (version management)");
    console.log("   • App Icons table (app icon management)");
    console.log("   • Sliders table (banner/slider management)");
    console.log("   • Media Gallery table (file management)");
    console.log("\n🛒 Cart & Order System Features:");
    console.log(
      "   • Real-time cart synchronization between frontend & backend"
    );
    console.log("   • Product lookup by SKU for accurate cart management");
    console.log("   • Individual product status tracking in orders");
    console.log("   • Automatic cart clearing after successful order creation");
    console.log(
      "   • Product stock management (available/out_of_stock/reserved)"
    );
    console.log("   • Automatic stock status update after order placement");
    console.log("\n🌐 API Endpoints Available:");
    console.log("   • Cart: /api/cart/* (add, get, update, remove, clear)");
    console.log("   • Orders: /api/orders/* (create, get, update, status)");
    console.log("   • Products: /api/products/* (get, create, update, delete)");
    console.log("   • Users: /api/users/* (register, login, profile)");
    console.log("\n🔑 Default Admin Credentials:");
    console.log("   • Email: Admin@admin.com");
    console.log("   • Password: Admin@123");
  } catch (error) {
    console.error("❌ Error during database setup:", error);
    throw error;
  }
}

// Helper function to execute queries with proper error handling
async function executeQuery(sql, successMessage) {
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) {
        console.error(`❌ Error executing query: ${err.message}`);
        reject(err);
      } else {
        console.log(`✅ ${successMessage}`);
        resolve();
      }
    });
  });
}

// Create default admin user
async function createDefaultAdmin() {
  const checkAdmin = `SELECT * FROM users WHERE email = 'Admin@admin.com'`;

  return new Promise((resolve, reject) => {
    db.query(checkAdmin, async (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length === 0) {
        try {
          const hashedPassword = await bcrypt.hash("Admin@123", 10);
          const insertAdmin = `INSERT INTO users (type, name, email, password, status) VALUES ('admin', 'Admin', 'Admin@admin.com', ?, 'approved')`;

          db.query(insertAdmin, [hashedPassword], (err) => {
            if (err) {
              console.error("❌ Error creating admin user:", err.message);
              reject(err);
            } else {
              console.log("✅ Default admin user created");
              resolve();
            }
          });
        } catch (hashError) {
          console.error("❌ Error hashing password:", hashError.message);
          reject(hashError);
        }
      } else {
        console.log("ℹ️  Admin user already exists");
        resolve();
      }
    });
  });
}

// Create performance indexes
async function createIndexes() {
  const indexes = [
    {
      name: "users_email_idx",
      sql: "CREATE INDEX users_email_idx ON users(email)",
    },
    {
      name: "users_type_status_idx",
      sql: "CREATE INDEX users_type_status_idx ON users(type, status)",
    },
    {
      name: "categories_status_idx",
      sql: "CREATE INDEX categories_status_idx ON categories(status)",
    },
    {
      name: "login_requests_user_status_idx",
      sql: "CREATE INDEX login_requests_user_status_idx ON login_requests(user_id, status)",
    },
    {
      name: "products_category_status_idx",
      sql: "CREATE INDEX products_category_status_idx ON products(category_id, status)",
    },
    {
      name: "products_sku_idx",
      sql: "CREATE INDEX products_sku_idx ON products(sku)",
    },
    {
      name: "orders_user_status_idx",
      sql: "CREATE INDEX orders_user_status_idx ON orders(user_id, status)",
    },
    {
      name: "cart_items_user_status_idx",
      sql: "CREATE INDEX cart_items_user_status_idx ON cart_items(user_id, status)",
    },
    {
      name: "cart_items_product_idx",
      sql: "CREATE INDEX cart_items_product_idx ON cart_items(product_id)",
    },
    {
      name: "product_stock_history_product_idx",
      sql: "CREATE INDEX product_stock_history_product_idx ON product_stock_history(product_id)",
    },
    {
      name: "product_stock_history_action_idx",
      sql: "CREATE INDEX product_stock_history_action_idx ON product_stock_history(action)",
    },
    {
      name: "notifications_type_idx",
      sql: "CREATE INDEX notifications_type_idx ON notifications(type)",
    },
    {
      name: "notification_tokens_user_active_idx",
      sql: "CREATE INDEX notification_tokens_user_active_idx ON notification_tokens(user_id, active)",
    },
  ];

  for (const index of indexes) {
    try {
      // Check if index already exists before creating
      const checkIndexSql = `SHOW INDEX FROM ${
        index.table || getTableNameFromIndex(index.name)
      } WHERE Key_name = '${index.name}'`;

      const indexExists = await new Promise((resolve, reject) => {
        db.query(checkIndexSql, (err, results) => {
          if (err) {
            // If table doesn't exist or other error, assume index doesn't exist
            resolve(false);
          } else {
            resolve(results.length > 0);
          }
        });
      });

      if (!indexExists) {
        await executeQuery(index.sql, `Index ${index.name} created`);
      } else {
        console.log(`ℹ️  Index ${index.name} already exists`);
      }
    } catch (error) {
      // Index creation failed, log and continue
      console.log(`ℹ️  Index ${index.name} creation failed: ${error.message}`);
    }
  }
}

// Helper function to extract table name from index name
function getTableNameFromIndex(indexName) {
  const tableMap = {
    users_email_idx: "users",
    users_type_status_idx: "users",
    categories_status_idx: "categories",
    login_requests_user_status_idx: "login_requests",
    products_category_status_idx: "products",
    products_sku_idx: "products",
    orders_user_status_idx: "orders",
    cart_items_user_status_idx: "cart_items",
    cart_items_product_idx: "cart_items",
    product_stock_history_product_idx: "product_stock_history",
    product_stock_history_action_idx: "product_stock_history",
    notifications_type_idx: "notifications",
    notification_tokens_user_active_idx: "notification_tokens",
  };
  return tableMap[indexName] || "users"; // fallback to users
}

// Update existing tables with new fields
async function updateExistingTables() {
  console.log("🔄 Updating existing tables with new fields...");

  try {
    // Add stock_status field to products table if it doesn't exist
    const checkStockStatus = "SHOW COLUMNS FROM products LIKE 'stock_status'";
    const hasStockStatus = await new Promise((resolve, reject) => {
      db.query(checkStockStatus, (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0);
      });
    });

    if (!hasStockStatus) {
      console.log("🔧 Adding stock_status field to products table...");
      await executeQuery(
        "ALTER TABLE products ADD COLUMN stock_status ENUM('available', 'out_of_stock', 'reserved') DEFAULT 'available' AFTER status",
        "stock_status field added to products table"
      );

      // Update existing products to have 'available' status
      await executeQuery(
        "UPDATE products SET stock_status = 'available' WHERE stock_status IS NULL",
        "Existing products updated with available stock status"
      );
    } else {
      console.log("ℹ️  stock_status field already exists in products table");
    }

    console.log("✅ Table updates completed");
  } catch (error) {
    console.log(
      `ℹ️  Table update failed (might already be updated): ${error.message}`
    );
  }
}

// Export the main function
module.exports = createTablesAndAdmin;

// If this file is run directly, execute the setup
if (require.main === module) {
  createTablesAndAdmin()
    .then(() => {
      console.log("🎉 Database setup completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Database setup failed:", error);
      process.exit(1);
    });
}
