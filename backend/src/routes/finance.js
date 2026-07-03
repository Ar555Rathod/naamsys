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

// Roles validation middlewares
const requireManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
    return res.status(403).json({ error: 'Access denied: Manager or Admin role required.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required.' });
  }
  next();
};

router.use(authenticate);

// 1. Get all Pending invoices that are not yet linked to any Working Sheet
router.get('/unlinked-invoices', requireManagerOrAdmin, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        payment_status: 'Pending',
        working_sheet_id: null
      },
      include: {
        project: true,
        vendor: true,
        contractor: true,
        purchase_order: {
          include: {
            vendor: true,
            contractor: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Resolve project location names
    for (const inv of invoices) {
      if (inv.project) {
        if (inv.project.district_id) {
          const d = await prisma.locationDistrict.findUnique({ where: { id: inv.project.district_id } });
          inv.project.district_name = d ? d.name : null;
        }
        if (inv.project.taluka_id) {
          const t = await prisma.locationTaluka.findUnique({ where: { id: inv.project.taluka_id } });
          inv.project.taluka_name = t ? t.name : null;
        }
        if (inv.project.village_id) {
          const v = await prisma.locationVillage.findUnique({ where: { id: inv.project.village_id } });
          inv.project.village_name = v ? v.name : null;
        }
      }
    }

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unlinked invoices', details: error.message });
  }
});

// 2. Fetch all Working Sheets
router.get('/working-sheets', requireManagerOrAdmin, async (req, res) => {
  try {
    const sheets = await prisma.workingSheet.findMany({
      include: {
        invoices: {
          include: {
            project: true,
            vendor: true,
            contractor: true,
            purchase_order: {
              include: {
                vendor: true,
                contractor: true
              }
            }
          }
        },
        bank_statement: true
      },
      orderBy: { id: 'desc' }
    });

    // Enrich invoices inside sheets with location names
    for (const sheet of sheets) {
      for (const inv of sheet.invoices) {
        if (inv.project) {
          if (inv.project.district_id) {
            const d = await prisma.locationDistrict.findUnique({ where: { id: inv.project.district_id } });
            inv.project.district_name = d ? d.name : null;
          }
          if (inv.project.taluka_id) {
            const t = await prisma.locationTaluka.findUnique({ where: { id: inv.project.taluka_id } });
            inv.project.taluka_name = t ? t.name : null;
          }
          if (inv.project.village_id) {
            const v = await prisma.locationVillage.findUnique({ where: { id: inv.project.village_id } });
            inv.project.village_name = v ? v.name : null;
          }
        }
      }
    }

    res.json(sheets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch working sheets', details: error.message });
  }
});

// 3. Create a Working Sheet in Draft State
router.post('/working-sheets', requireManagerOrAdmin, async (req, res) => {
  try {
    const { invoice_ids } = req.body; // array of invoice IDs
    if (!Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return res.status(400).json({ error: 'At least one invoice must be selected.' });
    }

    // Verify all invoices are pending and unlinked
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoice_ids },
        payment_status: 'Pending',
        working_sheet_id: null
      }
    });

    if (invoices.length !== invoice_ids.length) {
      return res.status(400).json({ error: 'Some selected invoices are invalid, already linked, or paid.' });
    }

    // Enforce 25 Lakhs Limit
    const totalPayment = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    if (totalPayment > 2500000) {
      return res.status(400).json({ error: 'Working Sheet Total Limit Exceeded: The total cannot exceed ₹25,00,000 (25 Lakhs).' });
    }

    const sheet = await prisma.$transaction(async (tx) => {
      const sheetNumber = `WS-${Date.now()}`;
      const record = await tx.workingSheet.create({
        data: {
          sheet_number: sheetNumber,
          status: 'Draft',
          total_payment: totalPayment,
          created_by: req.user.id
        }
      });

      // Link invoices
      await tx.invoice.updateMany({
        where: { id: { in: invoice_ids } },
        data: { working_sheet_id: record.id }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Working Sheet',
          module: 'Finance',
          record_id: String(record.id),
          new_value: `Created Working Sheet Draft '${sheetNumber}' containing ${invoices.length} invoices (Total: ₹${totalPayment.toLocaleString('en-IN')})`
        }
      });

      return record;
    }, { maxWait: 15000, timeout: 30000 });

    res.status(201).json(sheet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create working sheet', details: error.message });
  }
});

// 4. Publish Working Sheet (Manager sends to Admin for review)
router.put('/working-sheets/:id/publish', requireManagerOrAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sheet = await prisma.workingSheet.findUnique({ where: { id } });

    if (!sheet) return res.status(404).json({ error: 'Working Sheet not found' });
    if (sheet.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft Working Sheets can be published.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.workingSheet.update({
        where: { id },
        data: { status: 'Published' }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Publish Working Sheet',
          module: 'Finance',
          record_id: String(id),
          new_value: `Published Working Sheet '${sheet.sheet_number}' for Admin approval.`
        }
      });

      return record;
    }, { maxWait: 15000, timeout: 30000 });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish working sheet', details: error.message });
  }
});

