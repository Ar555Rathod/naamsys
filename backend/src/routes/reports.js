const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get summary data for reporting
router.get('/summary', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        csr: true,
        govt_work_order: true,
        invoices: true
      }
    });

    const reportData = projects.map(p => {
      const totalInvoiced = p.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const utilized_percentage = p.budget > 0 ? ((p.budget - p.budget_remaining) / p.budget * 100).toFixed(2) : 0;
      
      return {
        Project_ID: p.project_id,
        Name: p.name,
        Type: p.type_of_work,
        Source: p.source_type,
        Funding_Entity: p.source_type === 'CSR' ? p.csr?.name : p.govt_work_order?.work_order_number,
        Total_Budget: p.budget,
        Budget_Utilized: p.budget - p.budget_remaining,
        Remaining_Budget: p.budget_remaining,
        Utilized_Percentage: `${utilized_percentage}%`,
        Invoices_Count: p.invoices.length,
        Status: p.status
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
