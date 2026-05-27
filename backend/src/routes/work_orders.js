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

// Get all active (latest) Work Orders
router.get('/', async (req, res) => {
  try {
    const wos = await prisma.workOrder.findMany({
      where: { is_active: true },
      include: {
        project: true,
        vendor: true,
        contractor: true
      },
      orderBy: { id: 'desc' }
    });

    // Enrich with creator details
    const userIds = [...new Set(wos.map(w => w.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    wos.forEach(w => {
      w.creator = userMap.get(w.created_by) || null;
    });

    // Resolve location names for each WO's project
    for (const wo of wos) {
      if (wo.project) {
        if (wo.project.district_id) {
          const d = await prisma.locationDistrict.findUnique({ where: { id: wo.project.district_id } });
          wo.project.district_name = d ? d.name : null;
        }
        if (wo.project.taluka_id) {
          const t = await prisma.locationTaluka.findUnique({ where: { id: wo.project.taluka_id } });
          wo.project.taluka_name = t ? t.name : null;
        }
        if (wo.project.village_id) {
          const v = await prisma.locationVillage.findUnique({ where: { id: wo.project.village_id } });
          wo.project.village_name = v ? v.name : null;
        }
      }
    }

    res.json(wos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Work Orders', details: error.message });
  }
});

// Get history (all versions) of a specific Work Order by its wo_number
router.get('/history/:wo_number', async (req, res) => {
  try {
    const history = await prisma.workOrder.findMany({
      where: { wo_number: req.params.wo_number },
      include: {
        project: true,
        vendor: true,
        contractor: true
      },
      orderBy: { version: 'desc' }
    });

    // Enrich with creator details
    const userIds = [...new Set(history.map(w => w.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    history.forEach(w => {
      w.creator = userMap.get(w.created_by) || null;
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Work Order history', details: error.message });
  }
});

// Get details of a specific Work Order by database ID
router.get('/:id', async (req, res) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        project: true,
        vendor: true,
        contractor: true
      }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    // Enrich with creator details
    const creator = await prisma.user.findUnique({
      where: { id: wo.created_by },
      select: { id: true, name: true, email: true, role: true }
    });
    wo.creator = creator;

    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Work Order details', details: error.message });
  }
});

// Create a new Work Order (V1)
router.post('/', async (req, res) => {
  try {
    const { project_id, vendor_id, contractor_id, work_description, completion_date, budget_amount, status } = req.body;
    
    const newWo = await prisma.$transaction(async (tx) => {
      // Count unique wo_numbers to generate sequential number
      const uniqueOrders = await tx.workOrder.groupBy({
        by: ['wo_number']
      });
      const wo_number = `WO-${new Date().getFullYear()}-${(uniqueOrders.length + 1).toString().padStart(4, '0')}`;

      const wo = await tx.workOrder.create({
        data: {
          wo_number,
          version: 1,
          is_active: true,
          project_id: parseInt(project_id),
          vendor_id: parseInt(vendor_id),
          contractor_id: contractor_id ? parseInt(contractor_id) : null,
          work_description,
          completion_date: new Date(completion_date),
          budget_amount: budget_amount ? parseFloat(budget_amount) : 0,
          status: status || 'Draft',
          created_by: req.user.id
        }
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Work Order',
          module: 'Work Orders',
          record_id: String(wo.id),
          new_value: `Created Work Order '${wo.wo_number}' (Budget: ₹${parseFloat(wo.budget_amount).toLocaleString('en-IN')})`
        }
      });

      return wo;
    });

    res.status(201).json(newWo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Work Order', details: error.message });
  }
});

// Amend an existing Work Order (Creates incremented version, deactivates previous)
router.post('/amend', async (req, res) => {
  try {
    const { wo_number, work_description, completion_date, budget_amount, contractor_id, status, remarks } = req.body;

    // Find the latest active version of this wo_number
    const previousWo = await prisma.workOrder.findFirst({
      where: { wo_number, is_active: true }
    });

    if (!previousWo) {
      return res.status(404).json({ error: 'Active Work Order to amend not found' });
    }

    // Wrap in transaction: Deactivate previous, create new version, and write audit log
    const result = await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: previousWo.id },
        data: { is_active: false }
      });

      const newWo = await tx.workOrder.create({
        data: {
          wo_number,
          version: previousWo.version + 1,
          is_active: true,
          project_id: previousWo.project_id,
          vendor_id: previousWo.vendor_id,
          contractor_id: contractor_id !== undefined ? (contractor_id ? parseInt(contractor_id) : null) : previousWo.contractor_id,
          work_description: work_description || previousWo.work_description,
          completion_date: completion_date ? new Date(completion_date) : previousWo.completion_date,
          budget_amount: budget_amount !== undefined ? parseFloat(budget_amount) : previousWo.budget_amount,
          status: status || 'Draft',
          remarks: remarks || `Amended from Version V${previousWo.version}`,
          created_by: req.user.id
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Amend Work Order',
          module: 'Work Orders',
          record_id: String(newWo.id),
          new_value: `Amended Work Order '${wo_number}' to Version V${newWo.version} (Budget: ₹${parseFloat(newWo.budget_amount).toLocaleString('en-IN')})`
        }
      });

      return newWo;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to amend Work Order', details: error.message });
  }
});

// Update Work Order Status (e.g. Approve)
router.put('/:id/status', async (req, res) => {
  try {
    if (req.user.role === 'Operator') {
      return res.status(403).json({ error: 'Access denied: Operators cannot approve or modify order statuses.' });
    }
    const { status, remarks } = req.body;
    
    const wo = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status,
          remarks: remarks || `Status updated to ${status}`
        }
      });

      const actionName = status === 'Approved' ? 'Approve Work Order' : 'Update Work Order Status';
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: actionName,
          module: 'Work Orders',
          record_id: String(updated.id),
          new_value: `${status === 'Approved' ? 'Approved' : 'Updated status of'} Work Order '${updated.wo_number}' (Status: ${status})`
        }
      });

      return updated;
    });

    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Work Order status', details: error.message });
  }
});

// Upload Signed Copy & Mark as Completed
router.put('/:id/upload-signed', async (req, res) => {
  try {
    const { duly_signed_url } = req.body; // simulated URL or filename

    const wo = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: parseInt(req.params.id) },
        data: {
          duly_signed_url,
          status: 'Completed'
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Complete Work Order',
          module: 'Work Orders',
          record_id: String(updated.id),
          new_value: `Signed and Completed Work Order '${updated.wo_number}'`
        }
      });

      return updated;
    });

    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload signed Work Order copy', details: error.message });
  }
});

module.exports = router;
