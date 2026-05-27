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

    // Enrich with creator details
    const userIds = [...new Set(pos.map(p => p.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    pos.forEach(p => {
      p.creator = userMap.get(p.created_by) || null;
    });

    // Resolve location names for each PO's project
    for (const po of pos) {
      if (po.project) {
        if (po.project.district_id) {
          const d = await prisma.locationDistrict.findUnique({ where: { id: po.project.district_id } });
          po.project.district_name = d ? d.name : null;
        }
        if (po.project.taluka_id) {
          const t = await prisma.locationTaluka.findUnique({ where: { id: po.project.taluka_id } });
          po.project.taluka_name = t ? t.name : null;
        }
        if (po.project.village_id) {
          const v = await prisma.locationVillage.findUnique({ where: { id: po.project.village_id } });
          po.project.village_name = v ? v.name : null;
        }
      }
    }

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

    // Enrich with creator details
    const userIds = [...new Set(history.map(p => p.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    history.forEach(p => {
      p.creator = userMap.get(p.created_by) || null;
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

    // Enrich with creator details
    const creator = await prisma.user.findUnique({
      where: { id: po.created_by },
      select: { id: true, name: true, email: true, role: true }
    });
    po.creator = creator;

    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Purchase Order details', details: error.message });
  }
});

// Create a new Purchase Order (V1)
router.post('/', async (req, res) => {
  try {
    const { project_id, vendor_id, contractor_id, item_details, delivery_date, total_amount, status } = req.body;
    
    const newPo = await prisma.$transaction(async (tx) => {
      // Count unique po_numbers to generate sequential number
      const uniqueOrders = await tx.purchaseOrder.groupBy({
        by: ['po_number']
      });
      const po_number = `PO-${new Date().getFullYear()}-${(uniqueOrders.length + 1).toString().padStart(4, '0')}`;

      const po = await tx.purchaseOrder.create({
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

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Purchase Order',
          module: 'Purchase Orders',
          record_id: String(po.id),
          new_value: `Created Purchase Order '${po.po_number}' (Total: ₹${parseFloat(po.total_amount).toLocaleString('en-IN')})`
        }
      });

      return po;
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

    // Wrap in transaction: Deactivate previous, create new version, and write audit log
    const result = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: previousPo.id },
        data: { is_active: false }
      });

      const newPo = await tx.purchaseOrder.create({
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
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Amend Purchase Order',
          module: 'Purchase Orders',
          record_id: String(newPo.id),
          new_value: `Amended Purchase Order '${po_number}' to Version V${newPo.version} (Total: ₹${parseFloat(newPo.total_amount).toLocaleString('en-IN')})`
        }
      });

      return newPo;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to amend Purchase Order', details: error.message });
  }
});

// Update Purchase Order Status (e.g. Approve)
router.put('/:id/status', async (req, res) => {
  try {
    if (req.user.role === 'Operator') {
      return res.status(403).json({ error: 'Access denied: Operators cannot approve or modify order statuses.' });
    }
    const { status, remarks } = req.body;
    
    const po = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status,
          remarks: remarks || `Status updated to ${status}`
        }
      });

      const actionName = status === 'Approved' ? 'Approve Purchase Order' : 'Update Purchase Order Status';
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: actionName,
          module: 'Purchase Orders',
          record_id: String(updated.id),
          new_value: `${status === 'Approved' ? 'Approved' : 'Updated status of'} Purchase Order '${updated.po_number}' (Status: ${status})`
        }
      });

      return updated;
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

    const po = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id: parseInt(req.params.id) },
        data: {
          duly_signed_url,
          status: 'Completed'
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Complete Purchase Order',
          module: 'Purchase Orders',
          record_id: String(updated.id),
          new_value: `Signed and Completed Purchase Order '${updated.po_number}'`
        }
      });

      return updated;
    });

    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload signed Purchase Order copy', details: error.message });
  }
});

module.exports = router;
