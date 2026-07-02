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

// Get Organization Budget details
router.get('/budget', async (req, res) => {
  try {
    let budget = await prisma.organizationBudget.findFirst();
    if (!budget) {
      // Create initial budget if none exists
      budget = await prisma.organizationBudget.create({
        data: { total_budget: 10000000, budget_remaining: 10000000 }
      });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organization budget', details: error.message });
  }
});

// Update Organization Budget
router.post('/budget', async (req, res) => {
  try {
    const { total_budget, budget_remaining } = req.body;
    let budget = await prisma.organizationBudget.findFirst();

    if (!budget) {
      budget = await prisma.organizationBudget.create({
        data: {
          total_budget: parseFloat(total_budget),
          budget_remaining: parseFloat(budget_remaining !== undefined ? budget_remaining : total_budget)
        }
      });
    } else {
      budget = await prisma.organizationBudget.update({
        where: { id: budget.id },
        data: {
          total_budget: parseFloat(total_budget),
          budget_remaining: budget_remaining !== undefined ? parseFloat(budget_remaining) : parseFloat(total_budget)
        }
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'Update Org Budget',
        module: 'Settings',
        record_id: String(budget.id),
        new_value: `Updated Org Budget: Total ₹${budget.total_budget.toLocaleString()}, Remaining ₹${budget.budget_remaining.toLocaleString()}`
      }
    });

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization budget', details: error.message });
  }
});

// List all Fuel Companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.fuelCompany.findMany({
      include: { petrol_pumps: true, deposits: true }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fuel companies', details: error.message });
  }
});

