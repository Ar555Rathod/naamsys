const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const csrs = await prisma.csrCompany.findMany();
  for (const csr of csrs) {
    if (csr.budget_remaining === 0) {
      await prisma.csrCompany.update({
        where: { id: csr.id },
        data: { budget_remaining: csr.budget }
      });
    }
  }

  const workOrders = await prisma.govtWorkOrder.findMany();
  for (const wo of workOrders) {
    if (wo.budget_remaining === 0) {
      await prisma.govtWorkOrder.update({
        where: { id: wo.id },
        data: { budget_remaining: wo.budget }
      });
    }
  }
  console.log("Budget remaining initialized.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
