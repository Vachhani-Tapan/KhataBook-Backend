const cloudinary = require('../config/cloudinary');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image received' });
  }

  // Return only the path, so it keeps working if your PC's IP changes
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
};