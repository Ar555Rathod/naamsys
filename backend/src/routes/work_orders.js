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
    const whereClause = { is_active: true };
    if (req.user.role === 'Vendor') {
      if (!req.user.vendor_id) {
        return res.json([]);
      }
      whereClause.vendor_id = req.user.vendor_id;
      whereClause.status = { not: 'Draft' };
    }

    const wos = await prisma.workOrder.findMany({
      where: whereClause,
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

    if (req.user.role === 'Vendor') {
      if (wo.vendor_id !== req.user.vendor_id || wo.status === 'Draft') {
        return res.status(403).json({ error: 'Access denied: Not authorized to view this Work Order' });
      }
    }

    // Enrich with creator details
    const creator = await prisma.user.findUnique({
      where: { id: wo.created_by },
      select: { id: true, name: true, email: true, role: true }
    });
    wo.creator = creator;

    // Resolve location names
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

    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Work Order details', details: error.message });
  }
});

// Create a new Work Order (V1)
router.post('/', async (req, res) => {
  try {
    const { project_id, vendor_id, contractor_id, work_description, completion_date, budget_amount, status } = req.body;
    
    const existingActiveWo = await prisma.workOrder.findFirst({
      where: {
        project_id: parseInt(project_id),
        is_active: true
      }
    });
    if (existingActiveWo) {
      return res.status(400).json({ error: `A Work Order already exists for this project (${existingActiveWo.wo_number}). Only one Work Order is allowed per project.` });
    }

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



// Edit Work Order in Draft mode
router.put('/:id', async (req, res) => {
  try {
    const woId = parseInt(req.params.id);
    const { project_id, vendor_id, contractor_id, work_description, completion_date, budget_amount, status, remarks } = req.body;

    const existingWo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });

    if (!existingWo) {
      return res.status(404).json({ error: 'Work Order not found' });
    }

    if (existingWo.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Work Orders in Draft mode can be edited' });
    }

    const updatedWo = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: woId },
        data: {
          project_id: project_id ? parseInt(project_id) : existingWo.project_id,
          vendor_id: vendor_id ? parseInt(vendor_id) : existingWo.vendor_id,
          contractor_id: contractor_id !== undefined ? (contractor_id ? parseInt(contractor_id) : null) : existingWo.contractor_id,
          work_description: work_description || existingWo.work_description,
          completion_date: completion_date ? new Date(completion_date) : existingWo.completion_date,
          budget_amount: budget_amount !== undefined ? parseFloat(budget_amount) : existingWo.budget_amount,
          status: status || existingWo.status,
          remarks: remarks || existingWo.remarks
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Edit Work Order',
          module: 'Work Orders',
          record_id: String(updated.id),
          new_value: `Updated Work Order '${updated.wo_number}' in Draft mode (Budget: ₹${parseFloat(updated.budget_amount).toLocaleString('en-IN')})`
        }
      });

      return updated;
    });

    res.json(updatedWo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Work Order', details: error.message });
  }
});

