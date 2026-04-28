const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@naammh.org' },
    update: { email: 'admin@naammh.org' },
    create: { name: 'NAAM Admin', email: 'admin@naammh.org', password_hash: hash, role: 'Admin' }
  });
  console.log('Admin user seeded!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
