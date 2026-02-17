const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { getDB } = require('../database');
const { requireAdmin } = require('../middleware/auth');
const { validateAdminCreation, validateUserId } = require('../middleware/validation');
const router = express.Router();

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const db = getDB();
  
  db.all(
    `SELECT id, email, username, is_admin, is_pro, storage_used, storage_limit, 
            created_at, last_login FROM users ORDER BY created_at DESC`,
    [],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
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
    [],
    (err, stats) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }

      db.get('SELECT COUNT(*) as totalFiles FROM files', [], (err, fileStats) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch file stats' });
        }
        
        res.json({
          totalUsers: stats.totalUsers || 0,
          freeUsers: (stats.totalUsers || 0) - (stats.proUsers || 0),
          proUsers: stats.proUsers || 0,
          totalFiles: fileStats.totalFiles || 0,
          totalStorageUsed: stats.totalStorageUsed || 0,
          totalStorageLimit: stats.totalStorageLimit || 0
        });
      });
    }
  );
});

// Toggle Pro subscription
router.post('/toggle-pro/:userId', requireAdmin, validateUserId, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.get('SELECT is_pro, is_admin FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Prevent modifying admin accounts
      if (user.is_admin === 1) {
        db.run('ROLLBACK');
        return res.status(403).json({ error: 'Cannot modify admin accounts' });
      }

      const newProStatus = user.is_pro === 1 ? 0 : 1;
      const newStorageLimit = newProStatus === 1 ? 37580963840 : 5368709120; // 35GB : 5GB

      db.run(
        'UPDATE users SET is_pro = ?, storage_limit = ? WHERE id = ?',
        [newProStatus, newStorageLimit, userId],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Update error:', err);
            return res.status(500).json({ error: 'Failed to update user' });
          }
          
          db.run('COMMIT');
          
          res.json({ 
            success: true, 
            isPro: newProStatus === 1,
            message: newProStatus === 1 ? 'Pro subscription activated' : 'Pro subscription removed'
          });
        }
      );
    });
  });
});

// Create admin account
router.post('/create-admin', requireAdmin, validateAdminCreation, async (req, res) => {
  const { email, password, username } = req.body;
  const db = getDB();
  
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (user) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      
      db.run(
        'INSERT INTO users (email, password, username, is_admin, storage_limit) VALUES (?, ?, ?, 1, ?)',
        [email, hashedPassword, username, 107374182400], // 100GB for admin
        function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Failed to create admin account' });
          }
          
          res.json({ 
            success: true,
            message: 'Admin account created successfully',
            admin: { id: this.lastID, email, username }
          });
        }
      );
    } catch (error) {
      console.error('Hashing error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Delete user
router.delete('/delete-user/:userId', requireAdmin, validateUserId, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  // Prevent deleting yourself
  if (parseInt(userId) === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Check if user is admin
    db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Prevent deleting other admins
      if (user.is_admin === 1) {
        db.run('ROLLBACK');
        return res.status(403).json({ error: 'Cannot delete admin accounts' });
      }
      
      // Get user's files
      db.all('SELECT filepath FROM files WHERE user_id = ?', [userId], (err, files) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch user files' });
        }
        
        // Delete all user files from filesystem
        files.forEach(file => {
          if (fs.existsSync(file.filepath)) {
            try {
              fs.unlinkSync(file.filepath);
            } catch (e) {
              console.error('Failed to delete file:', e);
            }
          }
        });

        // Delete user directory
        const userDir = path.join(__dirname, '..', 'uploads', userId.toString());
        if (fs.existsSync(userDir)) {
          try {
            fs.rmSync(userDir, { recursive: true, force: true });
          } catch (e) {
            console.error('Failed to delete directory:', e);
          }
        }

        // Delete user from database (files will be cascade deleted)
        db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Delete error:', err);
            return res.status(500).json({ error: 'Failed to delete user' });
          }
          
          db.run('COMMIT');
          res.json({ success: true, message: 'User deleted successfully' });
        });
      });
    });
  });
});

// Get user files (for admin view)
router.get('/user-files/:userId', requireAdmin, validateUserId, (req, res) => {
  const { userId } = req.params;
  const db = getDB();
  
  db.all(
    'SELECT id, original_name, size, mimetype, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
    [userId],
    (err, files) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch files' });
      }
      res.json({ files: files || [] });
    }
  );
});

module.exports = router;
