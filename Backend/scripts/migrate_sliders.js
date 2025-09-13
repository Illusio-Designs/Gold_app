const { db } = require('../config/db');

async function migrateSlidersTable() {
  try {
    console.log('🔄 Starting sliders table migration...');
    
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
      console.log('🗑️ Removing description column...');
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE sliders DROP COLUMN description", (err, result) => {
          if (err) reject(err);
          else {
            console.log('✅ Description column removed successfully');
            resolve(result);
          }
        });
      });
    } else {
      console.log('ℹ️ Description column does not exist, skipping...');
    }

    // Remove link_url column if it exists
    if (checkLinkUrl) {
      console.log('🗑️ Removing link_url column...');
      await new Promise((resolve, reject) => {
        db.query("ALTER TABLE sliders DROP COLUMN link_url", (err, result) => {
          if (err) reject(err);
          else {
            console.log('✅ Link_url column removed successfully');
            resolve(result);
          }
        });
      });
    } else {
      console.log('ℹ️ Link_url column does not exist, skipping...');
    }

    console.log('✅ Sliders table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during sliders table migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSlidersTable()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSlidersTable };
