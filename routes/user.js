const express = require('express');
const { getDB } = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get user info
router.get('/info', requireAuth, (req, res) => {
  const db = getDB();
  
  db.get(
    'SELECT id, email, username, is_pro, storage_used, storage_limit, created_at FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isPro: user.is_pro === 1,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit,
          createdAt: user.created_at
        }
      });
    }
  );
});

// Get storage stats
router.get('/storage', requireAuth, (req, res) => {
  const db = getDB();
  
  db.get(
    'SELECT storage_used, storage_limit FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const percentage = (user.storage_used / user.storage_limit * 100).toFixed(2);

      res.json({
        used: user.storage_used,
        limit: user.storage_limit,
        percentage: parseFloat(percentage)
      });
    }
  );
});

module.exports = router;
