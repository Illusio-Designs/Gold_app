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
      for (const file of orphaned) {
        try {
          fs.unlinkSync(file.path);
          } catch (error) {
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
        if (!fs.existsSync(filePath)) {
          reject(new Error(`File not found: ${filePath}`));
          return;
        }

        // Extract filename and determine type from path
        const filename = path.basename(filePath);
        const isCategory = filePath.includes('categories');
        const isProduct = filePath.includes('products');
        
        // Delete file from filesystem
        fs.unlink(filePath, async (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          try {
            // Update database to remove image reference
            if (isCategory) {
              // Remove image from categories table
              const updateQuery = 'UPDATE categories SET image = NULL WHERE image = ?';
              db.query(updateQuery, [filename], (dbErr, result) => {
                if (dbErr) {
                  // Still resolve since file was deleted
                  resolve({ success: true, path: filePath, dbUpdated: false });
                } else {
                  resolve({ success: true, path: filePath, dbUpdated: true });
                }
              });
            } else if (isProduct) {
              // When deleting a product image, change status to draft so it won't appear in mobile app
              const updateQuery = 'UPDATE products SET image = NULL, status = "draft" WHERE image = ?';
              db.query(updateQuery, [filename], (dbErr, result) => {
                if (dbErr) {
                  // Still resolve since file was deleted
                  resolve({ success: true, path: filePath, dbUpdated: false });
                } else {
                  resolve({ success: true, path: filePath, dbUpdated: true });
                }
              });
            } else {
              // Unknown file type, just resolve
              resolve({ success: true, path: filePath, dbUpdated: false });
            }
          } catch (dbError) {
            // Still resolve since file was deleted
            resolve({ success: true, path: filePath, dbUpdated: false });
          }
        });
        
      } catch (error) {
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
        let cleanedCount = 0;
        let categoryCleaned = 0;
        let productCleaned = 0;
        
        // Clean up categories table
        db.query('SELECT id, name, image FROM categories WHERE image IS NOT NULL', (err, categories) => {
          if (err) {
            reject(err);
            return;
          }
          
          categories.forEach(category => {
            const imagePath = path.join(this.uploadDirs.category, category.image);
            - Image: ${category.image}`);
            if (!fs.existsSync(imagePath)) {
              // Image file doesn't exist, remove from database
              db.query('UPDATE categories SET image = NULL WHERE id = ?', [category.id], (updateErr) => {
                if (updateErr) {
                  } else {
                  `);
                  cleanedCount++;
                  categoryCleaned++;
                }
              });
            } else {
              }
          });
          
          // Clean up products table
          db.query('SELECT id, name, sku, image FROM products WHERE image IS NOT NULL', (err, products) => {
            if (err) {
              reject(err);
              return;
            }
            
            products.forEach(product => {
              const imagePath = path.join(this.uploadDirs.product, product.image);
              - Image: ${product.image}`);
              if (!fs.existsSync(imagePath)) {
                // Image file doesn't exist, remove from database
                db.query('UPDATE products SET image = NULL WHERE id = ?', [product.id], (updateErr) => {
                  if (updateErr) {
                    } else {
                    `);
                    cleanedCount++;
                    productCleaned++;
                  }
                });
              } else {
                }
            });
            
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
        reject(error);
      }
    });
  }
}

module.exports = new MediaGalleryService(); 