const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== PROJECT FUNDING ===');
  const fundings = await prisma.projectFunding.findMany({
    include: {
      project: true,
      csr: true,
      govt_work_order: { include: { govt: true } },
      individual_donor: true
    }
  });

  for (const f of fundings) {
    console.log(`Funding ID: ${f.id}, Project: ${f.project.name} (${f.project.project_id}), Source: ${f.source_type}, Amount: ₹${f.amount.toLocaleString()}`);
    if (f.csr) {
      console.log(`  CSR: ${f.csr.name} (Budget: ₹${f.csr.budget.toLocaleString()}, Remaining: ₹${f.csr.budget_remaining.toLocaleString()}, Available: ₹${f.csr.available_budget.toLocaleString()})`);
    }
    if (f.govt_work_order) {
      console.log(`  Govt Work Order: ${f.govt_work_order.work_order_number} (Budget: ₹${f.govt_work_order.budget.toLocaleString()}, Remaining: ₹${f.govt_work_order.budget_remaining.toLocaleString()})`);
      console.log(`  Govt Scheme: ${f.govt_work_order.govt.scheme_dept} (Budget: ₹${f.govt_work_order.govt.budget.toLocaleString()}, Remaining: ₹${f.govt_work_order.govt.budget_remaining.toLocaleString()}, Available: ₹${f.govt_work_order.govt.available_budget.toLocaleString()})`);
    }
    if (f.individual_donor) {
      console.log(`  Donor: ${f.individual_donor.name} (Budget: ₹${f.individual_donor.budget.toLocaleString()}, Remaining: ₹${f.individual_donor.budget_remaining.toLocaleString()}, Available: ₹${f.individual_donor.available_budget.toLocaleString()})`);
    }
  }

  console.log('\n=== ALL USERS IN DB ===');
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`User: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  }

  console.log('\n=== CSR COMPANIES ===');
  const csrs = await prisma.csrCompany.findMany();
  for (const c of csrs) {
    console.log(`CSR Company: ${c.name} (${c.csr_id}), Budget: ₹${c.budget.toLocaleString()}, Remaining: ₹${c.budget_remaining.toLocaleString()}, Available: ₹${c.available_budget.toLocaleString()}`);
  }

  console.log('\n=== GOVT ENTRIES ===');
  const govts = await prisma.govtEntry.findMany();
  for (const g of govts) {
    console.log(`Govt: ${g.scheme_dept} (${g.govt_id}), Budget: ₹${g.budget.toLocaleString()}, Remaining: ₹${g.budget_remaining.toLocaleString()}, Available: ₹${g.available_budget.toLocaleString()}`);
  }

  console.log('\n=== INDIVIDUAL DONORS ===');
  const donors = await prisma.individualDonor.findMany();
  for (const d of donors) {
    console.log(`Donor: ${d.name} (${d.donor_id}), Budget: ₹${d.budget.toLocaleString()}, Remaining: ₹${d.budget_remaining.toLocaleString()}, Available: ₹${d.available_budget.toLocaleString()}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
