const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join('uploads', req.session.userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
});

// Upload file
router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const db = getDB();
  
  // Check storage limit
  db.get('SELECT storage_used, storage_limit FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (user.storage_used + req.file.size > user.storage_limit) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Storage limit exceeded' });
      }

      // Add file to database
      db.run(
        `INSERT INTO files (user_id, filename, original_name, filepath, size, mimetype) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.session.userId, req.file.filename, req.file.originalname, 
         req.file.path, req.file.size, req.file.mimetype],
        function(err) {
          if (err) {
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Failed to save file info' });
          }

          // Update storage used
          db.run('UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
            [req.file.size, req.session.userId]
          );

          res.json({ 
            success: true,
            file: {
              id: this.lastID,
              name: req.file.originalname,
              size: req.file.size,
              type: req.file.mimetype
            }
          });
        }
      );
    }
  );
});

// List files
router.get('/list', requireAuth, (req, res) => {
  const db = getDB();
  
  db.all(
    'SELECT id, original_name, size, mimetype, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
    [req.session.userId],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch files' });
      }
      res.json({ files });
    }
  );
});

// Download file
router.get('/download/:id', requireAuth, (req, res) => {
  const db = getDB();
  
  db.get(
    'SELECT * FROM files WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId],
    (err, file) => {
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.download(file.filepath, file.original_name);
    }
  );
});

// Delete file
router.delete('/delete/:id', requireAuth, (req, res) => {
  const db = getDB();
  
  db.get(
    'SELECT * FROM files WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId],
    (err, file) => {
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from filesystem
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }

      // Delete from database
      db.run('DELETE FROM files WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete file' });
        }

        // Update storage used
        db.run('UPDATE users SET storage_used = storage_used - ? WHERE id = ?',
          [file.size, req.session.userId]
        );

        res.json({ success: true });
      });
    }
  );
});

module.exports = router;
