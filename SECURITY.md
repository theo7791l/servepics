# Security Policy

## 🛡️ Security Overview

ServePics is built with security as a top priority. This document outlines our security measures and how to report vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## 🔒 Security Features

### 1. Authentication & Authorization

#### Password Security
- **Bcrypt hashing** with cost factor 12 (2^12 iterations)
- **Minimum 8 characters** with complexity requirements
- **Constant-time comparison** to prevent timing attacks
- **No password in logs** or error messages

#### Session Management
- **Secure session cookies** (httpOnly, sameSite: strict)
- **Session regeneration** on login (prevents fixation attacks)
- **7-day session expiration** with automatic cleanup
- **Custom session name** (prevents fingerprinting)

#### Access Control
- **Role-based permissions** (admin vs regular user)
- **Ownership verification** on all file operations
- **Admin privilege separation** (cannot modify other admins)
- **Self-deletion prevention** for admin accounts

### 2. Input Validation & Sanitization

#### Email Validation
```javascript
- Regex pattern matching
- Maximum 255 characters
- Case normalization (lowercase)
```

#### Username Validation
```javascript
- 3-30 characters
- Alphanumeric + underscore + hyphen only
- No special characters or spaces
```

#### Password Requirements
```javascript
- Minimum 8 characters
- Maximum 128 characters
- At least 2 of: uppercase, lowercase, numbers, special chars
```

#### XSS Protection
- **HTML entity encoding** for all user inputs
- **Content Security Policy** (CSP) headers
- **X-XSS-Protection** enabled

#### SQL Injection Prevention
- **Prepared statements** for all database queries
- **Parameterized queries** (never string concatenation)
- **Input type validation** (integers, strings, etc.)

#### Path Traversal Protection
- **Filename sanitization** (removes ../, /, \)
- **Whitelist approach** for allowed characters
- **Secure random filenames** (crypto.randomBytes)

### 3. File Upload Security

#### File Type Validation
```javascript
Whitelist approach - Only allowed MIME types:
- Images: jpeg, png, gif, webp, svg
- Documents: pdf, doc, xls, ppt, txt, csv
- Archives: zip, rar, 7z
- Media: mp3, mp4, avi, webm
```

#### File Size Limits
- **100MB maximum** per file
- **Storage quota enforcement** (5GB/35GB)
- **Multer file size limits**

#### File Name Security
- **Crypto-random filenames** (prevents guessing)
- **Extension validation** (no double extensions)
- **Special character removal**
- **Length limitation** (255 chars max)

#### File Storage
- **User-specific directories** (isolated storage)
- **Restricted permissions** (0o700 for user dirs)
- **Ownership verification** before access
- **Secure deletion** (file + database + directory)

### 4. Rate Limiting

#### API Rate Limits
```javascript
General API:  60 requests per minute
Authentication: 5 attempts per 15 minutes
File Upload:   20 uploads per 15 minutes
```

#### Benefits
- **DDoS protection**
- **Brute force prevention**
- **Resource abuse prevention**
- **Automatic IP blocking** on violations

### 5. HTTP Security Headers (Helmet)

#### Content Security Policy (CSP)
```
default-src: 'self'
script-src: 'self'
style-src: 'self' 'unsafe-inline'
object-src: 'none'
frame-src: 'none'
```

#### Additional Headers
- **HSTS**: Forces HTTPS (31536000 seconds)
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: 1; mode=block
- **Hide X-Powered-By**: No Express fingerprinting

### 6. Database Security

#### Transaction Safety
- **Atomic operations** (BEGIN/COMMIT/ROLLBACK)
- **Race condition prevention**
- **Storage consistency** checks
- **Cascading deletes** properly configured

#### Prepared Statements
```javascript
// Good (parameterized)
db.get('SELECT * FROM users WHERE id = ?', [userId])

// Bad (vulnerable to SQL injection)
db.get(`SELECT * FROM users WHERE id = ${userId}`)
```

### 7. Error Handling

#### Information Disclosure Prevention
- **Generic error messages** in production
- **Detailed logs** only in development
- **No stack traces** sent to client
- **Sensitive data filtering** in logs

#### Logging
- Failed authentication attempts
- File operations
- Database errors
- Rate limit violations
- Security events

## 🚨 Reporting a Vulnerability

### Please DO:
1. **Email**: security@servepics.com
2. **Provide details**: Steps to reproduce, impact assessment
3. **Wait for response**: We aim to respond within 48 hours
4. **Keep it private**: Until we've patched the issue

### Please DON'T:
1. **Create public issues** for security vulnerabilities
2. **Exploit the vulnerability** beyond proof-of-concept
3. **Disclose publicly** before we've had time to fix

### What to Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline:
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix deployment**: Depends on severity
- **Public disclosure**: After fix is deployed

## 🐛 Known Limitations

### Current Scope
1. **SQLite limitations**: Not designed for high concurrency
2. **Local file storage**: No distributed storage support
3. **No email verification**: Relies on manual account approval
4. **No 2FA**: Only password-based authentication
5. **No file encryption at rest**: Files stored in plaintext

### Future Improvements
- [ ] Two-factor authentication (2FA)
- [ ] Email verification
- [ ] File encryption at rest
- [ ] Redis session store (for scalability)
- [ ] PostgreSQL support (better concurrency)
- [ ] Audit logging
- [ ] IP whitelist/blacklist
- [ ] CAPTCHA on signup/login

## 🛠️ Security Checklist for Deployment

### Before Going Live:

- [ ] Generate strong SESSION_SECRET (min 32 chars)
- [ ] Change default admin credentials
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure firewall (only ports 80/443 open)
- [ ] Setup reverse proxy (nginx/Apache)
- [ ] Enable automatic security updates
- [ ] Configure backup strategy
- [ ] Setup monitoring and alerting
- [ ] Review and test rate limits
- [ ] Scan for vulnerabilities (npm audit)
- [ ] Test file upload restrictions
- [ ] Verify CSP headers
- [ ] Check error handling (no info leakage)
- [ ] Setup log rotation
- [ ] Document incident response plan

### Regular Maintenance:

- [ ] Weekly: Check security logs
- [ ] Monthly: Update dependencies (npm update)
- [ ] Monthly: Review user accounts
- [ ] Quarterly: Security audit
- [ ] Quarterly: Rotate SESSION_SECRET
- [ ] Annually: Penetration testing

## 📚 Additional Resources

### Security Best Practices:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Tools:
- `npm audit` - Check for known vulnerabilities
- `snyk` - Continuous security monitoring
- `helmet` - Secure HTTP headers
- `express-rate-limit` - Rate limiting

## 📝 Security Updates

| Date | Version | Description |
|------|---------|-------------|
| 2026-02-17 | 1.0.0 | Initial security implementation |

---

**Last Updated**: February 17, 2026
**Security Contact**: security@servepics.com
