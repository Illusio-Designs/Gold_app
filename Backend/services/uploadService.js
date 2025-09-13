const { upload } = require('../config/multerConfig');

// Example function to handle post-upload logic (e.g., save file info to DB)
async function handleFileUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // You can add logic here to save file info to DB if needed
    // Example: const { filename, path, mimetype, size } = req.file;
    res.status(200).json({ message: 'File uploaded successfully', file: req.file });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  handleFileUpload
}; 