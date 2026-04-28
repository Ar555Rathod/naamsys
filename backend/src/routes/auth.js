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
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
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

module.exports = router;
