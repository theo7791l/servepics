# ServePics - Cloud Storage Platform

## Features
- 🎨 Beautiful animated UI
- 📁 Secure file storage and management
- 👥 User authentication system
- 💎 5GB free tier, 35GB pro tier
- 🔐 Admin panel for account management
- 🚀 Fast and responsive

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```
PORT=3000
SESSION_SECRET=your_secure_random_secret_here
ADMIN_EMAIL=admin@servepics.com
ADMIN_PASSWORD=change_this_password
```

## Run

```bash
npm start
```

Or for development:

```bash
npm run dev
```

## Default Admin Account

After first launch, login with:
- Email: admin@servepics.com
- Password: admin123 (change immediately!)

## Project Structure

```
servepics/
├── server.js           # Main server file
├── database.js         # Database setup
├── routes/            # API routes
├── middleware/        # Auth middleware
├── public/            # Static files
│   ├── index.html     # Landing page
│   ├── login.html     # Login page
│   ├── signup.html    # Signup page
│   ├── drive.html     # Main drive interface
│   ├── admin.html     # Admin panel
│   ├── css/          # Stylesheets
│   └── js/           # Client scripts
└── uploads/          # User files storage
```

## Admin Features

- View all users and their storage usage
- Assign/remove Pro subscriptions
- Create admin accounts
- Delete users and their files
- Monitor platform statistics

## Tech Stack

- Backend: Node.js + Express
- Database: SQLite3
- Frontend: Vanilla JS with CSS animations
- Security: bcryptjs, helmet, rate limiting
