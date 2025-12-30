const { db } = require("../config/db");
const path = require("path");
const fs = require("fs");
const { getBaseUrl } = require("../config/environment");

// Get all media files
function getAllMedia(req, res) {
  const sql = `
    SELECT * FROM media_gallery 
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ media: results });
  });
}

// Get media statistics
function getMediaStats(req, res) {
  const sql = `
    SELECT 
      COUNT(*) as total_files,
      SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) as image_count,
      SUM(CASE WHEN file_type = 'video' THEN 1 ELSE 0 END) as video_count,
      SUM(file_size) as total_size
    FROM media_gallery
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results[0]);
  });
}

// Delete orphaned files
function deleteOrphanedFiles(req, res) {
  res.json({ message: "Orphaned files deletion not implemented yet" });
}

// Delete specific file
function deleteFile(req, res) {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  const deleteSql = "DELETE FROM media_gallery WHERE file_path = ?";
  db.query(deleteSql, [filePath], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const fullPath = path.join(__dirname, "../uploads", filePath);
    fs.unlink(fullPath, (unlinkErr) => {
      // File deletion attempted
    });

    res.json({ message: "File deleted successfully" });
  });
}

// Clean up orphaned database records
function cleanupOrphanedRecords(req, res) {
  res.json({ message: "Cleanup orphaned records not implemented yet" });
}

// Get file info
function getFileInfo(req, res) {
  const { encodedPath } = req.params;
  const filePath = decodeURIComponent(encodedPath);

  const sql = "SELECT * FROM media_gallery WHERE file_path = ?";
  db.query(sql, [filePath], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(results[0]);
  });
}

