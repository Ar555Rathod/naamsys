const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('       RECONCILING AND FIXING PROJECT BUDGETS       ');
  console.log('====================================================\n');

  const adminUser = await prisma.user.findFirst({ where: { role: 'Admin' } });
  const adminId = adminUser ? adminUser.id : 1;

  const projects = await prisma.project.findMany({
    include: {
      invoices: true
    }
  });

  for (const p of projects) {
    // Calculate exact sum of paid TypeA & TypeC invoices
    const paidInvoices = p.invoices.filter(
      inv => inv.payment_status === 'Paid' && (inv.invoice_type === 'TypeA' || inv.invoice_type === 'TypeC')
    );
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    const correctRemaining = p.budget - totalPaidAmount;
    const oldRemaining = p.budget_remaining;

    if (oldRemaining !== correctRemaining) {
      console.log(`Fixing Project: "${p.name}" (${p.project_id})`);
      console.log(`  Initial Budget:          ₹${p.budget.toLocaleString('en-IN')}`);
      console.log(`  Total Paid Invoices:     ₹${totalPaidAmount.toLocaleString('en-IN')}`);
      console.log(`  Old DB Remaining:        ₹${oldRemaining.toLocaleString('en-IN')}`);
      console.log(`  Correct New Remaining:   ₹${correctRemaining.toLocaleString('en-IN')}`);

      await prisma.project.update({
        where: { id: p.id },
        data: { budget_remaining: correctRemaining }
      });

      if (adminUser) {
        await prisma.auditLog.create({
          data: {
            user_id: adminId,
            action: 'Reconcile Project Budget',
            module: 'Projects',
            record_id: String(p.id),
            old_value: `budget_remaining: ₹${oldRemaining.toLocaleString('en-IN')}`,
            new_value: `Reconciled budget_remaining to ₹${correctRemaining.toLocaleString('en-IN')} based on ₹${totalPaidAmount.toLocaleString('en-IN')} paid invoices`
          }
        });
      }

      console.log(`  ✅ Successfully updated database record!\n`);
    } else {
      console.log(`Project "${p.name}" (${p.project_id}) is already correct. (Remaining: ₹${correctRemaining.toLocaleString('en-IN')})\n`);
    }
  }

  console.log('Reconciliation complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
