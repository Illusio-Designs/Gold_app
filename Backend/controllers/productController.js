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
        console.log(
          `🔄 [PRODUCT] Processing image for new product: ${req.file.filename}`
        );
        // Use the new image processing service with watermark
        const processedPath = await imageProcessingService.processProductImage(
          req.file.path,
          req.file.filename
        );
        imageFilename = path.basename(processedPath);
        console.log(
          `✅ [PRODUCT] Image processed successfully: ${imageFilename}`
        );

        // Original file is automatically deleted by the service
      } catch (imageError) {
        console.error("❌ [PRODUCT] Image processing error:", imageError);
        console.error("❌ [PRODUCT] Image processing error details:", {
          message: imageError.message,
          stack: imageError.stack,
          filename: req.file.filename,
        });
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
        console.error("Database error in createProduct:", err);
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
    console.error("Unexpected error in createProduct:", error);
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

  console.log("🔍 [BACKEND] getProductBySku called with SKU:", sku);

  productModel.getProductBySku(sku, (err, results) => {
    if (err) {
      console.error("❌ [BACKEND] Error getting product by SKU:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      console.log("❌ [BACKEND] No product found with SKU:", sku);
      return res.status(404).json({ error: "Product not found" });
    }

    console.log("✅ [BACKEND] Product found by SKU:", results[0]);
    res.json(results[0]);
  });
}

// Get product by ID
function getProductById(req, res) {
  const { id } = req.params;
  productModel.getProductById(id, (err, result) => {
    if (err) {
      console.error("Product fetch error:", err);
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
        console.log(
          `🔄 [PRODUCT] Processing image for product update: ${req.file.filename}`
        );
        // Use the new image processing service with watermark
        const processedPath = await imageProcessingService.processProductImage(
          req.file.path,
          req.file.filename
        );
        imageFilename = path.basename(processedPath);
        console.log(
          `✅ [PRODUCT] Image processed successfully: ${imageFilename}`
        );

        // Original file is automatically deleted by the service
      } catch (imageError) {
        console.error("❌ [PRODUCT] Image processing error:", imageError);
        console.error("❌ [PRODUCT] Image processing error details:", {
          message: imageError.message,
          stack: imageError.stack,
          filename: req.file.filename,
        });
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
        console.error("Database error:", err);
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
    console.error("Product update error:", error);
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

  console.log(
    `[Backend] getProductsByCategory called with categoryId:`,
    categoryId
  );
  console.log(`[Backend] categoryId type:`, typeof categoryId);

  // First, let's check if the category exists and is active
  const categoryCheckSql =
    "SELECT id, name, status FROM categories WHERE id = ?";
  db.query(categoryCheckSql, [categoryId], (categoryErr, categoryResults) => {
    if (categoryErr) {
      console.error(`[Backend] Error checking category:`, categoryErr);
      return res.status(500).json({ error: categoryErr.message });
    }

    console.log(`[Backend] Category check results:`, categoryResults);

    if (categoryResults.length === 0) {
      console.log(`[Backend] Category not found with ID:`, categoryId);
      return res.status(404).json({ error: "Category not found" });
    }

    const category = categoryResults[0];
    console.log(`[Backend] Category found:`, category);

    // Now let's check all products for this category (including draft ones for debugging)
    const allProductsSql =
      "SELECT id, name, sku, status, category_id FROM products WHERE category_id = ?";
    db.query(
      allProductsSql,
      [categoryId],
      (allProductsErr, allProductsResults) => {
        if (allProductsErr) {
          console.error(
            `[Backend] Error checking all products:`,
            allProductsErr
          );
          return res.status(500).json({ error: allProductsErr.message });
        }

        console.log(
          `[Backend] All products for category ${categoryId}:`,
          allProductsResults
        );

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
            console.error(`[Backend] Error in getProductsByCategory:`, err);
            return res.status(500).json({ error: err.message });
          }

          // Process results to include processed image URLs with watermarks
          const processedResults = results.map((product) => {
            let processedImageUrl = null;
            let originalImageUrl = null;
            let finalImageUrl = null;

            if (product.image) {
              // Original image URL
              originalImageUrl = `${
                process.env.BASE_URL || "http://10.106.29.15:3001"
              }/uploads/products/${product.image}`;

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
                processedImageUrl = `${
                  process.env.BASE_URL || "http://10.106.29.15:3001"
                }/uploads/products/${cleanedImageName}`;
                finalImageUrl = processedImageUrl;
                console.log(
                  `[Backend] ✅ Using enhanced cleaned/watermarked image: ${processedImageUrl}`
                );
              } else if (product.image.endsWith(".webp")) {
                // Fall back to existing processed .webp file
                processedImageUrl = originalImageUrl;
                finalImageUrl = processedImageUrl;
                console.log(
                  `[Backend] Using existing processed image: ${processedImageUrl}`
                );
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
                  processedImageUrl = `${
                    process.env.BASE_URL || "http://10.106.29.15:3001"
                  }/uploads/products/${processedImageName}`;
                  finalImageUrl = processedImageUrl;
                  console.log(
                    `[Backend] ✅ Using processed image: ${processedImageUrl}`
                  );
                } else {
                  // Processed image doesn't exist, fall back to original
                  processedImageUrl = null;
                  finalImageUrl = originalImageUrl;
                  console.log(
                    `[Backend] ⚠️ No processed image found for: ${product.image}`
                  );
                  console.log(
                    `[Backend] 🔄 Falling back to original image: ${originalImageUrl}`
                  );
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

          console.log(
            `[Backend] Active products found for category ${categoryId}:`,
            processedResults.length
          );
          processedResults.forEach((product, index) => {
            console.log(`[Backend] Product ${index + 1}:`, {
              id: product.id,
              name: product.name,
              sku: product.sku,
              image: product.image,
              processedImageUrl: product.processedImageUrl,
              originalImageUrl: product.originalImageUrl,
              finalImageUrl: product.imageUrl,
              hasProcessedImage: product.hasProcessedImage,
            });
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

    console.log("🔍 [EXCEL IMPORT] Excel import started");
    console.log("🔍 [EXCEL IMPORT] File:", req.file.filename);
    console.log("🔍 [EXCEL IMPORT] File path:", req.file.path);
    console.log("🔍 [EXCEL IMPORT] File size:", req.file.size, "bytes");

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log("🔍 [EXCEL IMPORT] Workbook sheets:", workbook.SheetNames);
    console.log("🔍 [EXCEL IMPORT] Using sheet:", sheetName);

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("🔍 [EXCEL IMPORT] Total rows in Excel:", data.length);
    console.log("🔍 [EXCEL IMPORT] First few rows:", data.slice(0, 3));

    if (data.length < 2) {
      console.log("❌ [EXCEL IMPORT] Excel file is empty or has no data rows");
      return res
        .status(400)
        .json({ error: "Excel file is empty or has no data rows" });
    }

    // Get headers (first row)
    const headers = data[0];
    console.log("🔍 [EXCEL IMPORT] Headers found:", headers);
    console.log("🔍 [EXCEL IMPORT] Headers count:", headers.length);

    // Debug: Show exact header names and their positions
    console.log("🔍 [EXCEL IMPORT] Detailed header analysis:");
    headers.forEach((header, index) => {
      if (header) {
        console.log(
          `🔍 [EXCEL IMPORT] Header ${index}: "${header}" (type: ${typeof header})`
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

    console.log("🔍 [EXCEL IMPORT] Searching for required columns...");

    for (const mapping of requiredColumnMappings) {
      const index = findColumn(mapping.names);
      if (index !== -1) {
        columnIndices[mapping.key] = index;
        console.log(
          `✅ [EXCEL IMPORT] Found column "${mapping.key}" at index ${index}: "${headers[index]}"`
        );

        // Special debugging for stamp column
        if (mapping.key === "stamp") {
          console.log(`🔍 [EXCEL IMPORT] STAMP COLUMN DEBUG:`);
          console.log(
            `🔍 [EXCEL IMPORT] - Expected names: ${mapping.names.join(", ")}`
          );
          console.log(`🔍 [EXCEL IMPORT] - Found at index: ${index}`);
          console.log(`🔍 [EXCEL IMPORT] - Header value: "${headers[index]}"`);
          console.log(
            `🔍 [EXCEL IMPORT] - Header type: ${typeof headers[index]}`
          );
          console.log(
            `🔍 [EXCEL IMPORT] - Header length: ${
              headers[index] ? headers[index].length : "null"
            }`
          );
        }
      } else {
        missingColumns.push(mapping.names[0]); // Use first name for error message
        console.log(
          `❌ [EXCEL IMPORT] Missing column "${mapping.key}". Tried names:`,
          mapping.names
        );

        // Special debugging for missing stamp column
        if (mapping.key === "stamp") {
          console.log(`🔍 [EXCEL IMPORT] STAMP COLUMN MISSING DEBUG:`);
          console.log(
            `🔍 [EXCEL IMPORT] - Tried to find: ${mapping.names.join(", ")}`
          );
          console.log(`🔍 [EXCEL IMPORT] - Available headers:`, headers);
          console.log(
            `🔍 [EXCEL IMPORT] - Header types:`,
            headers.map((h) => typeof h)
          );
        }
      }
    }

    console.log("🔍 [EXCEL IMPORT] Final column mapping:", columnIndices);

    if (missingColumns.length > 0) {
      console.log(
        "❌ [EXCEL IMPORT] Missing required columns:",
        missingColumns
      );
      console.log("❌ [EXCEL IMPORT] Available headers:", headers);
      return res.status(400).json({
        error: `Missing required columns: ${missingColumns.join(
          ", "
        )}. Available headers: ${headers.join(", ")}`,
      });
    }

    // Process data rows (skip header)
    const dataRows = data.slice(1);
    console.log("🔍 [EXCEL IMPORT] Processing", dataRows.length, "data rows");

    const results = {
      categoriesCreated: 0,
      categoriesUpdated: 0,
      productsCreated: 0,
      productsUpdated: 0,
      errors: [],
    };

    // Group by category name (Item Name)
    const categoryGroups = {};

    console.log("🔍 [EXCEL IMPORT] Grouping products by category...");

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // Excel row number (1-based + header)

      try {
        const itemName = row[columnIndices.itemName];
        console.log(
          `🔍 [EXCEL IMPORT] Row ${rowNumber}: Item Name = "${itemName}"`
        );

        if (!itemName) {
          const errorMsg = `Row ${rowNumber}: Item Name is required`;
          console.log(`❌ [EXCEL IMPORT] ${errorMsg}`);
          results.errors.push(errorMsg);
          continue;
        }

        if (!categoryGroups[itemName]) {
          categoryGroups[itemName] = [];
          console.log(
            `🔍 [EXCEL IMPORT] Created new category group: "${itemName}"`
          );
        }

        const productData = {
          row: row,
          rowNumber: rowNumber,
          indices: columnIndices,
        };

        categoryGroups[itemName].push(productData);
        console.log(
          `🔍 [EXCEL IMPORT] Added product to category "${itemName}" (Row ${rowNumber})`
        );
      } catch (error) {
        const errorMsg = `Row ${rowNumber}: ${error.message}`;
        console.log(`❌ [EXCEL IMPORT] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(
      "🔍 [EXCEL IMPORT] Category groups created:",
      Object.keys(categoryGroups)
    );
    console.log(
      "🔍 [EXCEL IMPORT] Products per category:",
      Object.fromEntries(
        Object.entries(categoryGroups).map(([name, products]) => [
          name,
          products.length,
        ])
      )
    );

    // Create/Update categories and products
    console.log("🔍 [EXCEL IMPORT] Starting category and product creation...");

    for (const [categoryName, products] of Object.entries(categoryGroups)) {
      try {
        console.log(
          `🔍 [EXCEL IMPORT] Processing category: "${categoryName}" with ${products.length} products`
        );

        // Check if category already exists
        const existingCategory = await findOrCreateCategory(categoryName);
        const categoryId = existingCategory.id;

        console.log(
          `🔍 [EXCEL IMPORT] Category "${categoryName}" - ID: ${categoryId}, Is New: ${existingCategory.isNew}`
        );

        if (existingCategory.isNew) {
          results.categoriesCreated++;
          console.log(
            `✅ [EXCEL IMPORT] Category "${categoryName}" created successfully`
          );
        } else {
          results.categoriesUpdated++;
          console.log(
            `✅ [EXCEL IMPORT] Category "${categoryName}" updated successfully`
          );
        }

        // Create/Update products for this category
        console.log(
          `🔍 [EXCEL IMPORT] Processing ${products.length} products for category "${categoryName}"`
        );

        for (const productData of products) {
          try {
            console.log(
              `🔍 [EXCEL IMPORT] Processing product row ${productData.rowNumber} for category "${categoryName}"`
            );

            await createOrUpdateProduct(productData, categoryId);

            if (productData.isUpdated) {
              results.productsUpdated++;
              console.log(
                `✅ [EXCEL IMPORT] Product row ${productData.rowNumber} updated successfully`
              );
            } else {
              results.productsCreated++;
              console.log(
                `✅ [EXCEL IMPORT] Product row ${productData.rowNumber} created successfully`
              );
            }
          } catch (error) {
            const errorMsg = `Row ${productData.rowNumber}: ${error.message}`;
            console.log(
              `❌ [EXCEL IMPORT] Product creation failed: ${errorMsg}`
            );
            results.errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `Category "${categoryName}": ${error.message}`;
        console.log(
          `❌ [EXCEL IMPORT] Category processing failed: ${errorMsg}`
        );
        results.errors.push(errorMsg);
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🔍 [EXCEL IMPORT] Uploaded file cleaned up");
    }

    console.log("🎉 [EXCEL IMPORT] Excel import completed successfully");
    console.log("📊 [EXCEL IMPORT] Final results:", results);

    res.json({
      message: "Excel import completed successfully",
      results: results,
    });
  } catch (error) {
    console.error("❌ [EXCEL IMPORT] Excel import error:", error);
    console.error("❌ [EXCEL IMPORT] Error stack:", error.stack);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🔍 [EXCEL IMPORT] Uploaded file cleaned up after error");
    }

    res.status(500).json({ error: "Failed to import Excel file" });
  }
}

// Find existing category or create new one
function findOrCreateCategory(name) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 [CATEGORY] Searching for category: "${name}"`);

    // First, try to find existing category
    const findSql = "SELECT id FROM categories WHERE name = ?";
    console.log(`🔍 [CATEGORY] SQL Query: ${findSql} with params: [${name}]`);

    db.query(findSql, [name], (err, results) => {
      if (err) {
        console.error(
          `❌ [CATEGORY] Database error finding category "${name}":`,
          err
        );
        reject(err);
        return;
      }

      console.log(`🔍 [CATEGORY] Database results for "${name}":`, results);

      if (results.length > 0) {
        // Category exists, return it
        const categoryId = results[0].id;
        console.log(
          `✅ [CATEGORY] Category "${name}" found with ID: ${categoryId}`
        );
        resolve({ id: categoryId, isNew: false });
      } else {
        // Category doesn't exist, create it
        console.log(
          `🔍 [CATEGORY] Category "${name}" not found, creating new one...`
        );

        const createSql = `
          INSERT INTO categories (name, status, created_at, updated_at) 
          VALUES (?, 'draft', NOW(), NOW())
        `;

        console.log(
          `🔍 [CATEGORY] SQL Insert: ${createSql} with params: [${name}]`
        );

        db.query(createSql, [name], (err, result) => {
          if (err) {
            console.error(
              `❌ [CATEGORY] Database error creating category "${name}":`,
              err
            );
            reject(err);
          } else {
            const newCategoryId = result.insertId;
            console.log(
              `✅ [CATEGORY] Category "${name}" created successfully with ID: ${newCategoryId}`
            );
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

    console.log(
      `🔍 [PRODUCT] Processing product row ${rowNumber} for category ID ${categoryId}`
    );
    console.log(`🔍 [PRODUCT] Raw row data:`, row);
    console.log(`🔍 [PRODUCT] Column indices:`, indices);

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
    console.log(`🔍 [PRODUCT] Row ${rowNumber} - Purity/Stamp debugging:`);
    console.log(`🔍 [PRODUCT] - indices.stamp value: ${indices.stamp}`);
    console.log(`🔍 [PRODUCT] - row[indices.stamp] raw value: "${rawPurity}"`);
    console.log(`🔍 [PRODUCT] - Final purity value: "${purity}"`);
    console.log(`🔍 [PRODUCT] - Column mapping for stamp:`, {
      key: "stamp",
      expectedNames: [
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
      foundIndex: indices.stamp,
      headerName: row[indices.stamp] ? "Found" : "Not found",
    });

    console.log(`🔍 [PRODUCT] Extracted product data:`, {
      sku,
      purity,
      pieces,
      grossWeight,
      netWeight,
      size,
      mrp,
      categoryId,
    });

    // Validate required fields
    if (!sku) {
      const errorMsg = "SKU (Tgno) is required";
      console.log(`❌ [PRODUCT] Row ${rowNumber}: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    // Additional validation for data integrity
    if (pieces < 0) {
      const errorMsg = "Pieces cannot be negative";
      console.log(`❌ [PRODUCT] Row ${rowNumber}: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    if (grossWeight < 0 || netWeight < 0) {
      const errorMsg = "Weight values cannot be negative";
      console.log(`❌ [PRODUCT] Row ${rowNumber}: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    if (mrp < 0) {
      const errorMsg = "MRP cannot be negative";
      console.log(`❌ [PRODUCT] Row ${rowNumber}: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    console.log(`🔍 [PRODUCT] Data validation passed for row ${rowNumber}`);
    console.log(
      `🔍 [PRODUCT] Checking if product with SKU "${sku}" already exists...`
    );

    // First, check if product with this SKU already exists
    const checkSql = "SELECT id FROM products WHERE sku = ?";
    console.log(`🔍 [PRODUCT] SQL Query: ${checkSql} with params: [${sku}]`);

    db.query(checkSql, [sku], (err, results) => {
      if (err) {
        console.error(
          `❌ [PRODUCT] Database error checking SKU "${sku}":`,
          err
        );
        reject(err);
        return;
      }

      console.log(`🔍 [PRODUCT] Database results for SKU "${sku}":`, results);

      if (results.length > 0) {
        // Product exists, update it
        const existingProductId = results[0].id;
        console.log(
          `🔍 [PRODUCT] Product with SKU "${sku}" exists (ID: ${existingProductId}), updating...`
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
        console.log(
          `🔍 [PRODUCT] SQL Update: ${updateSql} with params:`,
          updateValues
        );

        db.query(updateSql, updateValues, (err, result) => {
          if (err) {
            console.error(
              `❌ [PRODUCT] Database error updating product "${sku}":`,
              err
            );
            reject(err);
          } else {
            console.log(`✅ [PRODUCT] Product "${sku}" updated successfully`);
            productData.isUpdated = true;
            resolve(result);
          }
        });
      } else {
        // Product doesn't exist, create it
        console.log(
          `🔍 [PRODUCT] Product with SKU "${sku}" doesn't exist, creating new one...`
        );

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
        console.log(
          `🔍 [PRODUCT] SQL Insert: ${insertSql} with params:`,
          insertValues
        );

        db.query(insertSql, insertValues, (err, result) => {
          if (err) {
            console.error(
              `❌ [PRODUCT] Database error creating product "${sku}":`,
              err
            );
            console.error(`❌ [PRODUCT] Error details:`, {
              code: err.code,
              sqlMessage: err.sqlMessage,
              sqlState: err.sqlState,
            });
            reject(err);
          } else {
            const newProductId = result.insertId;
            console.log(
              `✅ [PRODUCT] Product "${sku}" created successfully with ID: ${newProductId}`
            );
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
  console.log("🚀 Starting watermark addition to existing products...");

  try {
    // Get all products from database
    productModel.getAllProducts((err, products) => {
      if (err) {
        console.error("❌ Error fetching products:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log(`📦 Found ${products.length} products to process`);

      let processedCount = 0;
      let errorCount = 0;
      let successCount = 0;

      // Process each product
      products.forEach(async (product) => {
        if (!product.image) {
          console.log(
            `⚠️ Product ${product.id} (${product.name}) has no image, skipping...`
          );
          processedCount++;
          return;
        }

        try {
          console.log(`🔄 Processing product ${product.id}: ${product.name}`);

          // Check if image file exists
          const imagePath = path.join(
            __dirname,
            "../uploads/products",
            product.image
          );

          if (!fs.existsSync(imagePath)) {
            console.log(
              `⚠️ Image file not found for product ${product.id}: ${imagePath}`
            );
            processedCount++;
            return;
          }

          // Check if image already has watermark (look for .webp extension)
          if (product.image.endsWith(".webp")) {
            console.log(
              `✅ Product ${product.id} already has processed image: ${product.image}`
            );
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
                console.error(
                  `❌ Error updating product ${product.id}:`,
                  updateErr
                );
                errorCount++;
              } else {
                console.log(
                  `✅ Successfully processed product ${product.id}: ${product.image} → ${newImageName}`
                );
                successCount++;
              }

              processedCount++;

              // Check if all products are processed
              if (processedCount === products.length) {
                console.log("\n🎉 Watermark processing completed!");
                console.log(`📊 Summary:`);
                console.log(`   - Total products: ${products.length}`);
                console.log(`   - Successfully processed: ${successCount}`);
                console.log(`   - Errors: ${errorCount}`);

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
          console.error(`❌ Error processing product ${product.id}:`, error);
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
    console.error("❌ Fatal error:", error);
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
          console.error("Error recording stock history:", historyErr);
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