// Upload media file
function uploadMedia(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { originalname, filename, mimetype, size } = req.file;
  const filePath = `media/${filename}`;
  const fileType = mimetype.startsWith("image/") ? "image" : "video";

  const sql = `
    INSERT INTO media_gallery (original_name, file_name, file_path, file_type, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [originalname, filename, filePath, fileType, size, mimetype],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "File uploaded successfully",
        file: {
          id: result.insertId,
          originalName: originalname,
          fileName: filename,
          filePath: filePath,
          fileType: fileType,
          fileSize: size,
          mimeType: mimetype,
        },
      });
    }
  );
}

// Bulk upload media files with auto-detection
async function bulkUploadMedia(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const results = [];
  const imageProcessingService = require("../services/imageProcessingService");
  const autoDetectionService = require("../services/autoDetectionService");
  const ocrService = require("../services/ocrService");
  const aiStudioService = require("../services/aiStudioService");

  const aiEnabled = aiStudioService.isEnabled();
  const aiMissing = !process.env.GOOGLE_AI_API_KEY ? "GOOGLE_AI_API_KEY" : null;

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    try {
      let processedFilePath = file.path; // Default to temp path
      let fileUrl = `/uploads/temp/${file.filename}`;
      let detectedAssociation = null;
      let updateResult = null;
      let ocrMeta = { enabled: true, tag: null, candidates: [], error: null };
      let aiMeta = {
        enabled: aiEnabled,
        missingEnv: aiMissing,
        attempted: false,
        bgRemovedPath: null,
        studioPath: null,
        error: null,
      };

      // Auto-detect image association
      if (file.mimetype.startsWith("image/")) {
        try {
          // Prefer OCR-based detection (tag/SKU inside image). Fallback to filename-based auto-detect.
          let ocrSku = null;
          let ocrCandidates = [];
          try {
            const ocr = await ocrService.extractTagNo(file.path, {
              minLen: 3,
              maxLen: 30,
            });
            ocrSku = ocr.tag;
            ocrCandidates = ocr.candidates || [];
            ocrMeta.tag = ocrSku;
            ocrMeta.candidates = ocrCandidates;
          } catch (ocrErr) {
            ocrMeta.error = ocrErr.message;
          }

          if (ocrSku) {
            const matchedProduct = await new Promise((resolve, reject) => {
              db.query(
                "SELECT id, name, sku FROM products WHERE sku = ? LIMIT 1",
                [ocrSku],
                (err, rows) => {
                  if (err) return reject(err);
                  resolve(rows && rows.length ? rows[0] : null);
                }
              );
            });

            if (matchedProduct) {
              detectedAssociation = {
                type: "product",
                id: matchedProduct.id,
                name: matchedProduct.name,
                sku: matchedProduct.sku,
                confidence: "high",
                source: "ocr",
                ocrCandidates,
              };
            } else {
              // Mark that we should create a product with this SKU
              detectedAssociation = {
                type: "product",
                id: null, // Will be created
                name: ocrSku,
                sku: ocrSku,
                confidence: "high",
                source: "ocr_new",
                ocrCandidates,
                createNew: true, // Flag to create new product
              };
            }
          }

          if (!detectedAssociation) {
            detectedAssociation =
              await autoDetectionService.detectImageAssociation(file.originalname);
          }

          if (detectedAssociation) {
            // Process image based on detected type
            if (detectedAssociation.type === "product") {
              // Optional AI photoshoot enhancement (only if configured)
              let inputPathForProcessing = file.path;
              let inputFilenameForProcessing = file.filename;
              let bgRemovedPath = null;
              const tempDir = path.join(__dirname, "../uploads/temp");
              const tempFilesToCleanup = []; // Track all temp files for cleanup

              if (aiEnabled) {
                try {
                  aiMeta.attempted = true;
                  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                  bgRemovedPath = await aiStudioService.removeBackground(
                    file.path,
                    tempDir
                  );
                  aiMeta.bgRemovedPath = bgRemovedPath;
                  if (bgRemovedPath && bgRemovedPath.includes("/temp/")) {
                    tempFilesToCleanup.push(bgRemovedPath);
                  }

                  const studioPath = await aiStudioService.generateStudioImage(
                    bgRemovedPath,
                    tempDir
                  );
                  aiMeta.studioPath = studioPath;
                  if (studioPath && studioPath.includes("/temp/")) {
                    tempFilesToCleanup.push(studioPath);
                  }

                  inputPathForProcessing = studioPath;
                  inputFilenameForProcessing = `${detectedAssociation.sku || "product"}-${Date.now()}.png`;

                  // Mark original temp upload for cleanup (don't delete immediately)
                  if (file.path && file.path.includes("/temp/")) {
                    tempFilesToCleanup.push(file.path);
                  }
                } catch (aiErr) {
                  aiMeta.error = aiErr.message;
                  inputPathForProcessing = file.path;
                  inputFilenameForProcessing = file.filename;
                }
                // Don't cleanup here - track for later cleanup
              }

              // Store temp files for cleanup
              if (tempFilesToCleanup.length > 0) {
                if (!results[i]) results[i] = {};
                results[i].tempFilesToCleanup = tempFilesToCleanup;
              }

              processedFilePath = await imageProcessingService.processProductImage(
                inputPathForProcessing,
                inputFilenameForProcessing
              );
              fileUrl = `/uploads/products/${path.basename(processedFilePath)}`;

              // Verify file exists
              if (!fs.existsSync(processedFilePath)) {
              }

              // Create or update product
              if (detectedAssociation.createNew || !detectedAssociation.id) {
                // Create new product with OCR-detected SKU
                const createProductSql = `
                  INSERT INTO products (name, sku, image, status, stock_status, created_at, updated_at)
                  VALUES (?, ?, ?, 'active', 'available', NOW(), NOW())
                `;
                await new Promise((resolve, reject) => {
                  db.query(
                    createProductSql,
                    [
                      detectedAssociation.sku || detectedAssociation.name, // Use SKU as name
                      detectedAssociation.sku || detectedAssociation.name,
                      path.basename(processedFilePath),
                    ],
                    (err, result) => {
                      if (err) {
                        reject(err);
                      } else {
                        const newProductId = result.insertId;
                        detectedAssociation.id = newProductId;
                        updateResult = {
                          type: "product",
                          id: newProductId,
                          name: detectedAssociation.sku || detectedAssociation.name,
                          status: "active",
                        };
                        resolve();
                      }
                    }
                  );
                });
              } else {
                // Update existing product with new image and set status to active
                const updateProductSql =
                  "UPDATE products SET image = ?, status = 'active' WHERE id = ?";
                await new Promise((resolve, reject) => {
                  db.query(
                    updateProductSql,
                    [path.basename(processedFilePath), detectedAssociation.id],
                    (err, result) => {
                      if (err) {
                        reject(err);
                      } else {
                        updateResult = {
                          type: "product",
                          id: detectedAssociation.id,
                          name: detectedAssociation.name,
                          status: "active",
                        };
                        resolve();
                      }
                    }
                  );
                });
              }
            } else if (detectedAssociation.type === "category") {
              processedFilePath =
                await imageProcessingService.processCategoryImage(
                  file.path,
                  file.filename
                );
              fileUrl = `/uploads/categories/${path.basename(
                processedFilePath
              )}`;

              // Update category with new image and set status to active
              const updateCategorySql =
                "UPDATE categories SET image = ?, status = 'active' WHERE id = ?";
              await new Promise((resolve, reject) => {
                db.query(
                  updateCategorySql,
                  [path.basename(processedFilePath), detectedAssociation.id],
                  (err, result) => {
                    if (err) {
                      reject(err);
                    } else {
                      updateResult = {
                        type: "category",
                        id: detectedAssociation.id,
                        name: detectedAssociation.name,
                        status: "active",
                      };
                      resolve();
                    }
                  }
                );
              });
            }

            } else {
            // Process as generic product image if no association found
            // Optional AI photoshoot enhancement (only if configured)
            let inputPathForProcessing = file.path;
            let inputFilenameForProcessing = file.filename;
            let bgRemovedPath = null;
            const tempDir = path.join(__dirname, "../uploads/temp");
            const tempFilesToCleanup = []; // Track all temp files for cleanup

            if (aiEnabled) {
              try {
                aiMeta.attempted = true;
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                bgRemovedPath = await aiStudioService.removeBackground(
                  file.path,
                  tempDir
                );
                aiMeta.bgRemovedPath = bgRemovedPath;
                if (bgRemovedPath && bgRemovedPath.includes("/temp/")) {
                  tempFilesToCleanup.push(bgRemovedPath);
                }

                const studioPath = await aiStudioService.generateStudioImage(
                  bgRemovedPath,
                  tempDir
                );
                aiMeta.studioPath = studioPath;
                if (studioPath && studioPath.includes("/temp/")) {
                  tempFilesToCleanup.push(studioPath);
                }

                inputPathForProcessing = studioPath;
                inputFilenameForProcessing = `product-${Date.now()}.png`;

                // Mark original temp upload for cleanup (don't delete immediately)
                if (file.path && file.path.includes("/temp/")) {
                  tempFilesToCleanup.push(file.path);
                }
              } catch (aiErr) {
                aiMeta.error = aiErr.message;
                inputPathForProcessing = file.path;
                inputFilenameForProcessing = file.filename;
              }
              // Don't cleanup here - track for later cleanup
            }

            // Store temp files for cleanup
            if (tempFilesToCleanup.length > 0) {
              if (!results[i]) results[i] = {};
              results[i].tempFilesToCleanup = tempFilesToCleanup;
            }

            processedFilePath = await imageProcessingService.processProductImage(
              inputPathForProcessing,
              inputFilenameForProcessing
            );
            fileUrl = `/uploads/products/${path.basename(processedFilePath)}`;
            
            // Verify file exists
            if (!fs.existsSync(processedFilePath)) {
            }

            // If OCR found a SKU but no product exists, create a new product
            if (ocrMeta.tag && !detectedAssociation) {
              const createProductSql = `
                INSERT INTO products (name, sku, image, status, stock_status, created_at, updated_at)
                VALUES (?, ?, ?, 'active', 'available', NOW(), NOW())
              `;
              try {
                await new Promise((resolve, reject) => {
                  db.query(
                    createProductSql,
                    [
                      ocrMeta.tag, // Use SKU as name
                      ocrMeta.tag,
                      path.basename(processedFilePath),
                    ],
                    (err, result) => {
                      if (err) {
                        reject(err);
                      } else {
                        const newProductId = result.insertId;
                        detectedAssociation = {
                          type: "product",
                          id: newProductId,
                          name: ocrMeta.tag,
                          sku: ocrMeta.tag,
                          confidence: "high",
                          source: "ocr_new",
                        };
                        updateResult = {
                          type: "product",
                          id: newProductId,
                          name: ocrMeta.tag,
                          status: "active",
                        };
                        resolve();
                      }
                    }
                  );
                });
              } catch (createErr) {
                }
            }
          }
        } catch (processError) {
          // Continue with original file if processing fails
        }
      } else {
        }

      // Save to media gallery for tracking
      const fileData = {
        title: file.originalname,
        file_url: fileUrl,
        file_type: file.mimetype.startsWith("image/") ? "image" : "video",
        category: detectedAssociation
          ? `${detectedAssociation.type}_auto_detected`
          : "bulk_upload",
        auto_detected: !!detectedAssociation,
        association: detectedAssociation,
        update_result: updateResult,
        ocr: ocrMeta,
        ai: aiMeta,
      };

      const sql = `
        INSERT INTO media_gallery (title, file_url, file_type, category)
        VALUES (?, ?, ?, ?)
      `;

      await new Promise((resolve, reject) => {
        db.query(
          sql,
          [
            fileData.title,
            fileData.file_url,
            fileData.file_type,
            fileData.category,
          ],
          (err, result) => {
            if (err) {
              results[i] = {
                error: err.message,
                filename: file.originalname,
                success: false,
              };
              reject(err);
            } else {
              results[i] = {
                id: result.insertId,
                filename: file.originalname,
                success: true,
                ...fileData,
              };
              resolve();
            }
          }
        );
      });
    } catch (error) {
      results[i] = {
        error: error.message,
        filename: file.originalname,
        success: false,
      };
    }
  }

  // Clean up temporary files after processing
  const tempDir = path.join(__dirname, "../uploads/temp");
  const cleanedFiles = new Set(); // Track cleaned files to avoid duplicates

  // Clean up files tracked in results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.tempFilesToCleanup && Array.isArray(result.tempFilesToCleanup)) {
      for (const tempFile of result.tempFilesToCleanup) {
        if (tempFile && !cleanedFiles.has(tempFile)) {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
              cleanedFiles.add(tempFile);
              }
          } catch (cleanupError) {
            }
        }
      }
    }
  }

  // Clean up original uploaded temp files
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    if (file && file.path && !cleanedFiles.has(file.path)) {
      try {
        // Only delete if it's still in temp directory and processing was successful
        if (file.path.includes("/temp/") && results[i] && results[i].success) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            cleanedFiles.add(file.path);
            }
        }
      } catch (cleanupError) {
        }
    }
  }

  // Clean up any remaining temp files in temp directory (AI-generated files)
  try {
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir);
      const now = Date.now();
      for (const tempFile of tempFiles) {
        const tempFilePath = path.join(tempDir, tempFile);
        if (!cleanedFiles.has(tempFilePath)) {
          try {
            const stats = fs.statSync(tempFilePath);
            // Delete files older than 1 hour or AI-generated files
            if (now - stats.mtimeMs > 3600000 || tempFile.includes("bg-removed") || tempFile.includes("studio-gemini") || tempFile.includes("studio-")) {
              fs.unlinkSync(tempFilePath);
              }
          } catch (cleanupError) {
            }
        }
      }
    }
  } catch (dirError) {
    }

  res.json({
    message: "Bulk upload completed with auto-detection",
    files: results,
    summary: {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      auto_detected: results.filter((r) => r.auto_detected).length,
    },
  });
}

// Get available products and categories for manual selection
function getAvailableItems(req, res) {
  const sql = `
    SELECT 'product' as type, id, name, image, created_at
    FROM products 
    WHERE status = 'active'
    UNION ALL
    SELECT 'category' as type, id, name, image, created_at
    FROM categories 
    WHERE status = 'active'
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ items: results });
  });
}

