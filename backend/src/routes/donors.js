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
    const { name, pan, contact, email, budget } = req.body;
    
    const count = await prisma.individualDonor.count() + 1;
    const donor_id = `IDN-${String(count).padStart(3, '0')}`;

    const donor = await prisma.individualDonor.create({
      data: {
        donor_id,
        name,
        pan,
        contact,
        email,
        budget: parseFloat(budget),
        budget_remaining: parseFloat(budget),
        created_by: req.user.id
      }
    });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register donor' });
  }
});

// Update a donor
router.put('/:id', async (req, res) => {
  try {
    const { name, pan, contact, email, budget } = req.body;
    
    const oldDonor = await prisma.individualDonor.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!oldDonor) return res.status(404).json({ error: 'Donor not found' });
    
    const budgetDiff = parseFloat(budget) - oldDonor.budget;

    const donor = await prisma.individualDonor.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name, pan, contact, email, 
        budget: parseFloat(budget),
        budget_remaining: oldDonor.budget_remaining + budgetDiff
      }
    });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update donor' });
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
