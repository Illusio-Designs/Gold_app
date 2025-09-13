const fs = require('fs');
const path = require('path');
const { db } = require('../config/db');

class MediaGalleryService {
  constructor() {
    this.uploadDirs = {
      category: path.join(__dirname, '../uploads/categories'),
      product: path.join(__dirname, '../uploads/products'),
    };
  }

  // Get all media files with their associations
  async getAllMedia() {
    return new Promise((resolve, reject) => {
      const media = {
        categories: [],
        products: [],
        orphaned: []
      };

      // Get category images
      db.query('SELECT id, name, image FROM categories WHERE image IS NOT NULL', (err, categories) => {
        if (err) {
          reject(err);
          return;
        }

        media.categories = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          image: cat.image,
          type: 'category',
          path: path.join(this.uploadDirs.category, cat.image)
        }));

        // Get product images
        db.query('SELECT id, name, sku, image FROM products WHERE image IS NOT NULL', (err, products) => {
          if (err) {
            reject(err);
            return;
          }

          media.products = products.map(prod => ({
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            image: prod.image,
            type: 'product',
            path: path.join(this.uploadDirs.product, prod.image)
          }));

          // Auto-delete orphaned files instead of returning them
          this.findAndDeleteOrphanedFiles(media).then(() => {
            resolve(media);
          }).catch(reject);
        });
      });
    });
  }

  // Find and automatically delete orphaned files
  async findAndDeleteOrphanedFiles(media) {
    const orphaned = [];

    // Check category directory
    if (fs.existsSync(this.uploadDirs.category)) {
      const categoryFiles = fs.readdirSync(this.uploadDirs.category);
      const usedCategoryImages = media.categories.map(cat => cat.image);
      
      categoryFiles.forEach(file => {
        if (!usedCategoryImages.includes(file)) {
          orphaned.push({
            filename: file,
            path: path.join(this.uploadDirs.category, file),
            type: 'category',
            size: fs.statSync(path.join(this.uploadDirs.category, file)).size
          });
        }
      });
    }

    // Check products directory
    if (fs.existsSync(this.uploadDirs.product)) {
      const productFiles = fs.readdirSync(this.uploadDirs.product);
      const usedProductImages = media.products.map(prod => prod.image);
      
      productFiles.forEach(file => {
        if (!usedProductImages.includes(file)) {
          orphaned.push({
            filename: file,
            path: path.join(this.uploadDirs.product, file),
            type: 'product',
            size: fs.statSync(path.join(this.uploadDirs.product, file)).size
          });
        }
      });
    }

    // Automatically delete orphaned files
    if (orphaned.length > 0) {
      console.log(`Found ${orphaned.length} orphaned files, deleting automatically...`);
      for (const file of orphaned) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted orphaned file: ${file.filename}`);
        } catch (error) {
          console.error(`Failed to delete orphaned file: ${file.filename}`, error);
        }
      }
    }

    return orphaned.length; // Return count of deleted files
  }

  // Delete orphaned files
  async deleteOrphanedFiles() {
    const media = await this.getAllMedia();
    const deletedFiles = [];

    for (const orphaned of media.orphaned) {
      try {
        fs.unlinkSync(orphaned.path);
        deletedFiles.push(orphaned);
      } catch (error) {
        console.error(`Failed to delete orphaned file: ${orphaned.path}`, error);
      }
    }

    return deletedFiles;
  }

  // Get media statistics
  async getMediaStats() {
    const media = await this.getAllMedia();
    
    const stats = {
      totalCategories: media.categories.length,
      totalProducts: media.products.filter(p => p.type === 'product').length,
      totalAdditionalImages: media.products.filter(p => p.type === 'product_additional').length,
      totalSize: 0
    };

    // Calculate total size (excluding orphaned files since they're auto-deleted)
    const allFiles = [...media.categories, ...media.products];
    allFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        stats.totalSize += fs.statSync(file.path).size;
      }
    });

    return stats;
  }

  // Delete specific file and update database
  async deleteFile(filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`[MediaGalleryService] Checking if file exists: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
          console.error(`[MediaGalleryService] File not found: ${filePath}`);
          reject(new Error(`File not found: ${filePath}`));
          return;
        }

        // Extract filename and determine type from path
        const filename = path.basename(filePath);
        const isCategory = filePath.includes('categories');
        const isProduct = filePath.includes('products');
        
        console.log(`[MediaGalleryService] File type detected: ${isCategory ? 'category' : isProduct ? 'product' : 'unknown'}`);
        
        // Delete file from filesystem
        fs.unlink(filePath, async (err) => {
          if (err) {
            console.error(`[MediaGalleryService] Error deleting file: ${filePath}`, err);
            reject(err);
            return;
          }
          
          console.log(`[MediaGalleryService] File deleted successfully: ${filePath}`);
          
          try {
            // Update database to remove image reference
            if (isCategory) {
              // Remove image from categories table
              const updateQuery = 'UPDATE categories SET image = NULL WHERE image = ?';
              db.query(updateQuery, [filename], (dbErr, result) => {
                if (dbErr) {
                  console.error(`[MediaGalleryService] Database update error for category:`, dbErr);
                  // Still resolve since file was deleted
                  resolve({ success: true, path: filePath, dbUpdated: false });
                } else {
                  console.log(`[MediaGalleryService] Database updated for category: ${filename}`);
                  resolve({ success: true, path: filePath, dbUpdated: true });
                }
              });
            } else if (isProduct) {
              // When deleting a product image, change status to draft so it won't appear in mobile app
              const updateQuery = 'UPDATE products SET image = NULL, status = "draft" WHERE image = ?';
              db.query(updateQuery, [filename], (dbErr, result) => {
                if (dbErr) {
                  console.error(`[MediaGalleryService] Database update error for product:`, dbErr);
                  // Still resolve since file was deleted
                  resolve({ success: true, path: filePath, dbUpdated: false });
                } else {
                  console.log(`[MediaGalleryService] Database updated for product: ${filename}, status changed to draft`);
                  resolve({ success: true, path: filePath, dbUpdated: true });
                }
              });
            } else {
              // Unknown file type, just resolve
              resolve({ success: true, path: filePath, dbUpdated: false });
            }
          } catch (dbError) {
            console.error(`[MediaGalleryService] Database operation error:`, dbError);
            // Still resolve since file was deleted
            resolve({ success: true, path: filePath, dbUpdated: false });
          }
        });
        
      } catch (error) {
        console.error(`[MediaGalleryService] Unexpected error in deleteFile:`, error);
        reject(error);
      }
    });
  }

  // Get file info
  getFileInfo(filePath) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    }
    return { exists: false };
  }

  // Clean up orphaned database records (images that don't exist in filesystem)
  async cleanupOrphanedDatabaseRecords() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔧 [MediaGalleryService] Starting cleanup of orphaned database records...');
        console.log('📁 [MediaGalleryService] Checking categories and products tables...');
        
        let cleanedCount = 0;
        let categoryCleaned = 0;
        let productCleaned = 0;
        
        // Clean up categories table
        console.log('📋 [MediaGalleryService] Querying categories table for images...');
        db.query('SELECT id, name, image FROM categories WHERE image IS NOT NULL', (err, categories) => {
          if (err) {
            console.error('❌ [MediaGalleryService] Error querying categories:', err);
            reject(err);
            return;
          }
          
          console.log(`📊 [MediaGalleryService] Found ${categories.length} categories with images`);
          
          categories.forEach(category => {
            const imagePath = path.join(this.uploadDirs.category, category.image);
            console.log(`🔍 [MediaGalleryService] Checking category "${category.name}" (ID: ${category.id}) - Image: ${category.image}`);
            console.log(`📂 [MediaGalleryService] Full image path: ${imagePath}`);
            
            if (!fs.existsSync(imagePath)) {
              console.log(`⚠️  [MediaGalleryService] Image file NOT FOUND for category "${category.name}" - Cleaning up database record`);
              
              // Image file doesn't exist, remove from database
              db.query('UPDATE categories SET image = NULL WHERE id = ?', [category.id], (updateErr) => {
                if (updateErr) {
                  console.error(`❌ [MediaGalleryService] Error updating category ${category.id}:`, updateErr);
                } else {
                  console.log(`✅ [MediaGalleryService] Successfully cleaned up orphaned category image: ${category.image} (ID: ${category.id})`);
                  cleanedCount++;
                  categoryCleaned++;
                }
              });
            } else {
              console.log(`✅ [MediaGalleryService] Image file EXISTS for category "${category.name}" - No cleanup needed`);
            }
          });
          
          // Clean up products table
          console.log('📋 [MediaGalleryService] Querying products table for images...');
          db.query('SELECT id, name, sku, image FROM products WHERE image IS NOT NULL', (err, products) => {
            if (err) {
              console.error('❌ [MediaGalleryService] Error querying products:', err);
              reject(err);
              return;
            }
            
            console.log(`📊 [MediaGalleryService] Found ${products.length} products with images`);
            
            products.forEach(product => {
              const imagePath = path.join(this.uploadDirs.product, product.image);
              console.log(`🔍 [MediaGalleryService] Checking product "${product.name}" (SKU: ${product.sku}, ID: ${product.id}) - Image: ${product.image}`);
              console.log(`📂 [MediaGalleryService] Full image path: ${imagePath}`);
              
              if (!fs.existsSync(imagePath)) {
                console.log(`⚠️  [MediaGalleryService] Image file NOT FOUND for product "${product.name}" - Cleaning up database record`);
                
                // Image file doesn't exist, remove from database
                db.query('UPDATE products SET image = NULL WHERE id = ?', [product.id], (updateErr) => {
                  if (updateErr) {
                    console.error(`❌ [MediaGalleryService] Error updating product ${product.id}:`, updateErr);
                  } else {
                    console.log(`✅ [MediaGalleryService] Successfully cleaned up orphaned product image: ${product.image} (ID: ${product.id})`);
                    cleanedCount++;
                    productCleaned++;
                  }
                });
              } else {
                console.log(`✅ [MediaGalleryService] Image file EXISTS for product "${product.name}" - No cleanup needed`);
              }
            });
            
            console.log('🎯 [MediaGalleryService] Cleanup summary:');
            console.log(`   📊 Total records cleaned: ${cleanedCount}`);
            console.log(`   📋 Categories cleaned: ${categoryCleaned}`);
            console.log(`   📦 Products cleaned: ${productCleaned}`);
            console.log(`✅ [MediaGalleryService] Cleanup completed successfully!`);
            
            resolve({ 
              success: true, 
              cleanedCount,
              categoryCleaned,
              productCleaned,
              message: `Cleanup completed: ${cleanedCount} orphaned records cleaned (${categoryCleaned} categories, ${productCleaned} products)`
            });
          });
        });
        
      } catch (error) {
        console.error('❌ [MediaGalleryService] Unexpected error in cleanupOrphanedDatabaseRecords:', error);
        reject(error);
      }
    });
  }
}

module.exports = new MediaGalleryService(); 