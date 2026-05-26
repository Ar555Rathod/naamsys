const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Multer Storage Configuration (In-Memory for stateless serverless environments)
const storage = multer.memoryStorage();

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

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    const ext = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFilename = `${Date.now()}_${baseName}${ext}`;

    // Store in MySQL database LONGBLOB
    await prisma.uploadedFile.create({
      data: {
        filename: uniqueFilename,
        mime_type: req.file.mimetype,
        data: req.file.buffer
      }
    });
    
    res.json({
      message: 'File uploaded successfully!',
      filename: uniqueFilename,
      url: `/uploads/${uniqueFilename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save uploaded file to database', details: error.message });
  }
}, (err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

module.exports = router;

