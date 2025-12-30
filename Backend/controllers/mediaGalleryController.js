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
      if (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      }
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

  console.log(
    `🚀 [BULK UPLOAD] Processing ${req.files.length} files with auto-detection`
  );

  const results = [];
  const imageProcessingService = require("../services/imageProcessingService");
  const autoDetectionService = require("../services/autoDetectionService");
  const ocrService = require("../services/ocrService");
  const aiStudioService = require("../services/aiStudioService");

  const aiEnabled = aiStudioService.isEnabled();
  const aiMissing = !process.env.GOOGLE_AI_API_KEY ? "GOOGLE_AI_API_KEY" : null;

  if (!aiEnabled) {
    console.warn(
      "⚠️ [AI STUDIO] Disabled. Missing env:",
      aiMissing || "(unknown)"
    );
  }

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    try {
      console.log(
        `🔄 [BULK UPLOAD] Processing file ${i + 1}/${req.files.length}: ${
          file.originalname
        }`
      );

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
            console.log(`🔍 [OCR] Starting OCR extraction for ${file.originalname}...`);
            const ocr = await ocrService.extractTagNo(file.path, {
              minLen: 3,
              maxLen: 30,
            });
            ocrSku = ocr.tag;
            ocrCandidates = ocr.candidates || [];
            ocrMeta.tag = ocrSku;
            ocrMeta.candidates = ocrCandidates;
            
            if (ocrSku) {
              console.log(`✅ [OCR] Extracted tag: ${ocrSku} (candidates: ${ocrCandidates.join(", ") || "none"})`);
            } else {
              console.log(`ℹ️ [OCR] No tag found. Raw text: "${ocr.rawText || "(empty)"}", Candidates: ${ocrCandidates.length > 0 ? ocrCandidates.join(", ") : "none"}`);
            }
          } catch (ocrErr) {
            console.error(
              `❌ [OCR] OCR failed for ${file.originalname}:`,
              ocrErr.message,
              ocrErr.stack
            );
            ocrMeta.error = ocrErr.message;
          }

          if (ocrSku) {
            console.log(`🔍 [OCR] Detected SKU candidate: ${ocrSku}`);
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
              console.log(
                `✅ [OCR] Matched product by SKU: ${matchedProduct.sku} (${matchedProduct.name})`
              );
            } else {
              console.log(
                `⚠️ [OCR] SKU found (${ocrSku}) but no product matched. Will create new product with this SKU.`
              );
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
            console.log(`🔍 [AUTO-DETECT] Analyzing filename: ${file.originalname}`);
            detectedAssociation =
              await autoDetectionService.detectImageAssociation(file.originalname);
          }

          if (detectedAssociation) {
            console.log(
              `✅ [AUTO-DETECT] Detected: ${detectedAssociation.type} - ${detectedAssociation.name} (${detectedAssociation.confidence} confidence)`
            );

            // Process image based on detected type
            if (detectedAssociation.type === "product") {
              console.log(
                `🖼️ [BULK UPLOAD] Processing as product image: ${file.originalname}`
              );
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

                  console.log(`✨ [AI STUDIO] Running background removal...`);
                  bgRemovedPath = await aiStudioService.removeBackground(
                    file.path,
                    tempDir
                  );
                  aiMeta.bgRemovedPath = bgRemovedPath;
                  if (bgRemovedPath && bgRemovedPath.includes("/temp/")) {
                    tempFilesToCleanup.push(bgRemovedPath);
                  }

                  console.log(`✨ [AI STUDIO] Running studio generation...`);
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
                  console.warn(
                    `⚠️ [AI STUDIO] AI enhancement failed for ${file.originalname}, falling back to normal pipeline:`,
                    aiErr.message
                  );
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
                console.error(`❌ [BULK UPLOAD] Processed file does not exist: ${processedFilePath}`);
              } else {
                console.log(`✅ [BULK UPLOAD] Processed file verified: ${processedFilePath} (URL: ${fileUrl})`);
              }

              // Create or update product
              if (detectedAssociation.createNew || !detectedAssociation.id) {
                // Create new product with OCR-detected SKU
                console.log(`🆕 [BULK UPLOAD] Creating new product with SKU: ${detectedAssociation.sku}`);
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
                        console.error(
                          `❌ [BULK UPLOAD] Failed to create product:`,
                          err
                        );
                        reject(err);
                      } else {
                        const newProductId = result.insertId;
                        console.log(
                          `✅ [BULK UPLOAD] Created new product with ID ${newProductId} and SKU ${detectedAssociation.sku || detectedAssociation.name}`
                        );
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
                        console.error(
                          `❌ [BULK UPLOAD] Failed to update product:`,
                          err
                        );
                        reject(err);
                      } else {
                        console.log(
                          `✅ [BULK UPLOAD] Product updated with new image and set to active: ${detectedAssociation.name}`
                        );
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
              console.log(
                `🖼️ [BULK UPLOAD] Processing as category image: ${file.originalname}`
              );
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
                      console.error(
                        `❌ [BULK UPLOAD] Failed to update category:`,
                        err
                      );
                      reject(err);
                    } else {
                      console.log(
                        `✅ [BULK UPLOAD] Category updated with new image and set to active: ${detectedAssociation.name}`
                      );
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

            console.log(
              `✅ [BULK UPLOAD] Image processed and associated: ${fileUrl}`
            );
          } else {
            console.log(
              `❌ [AUTO-DETECT] No association found for: ${file.originalname}`
            );
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

                console.log(`✨ [AI STUDIO] Running background removal for unassociated image...`);
                bgRemovedPath = await aiStudioService.removeBackground(
                  file.path,
                  tempDir
                );
                aiMeta.bgRemovedPath = bgRemovedPath;
                if (bgRemovedPath && bgRemovedPath.includes("/temp/")) {
                  tempFilesToCleanup.push(bgRemovedPath);
                }

                console.log(`✨ [AI STUDIO] Running studio generation for unassociated image...`);
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
                console.warn(
                  `⚠️ [AI STUDIO] AI enhancement failed for ${file.originalname}, falling back to normal pipeline:`,
                  aiErr.message
                );
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
              console.error(`❌ [BULK UPLOAD] Processed file does not exist: ${processedFilePath}`);
            } else {
              console.log(`✅ [BULK UPLOAD] Processed file verified: ${processedFilePath} (URL: ${fileUrl})`);
            }

            // If OCR found a SKU but no product exists, create a new product
            if (ocrMeta.tag && !detectedAssociation) {
              console.log(`🆕 [BULK UPLOAD] OCR found SKU (${ocrMeta.tag}) but no association. Creating new product...`);
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
                        console.error(`❌ [BULK UPLOAD] Failed to create product from OCR SKU:`, err);
                        reject(err);
                      } else {
                        const newProductId = result.insertId;
                        console.log(`✅ [BULK UPLOAD] Created new product with ID ${newProductId} and SKU ${ocrMeta.tag}`);
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
                console.warn(`⚠️ [BULK UPLOAD] Could not create product from OCR SKU:`, createErr.message);
              }
            }
          }
        } catch (processError) {
          console.error(
            `❌ [BULK UPLOAD] Image processing failed for ${file.originalname}:`,
            processError
          );
          // Continue with original file if processing fails
        }
      } else {
        console.log(
          `📁 [BULK UPLOAD] Non-image file, skipping processing: ${file.originalname}`
        );
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

      // Log OCR results for debugging
      console.log(`📝 [OCR SUMMARY] File: ${file.originalname}`);
      console.log(`   - Tag found: ${ocrMeta.tag || "none"}`);
      console.log(`   - Candidates: ${ocrMeta.candidates.length > 0 ? ocrMeta.candidates.join(", ") : "none"}`);
      console.log(`   - Error: ${ocrMeta.error || "none"}`);
      if (ocrMeta.tag) {
        console.log(`   - ✅ OCR extracted SKU: ${ocrMeta.tag}`);
      } else {
        console.log(`   - ⚠️ OCR did not find any SKU/tag in image`);
      }

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
              console.error("❌ [BULK UPLOAD] Database error:", err);
              results[i] = {
                error: err.message,
                filename: file.originalname,
                success: false,
              };
              reject(err);
            } else {
              console.log(
                "✅ [BULK UPLOAD] File saved to media gallery:",
                fileData.title
              );
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
      console.error(
        `❌ [BULK UPLOAD] Error processing file ${file.originalname}:`,
        error
      );
      results[i] = {
        error: error.message,
        filename: file.originalname,
        success: false,
      };
    }
  }

  console.log("🎉 [BULK UPLOAD] All files processed:", results.length);

  // Clean up temporary files after processing
  console.log("🧹 [BULK UPLOAD] Cleaning up temporary files...");
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
              console.log(`✅ [CLEANUP] Deleted tracked temp file: ${tempFile}`);
            }
          } catch (cleanupError) {
            console.warn(
              `⚠️ [CLEANUP] Failed to delete tracked temp file ${tempFile}:`,
              cleanupError.message
            );
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
            console.log(`✅ [CLEANUP] Deleted uploaded temp file: ${file.path}`);
          }
        }
      } catch (cleanupError) {
        console.warn(
          `⚠️ [CLEANUP] Failed to delete temp file ${file.path}:`,
          cleanupError.message
        );
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
              console.log(`✅ [CLEANUP] Deleted old/AI temp file: ${tempFilePath}`);
            }
          } catch (cleanupError) {
            console.warn(
              `⚠️ [CLEANUP] Failed to delete temp file ${tempFilePath}:`,
              cleanupError.message
            );
          }
        }
      }
    }
  } catch (dirError) {
    console.warn(`⚠️ [CLEANUP] Failed to read temp directory:`, dirError.message);
  }

  console.log(`✅ [CLEANUP] Cleanup completed. Cleaned ${cleanedFiles.size} files.`);

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
  console.log("🔍 [DEBUG] Checking database contents...");

  // Check products table
  db.query("SELECT COUNT(*) as count FROM products", (err, productsCount) => {
    if (err) {
      console.error("❌ [DEBUG] Products count error:", err);
      return res.status(500).json({ error: err.message });
    }

    // Check categories table
    db.query(
      "SELECT COUNT(*) as count FROM categories",
      (err, categoriesCount) => {
        if (err) {
          console.error("❌ [DEBUG] Categories count error:", err);
          return res.status(500).json({ error: err.message });
        }

        // Check media_gallery table
        db.query(
          "SELECT COUNT(*) as count FROM media_gallery",
          (err, mediaCount) => {
            if (err) {
              console.error("❌ [DEBUG] Media gallery count error:", err);
              return res.status(500).json({ error: err.message });
            }

            // Get sample data from each table
            db.query(
              "SELECT id, name, image, status FROM products WHERE image IS NOT NULL LIMIT 5",
              (err, products) => {
                if (err) {
                  console.error("❌ [DEBUG] Products sample error:", err);
                  return res.status(500).json({ error: err.message });
                }

                db.query(
                  "SELECT id, name, image, status FROM categories WHERE image IS NOT NULL LIMIT 5",
                  (err, categories) => {
                    if (err) {
                      console.error("❌ [DEBUG] Categories sample error:", err);
                      return res.status(500).json({ error: err.message });
                    }

                    db.query(
                      "SELECT id, title, file_url, category FROM media_gallery LIMIT 5",
                      (err, media) => {
                        if (err) {
                          console.error(
                            "❌ [DEBUG] Media gallery sample error:",
                            err
                          );
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

                        console.log(
                          "🔍 [DEBUG] Database contents:",
                          JSON.stringify(debugInfo, null, 2)
                        );
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
  console.log("🔍 [MEDIA GALLERY] Fetching processed images...");
  console.log(
    "🔍 [DEBUG] Database name:",
    process.env.DB_NAME || "amrutjewels"
  );
  console.log("🔍 [DEBUG] Database host:", process.env.DB_HOST);
  console.log("🔍 [DEBUG] Database user:", process.env.DB_USER);

  // First, let's check what data actually exists with more flexible conditions
  console.log("🔍 [DEBUG] Checking what data exists in live database...");

  // Check products with any image data
  db.query(
    "SELECT id, name, image, status FROM products WHERE image IS NOT NULL LIMIT 10",
    (err, productsWithImages) => {
      if (err) {
        console.error("❌ [DEBUG] Products with images query failed:", err);
      } else {
        console.log("🔍 [DEBUG] Products with images:", productsWithImages);
      }
    }
  );

  // Check categories with any image data
  db.query(
    "SELECT id, name, image, status FROM categories WHERE image IS NOT NULL LIMIT 10",
    (err, categoriesWithImages) => {
      if (err) {
        console.error("❌ [DEBUG] Categories with images query failed:", err);
      } else {
        console.log("🔍 [DEBUG] Categories with images:", categoriesWithImages);
      }
    }
  );

  // Check media_gallery table
  db.query(
    "SELECT id, title, file_url, category FROM media_gallery LIMIT 10",
    (err, mediaGallery) => {
      if (err) {
        console.error("❌ [DEBUG] Media gallery query failed:", err);
      } else {
        console.log("🔍 [DEBUG] Media gallery:", mediaGallery);
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
    ) as main_data
    
    ORDER BY created_at DESC
  `;

  console.log("🔍 [DEBUG] Full SQL query:");
  console.log(sql);
  console.log("🔍 [DEBUG] Query length:", sql.length);

  // First, let's test a simple query to make sure database connection works
  console.log("🔍 [DEBUG] Testing basic database connection...");
  db.query("SELECT COUNT(*) as count FROM products", (testErr, testResults) => {
    if (testErr) {
      console.error("❌ [DEBUG] Basic database test failed:", testErr);
    } else {
      console.log("✅ [DEBUG] Basic database test successful:", testResults);
    }
  });

  // Test the specific products query
  console.log("🔍 [DEBUG] Testing products query...");
  db.query(
    "SELECT id, name, image, status FROM products WHERE image IS NOT NULL AND image != ''",
    (prodErr, prodResults) => {
      if (prodErr) {
        console.error("❌ [DEBUG] Products query failed:", prodErr);
      } else {
        console.log("✅ [DEBUG] Products query successful:", prodResults);
      }
    }
  );

  console.log("🔍 [DEBUG] About to execute main query...");
  db.query(sql, (err, results) => {
    console.log("🔍 [DEBUG] Query execution completed");

    if (err) {
      console.error("❌ [MEDIA GALLERY] Database error:", err);
      console.error("❌ [MEDIA GALLERY] Error details:", {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack,
      });
      return res.status(500).json({ error: err.message });
    }

    console.log(
      `📊 [MEDIA GALLERY] Found ${results.length} items from database`
    );
    console.log(
      "📋 [MEDIA GALLERY] Raw results:",
      JSON.stringify(results, null, 2)
    );

    // If no results found, try a more flexible query
    if (results.length === 0) {
      console.log(
        "🔍 [DEBUG] No results with strict conditions, trying flexible query..."
      );

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
        
        ORDER BY created_at DESC
      `;

      console.log("🔍 [DEBUG] Trying flexible query...");
      db.query(flexibleSql, (flexErr, flexResults) => {
        if (flexErr) {
          console.error("❌ [MEDIA GALLERY] Flexible query error:", flexErr);
          return res.status(500).json({ error: flexErr.message });
        }

        console.log(
          `📊 [MEDIA GALLERY] Flexible query found ${flexResults.length} items`
        );
        console.log(
          "📋 [MEDIA GALLERY] Flexible results:",
          JSON.stringify(flexResults, null, 2)
        );

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

        console.log(
          `✅ [MEDIA GALLERY] Processed ${processedResults.length} items`
        );
        res.json({
          success: true,
          message: "Processed media items retrieved successfully",
          items: processedResults,
          count: processedResults.length,
        });
      });
      return;
    }

    // If no results, let's debug what's in the database
    if (results.length === 0) {
      console.log("🔍 [DEBUG] No results found, checking individual tables...");

      // Check products table
      db.query(
        "SELECT id, name, image, status FROM products LIMIT 5",
        (err, products) => {
          if (err) {
            console.error("❌ [DEBUG] Error checking products:", err);
          } else {
            console.log("📋 [DEBUG] Sample products:", products);
          }
        }
      );

      // Check categories table
      db.query(
        "SELECT id, name, image, status FROM categories LIMIT 5",
        (err, categories) => {
          if (err) {
            console.error("❌ [DEBUG] Error checking categories:", err);
          } else {
            console.log("📋 [DEBUG] Sample categories:", categories);
          }
        }
      );

      // Check media_gallery table
      db.query(
        "SELECT id, title, file_url, category FROM media_gallery LIMIT 5",
        (err, media) => {
          if (err) {
            console.error("❌ [DEBUG] Error checking media_gallery:", err);
          } else {
            console.log("📋 [DEBUG] Sample media_gallery:", media);
          }
        }
      );
    }

    // Process results to include proper image URLs
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

    console.log(
      `✅ [MEDIA GALLERY] Processed ${processedResults.length} items`
    );
    console.log("📋 [MEDIA GALLERY] Processed results:", processedResults);

    // Return in the format expected by frontend
    res.json({
      success: true,
      message: "Processed media items retrieved successfully",
      items: processedResults, // Changed from 'data' to 'items'
      count: processedResults.length,
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
