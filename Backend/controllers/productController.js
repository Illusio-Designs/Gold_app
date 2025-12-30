const productModel = require("../models/product");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const imageProcessingService = require("../services/imageProcessingService");

const multer = require("multer");
const xlsx = require("xlsx");
const socketService = require("../services/socketService");
const { createUser: createUserModel } = require("../models/user");
const { db } = require("../config/db");
const { executeQuery, checkConnection } = require("../utils/dbHelper");
const { getBaseUrl } = require("../config/environment");

// Create new product
async function createProduct(req, res) {
  try {
    // Validate required fields
    if (!req.body.category_id || req.body.category_id === "") {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ error: "Product name is required" });
    }

    let imageFilename = null;

    // Process uploaded image if present
    if (req.file) {
      try {
        // Use the new image processing service with watermark
        const processedPath = await imageProcessingService.processProductImage(
          req.file.path,
          req.file.filename
        );
        imageFilename = path.basename(processedPath);
        // Original file is automatically deleted by the service
      } catch (imageError) {
        // Don't continue without proper image processing - return error
        return res.status(500).json({
          error: "Image processing failed",
          details: imageError.message,
        });
      }
    }

    const product = {
      category_id: req.body.category_id,
      name: req.body.name,
      image: imageFilename,
      net_weight: req.body.net_weight || null,
      gross_weight: req.body.gross_weight || null,
      size: req.body.size || null,
      sku: req.body.sku || null,
      purity: req.body.purity || null,
      pieces: req.body.pieces || null,
      mark_amount: req.body.mark_amount || null,
      status: "draft", // Always start as draft
      stock_status: "available", // Always start as available stock
    };

    // Convert empty strings to null for database compatibility
    Object.keys(product).forEach((key) => {
      if (product[key] === "") {
        product[key] = null;
      }
    });

    productModel.createProduct(product, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get the created product for real-time update
      const productId = result.insertId;
      productModel.getProductById(productId, (getErr, productResults) => {
        if (!getErr && productResults.length > 0) {
          // Emit real-time update
          socketService.notifyProductUpdate(productResults[0], "created");
        }
      });

      res.status(201).json({
        message: "Product created successfully",
        productId: productId,
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get all products (only available ones for frontend)
function getAllProducts(req, res) {
  // Check if this is a frontend request (no admin token)
  const isFrontendRequest =
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ");

  if (isFrontendRequest) {
    // Frontend request - only show available products
    productModel.getAvailableProducts((err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  } else {
    // Admin request - show all products including stock status
    productModel.getAllProducts((err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  }
}

// Get product by SKU
function getProductBySku(req, res) {
  const { sku } = req.params;

  if (!sku) {
    return res.status(400).json({ error: "SKU is required" });
  }

  productModel.getProductBySku(sku, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(results[0]);
  });
}

// Get product by ID
function getProductById(req, res) {
  const { id } = req.params;
  productModel.getProductById(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error fetching product",
        error: err.message,
      });
    }
    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Product not found",
      });
    }

    // Process product images
    const product = result[0];
    let images = [];
    if (product.image) {
      try {
        images = JSON.parse(product.image);
        if (!Array.isArray(images)) {
          images = [product.image];
        }
      } catch (e) {
        images = [product.image];
      }
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: images,
      },
    });
  });
}

