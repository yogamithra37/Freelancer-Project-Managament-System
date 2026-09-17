import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, project_id, search } = req.query;

    let sql = `
      SELECT e.*, p.name as project_name, c.company as client_company
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (category) {
      sql += ` AND e.category = ?`;
      params.push(category);
    }

    if (project_id) {
      sql += ` AND e.project_id = ?`;
      params.push(project_id);
    }

    if (search) {
      sql += ` AND (e.description LIKE ? OR e.category LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term);
    }

    sql += ` ORDER BY e.expense_date DESC`;

    const expenses = await dbQuery(sql, params);

    const totalExpenseRow = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      expenses,
      summary: {
        total_expenses: totalExpenseRow.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
  }
};

export const createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, category, description, amount, expense_date, payment_method, notes } = req.body;

    if (!category || !description || !amount || !expense_date) {
      return res.status(400).json({ success: false, message: 'Category, description, amount, and date are required.' });
    }

    const result = await dbRun(
      `INSERT INTO expenses (user_id, project_id, category, description, amount, expense_date, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, project_id || null, category, description, amount, expense_date, payment_method || 'UPI', notes || '']
    );

    res.status(201).json({
      success: true,
      message: 'Expense created successfully!',
      expense_id: result.lastID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating expense.' });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const { project_id, category, description, amount, expense_date, payment_method, notes } = req.body;

    await dbRun(
      `UPDATE expenses SET project_id = ?, category = ?, description = ?, amount = ?, expense_date = ?, payment_method = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [project_id || null, category, description, amount, expense_date, payment_method, notes, expenseId, userId]
    );

    res.json({ success: true, message: 'Expense updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating expense.' });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    await dbRun('DELETE FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);

    res.json({ success: true, message: 'Expense deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting expense.' });
  }
};
