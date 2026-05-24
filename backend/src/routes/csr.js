const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all CSR companies
router.get('/', async (req, res) => {
  try {
    const csrs = await prisma.csrCompany.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(csrs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CSR companies' });
  }
});

// Register a new CSR company
router.post('/', async (req, res) => {
  try {
    const { name, budget, admin_cost_type, admin_cost_value, contact_person, email, phone } = req.body;
    
    // Auto-generate CSR ID
    const count = await prisma.csrCompany.count();
    const csr_id = `CSR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    
    const originalBudget = parseFloat(budget);
    const adminCostType = admin_cost_type || 'PERCENT';
    const adminCostValue = parseFloat(admin_cost_value) || 0;
    
    let adminCostAmount = 0;
    if (adminCostType === 'PERCENT') {
      adminCostAmount = (originalBudget * adminCostValue) / 100;
    } else {
      adminCostAmount = adminCostValue;
    }
    const availableBudget = originalBudget - adminCostAmount;

    const newCsr = await prisma.csrCompany.create({
      data: {
        csr_id,
        name,
        budget: originalBudget,
        budget_remaining: availableBudget,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount,
        available_budget: availableBudget,
        contact_person,
        email,
        phone,
        created_by: 1 // Default to admin for MVP
      }
    });
    res.status(201).json(newCsr);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register CSR company', details: error.message });
  }
});

// Get a single CSR company with its projects
router.get('/:id', async (req, res) => {
  try {
    const csr = await prisma.csrCompany.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { projects: true }
    });
    if (!csr) return res.status(404).json({ error: 'CSR Company not found' });
    res.json(csr);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CSR details' });
  }
});

// Update a CSR company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, budget, admin_cost_type, admin_cost_value, contact_person, email, phone } = req.body;

    const originalBudget = parseFloat(budget);
    const adminCostType = admin_cost_type || 'PERCENT';
    const adminCostValue = parseFloat(admin_cost_value) || 0;
    
    let adminCostAmount = 0;
    if (adminCostType === 'PERCENT') {
      adminCostAmount = (originalBudget * adminCostValue) / 100;
    } else {
      adminCostAmount = adminCostValue;
    }
    const availableBudget = originalBudget - adminCostAmount;

    // Get all projects linked to this CSR to find how much has been allocated/spent
    const projects = await prisma.project.findMany({
      where: { csr_id: parseInt(id) }
    });
    const spentBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const budgetRemaining = availableBudget - spentBudget;

    const updated = await prisma.csrCompany.update({
      where: { id: parseInt(id) },
      data: {
        name,
        budget: originalBudget,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount,
        available_budget: availableBudget,
        budget_remaining: budgetRemaining,
        contact_person,
        email,
        phone
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CSR company', details: error.message });
  }
});

module.exports = router;
