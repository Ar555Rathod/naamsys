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
        budget_remaining: parseFloat(budget),
        description,
        govt_id
      }
    });
    res.status(201).json(workOrder);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add work order', details: error.message });
  }
});

// Get a single Govt Scheme with details
router.get('/:id', async (req, res) => {
  try {
    const scheme = await prisma.govtEntry.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        work_orders: {
          include: {
            projects: true
          }
        }
      }
    });

    if (!scheme) return res.status(404).json({ error: 'Government scheme not found' });

    // Resolve location names
    let districtName = '—';
    let talukaName = '—';
    let villageName = '—';

    if (scheme.district_id) {
      const dist = await prisma.locationDistrict.findUnique({
        where: { id: scheme.district_id },
        include: {
          talukas: {
            include: {
              villages: true
            }
          }
        }
      });
      if (dist) {
        districtName = dist.name;
        if (scheme.taluka_id) {
          const tal = dist.talukas.find(t => t.id === scheme.taluka_id);
          if (tal) {
            talukaName = tal.name;
            if (scheme.village_id) {
              const vil = tal.villages.find(v => v.id === scheme.village_id);
              if (vil) {
                villageName = vil.name;
              }
            }
          }
        }
      }
    }

    res.json({
      ...scheme,
      district_name: districtName,
      taluka_name: talukaName,
      village_name: villageName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Government scheme details', details: error.message });
  }
});

// Update a Govt Scheme
router.put('/:id', async (req, res) => {
  try {
    const { scheme_dept, type_of_work, sub_type, district_id, taluka_id, village_id } = req.body;
    const updated = await prisma.govtEntry.update({
      where: { id: parseInt(req.params.id) },
      data: {
        scheme_dept,
        type_of_work,
        sub_type,
        district_id: district_id ? parseInt(district_id) : null,
        taluka_id: taluka_id ? parseInt(taluka_id) : null,
        village_id: village_id ? parseInt(village_id) : null
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update Government scheme', details: error.message });
  }
});

module.exports = router;
