const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to restrict to Admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required.' });
  }
  next();
};

router.use(authenticate);
router.use(requireAdmin);

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve employees', details: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, designation, salary_amount, bank_name, account_number, ifsc } = req.body;
    
    if (!full_name || !designation || !salary_amount) {
      return res.status(400).json({ error: 'Name, Designation, and Salary are required.' });
    }

    const count = await prisma.employee.count() + 1;
    const employee_id = `EMP-${String(count).padStart(4, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        employee_id,
        full_name,
        email: email || null,
        phone: phone || null,
        designation,
        salary_amount: parseFloat(salary_amount),
        bank_name: bank_name || null,
        account_number: account_number || null,
        ifsc: ifsc || null
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee', details: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, designation, salary_amount, bank_name, account_number, ifsc } = req.body;

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        full_name,
        email: email || null,
        phone: phone || null,
        designation,
        salary_amount: salary_amount ? parseFloat(salary_amount) : undefined,
        bank_name: bank_name || null,
        account_number: account_number || null,
        ifsc: ifsc || null
      }
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee', details: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee', details: error.message });
  }
});

module.exports = router;
