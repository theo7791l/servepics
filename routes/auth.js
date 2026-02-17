const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const { validateSignup, validateLogin } = require('../middleware/validation');
const router = express.Router();

// Signup
router.post('/signup', validateSignup, async (req, res) => {
  const { email, password, username } = req.body;
  const db = getDB();
  
  // Check if email exists
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (user) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12); // Increased cost factor
      
      db.run(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [email, hashedPassword, username],
        function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Failed to create account' });
          }
          
          // Set session
          req.session.userId = this.lastID;
          req.session.isAdmin = false;
          
          // Regenerate session ID to prevent fixation
          req.session.regenerate((err) => {
            if (err) {
              console.error('Session error:', err);
            }
            
            req.session.userId = this.lastID;
            req.session.isAdmin = false;
            
            res.json({ 
              success: true, 
              message: 'Account created successfully',
              user: { id: this.lastID, email, username }
            });
          });
        }
      );
    } catch (error) {
      console.error('Hashing error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Login
router.post('/login', validateLogin, (req, res) => {
  const { email, password } = req.body;
  const db = getDB();
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      // Use constant-time response to prevent timing attacks
      await bcrypt.hash('dummy', 12);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Regenerate session to prevent fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session error:', err);
          return res.status(500).json({ error: 'Session error' });
        }
        
        req.session.userId = user.id;
        req.session.isAdmin = user.is_admin === 1;
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: user.is_admin === 1,
            isPro: user.is_pro === 1
          }
        });
      });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Check session
router.get('/check', (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  const db = getDB();
  db.get(
    'SELECT id, email, username, is_admin, is_pro FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (err || !user) {
        return res.json({ authenticated: false });
      }
      
      res.json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.is_admin === 1,
          isPro: user.is_pro === 1
        }
      });
    }
  );
});

module.exports = router;