// Update product
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    // Validate required fields
    if (!req.body.category_id || req.body.category_id === "") {
      return res.status(400).json({ error: "Category is required" });
    }

    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ error: "Product name is required" });
    }

    let imageFilename = req.body.image || null; // Keep existing image if no new one uploaded

    // Process uploaded image if present
    if (req.file) {
      try {
        // Use the new image processing service with watermark
        const processedPath = await imageProcessingService.processProductImage(
          req.file.path,
          req.file.filename
        );
        imageFilename = path.basename(processedPath);
        // Original file is automatically deleted by the service
      } catch (imageError) {
        // Don't continue without proper image processing - return error
        return res.status(500).json({
          error: "Image processing failed",
          details: imageError.message,
        });
      }
    }

    const product = {
      category_id: req.body.category_id,
      name: req.body.name,
      image: imageFilename,
      net_weight: req.body.net_weight || null,
      gross_weight: req.body.gross_weight || null,
      size: req.body.size || null,
      sku: req.body.sku || null,
      purity: req.body.purity || null,
      pieces: req.body.pieces || null,
      mark_amount: req.body.mark_amount || null,
    };

    // Convert empty strings to null for database compatibility
    Object.keys(product).forEach((key) => {
      if (product[key] === "") {
        product[key] = null;
      }
    });

    productModel.updateProduct(id, product, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get the updated product for real-time update
      productModel.getProductById(id, (getErr, productResults) => {
        if (!getErr && productResults.length > 0) {
          // Emit real-time update
          socketService.notifyProductUpdate(productResults[0], "updated");
        }
      });

      res.json({ message: "Product updated successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete product
function deleteProduct(req, res) {
  const { id } = req.params;

  // Get product info before deletion for real-time update
  productModel.getProductById(id, (getErr, productResults) => {
    const productToDelete = getErr ? null : productResults[0];

    productModel.deleteProduct(id, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit real-time update with deleted product info
      if (productToDelete) {
        socketService.notifyProductUpdate(productToDelete, "deleted");
      }

      res.json({ message: "Product deleted successfully" });
    });
  });
}

// Upload multiple product images
async function uploadProductImages(req, res) {
  const { productId } = req.params;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  try {
    const savedImages = [];
    for (const file of req.files) {
      // Use the new image processing service with watermark
      const processedPath = await imageProcessingService.processProductImage(
        file.path,
        file.filename
      );
      const outputFilename = path.basename(processedPath);

      // Original file is automatically deleted by the service
      await new Promise((resolve, reject) => {
        productModel.addProductImage(
          productId,
          outputFilename,
          (err, result) => {
            if (err) reject(err);
            else {
              savedImages.push(outputFilename);
              resolve();
            }
          }
        );
      });
    }
    res.json({ message: "Images uploaded successfully", images: savedImages });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Image upload failed", details: err.message });
  }
}

// Get all images for a product
function getProductImages(req, res) {
  const { productId } = req.params;
  productModel.getProductImages(productId, (err, images) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(images);
  });
}

// Delete a product image
function deleteProductImage(req, res) {
  const { productId, imageIndex } = req.params;
  const index = parseInt(imageIndex);

  if (isNaN(index) || index < 0) {
    return res.status(400).json({ error: "Invalid image index" });
  }

  productModel.deleteProductImage(productId, index, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Product image deleted successfully" });
  });
}

// Get all products by category
function getProductsByCategory(req, res) {
  const { categoryId } = req.params;

  // First, let's check if the category exists and is active
  const categoryCheckSql =
    "SELECT id, name, status FROM categories WHERE id = ?";
  db.query(categoryCheckSql, [categoryId], (categoryErr, categoryResults) => {
    if (categoryErr) {
      return res.status(500).json({ error: categoryErr.message });
    }

    if (categoryResults.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = categoryResults[0];
    // Now let's check all products for this category (including draft ones for debugging)
    const allProductsSql =
      "SELECT id, name, sku, status, category_id FROM products WHERE category_id = ?";
    db.query(
      allProductsSql,
      [categoryId],
      (allProductsErr, allProductsResults) => {
        if (allProductsErr) {
          return res.status(500).json({ error: allProductsErr.message });
        }

        // Check if this is a frontend request (no admin token)
        const isFrontendRequest =
          !req.headers.authorization ||
          !req.headers.authorization.startsWith("Bearer ");

        // Now get products based on request type
        const getProductsFunction = isFrontendRequest
          ? productModel.getAvailableProductsByCategory
          : productModel.getProductsByCategory;

        getProductsFunction(categoryId, (err, results) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Process results to include processed image URLs with watermarks
          const processedResults = results.map((product) => {
            let processedImageUrl = null;
            let originalImageUrl = null;
            let finalImageUrl = null;

            if (product.image) {
              // Original image URL
              originalImageUrl = `${getBaseUrl()}/uploads/products/${product.image}`;

              // Always check for cleaned/watermarked image first (highest priority)
              const baseName = product.image.split(".")[0]; // Remove original extension
              const cleanedImageName = `${baseName}-cleaned.webp`;
              const cleanedImagePath = path.join(
                __dirname,
                "../uploads/products",
                cleanedImageName
              );

              if (fs.existsSync(cleanedImagePath)) {
                // Use cleaned/watermarked image (highest priority)
                processedImageUrl = `${getBaseUrl()}/uploads/products/${cleanedImageName}`;
                finalImageUrl = processedImageUrl;
                } else if (product.image.endsWith(".webp")) {
                // Fall back to existing processed .webp file
                processedImageUrl = originalImageUrl;
                finalImageUrl = processedImageUrl;
                } else {
                // Convert to processed image path (.webp extension)
                const processedImageName = `${baseName}.webp`;
                const processedImagePath = path.join(
                  __dirname,
                  "../uploads/products",
                  processedImageName
                );

                if (fs.existsSync(processedImagePath)) {
                  // Use regular processed image
                  processedImageUrl = `${getBaseUrl()}/uploads/products/${processedImageName}`;
                  finalImageUrl = processedImageUrl;
                  } else {
                  // Processed image doesn't exist, fall back to original
                  processedImageUrl = null;
                  finalImageUrl = originalImageUrl;
                  }
              }
            }

            return {
              ...product,
              processedImageUrl: processedImageUrl,
              originalImageUrl: originalImageUrl,
              imageUrl: finalImageUrl, // Use final image as primary image
              hasProcessedImage: !!processedImageUrl,
            };
          });

          processedResults.forEach((product, index) => {
            });

          res.json(processedResults);
        });
      }
    );
  });
}

