const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Create upload directories if they don't exist
const uploadDirs = {
  profile: path.join(__dirname, "../uploads/profile"),
  category: path.join(__dirname, "../uploads/categories"),
  product: path.join(__dirname, "../uploads/products"),
  excel: path.join(__dirname, "../uploads/excel"),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on route or file field name
    let uploadDir = uploadDirs.profile; // default

    // Multer destination configuration
    console.log("=== MULTER DESTINATION DEBUG ===");
    console.log("- File fieldname:", file.fieldname);
    console.log("- File originalname:", file.originalname);
    console.log("- File mimetype:", file.mimetype);
    console.log("- Request baseUrl:", req.baseUrl);
    console.log("- Request path:", req.path);
    console.log("- Request method:", req.method);
    console.log("- Request URL:", req.url);

    if (file.fieldname === "image" && req.baseUrl.includes("/products")) {
      uploadDir = uploadDirs.product;
      console.log("- Using products directory:", uploadDir);
    } else if (
      file.fieldname === "image" &&
      req.baseUrl.includes("/categories")
    ) {
      uploadDir = uploadDirs.category;
      console.log("- Using category directory:", uploadDir);
    } else if (
      (file.fieldname === "image" || file.fieldname === "images") &&
      req.baseUrl.includes("/media-gallery")
    ) {
      // For media gallery uploads, use a temporary directory
      uploadDir = path.join(__dirname, "../uploads/temp");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      console.log("- Using media gallery temp directory:", uploadDir);
    } else if (
      file.fieldname === "image" &&
      (req.baseUrl.includes("/users") || req.path.includes("/users"))
    ) {
      // For user profile uploads
      uploadDir = uploadDirs.profile;
      console.log("- Using profile directory for user upload:", uploadDir);
    } else {
      console.log("- Using default profile directory:", uploadDir);
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);

    // Get identifier from request body or params
    let identifier = "";

    if (req.baseUrl.includes("/products")) {
      // For products, use SKU if available
      identifier = req.body.sku || req.params.sku || req.body.name || "product";
    } else if (req.baseUrl.includes("/categories")) {
      // For categories, use category name
      identifier = req.body.name || req.params.name || "category";
    } else if (req.baseUrl.includes("/media-gallery")) {
      // For media gallery uploads, try to preserve original filename when possible
      if (req.body.type === "product") {
        identifier = req.body.sku || req.body.name || base;
      } else {
        identifier = req.body.name || base;
      }

      // If we have a meaningful identifier (not just 'product' or 'category'), use it
      if (identifier && identifier !== "product" && identifier !== "category") {
        // Clean identifier (remove special characters, replace spaces with underscores)
        const cleanIdentifier = identifier
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "_")
          .toLowerCase();

        cb(
          null,
          cleanIdentifier +
            "-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 15) +
            ext
        );
      } else {
        // Fallback to original filename with timestamp
        cb(
          null,
          base +
            "-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 15) +
            ext
        );
      }
    } else {
      identifier = base;
    }

    // Clean identifier (remove special characters, replace spaces with underscores)
    const cleanIdentifier = identifier
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    cb(
      null,
      cleanIdentifier +
        "-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 15) +
        ext
    );
  },
});

// Excel storage configuration
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirs.excel);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(
      null,
      base +
        "-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 15) +
        ext
    );
  },
});

const fileFilter = (req, file, cb) => {
  console.log("=== MULTER FILE FILTER DEBUG ===");
  console.log("- File fieldname:", file.fieldname);
  console.log("- File mimetype:", file.mimetype);
  console.log("- File originalname:", file.originalname);

  if (file.mimetype.startsWith("image/")) {
    console.log("- File accepted by filter");
    cb(null, true);
  } else {
    console.log("- File rejected by filter - not an image");
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Excel file filter
const excelFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/octet-stream", // fallback for some Excel files
  ];

  const allowedExtensions = [".xlsx", ".xls"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });
const excelUpload = multer({
  storage: excelStorage,
  fileFilter: excelFileFilter,
});

// Bulk upload configuration for multiple files
const bulkUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 20, // Maximum 20 files per upload
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

module.exports = { upload, excelUpload, bulkUpload };
