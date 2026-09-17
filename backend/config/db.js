import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'freelancer.db');
const verboseSqlite = sqlite3.verbose();
let db;

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const instance = new verboseSqlite.Database(dbPath, (err) => {
      if (err) reject(err);
      else {
        console.log('Connected to SQLite database at:', dbPath);
        resolve(instance);
      }
    });
  });
};

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    db.close((err) => {
      if (err) reject(err);
      else {
        db = null;
        resolve();
      }
    });
  });
};

const removeCorruptDatabase = async () => {
  try {
    await fs.promises.unlink(dbPath);
    console.log('Deleted corrupted SQLite database file:', dbPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

const isCorruptError = (err) => {
  return err && (err.code === 'SQLITE_CORRUPT' || (typeof err.message === 'string' && err.message.includes('malformed')));
};

const ensureDatabase = async () => {
  if (db) return;
  db = await openDatabase();
};

const recoverDatabaseIfNeeded = async (err) => {
  if (!isCorruptError(err)) {
    throw err;
  }
  console.warn('SQLite database corruption detected, recreating database.');
  await closeDatabase();
  await removeCorruptDatabase();
  db = await openDatabase();
};

export const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const initializeSchema = async () => {
  await dbRun('PRAGMA foreign_keys = ON');

  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      location TEXT DEFAULT 'Coimbatore, Tamil Nadu, India',
      bio TEXT,
      skills TEXT,
      hourly_rate REAL DEFAULT 1200.00,
      experience_years INTEGER DEFAULT 4,
      languages TEXT DEFAULT 'English, Tamil, Hindi',
      portfolio_url TEXT DEFAULT 'https://arunkumar.dev',
      avatar_url TEXT DEFAULT '/assets/avatar-default.png',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      language TEXT DEFAULT 'en',
      currency_symbol TEXT DEFAULT '₹',
      invoice_prefix TEXT DEFAULT 'INV',
      default_tax_rate REAL DEFAULT 18.00,
      monthly_income_goal REAL DEFAULT 150000.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      gstin TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Web Development',
      budget REAL DEFAULT 0.00,
      start_date TEXT,
      deadline TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'In Progress',
      progress INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      client_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT DEFAULT 'Self',
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'To Do',
      progress INTEGER DEFAULT 0,
      start_date TEXT,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'UPI',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_rate REAL DEFAULT 18.00,
      tax_amount REAL DEFAULT 0.00,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER,
      client_id INTEGER,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const userCount = await dbGet('SELECT COUNT(*) AS count FROM users');
  if (userCount.count === 0) {
    console.log('Creating default user account...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    await dbRun(`
      INSERT INTO users (id, full_name, email, phone, password, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url, avatar_url)
      VALUES (1, 'Arun Kumar', 'arun@example.com', '+91 9876543210', ?, 'Coimbatore, Tamil Nadu, India',
      'Senior Full-Stack Web Developer & UI/UX Specialist crafting high-performance digital solutions.',
      'Node.js, Express, React, JavaScript, HTML5/CSS3, Tailwind CSS, REST APIs, SQL',
      1500.00, 5, 'English, Tamil, Hindi', 'https://arunkumar.dev', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
    `, [hashedPassword]);

    await dbRun(`
      INSERT INTO settings (user_id, language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal)
      VALUES (1, 'en', '₹', 'INV', 18.00, 150000.00)
    `);
  }
};

export const initDB = async () => {
  try {
    await ensureDatabase();
  } catch (error) {
    if (isCorruptError(error)) {
      await recoverDatabaseIfNeeded(error);
    } else {
      throw error;
    }
  }

  try {
    await initializeSchema();
  } catch (error) {
    if (isCorruptError(error)) {
      await recoverDatabaseIfNeeded(error);
      await initializeSchema();
    } else {
      throw error;
    }
  }
};

export default db;
