const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'servepics.db');
const db = new sqlite3.Database(DB_PATH);

function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        is_pro BOOLEAN DEFAULT 0,
        storage_used INTEGER DEFAULT 0,
        storage_limit INTEGER DEFAULT 5368709120,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Files table
    db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        filepath TEXT NOT NULL,
        size INTEGER NOT NULL,
        mimetype TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create uploads directory
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads', { recursive: true });
    }

    // Create default admin account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@servepics.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        db.run(
          'INSERT INTO users (email, password, username, is_admin, storage_limit) VALUES (?, ?, ?, ?, ?)',
          [adminEmail, hashedPassword, 'Admin', 1, 107374182400], // 100GB for admin
          (err) => {
            if (!err) {
              console.log('✅ Admin account created:');
              console.log(`   Email: ${adminEmail}`);
              console.log(`   Password: ${adminPassword}`);
              console.log('   ⚠️  Please change the password!');
            }
          }
        );
      }
    });
  });
}

function getDB() {
  return db;
}

module.exports = { initDatabase, getDB };
