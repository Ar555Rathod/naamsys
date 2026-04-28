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

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { csr: true, govt_work_order: true }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a project
router.post('/', async (req, res) => {
  try {
    const { 
      name, type_of_work, sub_type, budget,
      district_id, taluka_id, village_id, 
      source_type, csr_id, govt_work_order_id, individual_donor_id,
      proposal_id, financial_year_id, start_date, end_date
    } = req.body;

    // Fetch locations to construct the ID
    let di_code = 'XX', ta_code = 'XX', vi_code = 'XXX';
    if (district_id) {
      const d = await prisma.locationDistrict.findUnique({ where: { id: parseInt(district_id) } });
      if (d) di_code = d.name.substring(0, 2).toUpperCase();
    }
    if (taluka_id) {
      const t = await prisma.locationTaluka.findUnique({ where: { id: parseInt(taluka_id) } });
      if (t) ta_code = t.name.substring(0, 2).toUpperCase();
    }
    if (village_id) {
      const v = await prisma.locationVillage.findUnique({ where: { id: parseInt(village_id) } });
      if (v) vi_code = v.name.substring(0, 3).toUpperCase();
    }

    // Generate Project ID logic
    const count = await prisma.project.count() + 1;
    const project_id = `NAAM-${di_code}-${ta_code}-${vi_code}-${String(count).padStart(3, '0')}`;

    // Budget Validation & Deduction
    const reqBudget = parseFloat(budget);
    let updateSourceQuery = null;

    if (source_type === 'CSR' && csr_id) {
      const csr = await prisma.csrCompany.findUnique({ where: { id: parseInt(csr_id) } });
      if (!csr || csr.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected CSR Partner.' });
      }
      updateSourceQuery = prisma.csrCompany.update({
        where: { id: parseInt(csr_id) },
        data: { budget_remaining: csr.budget_remaining - reqBudget }
      });
    } else if (source_type === 'GOVT' && govt_work_order_id) {
      const wo = await prisma.govtWorkOrder.findUnique({ where: { id: parseInt(govt_work_order_id) } });
      if (!wo || wo.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected Govt Work Order.' });
      }
      updateSourceQuery = prisma.govtWorkOrder.update({
        where: { id: parseInt(govt_work_order_id) },
        data: { budget_remaining: wo.budget_remaining - reqBudget }
      });
    } else if (source_type === 'INDIVIDUAL' && individual_donor_id) {
      const donor = await prisma.individualDonor.findUnique({ where: { id: parseInt(individual_donor_id) } });
      if (!donor || donor.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected Individual Donor.' });
      }
      updateSourceQuery = prisma.individualDonor.update({
        where: { id: parseInt(individual_donor_id) },
        data: { budget_remaining: donor.budget_remaining - reqBudget }
      });
    } else {
      return res.status(400).json({ error: 'Valid Funding Source is required.' });
    }

    const createProjectQuery = prisma.project.create({
      data: {
        project_id,
        name,
        budget: reqBudget,
        budget_remaining: reqBudget,
        type_of_work,
        sub_type,
        source_type,
        csr_id: csr_id ? parseInt(csr_id) : null,
        govt_work_order_id: govt_work_order_id ? parseInt(govt_work_order_id) : null,
        individual_donor_id: individual_donor_id ? parseInt(individual_donor_id) : null,
        proposal_id,
        financial_year_id: financial_year_id ? parseInt(financial_year_id) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        district_id: district_id ? parseInt(district_id) : null,
        taluka_id: taluka_id ? parseInt(taluka_id) : null,
        village_id: village_id ? parseInt(village_id) : null,
        created_by: req.user.id
      }
    });

    const transaction = await prisma.$transaction([updateSourceQuery, createProjectQuery]);
    res.json(transaction[1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

module.exports = router;
