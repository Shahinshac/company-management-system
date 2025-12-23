const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Gracefully handle invalid JSON in request bodies (return 400 instead of crashing)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON received:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const dependentRoutes = require('./routes/dependentRoutes');
const configRoutes = require('./routes/configRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);

// Protected routes (authentication required)
app.use('/api/users', userRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/dependents', authenticateToken, dependentRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Company Management System API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Company Management System API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth (login, register)',
      users: '/api/users (admin)',
      employees: '/api/employees',
      departments: '/api/departments',
      projects: '/api/projects',
      dependents: '/api/dependents'
    },
    note: 'Most endpoints require authentication'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error for debugging (include stack)
  console.error('Unhandled error:', err && err.stack ? err.stack : err);

  const status = err && err.status ? err.status : 500;
  const response = { error: { message: status === 500 ? 'Internal Server Error' : (err && err.message) || 'Error', status } };

  // In non-production include details for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    response.error.details = err && (err.message || err.stack);
  }

  res.status(status).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Check for critical environment variables and warn
const requiredEnvs = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingEnvs = requiredEnvs.filter(k => !process.env[k]);
if (missingEnvs.length > 0) {
  console.warn('Warning: Missing environment variables:', missingEnvs.join(', '));
  if (process.env.NODE_ENV === 'production') {
    console.warn('Missing env vars in production can cause runtime failures. Please set them in your hosting provider.');
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