// Create a new Fuel Company
router.post('/companies', async (req, res) => {
  try {
    const { name, bank_name, branch, account_no, ifsc, pan, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const company = await prisma.fuelCompany.create({
      data: { 
        name, 
        balance: 0, 
        total_deposited: 0,
        bank_name,
        branch,
        account_no,
        ifsc,
        pan,
        address
      }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'Create Fuel Company',
        module: 'Diesel',
        record_id: String(company.id),
        new_value: `Registered new Fuel Company tieup: ${name}`
      }
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fuel company', details: error.message });
  }
});

// List all Petrol Pumps
router.get('/pumps', async (req, res) => {
  try {
    const pumps = await prisma.petrolPump.findMany({
      include: { fuel_company: true }
    });
    res.json(pumps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch petrol pumps', details: error.message });
  }
});

// Create a new Petrol Pump
router.post('/pumps', async (req, res) => {
  try {
    const { name, gst, pan, contact, address, fuel_company_id } = req.body;
    if (!name || !fuel_company_id) return res.status(400).json({ error: 'Name and Fuel Company are required' });

    const count = await prisma.petrolPump.count() + 1;
    const pump_id = `PUMP-${String(count).padStart(4, '0')}`;

    const pump = await prisma.petrolPump.create({
      data: {
        pump_id,
        name,
        gst,
        pan,
        contact,
        address,
        fuel_company_id: parseInt(fuel_company_id)
      }
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'Create Petrol Pump',
        module: 'Diesel',
        record_id: String(pump.id),
        new_value: `Registered new Petrol Pump: ${name} (${pump_id})`
      }
    });

    res.status(201).json(pump);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create petrol pump', details: error.message });
  }
});

// Deposit money to a Fuel Company
router.post('/deposit', async (req, res) => {
  try {
    const { fuel_company_id, amount, remarks, deposit_date } = req.body;
    const depAmount = parseFloat(amount);

    if (isNaN(depAmount) || depAmount <= 0) {
      return res.status(400).json({ error: 'Deposit amount must be greater than zero.' });
    }

    // Get org budget
    let budget = await prisma.organizationBudget.findFirst();
    if (!budget) {
      budget = await prisma.organizationBudget.create({
        data: { total_budget: 10000000, budget_remaining: 10000000 }
      });
    }

    if (budget.budget_remaining < depAmount) {
      return res.status(400).json({
        error: `Insufficient organization budget. Available: ₹${budget.budget_remaining.toLocaleString()}`
      });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // Deduct from org budget
      await tx.organizationBudget.update({
        where: { id: budget.id },
        data: { budget_remaining: { decrement: depAmount } }
      });

      // Add to fuel company
      const updatedCompany = await tx.fuelCompany.update({
        where: { id: parseInt(fuel_company_id) },
        data: {
          balance: { increment: depAmount },
          total_deposited: { increment: depAmount }
        }
      });

      // Generate a bank sheet no for the authorized deposit
      const bankSheetNo = `FDS-${Date.now()}`;

      // Create deposit record
      const dep = await tx.dieselDeposit.create({
        data: {
          fuel_company_id: parseInt(fuel_company_id),
          amount: depAmount,
          deposit_date: deposit_date ? new Date(deposit_date) : new Date(),
          remarks: remarks || 'Deposit to pre-paid reserves',
          bank_sheet_no: bankSheetNo,
          created_by: req.user.id
        }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Deposit Diesel Funds',
          module: 'Diesel',
          record_id: String(dep.id),
          new_value: `Deposited ₹${depAmount.toLocaleString('en-IN')} to ${updatedCompany.name}. Org Budget Remaining: ₹${(budget.budget_remaining - depAmount).toLocaleString()}`
        }
      });

      return dep;
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process deposit', details: error.message });
  }
});

// Draw diesel (Deduct fuel amount and create invoice)
router.post('/draw', async (req, res) => {
  try {
    const { petrol_pump_id, project_id, vendor_id, amount } = req.body;
    const drawAmt = parseFloat(amount);

    if (isNaN(drawAmt) || drawAmt <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero.' });
    }

    // Load Petrol Pump & Company
    const pump = await prisma.petrolPump.findUnique({
      where: { id: parseInt(petrol_pump_id) },
      include: { fuel_company: true }
    });

    if (!pump) return res.status(404).json({ error: 'Petrol Pump not found.' });

    if (pump.fuel_company.balance < drawAmt) {
      return res.status(400).json({
        error: `Insufficient prepaid reserves in ${pump.fuel_company.name}. Available: ₹${pump.fuel_company.balance.toLocaleString()}`
      });
    }

    // Load Project
    const project = await prisma.project.findUnique({
      where: { id: parseInt(project_id) }
    });

    if (!project) return res.status(404).json({ error: 'Project not found.' });

    if (project.budget_remaining < drawAmt) {
      return res.status(400).json({
        error: `Insufficient project budget. Available: ₹${project.budget_remaining.toLocaleString()}`
      });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Deduct from Fuel Company balance
      await tx.fuelCompany.update({
        where: { id: pump.fuel_company_id },
        data: { balance: { decrement: drawAmt } }
      });

      // 2. Deduct from Project budget remaining
      await tx.project.update({
        where: { id: parseInt(project_id) },
        data: { budget_remaining: { decrement: drawAmt } }
      });

      // 2.5. Increment organization's central admin cost pool
      const orgBudget = await tx.organizationBudget.findFirst();
      if (orgBudget) {
        await tx.organizationBudget.update({
          where: { id: orgBudget.id },
          data: {
            admin_cost_pool_total: { increment: drawAmt },
            admin_cost_pool_remaining: { increment: drawAmt }
          }
        });
      }

      // 3. Create settled Invoice for Petrol Pump
      const invoice = await tx.invoice.create({
        data: {
          invoice_id: `DSL-${Date.now()}`,
          invoice_type: 'TypeC', // General Invoice
          project_id: parseInt(project_id),
          vendor_id: vendor_id ? parseInt(vendor_id) : null,
          petrol_pump_id: parseInt(petrol_pump_id),
          invoice_date: new Date(),
          subtotal: drawAmt,
          gst_rate: 0,
          gst_amount: 0,
          tds_rate: 0,
          tds_amount: 0,
          total_amount: drawAmt,
          payment_status: 'Paid', // Pre-settled from deposits
          amount_paid: drawAmt,
          payment_date: new Date(),
          particulars: `Diesel drawn by vendor from Petrol Pump: ${pump.name} under ${pump.fuel_company.name} tieup`,
          created_by: req.user.id
        }
      });

      // 4. Write Audit Log
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Draw Diesel',
          module: 'Diesel',
          record_id: String(invoice.id),
          new_value: `Vendor drew ₹${drawAmt.toLocaleString('en-IN')} worth of diesel from ${pump.name}. Deducted from ${pump.fuel_company.name} and Project ${project.project_id}`
        }
      });

      return invoice;
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete diesel draw transaction', details: error.message });
  }
});

module.exports = router;