// Import products and categories from Excel
async function importFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    );

    if (data.length < 2) {
      return res
        .status(400)
        .json({ error: "Excel file is empty or has no data rows" });
    }

    // Get headers (first row)
    const headers = data[0];
    // Debug: Show exact header names and their positions
    headers.forEach((header, index) => {
      if (header) {
        `
        );
      }
    });

    // Helper function to find column with flexible matching
    const findColumn = (possibleNames) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(
          (header) =>
            header &&
            header.toString().toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (index !== -1) {
          return index;
        }
      }
      return -1;
    };

    // Validate required columns with flexible matching
    const requiredColumnMappings = [
      { key: "tgno", names: ["Tgno", "TGNO", "TgNo", "tgno"] },
      {
        key: "stamp",
        names: [
          "Stamp",
          "STAMP",
          "stamp",
          "Stmp",
          "STMP",
          "stmp",
          "Purity",
          "PURITY",
          "purity",
          "Karat",
          "KARAT",
          "karat",
          "K",
          "k",
        ],
      },
      { key: "pc", names: ["PC", "Pc", "pc", "P.C", "P.C."] },
      { key: "gwt", names: ["Gwt", "GWT", "gwt", "G.WT", "G.W.T"] },
      { key: "nwt", names: ["N.wt", "N.WT", "N.W.T", "n.wt", "Nwt", "NWT"] },
      { key: "size", names: ["Size", "SIZE", "size"] },
      { key: "mrp", names: ["MRP", "mrp", "Mrp", "M.R.P", "M.R.P."] },
      {
        key: "itemName",
        names: [
          "Item Name",
          "ItemName",
          "ITEM NAME",
          "item name",
          "Item",
          "item",
        ],
      },
    ];

    const columnIndices = {};
    const missingColumns = [];

    for (const mapping of requiredColumnMappings) {
      const index = findColumn(mapping.names);
      if (index !== -1) {
        columnIndices[mapping.key] = index;
        // Special debugging for stamp column
        if (mapping.key === "stamp") {
          }`
          );
          }
      } else {
        missingColumns.push(mapping.names[0]); // Use first name for error message
        // Special debugging for missing stamp column
        if (mapping.key === "stamp") {
          }`
          );
          => typeof h)
          );
        }
      }
    }

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(
          ", "
        )}. Available headers: ${headers.join(", ")}`,
      });
    }

    // Process data rows (skip header)
    const dataRows = data.slice(1);
    const results = {
      categoriesCreated: 0,
      categoriesUpdated: 0,
      productsCreated: 0,
      productsUpdated: 0,
      errors: [],
    };

    // Group by category name (Item Name)
    const categoryGroups = {};

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // Excel row number (1-based + header)

      try {
        const itemName = row[columnIndices.itemName];
        if (!itemName) {
          const errorMsg = `Row ${rowNumber}: Item Name is required`;
          results.errors.push(errorMsg);
          continue;
        }

        if (!categoryGroups[itemName]) {
          categoryGroups[itemName] = [];
          }

        const productData = {
          row: row,
          rowNumber: rowNumber,
          indices: columnIndices,
        };

        categoryGroups[itemName].push(productData);
        `
        );
      } catch (error) {
        const errorMsg = `Row ${rowNumber}: ${error.message}`;
        results.errors.push(errorMsg);
      }
    }

    );
    .map(([name, products]) => [
          name,
          products.length,
        ])
      )
    );

    // Create/Update categories and products
    for (const [categoryName, products] of Object.entries(categoryGroups)) {
      try {
        // Check if category already exists
        const existingCategory = await findOrCreateCategory(categoryName);
        const categoryId = existingCategory.id;

        if (existingCategory.isNew) {
          results.categoriesCreated++;
          } else {
          results.categoriesUpdated++;
          }

        // Create/Update products for this category
        for (const productData of products) {
          try {
            await createOrUpdateProduct(productData, categoryId);

            if (productData.isUpdated) {
              results.productsUpdated++;
              } else {
              results.productsCreated++;
              }
          } catch (error) {
            const errorMsg = `Row ${productData.rowNumber}: ${error.message}`;
            results.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Category "${categoryName}": ${error.message}`;
        results.errors.push(errorMsg);
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      }

    res.json({
      message: "Excel import completed successfully",
      results: results,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      }

    res.status(500).json({ error: "Failed to import Excel file" });
  }
}

