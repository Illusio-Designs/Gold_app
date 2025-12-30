const { db } = require('../config/db');

async function migrateSlidersTable() {
  try {
    // Check if description column exists
    const checkDescription = await new Promise((resolve, reject) => {
      db.query("SHOW COLUMNS FROM sliders LIKE 'description'", (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0);
      });
    });

    // Check if link_url column exists
    const checkLinkUrl = await new Promise((resolve, reject) => {
      db.query("SHOW COLUMNS FROM sliders LIKE 'link_url'", (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0);
      });
    });

    // Remove description column if it exists
    if (checkDescription) {
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE sliders DROP COLUMN description", (err, result) => {
          if (err) reject(err);
          else {
            resolve(result);
          }
        });
      });
    } else {
      }

    // Remove link_url column if it exists
    if (checkLinkUrl) {
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE sliders DROP COLUMN link_url", (err, result) => {
          if (err) reject(err);
          else {
            resolve(result);
          }
        });
      });
    } else {
      }

    } catch (error) {
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSlidersTable()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { migrateSlidersTable };
