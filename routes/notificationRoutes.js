const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.getByUser(userId, limit);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get upcoming birthdays
router.get('/birthdays', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const birthdays = await Notification.getUpcomingBirthdays(days);
    res.json({ success: true, data: birthdays });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get upcoming work anniversaries
router.get('/anniversaries', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const anniversaries = await Notification.getUpcomingAnniversaries(days);
    res.json({ success: true, data: anniversaries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create broadcast notification
router.post('/broadcast', async (req, res) => {
  try {
    const count = await Notification.createBulk(req.body, req.body.userIds);
    res.status(201).json({ success: true, message: `Notification sent to ${count} users` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.markAsRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.put('/read/all', async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.markAllAsRead(userId);
    res.json({ success: true, message: `${count} notifications marked as read` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.delete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete expired notifications
router.delete('/expired/all', async (req, res) => {
  try {
    const count = await Notification.deleteExpired();
    res.json({ success: true, message: `${count} expired notifications deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
