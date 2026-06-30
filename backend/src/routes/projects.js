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
      funding_sources, // Array of { source_type, id, amount }
      proposal_id, financial_year_id, start_date, end_date, proposal_pdf,
      // New Unified Registration fields
      funding_type, funding_name, funding_pan, funding_govt_dept,
      funding_contact_person, funding_email, funding_phone, funding_mou_pdf,
      admin_cost_percent = 0
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

    // Budget Validation
    const reqBudget = parseFloat(budget);
    if (isNaN(reqBudget) || reqBudget <= 0) {
      return res.status(400).json({ error: 'Project budget must be greater than zero.' });
    }

    // Unified Path
    if (funding_type) {
      const pPercent = parseFloat(admin_cost_percent) || 0;
      const admin_cost_amount = reqBudget * (pPercent / 100);
      const total_cost = reqBudget + admin_cost_amount;

      const project = await prisma.$transaction(async (tx) => {
        const p = await tx.project.create({
          data: {
            project_id,
            name,
            budget: reqBudget,
            budget_remaining: reqBudget,
            type_of_work,
            sub_type,
            source_type: funding_type,
            proposal_id,
            proposal_pdf: proposal_pdf || null,
            financial_year_id: financial_year_id ? parseInt(financial_year_id) : null,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            district_id: final_district_id,
            taluka_id: final_taluka_id,
            village_id: final_village_id,
            created_by: req.user.id,
            // Unified Fields
            funding_type,
            funding_name,
            funding_pan: funding_pan || null,
            funding_govt_dept: funding_govt_dept || null,
            funding_contact_person: funding_contact_person || null,
            funding_email: funding_email || null,
            funding_phone: funding_phone || null,
            funding_mou_pdf: funding_mou_pdf || null,
            admin_cost_percent: pPercent,
            admin_cost_amount,
            total_cost
          }
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            user_id: req.user.id,
            action: 'Create Project',
            module: 'Projects',
            record_id: String(p.id),
            new_value: `Created project '${name}' (${project_id}) with budget ₹${reqBudget.toLocaleString('en-IN')}, Admin Cost: ${pPercent}% (₹${admin_cost_amount.toLocaleString('en-IN')}), Total Cost: ₹${total_cost.toLocaleString('en-IN')}`
          }
        });

        return p;
      });

      return res.status(201).json(project);
    }

    // Legacy Path
    let final_funding_sources = funding_sources;
    if (!final_funding_sources && source_type) {
      final_funding_sources = [{
        source_type,
        id: source_type === 'CSR' ? csr_id : source_type === 'GOVT' ? govt_work_order_id : individual_donor_id,
        amount: parseFloat(budget)
      }];
    }

    if (!final_funding_sources || final_funding_sources.length === 0) {
      return res.status(400).json({ error: 'At least one Funding Source is required.' });
    }

    const sumContributions = final_funding_sources.reduce((sum, src) => sum + parseFloat(src.amount || 0), 0);
    if (Math.abs(sumContributions - reqBudget) > 0.01) {
      return res.status(400).json({ error: `Sum of contributions (₹${sumContributions.toLocaleString()}) must match the total project budget (₹${reqBudget.toLocaleString()}).` });
    }

    // Perform check beforehand to ensure all contributors have enough budget remaining
    for (const src of final_funding_sources) {
      const srcAmount = parseFloat(src.amount);
      if (isNaN(srcAmount) || srcAmount <= 0) {
        return res.status(400).json({ error: 'Contribution amount must be greater than zero.' });
      }
      if (src.source_type === 'CSR' && src.id) {
        const csr = await prisma.csrCompany.findUnique({ where: { id: parseInt(src.id) } });
        if (!csr || csr.budget_remaining < srcAmount) {
          return res.status(400).json({ error: `Insufficient budget remaining in CSR Partner: ${csr?.name || 'Unknown'}` });
        }
      } else if (src.source_type === 'GOVT' && src.id) {
        const wo = await prisma.govtWorkOrder.findUnique({ where: { id: parseInt(src.id) } });
        if (!wo || wo.budget_remaining < srcAmount) {
          return res.status(400).json({ error: `Insufficient budget remaining in Govt Work Order: ${wo?.work_order_number || 'Unknown'}` });
        }
      } else if (src.source_type === 'INDIVIDUAL' && src.id) {
        const donor = await prisma.individualDonor.findUnique({ where: { id: parseInt(src.id) } });
        if (!donor || donor.budget_remaining < srcAmount) {
          return res.status(400).json({ error: `Insufficient budget remaining in Individual Donor: ${donor?.name || 'Unknown'}` });
        }
      } else {
        return res.status(400).json({ error: 'Valid Funding Source details are required.' });
      }
    }

    const createdProject = await prisma.$transaction(async (tx) => {
      // 1. Deduct from all funding sources
      for (const src of final_funding_sources) {
        const srcAmount = parseFloat(src.amount);
        if (src.source_type === 'CSR' && src.id) {
          await tx.csrCompany.update({
            where: { id: parseInt(src.id) },
            data: { budget_remaining: { decrement: srcAmount } }
          });
        } else if (src.source_type === 'GOVT' && src.id) {
          await tx.govtWorkOrder.update({
            where: { id: parseInt(src.id) },
            data: { budget_remaining: { decrement: srcAmount } }
          });
        } else if (src.source_type === 'INDIVIDUAL' && src.id) {
          await tx.individualDonor.update({
            where: { id: parseInt(src.id) },
            data: { budget_remaining: { decrement: srcAmount } }
          });
        }
      }

      // Determine legacy fields from the first source for backward compatibility
      const primarySource = final_funding_sources[0];
      const primaryType = primarySource.source_type;
      const primaryCsrId = primaryType === 'CSR' ? parseInt(primarySource.id) : null;
      const primaryGovtId = primaryType === 'GOVT' ? parseInt(primarySource.id) : null;
      const primaryDonorId = primaryType === 'INDIVIDUAL' ? parseInt(primarySource.id) : null;

      // 2. Create Project
      const project = await tx.project.create({
        data: {
          project_id,
          name,
          budget: reqBudget,
          budget_remaining: reqBudget,
          type_of_work,
          sub_type,
          source_type: primaryType,
          csr_id: primaryCsrId,
          govt_work_order_id: primaryGovtId,
          individual_donor_id: primaryDonorId,
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

      // 3. Create ProjectFunding mapping records
      for (const src of final_funding_sources) {
        const srcAmount = parseFloat(src.amount);
        await tx.projectFunding.create({
          data: {
            project_id: project.id,
            source_type: src.source_type,
            csr_id: src.source_type === 'CSR' ? parseInt(src.id) : null,
            govt_work_order_id: src.source_type === 'GOVT' ? parseInt(src.id) : null,
            individual_donor_id: src.source_type === 'INDIVIDUAL' ? parseInt(src.id) : null,
            amount: srcAmount
          }
        });
      }

      // 4. Log Audit Activity
      await tx.auditLog.create({
        data: {
          user_id: req.user.id,
          action: 'Create Project',
          module: 'Projects',
          record_id: String(project.id),
          new_value: `Created project '${name}' (${project_id}) with budget ₹${reqBudget.toLocaleString('en-IN')} and ${final_funding_sources.length} funding sources`
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
        funding_sources: {
          include: {
            csr: true,
            govt_work_order: {
              include: {
                govt: true
              }
            },
            individual_donor: true
          }
        },
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

    // Resolve location IDs to names
    if (project.district_id) {
      const district = await prisma.locationDistrict.findUnique({ where: { id: project.district_id } });
      project.district_name = district ? district.name : null;
    }
    if (project.taluka_id) {
      const taluka = await prisma.locationTaluka.findUnique({ where: { id: project.taluka_id } });
      project.taluka_name = taluka ? taluka.name : null;
    }
    if (project.village_id) {
      const village = await prisma.locationVillage.findUnique({ where: { id: project.village_id } });
      project.village_name = village ? village.name : null;
    }

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

      let newBudget = current.budget;
      let newBudgetRemaining = current.budget_remaining;

      if (budget !== undefined) {
        newBudget = parseFloat(budget);
        if (isNaN(newBudget) || newBudget <= 0) {
          throw new Error('Project budget must be greater than zero.');
        }
        
        // Ensure budget is not updated below spent amount
        const spent = current.budget - current.budget_remaining;
        if (newBudget < spent) {
          throw new Error(`Project budget cannot be reduced below the spent amount of ₹${spent.toLocaleString('en-IN')}`);
        }
        
        // Calculate new remaining budget
        newBudgetRemaining = newBudget - spent;
      }

      const project = await tx.project.update({
        where: { id: parseInt(id) },
        data: {
          name: name !== undefined ? name : current.name,
          budget: newBudget,
          budget_remaining: newBudgetRemaining,
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
