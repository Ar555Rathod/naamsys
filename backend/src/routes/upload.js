const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
let activeUploadDir = uploadDir;

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Local uploads folder is read-only, falling back to /tmp/uploads on Vercel.');
  activeUploadDir = '/tmp/uploads';
  if (!fs.existsSync(activeUploadDir)) {
    try {
      fs.mkdirSync(activeUploadDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create fallback upload directory:', e.message);
    }
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, activeUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}_${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and image formats (JPG, PNG) are supported.'));
  }
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  
  res.json({
    message: 'File uploaded successfully!',
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
}, (err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

module.exports = router;
