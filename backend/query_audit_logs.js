const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDIT LOGS ===');
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'asc' }
  });

  for (const l of logs) {
    console.log(`[${l.timestamp.toISOString()}] Action: ${l.action} | Module: ${l.module} | Record ID: ${l.record_id}`);
    console.log(`  Old Value: ${l.old_value}`);
    console.log(`  New Value: ${l.new_value}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
