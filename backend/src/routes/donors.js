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

// Get all donors
router.get('/', async (req, res) => {
  try {
    const donors = await prisma.individualDonor.findMany({
      include: { projects: true }
    });
    res.json(donors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

// Register a donor
router.post('/', async (req, res) => {
  try {
    const { 
      name, pan, contact, email, budget, 
      admin_cost_type = 'PERCENT', admin_cost_value = 0 
    } = req.body;
    
    const count = await prisma.individualDonor.count() + 1;
    const donor_id = `IDN-${String(count).padStart(3, '0')}`;

    const originalBudget = parseFloat(budget) || 0;
    const adminCostType = admin_cost_type || 'PERCENT';
    const adminCostValue = parseFloat(admin_cost_value) || 0;

    let adminCostAmount = 0;
    if (adminCostType === 'PERCENT') {
      adminCostAmount = (originalBudget * adminCostValue) / 100;
    } else {
      adminCostAmount = adminCostValue;
    }
    const availableBudget = originalBudget - adminCostAmount;

    const donor = await prisma.individualDonor.create({
      data: {
        donor_id,
        name,
        pan,
        contact,
        email,
        budget: originalBudget,
        budget_remaining: availableBudget,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount,
        available_budget: availableBudget,
        created_by: req.user.id
      }
    });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register donor', details: error.message });
  }
});

// Update a donor
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, pan, contact, email, budget, 
      admin_cost_type = 'PERCENT', admin_cost_value = 0 
    } = req.body;
    const id = parseInt(req.params.id);
    
    const oldDonor = await prisma.individualDonor.findUnique({ 
      where: { id },
      include: { projects: true }
    });
    if (!oldDonor) return res.status(404).json({ error: 'Donor not found' });
    
    const originalBudget = parseFloat(budget) || 0;
    const adminCostType = admin_cost_type || 'PERCENT';
    const adminCostValue = parseFloat(admin_cost_value) || 0;

    let adminCostAmount = 0;
    if (adminCostType === 'PERCENT') {
      adminCostAmount = (originalBudget * adminCostValue) / 100;
    } else {
      adminCostAmount = adminCostValue;
    }
    const availableBudget = originalBudget - adminCostAmount;

    const spentBudget = oldDonor.projects?.reduce((sum, p) => sum + p.budget, 0) || 0;

    if (availableBudget < spentBudget) {
      return res.status(400).json({ 
        error: `Cannot update: New available budget (₹${availableBudget.toLocaleString()}) is less than total budget already allocated to projects (₹${spentBudget.toLocaleString()}).` 
      });
    }

    const budgetRemaining = availableBudget - spentBudget;

    const donor = await prisma.individualDonor.update({
      where: { id },
      data: {
        name, pan, contact, email, 
        budget: originalBudget,
        available_budget: availableBudget,
        budget_remaining: budgetRemaining,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount
      }
    });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update donor', details: error.message });
  }
});

// Get donor details
router.get('/:id', async (req, res) => {
  try {
    const donor = await prisma.individualDonor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projects: true
      }
    });
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donor details' });
  }
});

// Delete a donor
router.delete('/:id', async (req, res) => {
  try {
    await prisma.individualDonor.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete donor. Ensure there are no linked projects.' });
  }
});

module.exports = router;
