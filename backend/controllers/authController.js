import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

export const signup = async (req, res) => {
  try {
    const { full_name, email, phone, password, confirm_password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check existing email
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbRun(
      `INSERT INTO users (full_name, email, phone, password) VALUES (?, ?, ?, ?)`,
      [full_name, email.toLowerCase().trim(), phone || '', hashedPassword]
    );

    const userId = result.lastID;

    // Create default settings
    await dbRun(
      `INSERT INTO settings (user_id, language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal)
       VALUES (?, 'en', '₹', 'INV', 18.00, 150000.00)`,
      [userId]
    );

    // Initial welcome notification
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'Welcome to FreelanceHub!', 'Your account has been created successfully. Explore your dashboard to start managing projects.', 'success']
    );

    const token = generateToken({ id: userId, email, full_name });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: userId, full_name, email, phone }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({ id: user.id, email: user.email, full_name: user.full_name });

    // Log activity
    await dbRun(
      `INSERT INTO activities (user_id, title, description, type) VALUES (?, ?, ?, ?)`,
      [user.id, 'User Login', 'User authenticated successfully.', 'auth']
    );

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const demoSession = async (req, res) => {
  try {
    let user = await dbGet('SELECT * FROM users WHERE id = 1');
    if (!user) {
      user = await dbGet('SELECT * FROM users ORDER BY id ASC LIMIT 1');
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'No demo user found.' });
    }
    const token = generateToken({ id: user.id, email: user.email, full_name: user.full_name });
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Demo session error:', error);
    res.status(500).json({ success: false, message: 'Server error generating demo session.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email.' });
    }

    const user = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      // Don't leak if email exists or not
      return res.json({ success: true, message: 'If that email is registered, password reset instructions have been sent.' });
    }

    return res.json({ success: true, message: 'Password reset link sent to your email address (Simulated).' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing forgot password request.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ success: false, message: 'Missing parameters.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await dbRun('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.toLowerCase().trim()]);

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
};
