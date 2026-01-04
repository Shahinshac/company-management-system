const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Performance.getAll();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get performance stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Performance.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rating distribution
router.get('/ratings', async (req, res) => {
  try {
    const distribution = await Performance.getRatingDistribution();
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending reviews
router.get('/pending', async (req, res) => {
  try {
    const reviews = await Performance.getPendingReviews();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reviews by employee
router.get('/employee/:empId', async (req, res) => {
  try {
    const reviews = await Performance.getByEmployee(req.params.empId);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get goals by employee
router.get('/goals/:empId', async (req, res) => {
  try {
    const goals = await Performance.getGoals(req.params.empId);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await Performance.getById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    const review = await Performance.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    await Performance.update(req.params.id, req.body);
    res.json({ success: true, message: 'Review updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit review
router.put('/:id/submit', async (req, res) => {
  try {
    await Performance.submit(req.params.id);
    res.json({ success: true, message: 'Review submitted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete review
router.put('/:id/complete', async (req, res) => {
  try {
    await Performance.complete(req.params.id);
    res.json({ success: true, message: 'Review completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    await Performance.delete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== GOALS ROUTES =====

// Create goal
router.post('/goals', async (req, res) => {
  try {
    const goal = await Performance.createGoal(req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update goal
router.put('/goals/:id', async (req, res) => {
  try {
    await Performance.updateGoal(req.params.id, req.body);
    res.json({ success: true, message: 'Goal updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete goal
router.delete('/goals/:id', async (req, res) => {
  try {
    await Performance.deleteGoal(req.params.id);
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
