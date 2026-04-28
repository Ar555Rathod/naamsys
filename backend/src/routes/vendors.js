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

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { projects: { include: { project: true } } }
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Register a vendor
router.post('/', async (req, res) => {
  try {
    const { 
      company_name, pan, aadhaar, gst, 
      owner_name, owner_contact, owner_address, 
      machine_details, operator_details,
      bank_name, account_no, ifsc, project_ids
    } = req.body;

    const count = await prisma.vendor.count() + 1;
    const vendor_id = `VEN-${String(count).padStart(3, '0')}`;

    const vendor = await prisma.vendor.create({
      data: {
        vendor_id,
        company_name,
        pan, aadhaar, gst,
        owner_name, owner_contact, owner_address,
        machine_details, operator_details,
        bank_name, account_no, ifsc,
        created_by: req.user.id
      }
    });

    if (project_ids && project_ids.length > 0) {
      const vendorProjects = project_ids.map(pid => ({
        vendor_id: vendor.id,
        project_id: parseInt(pid)
      }));
      await prisma.vendorProject.createMany({ data: vendorProjects });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register vendor', details: error.message });
  }
});

// Get all contractors
router.get('/contractors', async (req, res) => {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        assignments: {
          include: { vendor: true, project: true }
        }
      }
    });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// Register a contractor
router.post('/contractors', async (req, res) => {
  try {
    const { 
      full_name, pan, aadhaar, contact, address,
      bank_name, account_no, ifsc,
      vendor_id, project_id
    } = req.body;

    const count = await prisma.contractor.count() + 1;
    const contractor_id = `CON-${String(count).padStart(3, '0')}`;

    // Check project budget
    const project = await prisma.project.findUnique({ where: { id: parseInt(project_id) } });
    if (!project || project.budget_remaining <= 0) {
      return res.status(400).json({ error: 'Cannot hire contractor: Project budget is exhausted or project not found.' });
    }

    const contractor = await prisma.contractor.create({
      data: {
        contractor_id,
        full_name,
        pan, aadhaar, contact, address,
        bank_name, account_no, ifsc,
        created_by: req.user.id
      }
    });

    await prisma.contractorAssignment.create({
      data: {
        contractor_id: contractor.id,
        vendor_id: parseInt(vendor_id),
        project_id: parseInt(project_id)
      }
    });

    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register contractor', details: error.message });
  }
});

module.exports = router;
