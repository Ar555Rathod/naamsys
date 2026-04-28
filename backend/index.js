const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const vendorRoutes = require('./src/routes/vendors');
const invoiceRoutes = require('./src/routes/invoices');
const csrRoutes = require('./src/routes/csr');
const govtRoutes = require('./src/routes/govt');
const reportsRoutes = require('./src/routes/reports');
const locationsRoutes = require('./src/routes/locations');
const wccRoutes = require('./src/routes/wcc');
const donorsRoutes = require('./src/routes/donors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/csr', csrRoutes);
app.use('/api/govt', govtRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/wcc', wccRoutes);
app.use('/api/donors', donorsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NAAM API is running' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Catch-all route for React Router (must be after all other routes and static files)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
