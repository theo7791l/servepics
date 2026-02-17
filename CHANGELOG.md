# Changelog

All notable changes to ServePics will be documented in this file.

## [1.0.0] - 2026-02-17

### 🔒 Security Enhancements

#### Authentication & Sessions
- ✅ Added bcrypt password hashing with cost factor 12 (increased from 10)
- ✅ Implemented session regeneration on login to prevent fixation attacks
- ✅ Added constant-time password comparison to prevent timing attacks
- ✅ Enhanced password validation (min 8 chars, complexity requirements)
- ✅ Secure session cookies (httpOnly, sameSite: strict)
- ✅ Custom session name to prevent fingerprinting
- ✅ Proper session cleanup on logout

#### Input Validation & Sanitization
- ✅ Created comprehensive validation middleware
- ✅ Email format validation with regex
- ✅ Username validation (3-30 chars, alphanumeric + _ -)
- ✅ XSS protection with HTML entity encoding
- ✅ SQL injection prevention with prepared statements
- ✅ Path traversal protection in file operations
- ✅ All database queries use parameterized statements

#### File Upload Security
- ✅ File type whitelist (only safe MIME types allowed)
- ✅ File size validation (100MB max)
- ✅ Secure random filename generation (crypto.randomBytes)
- ✅ Filename sanitization (removes dangerous characters)
- ✅ Double extension detection and prevention
- ✅ Ownership verification on all file operations
- ✅ Secure file deletion with cleanup
- ✅ User-specific directory isolation (0o700 permissions)

#### Rate Limiting
- ✅ Implemented multi-tier rate limiting:
  - API: 60 requests/minute
  - Auth: 5 attempts/15 minutes
  - Upload: 20 uploads/15 minutes
- ✅ Automatic IP blocking on abuse
- ✅ Skip successful requests for auth limiter

#### HTTP Security Headers (Helmet)
- ✅ Strict Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY (prevents clickjacking)
- ✅ X-XSS-Protection enabled
- ✅ Hidden X-Powered-By header

#### Database Security
- ✅ Transaction safety (BEGIN/COMMIT/ROLLBACK)
- ✅ Atomic operations for storage updates
- ✅ Race condition prevention
- ✅ Cascading deletes properly configured
- ✅ Storage consistency checks

#### Admin Panel Security
- ✅ Admin privilege separation
- ✅ Prevention of admin account modification by other admins
- ✅ Self-deletion prevention for admin accounts
- ✅ Validation of all admin operations
- ✅ Proper error handling without info leakage

#### Error Handling
- ✅ Generic error messages in production
- ✅ Detailed logging (with security event tracking)
- ✅ No stack traces sent to client in production
- ✅ Sensitive data filtering in logs
- ✅ Graceful shutdown handling

### 🛠️ Bug Fixes

#### File Management
- 🐛 Fixed: Files could be accessed without ownership verification
- 🐛 Fixed: Storage quota could be bypassed with concurrent uploads
- 🐛 Fixed: File cleanup didn't remove empty directories
- 🐛 Fixed: Storage counter could go negative on deletion errors
- 🐛 Fixed: Upload directory creation race condition

#### Authentication
- 🐛 Fixed: Session fixation vulnerability
- 🐛 Fixed: Timing attack vulnerability in password comparison
- 🐛 Fixed: Password requirements not enforced on signup
- 🐛 Fixed: Email case sensitivity issues

#### Database
- 🐛 Fixed: SQL injection vulnerabilities in queries
- 🐛 Fixed: Race conditions in storage calculations
- 🐛 Fixed: Missing transaction rollbacks on errors
- 🐛 Fixed: Database connections not properly closed

#### Admin Panel
- 🐛 Fixed: Admin could delete themselves
- 🐛 Fixed: Admin could modify other admin accounts
- 🐛 Fixed: No validation on user ID parameters
- 🐛 Fixed: User deletion didn't clean up files properly

### 🎉 New Features

#### Security
- ✨ Added comprehensive input validation middleware
- ✨ Added security.js utility module
- ✨ Added validation.js for route validation
- ✨ Added health check endpoint (/health)
- ✨ Added graceful shutdown handling

#### Documentation
- 📝 Added comprehensive SECURITY.md
- 📝 Updated README with security features
- 📝 Enhanced .env.example with security guidelines
- 📝 Added this CHANGELOG

### 🔄 Changed

- ♻️ Updated bcrypt cost factor from 10 to 12
- ♻️ Changed session secret validation (min 32 chars)
- ♻️ Improved error messages (no info leakage)
- ♻️ Enhanced logging with security events
- ♻️ Updated Helmet configuration for stricter CSP
- ♻️ Modified file storage to use crypto-random names

### 📚 Dependencies

#### No new dependencies added
All security improvements use existing dependencies:
- `express` - Web framework
- `bcryptjs` - Password hashing
- `helmet` - HTTP security headers
- `express-rate-limit` - Rate limiting
- `express-session` - Session management
- `multer` - File upload handling
- `sqlite3` - Database

### ⚠️ Breaking Changes

#### Session Secret Required
- SESSION_SECRET environment variable is now required
- Minimum 32 characters enforced
- Random secret generated if not provided (with warning)

#### Password Requirements
- Minimum length increased from 6 to 8 characters
- Complexity requirements added (2 of: upper, lower, number, special)
- Maximum length set to 128 characters

#### File Upload
- File type whitelist enforced (previously allowed all types)
- Filename sanitization applied (may change uploaded filenames)
- Storage quota strictly enforced with transactions

#### Rate Limiting
- New rate limits may affect high-frequency API usage
- Failed login attempts count towards rate limit

### 📝 Migration Guide

#### From Previous Version

1. **Update .env file:**
   ```bash
   # Generate secure session secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Add to .env
   SESSION_SECRET=<generated_secret>
   ```

2. **Update admin password:**
   - Login with current credentials
   - Change to strong password (min 8 chars, complexity)

3. **Test file uploads:**
   - Verify allowed file types work
   - Check that rejected types are blocked

4. **Monitor rate limits:**
   - Check application logs for rate limit hits
   - Adjust limits in middleware/security.js if needed

5. **Run security check:**
   ```bash
   npm audit
   npm audit fix
   ```

### 🔮 Upcoming Features

- [ ] Two-factor authentication (2FA)
- [ ] Email verification
- [ ] File encryption at rest
- [ ] Redis session store
- [ ] PostgreSQL support
- [ ] Audit logging
- [ ] IP whitelist/blacklist
- [ ] CAPTCHA integration
- [ ] Webhook support
- [ ] API key authentication

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for new functionality (backwards compatible)
- PATCH version for backwards compatible bug fixes

## Links

- [Security Policy](SECURITY.md)
- [README](README.md)
- [GitHub Repository](https://github.com/theo7791l/servepics)