// Find existing category or create new one
function findOrCreateCategory(name) {
  return new Promise((resolve, reject) => {
    // First, try to find existing category
    const findSql = "SELECT id FROM categories WHERE name = ?";
    db.query(findSql, [name], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length > 0) {
        // Category exists, return it
        const categoryId = results[0].id;
        resolve({ id: categoryId, isNew: false });
      } else {
        // Category doesn't exist, create it
        const createSql = `
          INSERT INTO categories (name, status, created_at, updated_at) 
          VALUES (?, 'draft', NOW(), NOW())
        `;

        db.query(createSql, [name], (err, result) => {
          if (err) {
            reject(err);
          } else {
            const newCategoryId = result.insertId;
            resolve({ id: newCategoryId, isNew: true });
          }
        });
      }
    });
  });
}

// Create or update product based on SKU
function createOrUpdateProduct(productData, categoryId) {
  return new Promise((resolve, reject) => {
    const row = productData.row;
    const indices = productData.indices;
    const rowNumber = productData.rowNumber;

    // Extract product data according to new mapping
    const sku = row[indices.tgno] || "";
    const rawPurity = row[indices.stamp] || "";
    const pieces = parseInt(row[indices.pc]) || 0;
    const grossWeight = parseFloat(row[indices.gwt]) || 0;
    const netWeight = parseFloat(row[indices.nwt]) || 0;
    const size = row[indices.size] || "";
    const mrp = parseFloat(row[indices.mrp]) || 0;

    // Accept any stamp/purity value (no more ENUM restriction)
    const purity = rawPurity ? rawPurity.toString().trim() : "";

    // Enhanced debugging for purity/stamp field
    // Validate required fields
    if (!sku) {
      const errorMsg = "SKU (Tgno) is required";
      reject(new Error(errorMsg));
      return;
    }

    // Additional validation for data integrity
    if (pieces < 0) {
      const errorMsg = "Pieces cannot be negative";
      reject(new Error(errorMsg));
      return;
    }

    if (grossWeight < 0 || netWeight < 0) {
      const errorMsg = "Weight values cannot be negative";
      reject(new Error(errorMsg));
      return;
    }

    if (mrp < 0) {
      const errorMsg = "MRP cannot be negative";
      reject(new Error(errorMsg));
      return;
    }

    // First, check if product with this SKU already exists
    const checkSql = "SELECT id FROM products WHERE sku = ?";
    db.query(checkSql, [sku], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length > 0) {
        // Product exists, update it
        const existingProductId = results[0].id;
        , updating...`
        );

        const updateSql = `
          UPDATE products SET 
            name = ?,
            category_id = ?, 
            purity = ?, 
            pieces = ?, 
            gross_weight = ?, 
            net_weight = ?, 
            size = ?,
            mark_amount = ?,
            stock_status = 'available',
            updated_at = NOW()
          WHERE sku = ?
        `;

        const updateValues = [
          sku,
          categoryId,
          purity,
          pieces,
          grossWeight,
          netWeight,
          size,
          mrp,
          sku,
        ];
        db.query(updateSql, updateValues, (err, result) => {
          if (err) {
            reject(err);
          } else {
            productData.isUpdated = true;
            resolve(result);
          }
        });
      } else {
        // Product doesn't exist, create it
        const insertSql = `
          INSERT INTO products (
            name, sku, purity, pieces, gross_weight, net_weight, size, mark_amount,
            category_id, status, stock_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'available', NOW(), NOW())
        `;

        // Use SKU as product name since we don't have a separate product name field
        // Parameters: name, sku, purity, pieces, gross_weight, net_weight, size, mark_amount, category_id
        const insertValues = [
          sku,
          sku,
          purity,
          pieces,
          grossWeight,
          netWeight,
          size,
          mrp,
          categoryId,
        ];
        db.query(insertSql, insertValues, (err, result) => {
          if (err) {
            reject(err);
          } else {
            const newProductId = result.insertId;
            productData.isUpdated = false;
            resolve(result);
          }
        });
      }
    });
  });
}

// Add watermarks to existing products
async function addWatermarksToExistingProducts(req, res) {
  try {
    // Get all products from database
    productModel.getAllProducts((err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      let processedCount = 0;
      let errorCount = 0;
      let successCount = 0;

      // Process each product
      products.forEach(async (product) => {
        if (!product.image) {
          has no image, skipping...`
          );
          processedCount++;
          return;
        }

        try {
          // Check if image file exists
          const imagePath = path.join(
            __dirname,
            "../uploads/products",
            product.image
          );

          if (!fs.existsSync(imagePath)) {
            processedCount++;
            return;
          }

          // Check if image already has watermark (look for .webp extension)
          if (product.image.endsWith(".webp")) {
            processedCount++;
            successCount++;
            return;
          }

          // Process image with watermark
          const processedPath =
            await imageProcessingService.processProductImage(
              imagePath,
              product.image
            );
          const newImageName = path.basename(processedPath);

          // Update product in database with new image name
          productModel.updateProduct(
            product.id,
            { image: newImageName },
            (updateErr) => {
              if (updateErr) {
                errorCount++;
              } else {
                successCount++;
              }

              processedCount++;

              // Check if all products are processed
              if (processedCount === products.length) {
                res.json({
                  message: "Watermark processing completed",
                  summary: {
                    total: products.length,
                    successful: successCount,
                    errors: errorCount,
                  },
                });
              }
            }
          );
        } catch (error) {
          errorCount++;
          processedCount++;

          if (processedCount === products.length) {
            res.json({
              message: "Watermark processing completed with errors",
              summary: {
                total: products.length,
                successful: successCount,
                errors: errorCount,
              },
            });
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Stock management functions
function updateProductStockStatus(req, res) {
  const { id } = req.params;
  const { stock_status, notes } = req.body;

  if (
    !stock_status ||
    !["available", "out_of_stock", "reserved"].includes(stock_status)
  ) {
    return res
      .status(400)
      .json({
        error:
          "Valid stock_status is required (available, out_of_stock, reserved)",
      });
  }

  // Get current stock status for history tracking
  productModel.getProductStockStatus(id, (err, stockResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (stockResult.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const previousStatus = stockResult[0].stock_status;

    // Update stock status
    productModel.updateProductStockStatus(id, stock_status, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Record stock history
      const historyData = {
        product_id: parseInt(id),
        action: stock_status === "available" ? "released" : "reserved",
        quantity: 1,
        user_id: req.user.id,
        previous_status: previousStatus,
        new_status: stock_status,
        notes: notes || `Stock status manually updated to ${stock_status}`,
      };

      productModel.recordStockHistory(historyData, (historyErr) => {
        if (historyErr) {
          // Don't fail the request if history recording fails
        }

        res.json({
          message: "Product stock status updated successfully",
          product_id: id,
          previous_status: previousStatus,
          new_status: stock_status,
        });
      });
    });
  });
}

function getProductStockStatus(req, res) {
  const { id } = req.params;

  productModel.getProductStockStatus(id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      product_id: id,
      stock_status: results[0].stock_status,
    });
  });
}

function getProductStockHistory(req, res) {
  const { id } = req.params;

  // This would need a new function in the product model
  // For now, we'll use a direct database query
  const sql = `
    SELECT 
      psh.*,
      u.name as user_name,
      o.id as order_id
    FROM product_stock_history psh
    LEFT JOIN users u ON psh.user_id = u.id
    LEFT JOIN orders o ON psh.order_id = o.id
    WHERE psh.product_id = ?
    ORDER BY psh.created_at DESC
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      product_id: id,
      history: results,
    });
  });
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductBySku,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getProductImages,
  deleteProductImage,
  getProductsByCategory,
  importFromExcel,
  addWatermarksToExistingProducts,
  updateProductStockStatus,
  getProductStockStatus,
  getProductStockHistory,
};
