const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@naam.org' },
    update: {},
    create: { name: 'NAAM Admin', email: 'admin@naam.org', password_hash: hash, role: 'Admin' }
  });
  console.log('Admin user seeded!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
