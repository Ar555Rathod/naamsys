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

router.post('/', async (req, res) => {
  try {
    const { 
      scheme_dept, type_of_work, sub_type, district_id, taluka_id, village_id,
      budget, admin_cost_type = 'PERCENT', admin_cost_value = 0,
      contact_person, email, phone 
    } = req.body;
    
    // Auto-generate Govt ID
    const count = await prisma.govtEntry.count();
    const govt_id = `GOV-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    
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

    // Resolve Location IDs from Name strings or existing numeric IDs
    let final_district_id = null;
    let final_taluka_id = null;
    let final_village_id = null;

    // 1. Resolve District
    if (district_id) {
      if (typeof district_id === 'string' && isNaN(Number(district_id))) {
        const name = district_id.trim();
        let d = await prisma.locationDistrict.findFirst({ where: { name } });
        if (!d) {
          let code = 'D-' + name.substring(0, 3).toUpperCase();
          const codeExists = await prisma.locationDistrict.findUnique({ where: { code } });
          if (codeExists) {
            code = code + '-' + Math.floor(Math.random() * 1000);
          }
          d = await prisma.locationDistrict.create({ data: { name, code } });
        }
        final_district_id = d.id;
      } else {
        const d = await prisma.locationDistrict.findUnique({ where: { id: parseInt(district_id) } });
        if (d) {
          final_district_id = d.id;
        }
      }
    }

    // 2. Resolve Taluka
    if (taluka_id) {
      if (typeof taluka_id === 'string' && isNaN(Number(taluka_id)) && final_district_id) {
        const name = taluka_id.trim();
        let t = await prisma.locationTaluka.findFirst({ where: { name, district_id: final_district_id } });
        if (!t) {
          const code = 'T-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
          t = await prisma.locationTaluka.create({ data: { name, code, district_id: final_district_id } });
        }
        final_taluka_id = t.id;
      } else {
        const t = await prisma.locationTaluka.findUnique({ where: { id: parseInt(taluka_id) } });
        if (t) {
          final_taluka_id = t.id;
        }
      }
    }

    // 3. Resolve Village
    if (village_id) {
      if (typeof village_id === 'string' && isNaN(Number(village_id)) && final_taluka_id) {
        const name = village_id.trim();
        let v = await prisma.locationVillage.findFirst({ where: { name, taluka_id: final_taluka_id } });
        if (!v) {
          const code = 'V-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
          v = await prisma.locationVillage.create({ data: { name, code, taluka_id: final_taluka_id } });
        }
        final_village_id = v.id;
      } else {
        const v = await prisma.locationVillage.findUnique({ where: { id: parseInt(village_id) } });
        if (v) {
          final_village_id = v.id;
        }
      }
    }

    const newScheme = await prisma.govtEntry.create({
      data: {
        govt_id,
        scheme_dept,
        type_of_work,
        sub_type,
        budget: originalBudget,
        budget_remaining: availableBudget,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount,
        available_budget: availableBudget,
        contact_person,
        email,
        phone,
        district_id: final_district_id,
        taluka_id: final_taluka_id,
        village_id: final_village_id,
        created_by: 1
      }
    });
    res.status(201).json(newScheme);
  } catch (error) {
    res.status(400).json({ error: 'Failed to register Govt scheme', details: error.message });
  }
});

router.post('/:id/work-orders', async (req, res) => {
  try {
    const { work_order_number, budget, description } = req.body;
    const govt_id = parseInt(req.params.id);

    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({ error: 'Work Order budget must be greater than zero.' });
    }

    const scheme = await prisma.govtEntry.findUnique({
      where: { id: govt_id }
    });
    if (!scheme) return res.status(404).json({ error: 'Government Scheme not found' });
    if (scheme.budget_remaining < parsedBudget) {
      return res.status(400).json({ error: `Insufficient budget remaining in Government Scheme. Available: ₹${scheme.budget_remaining.toLocaleString()}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement scheme's remaining budget
      await tx.govtEntry.update({
        where: { id: govt_id },
        data: { budget_remaining: { decrement: parsedBudget } }
      });

      // 2. Create Work Order
      const workOrder = await tx.govtWorkOrder.create({
        data: {
          work_order_number,
          budget: parsedBudget,
          budget_remaining: parsedBudget,
          description,
          govt_id
        }
      });
      return workOrder;
    });

    res.status(201).json(result);
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

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      scheme_dept, type_of_work, sub_type, district_id, taluka_id, village_id,
      budget, admin_cost_type = 'PERCENT', admin_cost_value = 0,
      contact_person, email, phone 
    } = req.body;

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

    // Fetch existing work orders to calculate spent/allocated budget
    const workOrders = await prisma.govtWorkOrder.findMany({
      where: { govt_id: id }
    });
    const spentBudget = workOrders.reduce((sum, wo) => sum + wo.budget, 0);

    if (availableBudget < spentBudget) {
      return res.status(400).json({ error: `Cannot update: New available budget (₹${availableBudget.toLocaleString()}) is less than total budget already allocated to Work Orders (₹${spentBudget.toLocaleString()}).` });
    }

    const budgetRemaining = availableBudget - spentBudget;

    // Resolve Location IDs from Name strings or existing numeric IDs
    let final_district_id = null;
    let final_taluka_id = null;
    let final_village_id = null;

    // 1. Resolve District
    if (district_id) {
      if (typeof district_id === 'string' && isNaN(Number(district_id))) {
        const name = district_id.trim();
        let d = await prisma.locationDistrict.findFirst({ where: { name } });
        if (!d) {
          let code = 'D-' + name.substring(0, 3).toUpperCase();
          const codeExists = await prisma.locationDistrict.findUnique({ where: { code } });
          if (codeExists) {
            code = code + '-' + Math.floor(Math.random() * 1000);
          }
          d = await prisma.locationDistrict.create({ data: { name, code } });
        }
        final_district_id = d.id;
      } else {
        const d = await prisma.locationDistrict.findUnique({ where: { id: parseInt(district_id) } });
        if (d) {
          final_district_id = d.id;
        }
      }
    }

    // 2. Resolve Taluka
    if (taluka_id) {
      if (typeof taluka_id === 'string' && isNaN(Number(taluka_id)) && final_district_id) {
        const name = taluka_id.trim();
        let t = await prisma.locationTaluka.findFirst({ where: { name, district_id: final_district_id } });
        if (!t) {
          const code = 'T-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
          t = await prisma.locationTaluka.create({ data: { name, code, district_id: final_district_id } });
        }
        final_taluka_id = t.id;
      } else {
        const t = await prisma.locationTaluka.findUnique({ where: { id: parseInt(taluka_id) } });
        if (t) {
          final_taluka_id = t.id;
        }
      }
    }

    // 3. Resolve Village
    if (village_id) {
      if (typeof village_id === 'string' && isNaN(Number(village_id)) && final_taluka_id) {
        const name = village_id.trim();
        let v = await prisma.locationVillage.findFirst({ where: { name, taluka_id: final_taluka_id } });
        if (!v) {
          const code = 'V-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
          v = await prisma.locationVillage.create({ data: { name, code, taluka_id: final_taluka_id } });
        }
        final_village_id = v.id;
      } else {
        const v = await prisma.locationVillage.findUnique({ where: { id: parseInt(village_id) } });
        if (v) {
          final_village_id = v.id;
        }
      }
    }

    const updated = await prisma.govtEntry.update({
      where: { id },
      data: {
        scheme_dept,
        type_of_work,
        sub_type,
        budget: originalBudget,
        available_budget: availableBudget,
        budget_remaining: budgetRemaining,
        admin_cost_type: adminCostType,
        admin_cost_value: adminCostValue,
        admin_cost_amount: adminCostAmount,
        contact_person,
        email,
        phone,
        district_id: final_district_id,
        taluka_id: final_taluka_id,
        village_id: final_village_id
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update Government scheme', details: error.message });
  }
});

module.exports = router;
