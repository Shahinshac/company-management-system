const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const worksRoutes = require('./routes/worksRoutes');
const managesRoutes = require('./routes/managesRoutes');
const dependentRoutes = require('./routes/dependentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/works', authenticateToken, worksRoutes);
app.use('/api/manages', authenticateToken, managesRoutes);
app.use('/api/dependents', authenticateToken, dependentRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Company Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Company Management System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/register': 'Register user',
        'POST /api/auth/change-password': 'Change password'
      },
      companies: {
        'GET /api/companies': 'Get all companies',
        'GET /api/companies/:name': 'Get company by name',
        'GET /api/companies/:name/employees': 'Get company employees',
        'POST /api/companies': 'Create company',
        'PUT /api/companies/:name': 'Update company',
        'DELETE /api/companies/:name': 'Delete company'
      },
      employees: {
        'GET /api/employees': 'Get all employees',
        'GET /api/employees/:id': 'Get employee by ID',
        'GET /api/employees/:id/works': 'Get employee work history',
        'GET /api/employees/:id/subordinates': 'Get employee subordinates',
        'POST /api/employees': 'Create employee',
        'PUT /api/employees/:id': 'Update employee',
        'DELETE /api/employees/:id': 'Delete employee'
      },
      works: {
        'GET /api/works': 'Get all work relationships',
        'GET /api/works/stats': 'Get salary statistics',
        'POST /api/works': 'Create work relationship',
        'PUT /api/works/:empId/:companyName': 'Update salary',
        'DELETE /api/works/:empId/:companyName': 'Delete work relationship'
      },
      manages: {
        'GET /api/manages': 'Get all management relationships',
        'GET /api/manages/managers': 'Get all managers',
        'POST /api/manages': 'Create management relationship',
        'DELETE /api/manages/:empId': 'Delete management relationship'
      }
    }
  });
});

// Root endpoint - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
========================================
  Company Management System
========================================
  Server running on port ${PORT}
  
  API Endpoints:
  - http://localhost:${PORT}/api
  - http://localhost:${PORT}/api/health
  
  Frontend:
  - http://localhost:${PORT}
========================================
  `);
});

module.exports = app;
