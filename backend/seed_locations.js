const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding locations...');
  
  const d1 = await prisma.locationDistrict.upsert({
    where: { code: 'D-PUN' },
    update: {},
    create: { name: 'Pune', code: 'D-PUN' }
  });

  const t1 = await prisma.locationTaluka.create({
    data: { name: 'Haveli', code: 'T-HAV', district_id: d1.id }
  });

  await prisma.locationVillage.create({
    data: { name: 'Hinjewadi', code: 'V-HIN', taluka_id: t1.id }
  });

  const d2 = await prisma.locationDistrict.upsert({
    where: { code: 'D-MUM' },
    update: {},
    create: { name: 'Mumbai', code: 'D-MUM' }
  });

  console.log('Locations seeded!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
