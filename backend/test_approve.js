const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApprove() {
  const id = 1; // Wait, let's find the ID of the working sheet with number WS-1779895842782!
  const sheetNum = 'WS-1779895842782';

  try {
    const sheet = await prisma.workingSheet.findUnique({
      where: { sheet_number: sheetNum },
      include: { invoices: { include: { project: true } } }
    });

    if (!sheet) {
      console.log(`Sheet ${sheetNum} not found in database!`);
      return;
    }

    console.log(`Found sheet ID: ${sheet.id}`);

    const approved_invoice_ids = sheet.invoices.map(i => i.id);
    const finalTotalPayment = sheet.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    const associatedInvoices = sheet.invoices;

    // Simulate the transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Disassociate unapproved invoices
      const unapprovedInvoiceIds = sheet.invoices
        .map(i => i.id)
        .filter(id => !approved_invoice_ids.includes(id));

      if (unapprovedInvoiceIds.length > 0) {
        await tx.invoice.updateMany({
          where: { id: { in: unapprovedInvoiceIds } },
          data: { working_sheet_id: null }
        });
      }

      // 2. Process budget deductions for Type A invoices being Paid
      for (const inv of associatedInvoices) {
        if (inv.invoice_type === 'TypeA') {
          const currentProject = await tx.project.findUnique({ where: { id: inv.project_id } });
          if (currentProject.budget_remaining < inv.total_amount) {
            throw new Error(`Invoice Blocked: Insufficient budget remaining for project '${currentProject.name}' to pay Invoice '${inv.invoice_id}'.`);
          }
          await tx.project.update({
            where: { id: inv.project_id },
            data: { budget_remaining: currentProject.budget_remaining - inv.total_amount }
          });
        }
      }

      // 3. Update all approved invoices to PAID
      await tx.invoice.updateMany({
        where: { id: { in: approved_invoice_ids } },
        data: {
          payment_status: 'Paid',
          payment_date: new Date()
        }
      });
      
      for (const inv of associatedInvoices) {
        await tx.invoice.update({
          where: { id: inv.id },
          data: { amount_paid: inv.total_amount }
        });
      }

      // 4. Mark Working Sheet as Approved
      const updatedSheet = await tx.workingSheet.update({
        where: { id: sheet.id },
        data: {
          status: 'Approved',
          total_payment: finalTotalPayment,
          approved_by: 1, // Simulate User ID 1
          approved_at: new Date()
        }
      });

      // 5. Generate Bank Statement
      const statementNumber = `BS-${Date.now()}`;
      await tx.bankStatement.create({
        data: {
          statement_number: statementNumber,
          working_sheet_id: updatedSheet.id,
          created_by: 1
        }
      });

      console.log('Transaction would complete successfully!');
      return updatedSheet;
    });

    console.log('Transaction Result:', result);

  } catch (err) {
    console.error('TRANSACTION FAILED WITH ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testApprove();
