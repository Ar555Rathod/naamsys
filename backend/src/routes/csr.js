const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all CSR companies
router.get('/', async (req, res) => {
  try {
    const csrs = await prisma.csrCompany.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(csrs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CSR companies' });
  }
});

// Register a new CSR company
router.post('/', async (req, res) => {
  try {
    const { name, budget, contact_person, email, phone } = req.body;
    
    // Auto-generate CSR ID
    const count = await prisma.csrCompany.count();
    const csr_id = `CSR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    
    const newCsr = await prisma.csrCompany.create({
      data: {
        csr_id,
        name,
        budget: parseFloat(budget),
        contact_person,
        email,
        phone,
        created_by: 1 // Default to admin for MVP
      }
    });
    res.status(201).json(newCsr);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register CSR company', details: error.message });
  }
});

module.exports = router;
