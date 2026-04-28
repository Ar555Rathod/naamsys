const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

// Get all WCCs
router.get('/', async (req, res) => {
  try {
    const wccs = await prisma.wcc.findMany({
      include: {
        project: true,
        vendor: true,
        contractor: true
      },
      orderBy: { id: 'desc' }
    });
    res.json(wccs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch WCCs' });
  }
});

// Create a new WCC (usually done by contractor/vendor, but via admin for MVP)
router.post('/', async (req, res) => {
  try {
    const { project_id, vendor_id, contractor_id, work_description, completion_date } = req.body;
    
    const count = await prisma.wcc.count();
    const wcc_id = `WCC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const wcc = await prisma.wcc.create({
      data: {
        wcc_id,
        project_id: parseInt(project_id),
        vendor_id: parseInt(vendor_id),
        contractor_id: parseInt(contractor_id),
        work_description,
        completion_date: new Date(completion_date)
      }
    });
    res.status(201).json(wcc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create WCC', details: error.message });
  }
});

// Approve/Reject WCC
router.put('/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body; // 'Approved' or 'Rejected'
    const wcc = await prisma.wcc.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        remarks,
        approved_by: req.user.id,
        approved_at: new Date()
      }
    });
    res.json(wcc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update WCC status' });
  }
});

module.exports = router;
