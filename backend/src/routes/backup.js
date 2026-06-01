const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate and authorize (Admins and Managers)
const authorizeAdminOrManager = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin only restriction middleware
const authorizeAdminOnly = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authorizeAdminOrManager);

// Map of user-friendly names to Prisma model properties
const modelMapping = {
  users: 'user',
  projects: 'project',
  vendors: 'vendor',
  contractors: 'contractor',
  csrCompanies: 'csrCompany',
  govtEntries: 'govtEntry',
  govtWorkOrders: 'govtWorkOrder',
  individualDonors: 'individualDonor',
  invoices: 'invoice',
  invoiceLineItems: 'invoiceLineItem',
  workOrders: 'workOrder',
  purchaseOrders: 'purchaseOrder',
  uploadedFiles: 'uploadedFile',
  auditLogs: 'auditLog',
  configGsts: 'configGst',
  configTds: 'configTds',
  financialYears: 'financialYear',
  locationDistricts: 'locationDistrict',
  locationTalukas: 'locationTaluka',
  locationVillages: 'locationVillage',
  workingSheets: 'workingSheet',
  bankStatements: 'bankStatement'
};

// Get stats for all tables
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    const tableKeys = Object.keys(modelMapping);

    for (const key of tableKeys) {
      const prismaModel = modelMapping[key];
      const count = await prisma[prismaModel].count();
      stats[key] = {
        count,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics', details: error.message });
  }
});

// Get raw table records (with sanitization)
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const prismaModel = modelMapping[tableName];

    if (!prismaModel) {
      return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    // Fetch up to 1000 records to prevent memory exhaustion in UI
    let records = await prisma[prismaModel].findMany({
      take: 1000,
      orderBy: { id: 'desc' }
    });

    // Sanitize records
    if (tableName === 'users') {
      records = records.map(u => {
        const { password_hash, ...rest } = u;
        return { ...rest, password_hash: '[REDACTED]' };
      });
    }

    if (tableName === 'uploadedFiles') {
      records = records.map(f => {
        // Redact binary data for the explorer grid
        return {
          id: f.id,
          filename: f.filename,
          mime_type: f.mime_type,
          created_at: f.created_at,
          data_size: f.data ? f.data.length : 0,
          data: '[BINARY BLOB - DOWNLOAD BACKUP TO EXTRACT]'
        };
      });
    }

    res.json(records);
  } catch (error) {
    console.error(`Error fetching table ${req.params.tableName}:`, error);
    res.status(500).json({ error: `Failed to fetch records for table ${req.params.tableName}`, details: error.message });
  }
});

// Download full database backup (Admins only)
router.get('/download', authorizeAdminOnly, async (req, res) => {
  try {
    const backup = {};
    const tableKeys = Object.keys(modelMapping);

    for (const key of tableKeys) {
      const prismaModel = modelMapping[key];
      let records = await prisma[prismaModel].findMany();

      // For uploaded files, convert Buffer data to Base64 strings for JSON transferability
      if (key === 'uploadedFiles') {
        records = records.map(file => ({
          ...file,
          data: file.data ? file.data.toString('base64') : null
        }));
      }

      backup[key] = records;
    }

    const backupData = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=naam_backup_${dateStr}.json`);
    res.send(backupData);
  } catch (error) {
    console.error('Error generating database backup:', error);
    res.status(500).json({ error: 'Failed to generate database backup file', details: error.message });
  }
});

module.exports = router;
