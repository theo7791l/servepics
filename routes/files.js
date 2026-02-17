const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDB } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { sanitizeFilename, validateFile } = require('../middleware/security');
const { validateFileId } = require('../middleware/validation');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}

// Configure multer with security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.session.userId.toString());
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      try {
        fs.mkdirSync(userDir, { recursive: true, mode: 0o700 });
      } catch (err) {
        return cb(err);
      }
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized);
    cb(null, `${randomName}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);
    cb(null, true);
  }
});

// Upload file with validation
router.post('/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 100MB limit' });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    const validationErrors = validateFile(req.file);
    if (validationErrors.length > 0) {
      // Delete uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete invalid file:', e);
      }
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const db = getDB();
    
    // Check storage limit with transaction safety
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.get(
        'SELECT storage_used, storage_limit FROM users WHERE id = ?', 
        [req.session.userId], 
        (err, user) => {
          if (err) {
            db.run('ROLLBACK');
            fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (!user) {
            db.run('ROLLBACK');
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'User not found' });
          }
          
          if (user.storage_used + req.file.size > user.storage_limit) {
            db.run('ROLLBACK');
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ 
              error: 'Storage limit exceeded',
              used: user.storage_used,
              limit: user.storage_limit
            });
          }

          // Add file to database
          db.run(
            `INSERT INTO files (user_id, filename, original_name, filepath, size, mimetype) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.session.userId, 
              req.file.filename, 
              req.file.originalname, 
              req.file.path, 
              req.file.size, 
              req.file.mimetype
            ],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                fs.unlinkSync(req.file.path);
                console.error('Database insert error:', err);
                return res.status(500).json({ error: 'Failed to save file info' });
              }

              // Update storage used
              db.run(
                'UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
                [req.file.size, req.session.userId],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Failed to update storage' });
                  }
                  
                  db.run('COMMIT');
                  
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
        }
      );
    });
  });
});

// List files - only user's own files
router.get('/list', requireAuth, (req, res) => {
  const db = getDB();
  
  db.all(
    'SELECT id, original_name, size, mimetype, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
    [req.session.userId],
    (err, files) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch files' });
      }
      res.json({ files: files || [] });
    }
  );
});

// Download file - verify ownership
router.get('/download/:id', requireAuth, validateFileId, (req, res) => {
  const db = getDB();
  
  db.get(
    'SELECT * FROM files WHERE id = ? AND user_id = ?',
    [req.params.id, req.session.userId],
    (err, file) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Verify file exists
      if (!fs.existsSync(file.filepath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      // Set secure headers
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      res.download(file.filepath, file.original_name);
    }
  );
});

// Delete file - verify ownership and clean up
router.delete('/delete/:id', requireAuth, validateFileId, (req, res) => {
  const db = getDB();
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.get(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId],
      (err, file) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!file) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'File not found' });
        }

        // Delete from filesystem
        if (fs.existsSync(file.filepath)) {
          try {
            fs.unlinkSync(file.filepath);
          } catch (e) {
            console.error('Failed to delete file:', e);
          }
        }

        // Delete from database
        db.run('DELETE FROM files WHERE id = ?', [req.params.id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to delete file record' });
          }

          // Update storage used
          db.run(
            'UPDATE users SET storage_used = MAX(0, storage_used - ?) WHERE id = ?',
            [file.size, req.session.userId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to update storage' });
              }
              
              db.run('COMMIT');
              res.json({ success: true });
            }
          );
        });
      }
    );
  });
});

module.exports = router;
