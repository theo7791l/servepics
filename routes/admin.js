const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const db = getDB();
  
  db.all(
    `SELECT id, email, username, is_admin, is_pro, storage_used, storage_limit, 
            created_at, last_login FROM users ORDER BY created_at DESC`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin === 1,
        isPro: user.is_pro === 1,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));
      
      res.json({ users: formattedUsers });
    }
  );
});

// Get platform statistics
router.get('/stats', requireAdmin, (req, res) => {
  const db = getDB();
  
  db.get(
    `SELECT 
      COUNT(*) as totalUsers,
      SUM(CASE WHEN is_pro = 1 THEN 1 ELSE 0 END) as proUsers,
      SUM(storage_used) as totalStorageUsed,
      SUM(storage_limit) as totalStorageLimit
     FROM users`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }

      db.get('SELECT COUNT(*) as totalFiles FROM files', (err, fileStats) => {
        res.json({
          totalUsers: stats.totalUsers,
          freeUsers: stats.totalUsers - stats.proUsers,
          proUsers: stats.proUsers,
          totalFiles: fileStats.totalFiles,
          totalStorageUsed: stats.totalStorageUsed,
          totalStorageLimit: stats.totalStorageLimit
        });
      });
    }
  );
});

// Toggle Pro subscription
router.post('/toggle-pro/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  db.get('SELECT is_pro FROM users WHERE id = ?', [userId], (err, user) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newProStatus = user.is_pro === 1 ? 0 : 1;
    const newStorageLimit = newProStatus === 1 ? 37580963840 : 5368709120; // 35GB : 5GB

    db.run(
      'UPDATE users SET is_pro = ?, storage_limit = ? WHERE id = ?',
      [newProStatus, newStorageLimit, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update user' });
        }
        
        res.json({ 
          success: true, 
          isPro: newProStatus === 1,
          message: newProStatus === 1 ? 'Pro subscription activated' : 'Pro subscription removed'
        });
      }
    );
  });
});

// Create admin account
router.post('/create-admin', requireAdmin, async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = getDB();
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, username, is_admin, storage_limit) VALUES (?, ?, ?, 1, ?)',
      [email, hashedPassword, username, 107374182400], // 100GB for admin
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create admin account' });
        }
        
        res.json({ 
          success: true,
          message: 'Admin account created successfully',
          admin: { id: this.lastID, email, username }
        });
      }
    );
  });
});

// Delete user
router.delete('/delete-user/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  // Don't allow deleting yourself
  if (parseInt(userId) === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Get user's files
  db.all('SELECT filepath FROM files WHERE user_id = ?', [userId], (err, files) => {
    // Delete all user files from filesystem
    files.forEach(file => {
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
    });

    // Delete user directory
    const userDir = path.join('uploads', userId.toString());
    if (fs.existsSync(userDir)) {
      fs.rmdirSync(userDir, { recursive: true });
    }

    // Delete user from database (files will be cascade deleted)
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete user' });
      }
      
      res.json({ success: true, message: 'User deleted successfully' });
    });
  });
});

// Get user files (for admin view)
router.get('/user-files/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  db.all(
    'SELECT id, original_name, size, mimetype, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
    [userId],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch files' });
      }
      res.json({ files });
    }
  );
});

module.exports = router;
