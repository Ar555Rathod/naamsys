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
      purchase_order_id, subtotal, total_amount 
    } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(project_id) }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Budget Checking Logic for Payable Invoices
    if (invoice_type === 'TypeA') {
      if (!purchase_order_id) {
        return res.status(400).json({ error: 'Invoice Blocked: A Purchase Order (PO) must be linked.' });
      }

      const po = await prisma.purchaseOrder.findUnique({ where: { id: parseInt(purchase_order_id) } });
      if (!po || po.status !== 'Completed') {
        return res.status(400).json({ error: 'Invoice Blocked: The linked Purchase Order must be Completed (Duly Signed copy uploaded) first.' });
      }

      if (project.budget_remaining < total_amount) {
        return res.status(400).json({ 
          error: 'Invoice Blocked: Insufficient remaining project budget.',
          budget_remaining: project.budget_remaining
        });
      }

      // Automatically deduct budget in a transaction
      const transaction = await prisma.$transaction([
        prisma.invoice.create({
          data: {
            invoice_id: `INV-${Date.now()}`,
            invoice_type,
            project_id: parseInt(project_id),
            vendor_id: po.vendor_id,
            contractor_id: po.contractor_id,
            purchase_order_id: parseInt(purchase_order_id),
            invoice_date: new Date(),
            subtotal: parseFloat(subtotal),
            total_amount: parseFloat(total_amount),
            payment_status: 'Pending',
            created_by: req.user.id
          }
        }),
        prisma.project.update({
          where: { id: project.id },
          data: { budget_remaining: project.budget_remaining - total_amount }
        })
      ]);

      return res.json(transaction[0]);
    } else {
      // TypeB / TypeC (Receivables)
      const invoice = await prisma.invoice.create({
        data: {
          invoice_id: `REC-${Date.now()}`,
          invoice_type,
          project_id: parseInt(project_id),
          invoice_date: new Date(),
          subtotal: parseFloat(subtotal),
          total_amount: parseFloat(total_amount),
          payment_status: 'Pending',
          created_by: req.user.id
        }
      });
      return res.json(invoice);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ 
      include: { 
        project: true,
        purchase_order: {
          include: {
            vendor: true,
            contractor: true
          }
        }
      }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

module.exports = router;
