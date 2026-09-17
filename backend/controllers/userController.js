import bcrypt from 'bcryptjs';
import { dbGet, dbRun, dbQuery } from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await dbGet(
      'SELECT id, full_name, email, phone, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const settings = await dbGet('SELECT * FROM settings WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      profile: user,
      settings: settings || { language: 'en', currency_symbol: '₹', invoice_prefix: 'INV', default_tax_rate: 18, monthly_income_goal: 150000 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email, phone, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url, avatar_url } = req.body;

    await dbRun(
      `UPDATE users SET 
        full_name = ?, email = COALESCE(?, email), phone = ?, location = ?, bio = ?, skills = ?, 
        hourly_rate = ?, experience_years = ?, languages = ?, portfolio_url = ?, avatar_url = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name, email || null, phone, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url, avatar_url || '', userId]
    );

    const updatedUser = await dbGet('SELECT id, full_name, email, phone, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url, avatar_url FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Please enter all password fields.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const user = await dbGet('SELECT password FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(current_password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal } = req.body;

    const existing = await dbGet('SELECT id FROM settings WHERE user_id = ?', [userId]);

    if (existing) {
      await dbRun(
        `UPDATE settings SET language = ?, currency_symbol = ?, invoice_prefix = ?, default_tax_rate = ?, monthly_income_goal = ? WHERE user_id = ?`,
        [language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal, userId]
      );
    } else {
      await dbRun(
        `INSERT INTO settings (user_id, language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal]
      );
    }

    res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving settings.' });
  }
};
