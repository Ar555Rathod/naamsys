const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

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

router.post('/', async (req, res) => {
  try {
    const { 
      invoice_type, project_id, vendor_id, contractor_id, 
      purchase_order_id, subtotal, gst_rate = 0, tds_rate = 0
    } = req.body;

    let project = null;
    if (project_id) {
      project = await prisma.project.findUnique({
        where: { id: parseInt(project_id) }
      });
      if (!project) return res.status(404).json({ error: 'Project not found' });
    } else if (invoice_type !== 'TypeC') {
      return res.status(400).json({ error: 'Project is required for this invoice type.' });
    }

    const baseAmount = parseFloat(subtotal);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ error: 'Invoice base amount must be greater than zero.' });
    }

    const gRate = parseFloat(gst_rate);
    const tRate = parseFloat(tds_rate);
    
    const gst_amount = baseAmount * (gRate / 100);
    const tds_amount = baseAmount * (tRate / 100);
    const total_amount = baseAmount - tds_amount + gst_amount;

    // Enforce PO linkage if vendor_id is present
    if (vendor_id && !purchase_order_id) {
      return res.status(400).json({ error: 'Invoice Blocked: Invoices billed to a vendor must be linked to a Purchase Order (PO).' });
    }

    if (invoice_type === 'TypeA') {
      if (!purchase_order_id) {
        return res.status(400).json({ error: 'Invoice Blocked: A Purchase Order (PO) must be linked.' });
      }

      const po = await prisma.purchaseOrder.findUnique({ where: { id: parseInt(purchase_order_id) } });
      if (!po || po.status !== 'Completed') {
        return res.status(400).json({ error: 'Invoice Blocked: The linked Purchase Order must be Completed (Duly Signed copy uploaded) first.' });
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoice_id: `INV-${Date.now()}`,
            invoice_type,
            project_id: parseInt(project_id),
            vendor_id: po.vendor_id,
            contractor_id: po.contractor_id,
            purchase_order_id: parseInt(purchase_order_id),
            invoice_date: new Date(),
            subtotal: baseAmount,
            gst_rate: gRate,
            gst_amount,
            tds_rate: tRate,
            tds_amount,
            total_amount,
            payment_status: 'Pending',
            amount_paid: 0,
            payment_date: null,
            created_by: req.user.id
          }
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Generate Invoice',
            module: 'Invoices',
            record_id: String(inv.id),
            new_value: `Generated Pending Payable Invoice '${inv.invoice_id}' for project '${project.name}' (Net Total: ₹${total_amount.toLocaleString('en-IN')}, GST: ${gRate}%, TDS: ${tRate}%)`
          }
        });

        return inv;
      });

      return res.json(invoice);
    } else if (invoice_type === 'TypeC') {
      // General Invoice (TypeC) - Stationery, Food bills etc.
      // Optional project_id, particulars.
      let finalVendorId = vendor_id ? parseInt(vendor_id) : null;
      let finalPoId = purchase_order_id ? parseInt(purchase_order_id) : null;

      if (finalPoId) {
        const po = await prisma.purchaseOrder.findUnique({ where: { id: finalPoId } });
        if (po) {
          finalVendorId = po.vendor_id;
        }
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoice_id: `GEN-${Date.now()}`,
            invoice_type,
            project_id: project_id ? parseInt(project_id) : null,
            vendor_id: finalVendorId,
            contractor_id: contractor_id ? parseInt(contractor_id) : null,
            purchase_order_id: finalPoId,
            invoice_date: new Date(),
            subtotal: baseAmount,
            gst_rate: gRate,
            gst_amount,
            tds_rate: tRate,
            tds_amount,
            total_amount,
            payment_status: 'Pending',
            amount_paid: 0,
            payment_date: null,
            particulars: req.body.particulars || null,
            created_by: req.user.id
          }
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Generate Invoice',
            module: 'Invoices',
            record_id: String(inv.id),
            new_value: `Generated Pending General Invoice '${inv.invoice_id}'${project ? ` for project '${project.name}'` : ''} (Net Total: ₹${total_amount.toLocaleString('en-IN')}, GST: ${gRate}%, TDS: ${tRate}%, Particulars: ${req.body.particulars || 'None'})`
          }
        });

        return inv;
      });

      return res.json(invoice);
    } else {
      // TypeB (Receivables)
      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoice_id: `REC-${Date.now()}`,
            invoice_type,
            project_id: parseInt(project_id),
            vendor_id: vendor_id ? parseInt(vendor_id) : null,
            contractor_id: contractor_id ? parseInt(contractor_id) : null,
            invoice_date: new Date(),
            subtotal: baseAmount,
            gst_rate: gRate,
            gst_amount,
            tds_rate: tRate,
            tds_amount,
            total_amount,
            payment_status: 'Pending',
            amount_paid: 0,
            payment_date: null,
            created_by: req.user.id
          }
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Generate Invoice',
            module: 'Invoices',
            record_id: String(inv.id),
            new_value: `Generated Pending Receivable Invoice '${inv.invoice_id}' (${invoice_type}) for project '${project.name}' (Net Total: ₹${total_amount.toLocaleString('en-IN')})`
          }
        });

        return inv;
      });

      return res.json(invoice);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
});

// Toggle Invoice Payment Status (Admins/Managers Only)
router.put('/:id/payment-status', async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ error: 'Access denied: Admin or Manager role required to modify payment status.' });
    }

    const id = parseInt(req.params.id);
    const { payment_status } = req.body;

    if (payment_status !== 'Pending' && payment_status !== 'Paid') {
      return res.status(400).json({ error: 'Invalid payment status. Must be Pending or Paid.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.payment_status === payment_status) {
        return invoice;
      }

      if (payment_status === 'Paid') {
        if (invoice.project_id && (invoice.invoice_type === 'TypeA' || invoice.invoice_type === 'TypeC')) {
          if (invoice.project.budget_remaining < invoice.total_amount) {
            throw new Error(`Insufficient project budget to complete payment. Available: ₹${invoice.project.budget_remaining.toLocaleString()}`);
          }
          await tx.project.update({
            where: { id: invoice.project_id },
            data: { budget_remaining: invoice.project.budget_remaining - invoice.total_amount }
          });
        }

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            payment_status: 'Paid',
            amount_paid: invoice.total_amount,
            payment_date: new Date()
          }
        });

        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Mark Invoice Paid',
            module: 'Invoices',
            record_id: String(id),
            new_value: `Marked Invoice '${invoice.invoice_id}' as PAID in the amount of ₹${invoice.total_amount.toLocaleString('en-IN')}`
          }
        });

        return updatedInvoice;
      } else {
        if (invoice.project_id && (invoice.invoice_type === 'TypeA' || invoice.invoice_type === 'TypeC')) {
          await tx.project.update({
            where: { id: invoice.project_id },
            data: { budget_remaining: invoice.project.budget_remaining + invoice.total_amount }
          });
        }

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            payment_status: 'Pending',
            amount_paid: 0,
            payment_date: null
          }
        });

        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Mark Invoice Pending',
            module: 'Invoices',
            record_id: String(id),
            new_value: `Reverted Invoice '${invoice.invoice_id}' back to PENDING. Refunded ₹${invoice.total_amount.toLocaleString('en-IN')} to project budget.`
          }
        });

        return updatedInvoice;
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice payment status', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ 
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
    });

    // Enrich with creator details
    const userIds = [...new Set(invoices.map(i => i.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    invoices.forEach(i => {
      i.creator = userMap.get(i.created_by) || null;
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

module.exports = router;