// Debug endpoint to check database contents
function debugDatabaseContents(req, res) {
  // Check products table
  db.query("SELECT COUNT(*) as count FROM products", (err, productsCount) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Check categories table
    db.query(
      "SELECT COUNT(*) as count FROM categories",
      (err, categoriesCount) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Check media_gallery table
        db.query(
          "SELECT COUNT(*) as count FROM media_gallery",
          (err, mediaCount) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Get sample data from each table
            db.query(
              "SELECT id, name, image, status FROM products WHERE image IS NOT NULL LIMIT 5",
              (err, products) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                db.query(
                  "SELECT id, name, image, status FROM categories WHERE image IS NOT NULL LIMIT 5",
                  (err, categories) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }

                    db.query(
                      "SELECT id, title, file_url, category FROM media_gallery LIMIT 5",
                      (err, media) => {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }

                        const debugInfo = {
                          counts: {
                            products: productsCount[0].count,
                            categories: categoriesCount[0].count,
                            media_gallery: mediaCount[0].count,
                          },
                          samples: {
                            products: products,
                            categories: categories,
                            media_gallery: media,
                          },
                          database: {
                            name: process.env.DB_NAME,
                            host: process.env.DB_HOST,
                            user: process.env.DB_USER,
                          },
                        };

                        res.json({ success: true, debug: debugInfo });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

// Get media items with actual processed images from products, categories, and media_gallery tables
function getMediaItemsWithProcessedImages(req, res) {
  // First, let's check what data actually exists with more flexible conditions
  // Check products with any image data
  db.query(
    "SELECT id, name, image, status FROM products WHERE image IS NOT NULL LIMIT 10",
    (err, productsWithImages) => {
      if (err) {
        } else {
        }
    }
  );

  // Check categories with any image data
  db.query(
    "SELECT id, name, image, status FROM categories WHERE image IS NOT NULL LIMIT 10",
    (err, categoriesWithImages) => {
      if (err) {
        } else {
        }
    }
  );

  // Check media_gallery table
  db.query(
    "SELECT id, title, file_url, category FROM media_gallery LIMIT 10",
    (err, mediaGallery) => {
      if (err) {
        } else {
        }
    }
  );

  const sql = `
    SELECT DISTINCT
      type,
      id,
      name,
      processed_image,
      created_at,
      category_name,
      source,
      product_status,
      category_status
    FROM (
    SELECT 
      'product' as type,
      p.id,
      p.name,
      p.image as processed_image,
      p.created_at,
        c.name as category_name,
        'database' as source,
        p.status as product_status,
        NULL as category_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.image IS NOT NULL AND p.image != '' AND p.image != 'null'
        AND p.image LIKE '%.webp'
    
    UNION ALL
    
    SELECT 
      'category' as type,
      c.id,
      c.name,
      c.image as processed_image,
      c.created_at,
        NULL as category_name,
        'database' as source,
        NULL as product_status,
        c.status as category_status
    FROM categories c
      WHERE c.image IS NOT NULL AND c.image != '' AND c.image != 'null'
        AND c.image LIKE '%.webp'
    
    UNION ALL
    
    SELECT 
      'media_gallery' as type,
      mg.id,
      mg.title as name,
      mg.file_url as processed_image,
      mg.created_at,
        NULL as category_name,
        'media_gallery' as source,
        NULL as product_status,
        NULL as category_status
    FROM media_gallery mg
      WHERE mg.file_url IS NOT NULL 
        AND mg.file_url != '' 
        AND mg.file_url != 'null'
        AND (mg.file_url LIKE '%.webp' OR mg.file_url LIKE '%.jpg' OR mg.file_url LIKE '%.jpeg' OR mg.file_url LIKE '%.png')
        AND mg.file_url LIKE '/uploads/%'
        AND mg.file_url NOT LIKE '%/temp/%'
        AND mg.file_url NOT LIKE '%temp/%'
        AND mg.category LIKE '%product%'
        AND NOT EXISTS (
          SELECT 1 FROM products p 
          WHERE p.image IS NOT NULL 
            AND (p.image = mg.file_url OR p.image = SUBSTRING_INDEX(mg.file_url, '/', -1))
        )
        AND NOT EXISTS (
          SELECT 1 FROM categories c 
          WHERE c.image IS NOT NULL 
            AND (c.image = mg.file_url OR c.image = SUBSTRING_INDEX(mg.file_url, '/', -1))
        )
    ) as main_data
    
    ORDER BY created_at DESC
  `;

  // First, let's test a simple query to make sure database connection works
  db.query("SELECT COUNT(*) as count FROM products", (testErr, testResults) => {
    if (testErr) {
      } else {
      }
  });

  // Test the specific products query
  db.query(
    "SELECT id, name, image, status FROM products WHERE image IS NOT NULL AND image != ''",
    (prodErr, prodResults) => {
      if (prodErr) {
        } else {
        }
    }
  );

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If no results found, try a more flexible query
    if (results.length === 0) {
      const flexibleSql = `
        SELECT 
          'product' as type,
          p.id,
          p.name,
          COALESCE(p.image, '') as processed_image,
          p.created_at,
          c.name as category_name,
          'database' as source,
          p.status as product_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.image IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'category' as type,
          c.id,
          c.name,
          COALESCE(c.image, '') as processed_image,
          c.created_at,
          NULL as category_name,
          'database' as source,
          c.status as category_status
        FROM categories c
        WHERE c.image IS NOT NULL
        
        UNION ALL
        
        SELECT 
          CASE 
            WHEN mg.category LIKE '%product%' THEN 'product'
            WHEN mg.category LIKE '%category%' THEN 'category'
            ELSE 'media_gallery'
          END as type,
          mg.id,
          mg.title as name,
          COALESCE(mg.file_url, '') as processed_image,
          mg.created_at,
          NULL as category_name,
          'media_gallery' as source,
          'media_gallery' as status
        FROM media_gallery mg
        WHERE mg.file_url IS NOT NULL
          AND mg.file_url NOT LIKE '%/temp/%'
          AND mg.file_url NOT LIKE '%temp/%'
          AND mg.category LIKE '%product%'
          AND NOT EXISTS (
            SELECT 1 FROM products p 
            WHERE p.image IS NOT NULL 
              AND (p.image = mg.file_url OR p.image = SUBSTRING_INDEX(mg.file_url, '/', -1))
          )
          AND NOT EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.image IS NOT NULL 
              AND (c.image = mg.file_url OR c.image = SUBSTRING_INDEX(mg.file_url, '/', -1))
          )
        
        ORDER BY created_at DESC
      `;

      db.query(flexibleSql, (flexErr, flexResults) => {
        if (flexErr) {
          return res.status(500).json({ error: flexErr.message });
        }

        // Process the flexible results
        const processedResults = flexResults.map((item) => {
          const imagePath = item.processed_image;
          const hasProcessedImage =
            imagePath && imagePath !== "" && imagePath !== "null";

          return {
            ...item,
            image: imagePath,
            imageUrl: hasProcessedImage
              ? `${getBaseUrl()}/uploads/${
                  item.type === "category" ? "categories" : "products"
                }/${imagePath}`
              : null,
            hasProcessedImage: hasProcessedImage,
          };
        });

        // Deduplicate flexible results based on image filename/path
        const seenImages = new Set();
        const deduplicatedResults = processedResults.filter((item) => {
          if (!item.processed_image) return false;
          
          // Extract filename from path (handle both full paths and just filenames)
          const filename = item.processed_image.includes('/') 
            ? item.processed_image.split('/').pop() 
            : item.processed_image;
          
          // Create a unique key based on filename
          const imageKey = filename.toLowerCase();
          
          if (seenImages.has(imageKey)) {
            return false; // Skip duplicate
          }
          
          seenImages.add(imageKey);
          return true; // Keep this item
        });

        res.json({
          success: true,
          message: "Processed media items retrieved successfully",
          items: deduplicatedResults,
          count: deduplicatedResults.length,
        });
      });
      return;
    }

    // If no results, let's debug what's in the database
    if (results.length === 0) {
      // Check products table
      db.query(
        "SELECT id, name, image, status FROM products LIMIT 5",
        (err, products) => {
          if (err) {
            } else {
            }
        }
      );

      // Check categories table
      db.query(
        "SELECT id, name, image, status FROM categories LIMIT 5",
        (err, categories) => {
          if (err) {
            } else {
            }
        }
      );

      // Check media_gallery table
      db.query(
        "SELECT id, title, file_url, category FROM media_gallery LIMIT 5",
        (err, media) => {
          if (err) {
            } else {
            }
        }
      );
    }

    // Process results to include proper image URLs and deduplicate
    const processedResults = results.map((item) => {
      let imageUrl = null;

      if (item.processed_image) {
        const baseUrl = getBaseUrl();

        // Determine directory based on file_url or type
        let directory;
        if (
          item.source === "media_gallery" &&
          item.processed_image.includes("/uploads/")
        ) {
          // Extract directory from file_url
          const pathParts = item.processed_image.split("/");
          directory = pathParts[pathParts.length - 2]; // Get directory name
        } else {
          // Use type-based directory
          directory = item.type === "category" ? "categories" : "products";
        }

        // If processed_image already contains full path, use it directly
        if (item.processed_image.startsWith("/uploads/")) {
          imageUrl = `${baseUrl}${item.processed_image}`;
        } else {
          imageUrl = `${baseUrl}/uploads/${directory}/${item.processed_image}`;
        }
      }

      return {
        ...item,
        image: item.processed_image, // Use processed_image as image for consistency
        imageUrl: imageUrl,
        hasProcessedImage: !!item.processed_image,
      };
    });

    // Deduplicate results based on image filename/path
    const seenImages = new Set();
    const deduplicatedResults = processedResults.filter((item) => {
      if (!item.processed_image) return false;
      
      // Extract filename from path (handle both full paths and just filenames)
      const filename = item.processed_image.includes('/') 
        ? item.processed_image.split('/').pop() 
        : item.processed_image;
      
      // Create a unique key based on filename
      const imageKey = filename.toLowerCase();
      
      if (seenImages.has(imageKey)) {
        return false; // Skip duplicate
      }
      
      seenImages.add(imageKey);
      return true; // Keep this item
    });

    // Return in the format expected by frontend
    res.json({
      success: true,
      message: "Processed media items retrieved successfully",
      items: deduplicatedResults, // Use deduplicated results
      count: deduplicatedResults.length,
    });
  });
}

// Serve media files
function serveMediaFile(req, res) {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", type, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}

module.exports = {
  getAllMedia,
  getMediaStats,
  deleteOrphanedFiles,
  deleteFile,
  cleanupOrphanedRecords,
  getFileInfo,
  uploadMedia,
  bulkUploadMedia,
  getAvailableItems,
  getMediaItemsWithProcessedImages,
  debugDatabaseContents,
  serveMediaFile,
};
