const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
      address_line1, address_line2, address_line3, pincode,
      machine_details, operator_details,
      bank_name, account_no, ifsc, branch, project_ids,
      email
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required to register a vendor and create their portal login.' });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Pincode must be a 6-digit number.' });
    }

    // Verify email uniqueness in User database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists. Please choose a unique email.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.vendor.count() + 1;
      const vendor_id = `VEN-${String(count).padStart(3, '0')}`;

      const vendor = await tx.vendor.create({
        data: {
          vendor_id,
          company_name,
          pan, aadhaar, gst,
          owner_name, owner_contact,
          owner_address: owner_address || [address_line1, address_line2, address_line3, pincode].filter(Boolean).join(', '),
          address_line1, address_line2, address_line3, pincode,
          machine_details, operator_details,
          bank_name, account_no, ifsc, branch,
          email,
          created_by: req.user.id
        }
      });

      const defaultPassword = (pan || 'vendor123').toUpperCase();
      const password_hash = await bcrypt.hash(defaultPassword, 10);

      await tx.user.create({
        data: {
          name: owner_name || company_name,
          email,
          password_hash,
          role: 'Vendor',
          vendor_id: vendor.id,
          is_active: true
        }
      });

      if (project_ids && project_ids.length > 0) {
        const vendorProjects = project_ids.map(pid => ({
          vendor_id: vendor.id,
          project_id: parseInt(pid)
        }));
        await tx.vendorProject.createMany({ data: vendorProjects });
      }

      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Register Vendor & Create User',
          module: 'Vendors',
          record_id: String(vendor.id),
          new_value: `Registered vendor ${company_name} (ID: ${vendor_id}) and created user login ${email}`
        }
      });

      return { vendor, defaultPassword };
    });

    res.json({
      vendor: result.vendor,
      login_credentials: {
        email,
        password: result.defaultPassword
      }
    });
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
      address_line1, address_line2, address_line3, pincode,
      bank_name, account_no, ifsc, branch,
      vendor_id, project_id
    } = req.body;

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Pincode must be a 6-digit number.' });
    }

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
        pan, aadhaar, contact,
        address: address || [address_line1, address_line2, address_line3, pincode].filter(Boolean).join(', '),
        address_line1, address_line2, address_line3, pincode,
        bank_name, account_no, ifsc, branch,
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

// Get a single vendor with full details
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid vendor ID' });

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        projects: {
          include: { project: true }
        },
        work_orders: {
          include: { project: true }
        },
        purchase_orders: {
          include: { project: true }
        },
        invoices: {
          include: { project: true }
        },
        contractor_assignments: {
          include: { contractor: true, project: true }
        }
      }
    });

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor details', details: error.message });
  }
});

// Update a vendor
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      company_name, pan, aadhaar, gst, 
      owner_name, owner_contact, owner_address, 
      address_line1, address_line2, address_line3, pincode,
      machine_details, operator_details,
      bank_name, account_no, ifsc, branch
    } = req.body;

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Pincode must be a 6-digit number.' });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        company_name,
        pan, aadhaar, gst,
        owner_name, owner_contact,
        owner_address: owner_address || [address_line1, address_line2, address_line3, pincode].filter(Boolean).join(', '),
        address_line1, address_line2, address_line3, pincode,
        machine_details, operator_details,
        bank_name, account_no, ifsc, branch
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update vendor', details: error.message });
  }
});

// Get a single contractor with full details
router.get('/contractors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid contractor ID' });

    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { vendor: true, project: true }
        },
        invoices: {
          include: { project: true }
        },
        work_orders: {
          include: { project: true }
        },
        purchase_orders: {
          include: { project: true }
        }
      }
    });

    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractor details', details: error.message });
  }
});

// Update a contractor
router.put('/contractors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      full_name, pan, aadhaar, contact, address,
      address_line1, address_line2, address_line3, pincode,
      bank_name, account_no, ifsc, branch,
      vendor_id, project_id
    } = req.body;

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Pincode must be a 6-digit number.' });
    }

    const updated = await prisma.contractor.update({
      where: { id },
      data: {
        full_name,
        pan, aadhaar, contact,
        address: address || [address_line1, address_line2, address_line3, pincode].filter(Boolean).join(', '),
        address_line1, address_line2, address_line3, pincode,
        bank_name, account_no, ifsc, branch
      }
    });

    // If vendor_id or project_id are provided, update the assignment
    if (vendor_id && project_id) {
      // Find active assignment
      const activeAssignment = await prisma.contractorAssignment.findFirst({
        where: { contractor_id: id, status: 'Active' }
      });

      if (activeAssignment) {
        await prisma.contractorAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            vendor_id: parseInt(vendor_id),
            project_id: parseInt(project_id)
          }
        });
      } else {
        await prisma.contractorAssignment.create({
          data: {
            contractor_id: id,
            vendor_id: parseInt(vendor_id),
            project_id: parseInt(project_id)
          }
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update contractor', details: error.message });
  }
});

module.exports = router;
