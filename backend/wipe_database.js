const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting full database wipe with Wcc deletions...');

  // Delete all transactional records in safe foreign-key order
  await prisma.auditLog.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.wcc.deleteMany({});
  await prisma.workingSheet.deleteMany({});
  await prisma.bankStatement.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.vendorProject.deleteMany({});
  await prisma.contractorAssignment.deleteMany({});
  await prisma.contractor.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.uploadedFile.deleteMany({});
  await prisma.individualDonor.deleteMany({});
  await prisma.govtWorkOrder.deleteMany({});
  await prisma.govtEntry.deleteMany({});
  await prisma.csrCompany.deleteMany({});

  // Wipe locations as requested (no reseeding of locations)
  await prisma.locationVillage.deleteMany({});
  await prisma.locationTaluka.deleteMany({});
  await prisma.locationDistrict.deleteMany({});

  // Wipe configuration tables as well to make it completely fresh
  await prisma.configGst.deleteMany({});
  await prisma.configTds.deleteMany({});
  await prisma.financialYear.deleteMany({});

  // Wipe all users
  await prisma.user.deleteMany({});

  console.log('Database successfully cleared!');

  // Seed ONLY the default Admin account
  console.log('Seeding default Admin user...');
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'NAAM Admin',
      email: 'admin@naammh.org',
      password_hash: hash,
      role: 'Admin'
    }
  });

  console.log('Admin user seeded successfully! Login email: admin@naammh.org | Password: admin123');
}

main()
  .catch(e => {
    console.error('Error during database wipe:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
