const { sanitizeInput, validateEmail, validateUsername, validatePassword } = require('./security');

// Validate signup data
function validateSignup(req, res, next) {
  const { email, password, username } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Validate email
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate username
  if (!validateUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters and contain only letters, numbers, _ or -' });
  }
  
  // Validate password
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.message });
  }
  
  // Sanitize inputs
  req.body.email = sanitizeInput(email.toLowerCase());
  req.body.username = sanitizeInput(username);
  
  next();
}

// Validate login data
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  req.body.email = sanitizeInput(email.toLowerCase());
  
  next();
}

// Validate admin creation data
function validateAdminCreation(req, res, next) {
  const { email, password, username } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!validateUsername(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.message });
  }
  
  req.body.email = sanitizeInput(email.toLowerCase());
  req.body.username = sanitizeInput(username);
  
  next();
}

// Validate user ID parameter
function validateUserId(req, res, next) {
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId) || userId < 1) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  req.params.userId = userId;
  next();
}

// Validate file ID parameter
function validateFileId(req, res, next) {
  const fileId = parseInt(req.params.id);
  
  if (isNaN(fileId) || fileId < 1) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }
  
  req.params.id = fileId;
  next();
}

module.exports = {
  validateSignup,
  validateLogin,
  validateAdminCreation,
  validateUserId,
  validateFileId
};
