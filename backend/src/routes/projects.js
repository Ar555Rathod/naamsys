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
    
    // Enrich with creator details
    const userIds = [...new Set(projects.map(p => p.created_by))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    projects.forEach(p => {
      p.creator = userMap.get(p.created_by) || null;
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
      proposal_id, financial_year_id, start_date, end_date, proposal_pdf
    } = req.body;

    // Fetch or create locations to construct the ID and save correct associations
    let final_district_id = null;
    let final_taluka_id = null;
    let final_village_id = null;
    let di_code = 'XX', ta_code = 'XX', vi_code = 'XXX';

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
        di_code = d.name.substring(0, 2).toUpperCase();
      } else {
        const d = await prisma.locationDistrict.findUnique({ where: { id: parseInt(district_id) } });
        if (d) {
          final_district_id = d.id;
          di_code = d.name.substring(0, 2).toUpperCase();
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
        ta_code = t.name.substring(0, 2).toUpperCase();
      } else {
        const t = await prisma.locationTaluka.findUnique({ where: { id: parseInt(taluka_id) } });
        if (t) {
          final_taluka_id = t.id;
          ta_code = t.name.substring(0, 2).toUpperCase();
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
        vi_code = v.name.substring(0, 3).toUpperCase();
      } else {
        const v = await prisma.locationVillage.findUnique({ where: { id: parseInt(village_id) } });
        if (v) {
          final_village_id = v.id;
          vi_code = v.name.substring(0, 3).toUpperCase();
        }
      }
    }

    // Generate Project ID logic
    const count = await prisma.project.count() + 1;
    const project_id = `NAAM-${di_code}-${ta_code}-${vi_code}-${String(count).padStart(3, '0')}`;

    // Budget Validation & Deduction
    const reqBudget = parseFloat(budget);

    // Perform check beforehand
    if (source_type === 'CSR' && csr_id) {
      const csr = await prisma.csrCompany.findUnique({ where: { id: parseInt(csr_id) } });
      if (!csr || csr.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected CSR Partner.' });
      }
    } else if (source_type === 'GOVT' && govt_work_order_id) {
      const wo = await prisma.govtWorkOrder.findUnique({ where: { id: parseInt(govt_work_order_id) } });
      if (!wo || wo.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected Govt Work Order.' });
      }
    } else if (source_type === 'INDIVIDUAL' && individual_donor_id) {
      const donor = await prisma.individualDonor.findUnique({ where: { id: parseInt(individual_donor_id) } });
      if (!donor || donor.budget_remaining < reqBudget) {
        return res.status(400).json({ error: 'Insufficient budget remaining in the selected Individual Donor.' });
      }
    } else {
      return res.status(400).json({ error: 'Valid Funding Source is required.' });
    }

    const createdProject = await prisma.$transaction(async (tx) => {
      // 1. Deduct from funding source
      if (source_type === 'CSR' && csr_id) {
        await tx.csrCompany.update({
          where: { id: parseInt(csr_id) },
          data: { budget_remaining: { decrement: reqBudget } }
        });
      } else if (source_type === 'GOVT' && govt_work_order_id) {
        await tx.govtWorkOrder.update({
          where: { id: parseInt(govt_work_order_id) },
          data: { budget_remaining: { decrement: reqBudget } }
        });
      } else if (source_type === 'INDIVIDUAL' && individual_donor_id) {
        await tx.individualDonor.update({
          where: { id: parseInt(individual_donor_id) },
          data: { budget_remaining: { decrement: reqBudget } }
        });
      }

      // 2. Create Project
      const project = await tx.project.create({
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
          proposal_pdf: proposal_pdf || null,
          financial_year_id: financial_year_id ? parseInt(financial_year_id) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          district_id: final_district_id,
          taluka_id: final_taluka_id,
          village_id: final_village_id,
          created_by: req.user.id
        }
      });

      // 3. Log Audit Activity
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Project',
          module: 'Projects',
          record_id: String(project.id),
          new_value: `Created project '${name}' (${project_id}) with budget ₹${reqBudget.toLocaleString('en-IN')}`
        }
      });

      return project;
    });

    res.json(createdProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Get a single project with all linked details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        csr: true,
        govt_work_order: {
          include: {
            govt: true
          }
        },
        individual_donor: true,
        invoices: {
          include: {
            purchase_order: {
              include: {
                vendor: true,
                contractor: true
              }
            }
          },
          orderBy: { id: 'desc' }
        },
        work_orders: {
          include: {
            vendor: true,
            contractor: true
          },
          orderBy: { version: 'desc' }
        },
        purchase_orders: {
          include: {
            vendor: true,
            contractor: true
          },
          orderBy: { version: 'desc' }
        },
        vendor_projects: {
          include: {
            vendor: true
          }
        },
        contractor_assignments: {
          include: {
            contractor: true,
            vendor: true
          }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Enrich with creator details
    const creator = await prisma.user.findUnique({
      where: { id: project.created_by },
      select: { id: true, name: true, email: true, role: true }
    });
    project.creator = creator;

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project details', details: error.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, budget, type_of_work, sub_type, status, proposal_pdf } = req.body;
    
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.project.findUnique({ where: { id: parseInt(id) } });
      if (!current) throw new Error('Project not found');

      const project = await tx.project.update({
        where: { id: parseInt(id) },
        data: {
          name: name !== undefined ? name : current.name,
          budget: budget !== undefined ? parseFloat(budget) : current.budget,
          type_of_work: type_of_work !== undefined ? type_of_work : current.type_of_work,
          sub_type: sub_type !== undefined ? sub_type : current.sub_type,
          status: status !== undefined ? status : current.status,
          proposal_pdf: proposal_pdf !== undefined ? proposal_pdf : current.proposal_pdf
        }
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Update Project Details',
          module: 'Projects',
          record_id: String(project.id),
          new_value: `Updated details for project '${project.name}' (${project.project_id})`
        }
      });

      return project;
    });

    // Enrich with creator details
    const creator = await prisma.user.findUnique({
      where: { id: updated.created_by },
      select: { id: true, name: true, email: true, role: true }
    });
    updated.creator = creator;

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

module.exports = router;
