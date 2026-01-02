const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Get overall statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Report.getOverallStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get salary by company
router.get('/salary-by-company', async (req, res) => {
  try {
    const data = await Report.getSalaryByCompany();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get salary by city
router.get('/salary-by-city', async (req, res) => {
  try {
    const data = await Report.getSalaryByCity();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top earners
router.get('/top-earners', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await Report.getTopEarners(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top managers
router.get('/top-managers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await Report.getTopManagers(limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unassigned employees
router.get('/unassigned-employees', async (req, res) => {
  try {
    const data = await Report.getUnassignedEmployees();
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get empty companies
router.get('/empty-companies', async (req, res) => {
  try {
    const data = await Report.getEmptyCompanies();
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payroll summary
router.get('/payroll', async (req, res) => {
  try {
    const data = await Report.getPayrollSummary();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get employee growth
router.get('/growth', async (req, res) => {
  try {
    const data = await Report.getEmployeeGrowth();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export data as JSON
router.get('/export/:type', async (req, res) => {
  try {
    let data;
    const type = req.params.type;
    
    switch(type) {
      case 'companies':
        data = await Report.getSalaryByCompany();
        break;
      case 'employees':
        data = await Report.getTopEarners(1000);
        break;
      case 'payroll':
        data = await Report.getPayrollSummary();
        break;
      default:
        data = await Report.getOverallStats();
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.json`);
    res.json({ exportDate: new Date().toISOString(), type, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
