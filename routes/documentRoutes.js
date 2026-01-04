const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.getAll();
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Document.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document categories
router.get('/categories', async (req, res) => {
  try {
    const categories = Document.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expiring documents
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const documents = await Document.getExpiring(days);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get expired documents
router.get('/expired', async (req, res) => {
  try {
    const documents = await Document.getExpired();
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get documents by category
router.get('/category/:category', async (req, res) => {
  try {
    const documents = await Document.getByCategory(req.params.category);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get documents by employee
router.get('/employee/:empId', async (req, res) => {
  try {
    const documents = await Document.getByEmployee(req.params.empId);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create document
router.post('/', async (req, res) => {
  try {
    const document = await Document.create(req.body);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update document
router.put('/:id', async (req, res) => {
  try {
    await Document.update(req.params.id, req.body);
    res.json({ success: true, message: 'Document updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify document
router.put('/:id/verify', async (req, res) => {
  try {
    const verifiedBy = req.user?.emp_id || null;
    await Document.verify(req.params.id, verifiedBy);
    res.json({ success: true, message: 'Document verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    await Document.delete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
