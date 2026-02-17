const crypto = require('crypto');

// Generate CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF Protection
function csrfProtection(req, res, next) {
  if (req.method === 'GET') {
    req.session.csrfToken = generateCSRFToken();
    return next();
  }
  
  const token = req.body.csrfToken || req.headers['x-csrf-token'];
  
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename) {
  // Remove any path components
  const basename = filename.replace(/^.*[\\\/]/, '');
  
  // Remove dangerous characters
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  return safe.substring(0, 255);
}

// Validate file type (whitelist approach)
const ALLOWED_MIMETYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  // Video
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function validateFile(file) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return errors;
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push('File size exceeds 100MB limit');
  }
  
  // Check mimetype
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    errors.push('File type not allowed');
  }
  
  // Check filename
  if (!file.originalname || file.originalname.length > 255) {
    errors.push('Invalid filename');
  }
  
  // Check for double extensions (potential bypass)
  const parts = file.originalname.split('.');
  if (parts.length > 3) {
    errors.push('Too many file extensions');
  }
  
  return errors;
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate username
function validateUsername(username) {
  // Alphanumeric, underscore, hyphen only, 3-30 chars
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password too long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 2) {
    return { valid: false, message: 'Password must contain at least 2 of: uppercase, lowercase, numbers, special characters' };
  }
  
  return { valid: true };
}

// Sanitize user input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    });
}

// Rate limiting configuration
const rateLimitConfig = {
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20 // 20 uploads per 15 minutes
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5 // 5 login attempts per 15 minutes
  },
  api: {
    windowMs: 1 * 60 * 1000,
    max: 60 // 60 requests per minute
  }
};

module.exports = {
  csrfProtection,
  sanitizeFilename,
  validateFile,
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeInput,
  rateLimitConfig,
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE
};
