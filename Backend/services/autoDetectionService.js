const { db } = require('../config/db');
const path = require('path');

class AutoDetectionService {
  constructor() {
    this.productModel = require('../models/product');
    this.categoryModel = require('../models/category');
  }

  // Auto-detect image type and association based on filename
  async detectImageAssociation(filename) {
    const nameWithoutExt = path.parse(filename).name;
    // Try to detect by SKU pattern first (products)
    const skuMatch = await this.detectBySku(nameWithoutExt);
    if (skuMatch) {
      return {
        type: 'product',
        id: skuMatch.id,
        name: skuMatch.name,
        sku: skuMatch.sku,
        confidence: 'high'
      };
    }

    // Try to detect by product name
    const productMatch = await this.detectByProductName(nameWithoutExt);
    if (productMatch) {
      return {
        type: 'product',
        id: productMatch.id,
        name: productMatch.name,
        sku: productMatch.sku,
        confidence: 'medium'
      };
    }

    // Try to detect by category name
    const categoryMatch = await this.detectByCategoryName(nameWithoutExt);
    if (categoryMatch) {
      return {
        type: 'category',
        id: categoryMatch.id,
        name: categoryMatch.name,
        confidence: 'medium'
      };
    }

    // Try fuzzy matching for products
    const fuzzyProductMatch = await this.fuzzyMatchProduct(nameWithoutExt);
    if (fuzzyProductMatch) {
      return {
        type: 'product',
        id: fuzzyProductMatch.id,
        name: fuzzyProductMatch.name,
        sku: fuzzyProductMatch.sku,
        confidence: 'low'
      };
    }

    // Try fuzzy matching for categories
    const fuzzyCategoryMatch = await this.fuzzyMatchCategory(nameWithoutExt);
    if (fuzzyCategoryMatch) {
      return {
        type: 'category',
        id: fuzzyCategoryMatch.id,
        name: fuzzyCategoryMatch.name,
        confidence: 'low'
      };
    }

    // If no match found, try to guess based on filename patterns
    const guessedType = this.guessTypeFromFilename(nameWithoutExt);
    if (guessedType) {
      return guessedType;
    }

    return null;
  }

  // Detect by exact SKU match
  async detectBySku(filename) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, sku FROM products WHERE sku = ?';
      db.query(sql, [filename], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Detect by exact product name match
  async detectByProductName(filename) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, sku FROM products WHERE LOWER(name) = LOWER(?)';
      db.query(sql, [filename], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Detect by exact category name match
  async detectByCategoryName(filename) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?)';
      db.query(sql, [filename], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Fuzzy match for products (partial name matching)
  async fuzzyMatchProduct(filename) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, sku FROM products WHERE LOWER(name) LIKE ? OR LOWER(sku) LIKE ? LIMIT 1';
      const searchTerm = `%${filename.toLowerCase()}%`;
      db.query(sql, [searchTerm, searchTerm], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Fuzzy match for categories (partial name matching)
  async fuzzyMatchCategory(filename) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name FROM categories WHERE LOWER(name) LIKE ? LIMIT 1';
      const searchTerm = `%${filename.toLowerCase()}%`;
      db.query(sql, [searchTerm], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Get all products for dropdown
  async getAllProducts() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, sku FROM products ORDER BY name';
      db.query(sql, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Get all categories for dropdown
  async getAllCategories() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name FROM categories ORDER BY name';
      db.query(sql, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  // Process bulk upload with auto-detection
  async processBulkUpload(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const detection = await this.detectImageAssociation(file.originalname);
        results.push({
          filename: file.originalname,
          detection: detection,
          success: detection !== null,
          message: detection ? `Auto-detected as ${detection.type}: ${detection.name}` : 'Could not auto-detect association'
        });
      } catch (error) {
        results.push({
          filename: file.originalname,
          detection: null,
          success: false,
          message: `Error during detection: ${error.message}`
        });
      }
    }

    return results;
  }

  // Guess type based on filename patterns
  guessTypeFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    
    // Common product-related keywords
    const productKeywords = [
      'ring', 'necklace', 'bracelet', 'earring', 'pendant', 'chain', 'bangle',
      'anklet', 'brooch', 'cufflink', 'watch', 'jewelry', 'gem', 'diamond',
      'gold', 'silver', 'platinum', 'pearl', 'ruby', 'emerald', 'sapphire',
      'product', 'item', 'piece', 'design', 'model', 'style'
    ];
    
    // Common category-related keywords
    const categoryKeywords = [
      'category', 'collection', 'series', 'line', 'brand', 'type', 'class',
      'group', 'family', 'set', 'assortment', 'range', 'variety'
    ];
    
    // Check for product keywords
    const hasProductKeywords = productKeywords.some(keyword => 
      lowerFilename.includes(keyword)
    );
    
    // Check for category keywords
    const hasCategoryKeywords = categoryKeywords.some(keyword => 
      lowerFilename.includes(keyword)
    );
    
    // If filename contains product keywords, guess it's a product
    if (hasProductKeywords && !hasCategoryKeywords) {
      return {
        type: 'product',
        name: filename,
        sku: null,
        confidence: 'very_low',
        reason: 'Filename contains product-related keywords'
      };
    }
    
    // If filename contains category keywords, guess it's a category
    if (hasCategoryKeywords) {
      return {
        type: 'category',
        name: filename,
        confidence: 'very_low',
        reason: 'Filename contains category-related keywords'
      };
    }
    
    // Default guess: if filename is short and doesn't contain obvious keywords, assume it's a product
    if (filename.length <= 20 && !filename.includes('_') && !filename.includes('-')) {
      return {
        type: 'product',
        name: filename,
        sku: null,
        confidence: 'very_low',
        reason: 'Short filename, assuming product image'
      };
    }
    
    return null;
  }
}

module.exports = new AutoDetectionService(); 