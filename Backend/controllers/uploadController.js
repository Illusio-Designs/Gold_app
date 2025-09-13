const { processImageUpload } = require('../utils/imageUpload');

async function uploadProfileImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const webpFilename = await processImageUpload(req.file, 'profile');
    res.json({ 
      filename: webpFilename, 
      url: `/uploads/profile/${webpFilename}` 
    });
  } catch (err) {
    res.status(500).json({ error: 'Image conversion failed', details: err.message });
  }
}

module.exports = { uploadProfileImage }; 