// 5. Approve Working Sheet & Generate Bank Statement (Admin Only)
router.put('/working-sheets/:id/approve', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { approved_invoice_ids } = req.body; // Exact array of invoice IDs to keep

    if (!Array.isArray(approved_invoice_ids) || approved_invoice_ids.length === 0) {
      return res.status(400).json({ error: 'At least one invoice must be selected for approval.' });
    }

    // Defensive mapping to handle string or numeric IDs
    const approvedIds = approved_invoice_ids.map(id => parseInt(id)).filter(id => !isNaN(id));

    const sheet = await prisma.workingSheet.findUnique({
      where: { id },
      include: { invoices: { include: { project: true } } }
    });

    if (!sheet) return res.status(404).json({ error: 'Working Sheet not found' });
    if (sheet.status !== 'Published') {
      return res.status(400).json({ error: 'Only Published Working Sheets can be approved.' });
    }

    // Verify all approved invoices actually belong to this sheet
    const associatedInvoices = sheet.invoices.filter(inv => approvedIds.includes(inv.id));
    if (associatedInvoices.length !== approvedIds.length) {
      return res.status(400).json({ error: 'Some selected invoices do not belong to this Working Sheet.' });
    }

    // Enforce 25 Lakhs Limit on the final selected set
    const finalTotalPayment = associatedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    if (finalTotalPayment > 2500000) {
      return res.status(400).json({ error: 'Working Sheet Total Limit Exceeded: The approved total cannot exceed ₹25,00,000 (25 Lakhs).' });
    }

    const approvedSheet = await prisma.$transaction(async (tx) => {
      // 1. Disassociate unapproved invoices
      const unapprovedInvoiceIds = sheet.invoices
        .map(i => i.id)
        .filter(id => !approvedIds.includes(id));

      if (unapprovedInvoiceIds.length > 0) {
        await tx.invoice.updateMany({
          where: { id: { in: unapprovedInvoiceIds } },
          data: { working_sheet_id: null }
        });
      }

      // 2. Process budget deductions for Type A & Type C invoices being Paid (if project-linked)
      for (const inv of associatedInvoices) {
        if (inv.project_id && (inv.invoice_type === 'TypeA' || inv.invoice_type === 'TypeC')) {
          const currentProject = await tx.project.findUnique({ where: { id: inv.project_id } });
          if (!currentProject) {
            throw new Error(`Project with ID ${inv.project_id} linked to Invoice '${inv.invoice_id}' not found in database.`);
          }
          if (currentProject.budget_remaining < inv.total_amount) {
            throw new Error(`Invoice Blocked: Insufficient budget remaining for project '${currentProject.name}' to pay Invoice '${inv.invoice_id}'.`);
          }
          await tx.project.update({
            where: { id: inv.project_id },
            data: { budget_remaining: currentProject.budget_remaining - inv.total_amount }
          });
        }
      }

      // 3. Update all approved invoices to PAID
      await tx.invoice.updateMany({
        where: { id: { in: approvedIds } },
        data: {
          payment_status: 'Paid',
          payment_date: new Date()
        }
      });
      
      // Since updateMany sets a single value, we loop to update amount_paid dynamically for each invoice
      for (const inv of associatedInvoices) {
        await tx.invoice.update({
          where: { id: inv.id },
          data: { amount_paid: inv.total_amount }
        });
      }

      // 4. Mark Working Sheet as Approved
      const updatedSheet = await tx.workingSheet.update({
        where: { id },
        data: {
          status: 'Approved',
          total_payment: finalTotalPayment,
          approved_by: req.user.id,
          approved_at: new Date()
        }
      });

      // 5. Generate Bank Statement
      const statementNumber = `BS-${Date.now()}`;
      await tx.bankStatement.create({
        data: {
          statement_number: statementNumber,
          working_sheet_id: updatedSheet.id,
          created_by: req.user.id
        }
      });

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Approve Working Sheet',
          module: 'Finance',
          record_id: String(id),
          new_value: `Approved Working Sheet '${sheet.sheet_number}', generated Bank Statement '${statementNumber}' for ₹${finalTotalPayment.toLocaleString('en-IN')}`
        }
      });

      return updatedSheet;
    }, { maxWait: 20000, timeout: 40000 });

    res.json(approvedSheet);
  } catch (error) {
    console.error('Error approving working sheet:', error);
    res.status(500).json({ error: 'Failed to approve working sheet', details: error.message });
  }
});

// 6. Fetch all Bank Statements
router.get('/bank-statements', requireManagerOrAdmin, async (req, res) => {
  try {
    const statements = await prisma.bankStatement.findMany({
      include: {
        working_sheet: {
          include: {
            invoices: {
              include: {
                project: true,
                vendor: true,
                contractor: true,
                petrol_pump: {
                  include: {
                    fuel_company: true
                  }
                },
                purchase_order: {
                  include: {
                    vendor: true,
                    contractor: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json(statements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank statements', details: error.message });
  }
});

module.exports = router;
