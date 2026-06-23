const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, vendor_id: user.vendor_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, vendor_id: user.vendor_id } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Setup admin for testing
router.post('/setup', async (req, res) => {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'Admin' } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    const password_hash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@naam.org',
        password_hash,
        role: 'Admin'
      }
    });
    
    res.json({ message: 'Admin user created successfully', user: { email: admin.email } });
  } catch (error) {
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

// Forgot Password flow (JWT token printed to console)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }
    
    const token = jwt.sign(
      { id: user.id, purpose: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Print clear visual instructions to server log
    console.log('\n=========================================');
    console.log('🗝️ PASSWORD RESET LINK INITIATED');
    console.log(`Email: ${email}`);
    console.log(`URL:   http://localhost:5173/reset-password?token=${token}`);
    console.log('=========================================\n');
    
    res.json({ message: 'A secure password-reset link has been logged to the server logs.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request reset', details: error.message });
  }
});

// Reset Password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }
    
    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({ error: 'Invalid token usage.' });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.id },
        data: { password_hash }
      }),
      prisma.auditLog.create({
        data: {
          user_id: decoded.id,
          action: 'Password Reset',
          module: 'Auth',
          record_id: String(decoded.id),
          new_value: 'User updated their password via email link.'
        }
      })
    ]);
    
    res.json({ message: 'Your password has been successfully reset.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
});

module.exports = router;
