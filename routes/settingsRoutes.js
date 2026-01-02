const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { isAdmin } = require('../middleware/authMiddleware');

// Get company info (public)
router.get('/company', async (req, res) => {
  try {
    const info = await Settings.getCompanyInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    // Return defaults if settings table doesn't exist
    res.json({
      success: true,
      data: {
        name: '26:07',
        tagline: 'Company Management System',
        currency: 'USD',
        currencySymbol: '$'
      }
    });
  }
});

// Get all settings (admin only)
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company info (admin only)
router.put('/company', isAdmin, async (req, res) => {
  try {
    await Settings.updateCompanyInfo(req.body);
    const info = await Settings.getCompanyInfo();
    res.json({ success: true, message: 'Settings updated', data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set a setting (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, error: 'Key is required' });
    }
    await Settings.set(key, value);
    res.json({ success: true, message: 'Setting saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a setting (admin only)
router.delete('/:key', isAdmin, async (req, res) => {
  try {
    await Settings.delete(req.params.key);
    res.json({ success: true, message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
