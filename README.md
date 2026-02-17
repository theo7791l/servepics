# ServePics - Secure Cloud Storage Platform 🔒

## Features
- 🎨 Beautiful animated UI with modern design
- 🔐 **Enterprise-grade security** with multiple protection layers
- 📁 Secure file storage and management
- 👥 Robust user authentication system
- 💎 5GB free tier, 35GB pro tier
- 🛡️ Admin panel for account management
- 🚀 Fast and responsive interface

## 🔒 Security Features

### Authentication & Sessions
- ✅ **Bcrypt password hashing** (cost factor 12)
- ✅ **Session regeneration** on login (prevents fixation)
- ✅ **Secure session cookies** (httpOnly, sameSite: strict)
- ✅ **Constant-time password comparison** (prevents timing attacks)
- ✅ **Strong password validation** (min 8 chars, complexity checks)

### Input Validation & Sanitization
- ✅ **Email format validation** with regex
- ✅ **Username validation** (alphanumeric, 3-30 chars)
- ✅ **XSS protection** with input sanitization
- ✅ **SQL injection prevention** with prepared statements
- ✅ **Path traversal protection** in file operations

### File Security
- ✅ **File type whitelist** (only safe mimetypes)
- ✅ **File size limits** (100MB max)
- ✅ **Secure random filenames** (crypto.randomBytes)
- ✅ **Filename sanitization** (removes dangerous characters)
- ✅ **Ownership verification** on all file operations
- ✅ **Double extension detection** (prevents bypass)

### Rate Limiting
- ✅ **API rate limiting** (60 req/min)
- ✅ **Auth rate limiting** (5 attempts/15min)
- ✅ **Upload rate limiting** (20 uploads/15min)
- ✅ **Automatic IP blocking** on abuse

### HTTP Security Headers (Helmet)
- ✅ **Strict Content Security Policy**
- ✅ **HSTS** (HTTP Strict Transport Security)
- ✅ **X-Content-Type-Options: nosniff**
- ✅ **X-XSS-Protection**
- ✅ **Frameguard** (prevents clickjacking)
- ✅ **Hide X-Powered-By**

### Additional Protections
- ✅ **Transaction safety** (atomic database operations)
- ✅ **Graceful error handling** (no info leakage)
- ✅ **Storage quota enforcement**
- ✅ **Admin privilege separation**
- ✅ **Secure file cleanup** on deletion

## Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/theo7791l/servepics.git
cd servepics

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### ⚠️ IMPORTANT: Configure .env

**Generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env` file:
```env
PORT=3000
NODE_ENV=production

# CRITICAL: Use a secure random string (min 32 characters)
SESSION_SECRET=your_generated_secure_secret_here

# Default admin account (CHANGE IMMEDIATELY after first login)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeThisStrongPassword123!
```

### Run the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
NODE_ENV=production npm start
```

## 🔐 First Login & Security Setup

1. **Start the application**
2. **Login with default admin account** (see .env)
3. **IMMEDIATELY change the admin password**
4. **Create your personal account** via /signup
5. **Review security logs regularly**

## Project Structure

```
servepics/
├── server.js                 # Main server with security config
├── database.js              # SQLite setup with prepared statements
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── security.js          # Security utilities & validators
│   └── validation.js        # Input validation middleware
├── routes/
│   ├── auth.js              # Secure authentication routes
│   ├── files.js             # Secure file management
│   ├── user.js              # User profile routes
│   └── admin.js             # Admin panel routes
├── public/
│   ├── index.html           # Landing page
│   ├── login.html           # Login page
│   ├── signup.html          # Registration page
│   ├── drive.html           # File manager interface
│   ├── admin.html           # Admin dashboard
│   ├── css/                 # Stylesheets with animations
│   └── js/                  # Client-side scripts
└── uploads/                 # User files (not in git)
```

## Admin Features

- 📊 **Real-time statistics** (users, files, storage)
- 👥 **User management** with detailed information
- 💎 **Pro subscription management** (assign/remove)
- 🔑 **Create admin accounts** securely
- 🗑️ **Delete users** with complete cleanup
- 🛡️ **Protection against self-deletion**
- ⚠️ **Admin account protection** (cannot be modified)

## Security Best Practices

### For Deployment
1. ✅ Use **HTTPS** (Let's Encrypt for free SSL)
2. ✅ Set `NODE_ENV=production`
3. ✅ Use a **strong SESSION_SECRET** (min 32 chars)
4. ✅ Enable **firewall** on server
5. ✅ Regular **security updates** (`npm audit fix`)
6. ✅ Setup **automated backups** for database
7. ✅ Monitor **logs** for suspicious activity
8. ✅ Use **reverse proxy** (nginx/Apache)

### For Users
1. ✅ Use **strong unique passwords**
2. ✅ Don't share admin credentials
3. ✅ Review uploaded files regularly
4. ✅ Report suspicious activity

## Rate Limiting Details

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 60 requests | 1 minute |
| Login/Signup | 5 attempts | 15 minutes |
| File Upload | 20 uploads | 15 minutes |

## Allowed File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word, Excel, PowerPoint, TXT, CSV
- **Archives**: ZIP, RAR, 7Z
- **Audio**: MP3, WAV, OGG, M4A
- **Video**: MP4, MPEG, QuickTime, AVI, WebM

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (with prepared statements)
- **Security**: 
  - bcryptjs (password hashing)
  - helmet (HTTP headers)
  - express-rate-limit (DDoS protection)
  - express-session (secure sessions)
- **Frontend**: Vanilla JavaScript + CSS3 animations

## Monitoring & Logs

The application logs:
- ❌ Failed login attempts
- 📁 File operations
- ⚠️ Security violations
- 💾 Database errors
- 🚨 Rate limit violations

## Troubleshooting

### "Session secret is not set"
- Generate a secure secret and add to `.env`

### "Storage limit exceeded"
- User has reached their quota (5GB free, 35GB pro)
- Admin can upgrade to Pro or user must delete files

### "Too many requests"
- Rate limit reached, wait for the cooldown period

### "File type not allowed"
- Only whitelisted file types are accepted
- Check the allowed file types list above

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check session

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/list` - List user files
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/delete/:id` - Delete file

### Admin (requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Platform statistics
- `POST /api/admin/toggle-pro/:userId` - Toggle Pro status
- `POST /api/admin/create-admin` - Create admin account
- `DELETE /api/admin/delete-user/:userId` - Delete user

## Contributing

Security improvements are always welcome! Please:
1. Report security vulnerabilities privately
2. Follow secure coding practices
3. Test thoroughly before submitting PRs

## License

MIT License - See LICENSE file

## Security Disclosure

Found a security issue? Please email: security@servepics.com
*(Do not create public issues for security vulnerabilities)*

---

**Made with ❤️ and 🔒 security in mind**
