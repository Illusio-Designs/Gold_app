const path = require("path");
const fs = require("fs");

// Image processing has been removed — uploads are stored and served exactly as
// received (original format, no resize, no WebP conversion, no watermark).

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Process uploaded image — now a pass-through. multer has already saved the
// original file in the correct uploads/<type> directory, so we simply return
// its filename unchanged (no conversion).
async function processImageUpload(file /*, uploadType = "profile" */) {
  if (!file) {
    return null;
  }
  return file.filename;
}

// Delete image file
function deleteImage(filename, uploadType = "profile") {
  const uploadDirs = {
    profile: "uploads/profile",
    category: "uploads/category",
    product: "uploads/products",
  };

  const filePath = path.join(
    uploadDirs[uploadType] || "uploads/profile",
    filename
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Utility to delete old image if changed
function deleteOldImageIfChanged(oldFilename, newFilename, uploadType = "profile") {
  if (oldFilename && oldFilename !== newFilename) {
    try {
      deleteImage(oldFilename, uploadType);
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

module.exports = {
  processImageUpload,
  ensureDirectoryExists,
  deleteImage,
  deleteOldImageIfChanged,
};
