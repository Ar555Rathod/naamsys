const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const ws = await prisma.workingSheet.findFirst({
      where: { sheet_number: 'WS-1779895842782' },
      include: {
        invoices: {
          include: {
            project: true
          }
        }
      }
    });

    if (!ws) {
      console.log('Working Sheet WS-1779895842782 not found!');
      // Let's print all working sheets just in case
      const allWs = await prisma.workingSheet.findMany({
        include: { invoices: { include: { project: true } } }
      });
      console.log('All Working Sheets in DB:');
      for (const s of allWs) {
        console.log(`Sheet: ${s.sheet_number}, Status: ${s.status}, Total: ${s.total_payment}, Invoices: ${s.invoices.length}`);
        for (const inv of s.invoices) {
          console.log(`  - Inv: ${inv.invoice_id}, Amount: ${inv.total_amount}, Project: ${inv.project?.project_id}, Budget Remaining: ${inv.project?.budget_remaining}`);
        }
      }
      return;
    }

    console.log(`=== Working Sheet ${ws.sheet_number} (Status: ${ws.status}) ===`);
    for (const inv of ws.invoices) {
      console.log(`Invoice: ${inv.invoice_id}`);
      console.log(`  Type: ${inv.invoice_type}`);
      console.log(`  Amount: ₹${inv.total_amount.toLocaleString()}`);
      if (inv.project) {
        console.log(`  Project ID: ${inv.project.project_id}`);
        console.log(`  Project Name: ${inv.project.name}`);
        console.log(`  Budget Remaining: ₹${inv.project.budget_remaining.toLocaleString()}`);
        console.log(`  Budget Deficit: ${inv.project.budget_remaining < inv.total_amount ? 'YES' : 'NO'}`);
      } else {
        console.log('  Project: NULL');
      }
    }

  } catch (e) {
    console.error('Error running script:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