// GET daily logs for a specific work order
router.get('/:id/daily-logs', async (req, res) => {
  try {
    const woId = parseInt(req.params.id);
    const wo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    if (req.user.role === 'Vendor' && wo.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: Not authorized to view logs for this Work Order' });
    }

    const logs = await prisma.dailyLog.findMany({
      where: { work_order_id: woId },
      orderBy: { date: 'asc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily logs', details: error.message });
  }
});

// POST add a daily log to a work order
router.post('/:id/daily-logs', async (req, res) => {
  try {
    const woId = parseInt(req.params.id);
    const wo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    if (req.user.role === 'Vendor' && wo.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: Not authorized to add logs for this Work Order' });
    }

    // Check if logs are already approved
    if (wo.logs_approved) {
      return res.status(400).json({ error: 'Cannot add log: Work Order daily logs have already been approved.' });
    }

    const { date, start_reading, stop_reading, daily_hours, diesel_qty, diesel_issued_by, site_image_url } = req.body;
    if (!date || start_reading === undefined || stop_reading === undefined || daily_hours === undefined) {
      return res.status(400).json({ error: 'Date, Start Reading, Stop Reading, and Daily Hours are required fields.' });
    }

    const newLog = await prisma.$transaction(async (tx) => {
      const log = await tx.dailyLog.create({
        data: {
          work_order_id: woId,
          date: new Date(date),
          start_reading: parseFloat(start_reading),
          stop_reading: parseFloat(stop_reading),
          daily_hours: parseFloat(daily_hours),
          diesel_qty: diesel_qty ? parseFloat(diesel_qty) : null,
          diesel_issued_by: diesel_issued_by || null,
          site_image_url: site_image_url || null
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Daily Log',
          module: 'Work Orders',
          record_id: String(log.id),
          new_value: `Added daily log for WO '${wo.wo_number}' (Hours: ${parseFloat(daily_hours)}, Date: ${date})`
        }
      });

      return log;
    });

    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create daily log', details: error.message });
  }
});

// DELETE a daily log entry
router.delete('/daily-logs/:logId', async (req, res) => {
  try {
    const logId = parseInt(req.params.logId);
    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: { work_order: true }
    });
    if (!log) return res.status(404).json({ error: 'Daily log entry not found' });

    if (req.user.role === 'Vendor' && log.work_order.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: Not authorized to delete logs for this Work Order' });
    }

    if (log.work_order.logs_approved) {
      return res.status(400).json({ error: 'Cannot delete log: Work Order daily logs have already been approved.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.dailyLog.delete({ where: { id: logId } });
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Delete Daily Log',
          module: 'Work Orders',
          record_id: String(logId),
          new_value: `Deleted daily log entry for WO '${log.work_order.wo_number}'`
        }
      });
    });

    res.json({ message: 'Daily log entry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete daily log entry', details: error.message });
  }
});

// PUT update machine name
router.put('/:id/machine-name', async (req, res) => {
  try {
    const woId = parseInt(req.params.id);
    const { machine_name } = req.body;
    const wo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    if (req.user.role === 'Vendor' && wo.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: Not authorized to edit this Work Order' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedWO = await tx.workOrder.update({
        where: { id: woId },
        data: { machine_name }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Set Machine Name',
          module: 'Work Orders',
          record_id: String(woId),
          new_value: `Updated machine name of WO '${wo.wo_number}' to '${machine_name}'`
        }
      });

      return updatedWO;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update machine name', details: error.message });
  }
});

// PUT upload signed daily logs photocopy
router.put('/:id/upload-signed-logs', async (req, res) => {
  try {
    const woId = parseInt(req.params.id);
    const { signed_logs_url } = req.body;
    const wo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    if (req.user.role === 'Vendor' && wo.vendor_id !== req.user.vendor_id) {
      return res.status(403).json({ error: 'Access denied: Not authorized to edit this Work Order' });
    }

    if (wo.logs_approved) {
      return res.status(400).json({ error: 'Cannot upload: Signed logs photocopy has already been approved.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedWO = await tx.workOrder.update({
        where: { id: woId },
        data: { signed_logs_url }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Upload Signed Logs Photocopy',
          module: 'Work Orders',
          record_id: String(woId),
          new_value: `Uploaded signed logs photocopy '${signed_logs_url}' for WO '${wo.wo_number}'`
        }
      });

      return updatedWO;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload signed logs photocopy', details: error.message });
  }
});

// PUT approve signed photocopy of logs
router.put('/:id/logs-approval', async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Access denied: Admin or Manager role required to approve logs.' });
    }

    const woId = parseInt(req.params.id);
    const { logs_approved } = req.body;
    const wo = await prisma.workOrder.findUnique({
      where: { id: woId }
    });
    if (!wo) return res.status(404).json({ error: 'Work Order not found' });

    if (logs_approved && !wo.signed_logs_url) {
      return res.status(400).json({ error: 'Cannot approve: Vendor has not uploaded the signed logs photocopy yet.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedWO = await tx.workOrder.update({
        where: { id: woId },
        data: { 
          logs_approved: !!logs_approved,
          status: logs_approved ? 'Completed' : 'SentToVendor'
        }
      });

      const actionText = logs_approved ? 'Approve Signed Logs' : 'Reject/Unapprove Signed Logs';
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: actionText,
          module: 'Work Orders',
          record_id: String(woId),
          new_value: `${logs_approved ? 'Approved' : 'Unapproved'} signed daily logs photocopy for WO '${wo.wo_number}'`
        }
      });

      return updatedWO;
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update logs approval status', details: error.message });
  }
});

module.exports = router;
