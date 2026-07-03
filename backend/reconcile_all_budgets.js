const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      invoices: true,
      purchase_orders: true,
      work_orders: true
    }
  });

  console.log('====================================================');
  console.log('       PROJECT BUDGET RECONCILIATION AUDIT          ');
  console.log('====================================================\n');

  for (const p of projects) {
    console.log(`Project ID: ${p.id} | Code: ${p.project_id} | Name: "${p.name}"`);
    console.log(`  Initial Budget:          ₹${p.budget.toLocaleString('en-IN')}`);
    console.log(`  Current DB Remaining:    ₹${p.budget_remaining.toLocaleString('en-IN')}`);

    // Calculate sum of paid TypeA and TypeC invoices
    const paidInvoices = p.invoices.filter(inv => inv.payment_status === 'Paid' && (inv.invoice_type === 'TypeA' || inv.invoice_type === 'TypeC'));
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    const calculatedRemaining = p.budget - totalPaidAmount;
    const difference = p.budget_remaining - calculatedRemaining;

    console.log(`  Paid Invoices Count:     ${paidInvoices.length}`);
    console.log(`  Total Paid Invoices Val: ₹${totalPaidAmount.toLocaleString('en-IN')}`);
    console.log(`  Calculated Remaining:    ₹${calculatedRemaining.toLocaleString('en-IN')}`);
    
    if (difference !== 0) {
      console.log(`  ⚠️ DISCREPANCY FOUND! DB is off by ₹${difference.toLocaleString('en-IN')}`);
    } else {
      console.log(`  ✅ Budget is aligned and accurate.`);
    }
    console.log('----------------------------------------------------');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
