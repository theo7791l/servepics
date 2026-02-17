const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDB();
  
  // Check if email exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create account' });
        }
        
        req.session.userId = this.lastID;
        req.session.isAdmin = false;
        
        res.json({ 
          success: true, 
          message: 'Account created successfully',
          user: { id: this.lastID, email, username }
        });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDB();
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

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
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check session
router.get('/check', (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  const db = getDB();
  db.get('SELECT id, email, username, is_admin, is_pro FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (!user) {
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
