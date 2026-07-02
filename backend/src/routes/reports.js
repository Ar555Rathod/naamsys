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

// Map of user-friendly names to Prisma model properties
const modelMapping = {
  projects: 'project',
  vendors: 'vendor',
  contractors: 'contractor',
  invoices: 'invoice',
  workOrders: 'workOrder',
  purchaseOrders: 'purchaseOrder',
  workingSheets: 'workingSheet',
  bankStatements: 'bankStatement',
  fuelCompanies: 'fuelCompany',
  dieselDeposits: 'dieselDeposit',
  auditLogs: 'auditLog'
};

// Get stats count for reporting dashboard
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      projects: { count: await prisma.project.count(), label: 'Projects' },
      vendors: { count: await prisma.vendor.count(), label: 'Vendors' },
      contractors: { count: await prisma.contractor.count(), label: 'Contractors' },
      invoices: { count: await prisma.invoice.count(), label: 'Invoices' },
      workOrders: { count: await prisma.workOrder.count(), label: 'Work Orders' },
      purchaseOrders: { count: await prisma.purchaseOrder.count(), label: 'Purchase Orders' },
      workingSheets: { count: await prisma.workingSheet.count(), label: 'Working Sheets' },
      bankStatements: { count: await prisma.bankStatement.count(), label: 'Bank Statements' },
      fuelCompanies: { count: await prisma.fuelCompany.count(), label: 'Fuel Tieups' },
      dieselDeposits: { count: await prisma.dieselDeposit.count(), label: 'Diesel Deposits' },
      auditLogs: { count: await prisma.auditLog.count(), label: 'Audit Logs' }
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reports stats:', error);
    res.status(500).json({ error: 'Failed to fetch database statistics for reports', details: error.message });
  }
});

// Get table records with relations resolved for high-fidelity human readable reports
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const prismaModel = modelMapping[tableName];

    if (!prismaModel) {
      return res.status(400).json({ error: `Invalid table name: ${tableName}` });
    }

    let records = [];

    // Fetch all records for reporting (no pagination block to ensure full reports can be generated)
    if (tableName === 'projects') {
      records = await prisma.project.findMany({
        include: { csr: true, govt_work_order: true, individual_donor: true },
        orderBy: { id: 'desc' }
      });
      // Resolve location names
      for (const p of records) {
        if (p.district_id) {
          const d = await prisma.locationDistrict.findUnique({ where: { id: p.district_id } });
          p.district_name = d ? d.name : null;
        }
        if (p.taluka_id) {
          const t = await prisma.locationTaluka.findUnique({ where: { id: p.taluka_id } });
          p.taluka_name = t ? t.name : null;
        }
        if (p.village_id) {
          const v = await prisma.locationVillage.findUnique({ where: { id: p.village_id } });
          p.village_name = v ? v.name : null;
        }
      }
    } else if (tableName === 'invoices') {
      records = await prisma.invoice.findMany({
        include: { project: true, vendor: true, contractor: true },
        orderBy: { id: 'desc' }
      });
    } else if (tableName === 'workOrders') {
      records = await prisma.workOrder.findMany({
        include: { project: true, vendor: true, contractor: true },
        orderBy: { id: 'desc' }
      });
    } else if (tableName === 'purchaseOrders') {
      records = await prisma.purchaseOrder.findMany({
        include: { project: true, vendor: true, contractor: true },
        orderBy: { id: 'desc' }
      });
    } else if (tableName === 'workingSheets') {
      records = await prisma.workingSheet.findMany({
        include: { invoices: true },
        orderBy: { id: 'desc' }
      });
    } else if (tableName === 'bankStatements') {
      records = await prisma.bankStatement.findMany({
        include: { working_sheet: { include: { invoices: true } } },
        orderBy: { id: 'desc' }
      });
    } else if (tableName === 'dieselDeposits') {
      records = await prisma.dieselDeposit.findMany({
        include: { fuel_company: true },
        orderBy: { id: 'desc' }
      });
    } else {
      // Default query for vendors, contractors, auditLogs, fuelCompanies
      records = await prisma[prismaModel].findMany({
        orderBy: { id: 'desc' }
      });
    }

    res.json(records);
  } catch (error) {
    console.error(`Error fetching report records for ${req.params.tableName}:`, error);
    res.status(500).json({ error: `Failed to fetch records for table ${req.params.tableName}`, details: error.message });
  }
});

// Get summary data for reporting
router.get('/summary', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        csr: true,
        govt_work_order: true,
        invoices: true
      }
    });

    const reportData = projects.map(p => {
      const totalInvoiced = p.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const utilized_percentage = p.budget > 0 ? ((p.budget - p.budget_remaining) / p.budget * 100).toFixed(2) : 0;
      
      return {
        Project_ID: p.project_id,
        Name: p.name,
        Type: p.type_of_work,
        Source: p.source_type,
        Funding_Entity: p.source_type === 'CSR' ? p.csr?.name : p.govt_work_order?.work_order_number,
        Total_Budget: p.budget,
        Budget_Utilized: p.budget - p.budget_remaining,
        Remaining_Budget: p.budget_remaining,
        Utilized_Percentage: `${utilized_percentage}%`,
        Invoices_Count: p.invoices.length,
        Status: p.status
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
