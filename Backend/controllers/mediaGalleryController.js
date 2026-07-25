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
async function uploadAndAssign(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const imageProcessingService = require("../services/imageProcessingService");
  const autoDetectionService = require("../services/autoDetectionService");
  const productModel = require("../models/product");
  const socketService = require("../services/socketService");

  const file = req.file;
  let productId = req.body.productId ? parseInt(req.body.productId, 10) : null;
  let matchedBy = "manual";

  try {
    // No product chosen -> auto-assign by the uploaded file name
    if (!productId) {
      const detection = await autoDetectionService.detectImageAssociation(
        file.originalname
      );
      if (detection && detection.type === "product") {
        productId = detection.id;
        matchedBy = `filename (${detection.confidence})`;
      }
    }

    // Still no product -> reject the upload and remove the temp file
    if (!productId) {
      fs.unlink(file.path, () => {});
      return res.status(422).json({
        matched: false,
        error:
          "No product matched the file name. Rename the file to the product SKU/name, or select a product.",
      });
    }

    // Verify the product exists
    const product = await new Promise((resolve, reject) => {
      productModel.getProductById(productId, (err, rows) =>
        err ? reject(err) : resolve(rows && rows[0])
      );
    });
    if (!product) {
      fs.unlink(file.path, () => {});
      return res.status(404).json({ matched: false, error: "Product not found" });
    }

    // Process image (Sharp -> WebP + watermark); the service removes the original file
    const processedPath = await imageProcessingService.processProductImage(
      file.path,
      file.filename
    );
    const outputFilename = path.basename(processedPath);

    // Assign the processed image to the product
    await new Promise((resolve, reject) => {
      productModel.addProductImage(productId, outputFilename, (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });

    // Live update to app + dashboard
    try {
      socketService.notifyProductUpdate(
        { ...product, image: outputFilename },
        "updated"
      );
    } catch (e) {}

    return res.json({
      success: true,
      matched: true,
      matchedBy,
      productId,
      productName: product.name,
      image: outputFilename,
    });
  } catch (err) {
    fs.unlink(file.path, () => {});
    return res.status(500).json({ error: err.message });
  }
}

// Bulk upload: assign each image to a product by its file name (watermark applied).
// Files whose name matches no product are rejected (reported as skipped).
async function bulkUploadMedia(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const imageProcessingService = require("../services/imageProcessingService");
  const autoDetectionService = require("../services/autoDetectionService");
  const productModel = require("../models/product");
  const socketService = require("../services/socketService");

  const results = [];

  for (const file of req.files) {
    try {
      const detection = await autoDetectionService.detectImageAssociation(
        file.originalname
      );

      if (!detection || detection.type !== "product") {
        fs.unlink(file.path, () => {});
        results.push({
          file: file.originalname,
          success: false,
          reason: "No matching product for file name",
        });
        continue;
      }

      const processedPath = await imageProcessingService.processProductImage(
        file.path,
        file.filename
      );
      const outputFilename = path.basename(processedPath);

      await new Promise((resolve, reject) => {
        productModel.addProductImage(detection.id, outputFilename, (err, result) =>
          err ? reject(err) : resolve(result)
        );
      });

      try {
        socketService.notifyProductUpdate(
          { id: detection.id, name: detection.name, image: outputFilename },
          "updated"
        );
      } catch (e) {}

      results.push({
        file: file.originalname,
        success: true,
        productId: detection.id,
        productName: detection.name,
        image: outputFilename,
        matchedBy: `filename (${detection.confidence})`,
      });
    } catch (err) {
      fs.unlink(file.path, () => {});
      results.push({ file: file.originalname, success: false, reason: err.message });
    }
  }

  const assigned = results.filter((r) => r.success).length;
  return res.json({
    message: `Assigned ${assigned}/${results.length} image(s) to products by file name`,
    summary: {
      total: results.length,
      assigned,
      rejected: results.length - assigned,
    },
    results,
  });
}

// Get available products and categories for manual selection
function getAvailableItems(req, res) {
  // Categories are icon-based (no images), so only products are listed here.
  const sql = `
    SELECT 'product' as type, id, name, image, created_at
    FROM products
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
  deleteFile,
  getFileInfo,
  uploadAndAssign,
  bulkUploadMedia,
  getAvailableItems,
  getMediaItemsWithProcessedImages,
  serveMediaFile,
};
