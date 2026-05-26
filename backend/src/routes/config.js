const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Authentication middleware
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

// Restriction middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required.' });
  }
  next();
};

const requireAdminOrManager = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
    return res.status(403).json({ error: 'Access denied: Admin or Manager role required.' });
  }
  next();
};

router.use(authenticate);

// ==========================================
// GST CONFIGURATION ROUTES
// ==========================================
router.get('/gst', async (req, res) => {
  try {
    const gstList = await prisma.configGst.findMany({ orderBy: { id: 'desc' } });
    res.json(gstList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GST config' });
  }
});

router.post('/gst', requireAdmin, async (req, res) => {
  try {
    const { name, rate, effective_from } = req.body;
    if (!name || rate === undefined) {
      return res.status(400).json({ error: 'Name and Rate are required.' });
    }

    const gst = await prisma.$transaction(async (tx) => {
      const record = await tx.configGst.create({
        data: {
          name,
          rate: parseFloat(rate),
          effective_from: effective_from ? new Date(effective_from) : new Date()
        }
      });
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create GST Slab',
          module: 'Settings',
          record_id: String(record.id),
          new_value: `Created GST slab ${name} at ${rate}%`
        }
      });
      return record;
    });

    res.status(201).json(gst);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create GST config', details: error.message });
  }
});

// ==========================================
// TDS CONFIGURATION ROUTES
// ==========================================
router.get('/tds', async (req, res) => {
  try {
    const tdsList = await prisma.configTds.findMany({ orderBy: { id: 'desc' } });
    res.json(tdsList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TDS config' });
  }
});

router.post('/tds', requireAdmin, async (req, res) => {
  try {
    const { name, rate, category, effective_from } = req.body;
    if (!name || rate === undefined || !category) {
      return res.status(400).json({ error: 'Name, Rate, and Category are required.' });
    }

    const tds = await prisma.$transaction(async (tx) => {
      const record = await tx.configTds.create({
        data: {
          name,
          rate: parseFloat(rate),
          category,
          effective_from: effective_from ? new Date(effective_from) : new Date()
        }
      });
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create TDS Slab',
          module: 'Settings',
          record_id: String(record.id),
          new_value: `Created TDS slab ${name} at ${rate}%`
        }
      });
      return record;
    });

    res.status(201).json(tds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create TDS config', details: error.message });
  }
});

// ==========================================
// FINANCIAL YEAR ROUTES
// ==========================================
router.get('/fy', async (req, res) => {
  try {
    const fyList = await prisma.financialYear.findMany({ orderBy: { start_date: 'desc' } });
    res.json(fyList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Financial Years' });
  }
});

router.post('/fy', requireAdmin, async (req, res) => {
  try {
    const { label, start_date, end_date, is_active } = req.body;
    if (!label || !start_date || !end_date) {
      return res.status(400).json({ error: 'Label, Start Date, and End Date are required.' });
    }

    const fy = await prisma.$transaction(async (tx) => {
      // If is_active is true, deactivate all other financial years first
      if (is_active) {
        await tx.financialYear.updateMany({
          data: { is_active: false }
        });
      }

      const record = await tx.financialYear.create({
        data: {
          label,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          is_active: !!is_active
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Financial Year',
          module: 'Settings',
          record_id: String(record.id),
          new_value: `Created Financial Year ${label} (Active: ${!!is_active})`
        }
      });

      return record;
    });

    res.status(201).json(fy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Financial Year', details: error.message });
  }
});

// ==========================================
// AUDIT LOG TRAILS (Admin & Manager)
// ==========================================
router.get('/audit-logs', async (req, res) => {
  try {
    const { module, record_id } = req.query;

    // Only Admin or Manager can view the unrestricted full audit trail
    if (!module && !record_id) {
      if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
        return res.status(403).json({ error: 'Access denied: Admin or Manager role required to view unrestricted audit logs.' });
      }
    }

    const where = {};
    if (module) where.module = module;
    if (record_id) where.record_id = String(record_id);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 200 // Cap at latest 200 logs for premium scroll performance
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Audit logs', details: error.message });
  }
});

// ==========================================
// USER ADMINISTRATION (Admin Only)
// ==========================================
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true
      },
      orderBy: { id: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, Email, Password, and Role are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const record = await tx.user.create({
        data: {
          name,
          email,
          password_hash,
          role,
          is_active: true
        }
      });
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create User',
          module: 'User Management',
          record_id: String(record.id),
          new_value: `Created user ${name} (${email}) with role ${role}`
        }
      });
      return record;
    });

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      is_active: newUser.is_active
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own active status.' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const record = await tx.user.update({
        where: { id: userId },
        data: { is_active: !!is_active }
      });
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Toggle User Status',
          module: 'User Management',
          record_id: String(record.id),
          new_value: `Set user active status to ${!!is_active}`
        }
      });
      return record;
    });

    res.json({ id: updatedUser.id, email: updatedUser.email, is_active: updatedUser.is_active });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status', details: error.message });
  }
});

module.exports = router;
