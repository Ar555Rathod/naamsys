const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all Govt Schemes
router.get('/', async (req, res) => {
  try {
    const schemes = await prisma.govtEntry.findMany({
      include: {
        work_orders: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Government schemes' });
  }
});

// Register a new Govt Scheme
router.post('/', async (req, res) => {
  try {
    const { scheme_dept, type_of_work, sub_type, district_id, taluka_id, village_id } = req.body;
    
    // Auto-generate Govt ID
    const count = await prisma.govtEntry.count();
    const govt_id = `GOV-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    
    const newScheme = await prisma.govtEntry.create({
      data: {
        govt_id,
        scheme_dept,
        type_of_work,
        sub_type,
        district_id,
        taluka_id,
        village_id,
        created_by: 1
      }
    });
    res.status(201).json(newScheme);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register Govt scheme', details: error.message });
  }
});

// Register a Govt Work Order under a scheme
router.post('/:id/work-orders', async (req, res) => {
  try {
    const { work_order_number, budget, description } = req.body;
    const govt_id = parseInt(req.params.id);

    const workOrder = await prisma.govtWorkOrder.create({
      data: {
        work_order_number,
        budget: parseFloat(budget),
        description,
        govt_id
      }
    });
    res.status(201).json(workOrder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add work order', details: error.message });
  }
});

module.exports = router;
