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

// Get all active (latest) Purchase Orders
router.get('/', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { is_active: true },
      include: {
        project: true,
        vendor: true,
        contractor: true
      },
      orderBy: { id: 'desc' }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Purchase Orders', details: error.message });
  }
});

// Get history (all versions) of a specific Purchase Order by its po_number
router.get('/history/:po_number', async (req, res) => {
  try {
    const history = await prisma.purchaseOrder.findMany({
      where: { po_number: req.params.po_number },
      include: {
        project: true,
        vendor: true,
        contractor: true
      },
      orderBy: { version: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Purchase Order history', details: error.message });
  }
});

// Get details of a specific Purchase Order by database ID
router.get('/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        project: true,
        vendor: true,
        contractor: true
      }
    });
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Purchase Order details', details: error.message });
  }
});

// Create a new Purchase Order (V1)
router.post('/', async (req, res) => {
  try {
    const { project_id, vendor_id, contractor_id, item_details, delivery_date, total_amount, status } = req.body;
    
    // Count unique po_numbers to generate sequential number
    const uniqueOrders = await prisma.purchaseOrder.groupBy({
      by: ['po_number']
    });
    const po_number = `PO-${new Date().getFullYear()}-${(uniqueOrders.length + 1).toString().padStart(4, '0')}`;

    const newPo = await prisma.purchaseOrder.create({
      data: {
        po_number,
        version: 1,
        is_active: true,
        project_id: parseInt(project_id),
        vendor_id: parseInt(vendor_id),
        contractor_id: contractor_id ? parseInt(contractor_id) : null,
        item_details,
        delivery_date: new Date(delivery_date),
        total_amount: parseFloat(total_amount),
        status: status || 'Draft',
        created_by: req.user.id
      }
    });
    res.status(201).json(newPo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Purchase Order', details: error.message });
  }
});

// Amend an existing Purchase Order (Creates incremented version, deactivates previous)
router.post('/amend', async (req, res) => {
  try {
    const { po_number, item_details, delivery_date, total_amount, contractor_id, status, remarks } = req.body;

    // Find the latest active version of this po_number
    const previousPo = await prisma.purchaseOrder.findFirst({
      where: { po_number, is_active: true }
    });

    if (!previousPo) {
      return res.status(404).json({ error: 'Active Purchase Order to amend not found' });
    }

    // Wrap in transaction: Deactivate previous, create new version
    const transaction = await prisma.$transaction([
      prisma.purchaseOrder.update({
        where: { id: previousPo.id },
        data: { is_active: false }
      }),
      prisma.purchaseOrder.create({
        data: {
          po_number,
          version: previousPo.version + 1,
          is_active: true,
          project_id: previousPo.project_id,
          vendor_id: previousPo.vendor_id,
          contractor_id: contractor_id !== undefined ? (contractor_id ? parseInt(contractor_id) : null) : previousPo.contractor_id,
          item_details: item_details || previousPo.item_details,
          delivery_date: delivery_date ? new Date(delivery_date) : previousPo.delivery_date,
          total_amount: total_amount !== undefined ? parseFloat(total_amount) : previousPo.total_amount,
          status: status || 'Draft',
          remarks: remarks || `Amended from Version V${previousPo.version}`,
          created_by: req.user.id
        }
      })
    ]);

    res.json(transaction[1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to amend Purchase Order', details: error.message });
  }
});

// Update Purchase Order Status (e.g. Approve)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        remarks: remarks || `Status updated to ${status}`
      }
    });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Purchase Order status', details: error.message });
  }
});

// Upload Signed Copy & Mark as Completed
router.put('/:id/upload-signed', async (req, res) => {
  try {
    const { duly_signed_url } = req.body; // simulated URL or filename
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: {
        duly_signed_url,
        status: 'Completed'
      }
    });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload signed Purchase Order copy', details: error.message });
  }
});

module.exports = router;
