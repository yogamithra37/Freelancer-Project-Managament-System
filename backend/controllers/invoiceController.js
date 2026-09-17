import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const getInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, client_id } = req.query;

    let sql = `
      SELECT i.*, COALESCE(c.name, 'Unassigned Client') as client_name, COALESCE(c.company, 'Individual') as client_company, COALESCE(p.name, 'General Project') as project_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (client_id) {
      sql += ` AND i.client_id = ?`;
      params.push(client_id);
    }

    if (search) {
      sql += ` AND (i.invoice_number LIKE ? OR c.name LIKE ? OR c.company LIKE ? OR p.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY i.issue_date DESC`;

    const invoices = await dbQuery(sql, params);

    // Totals
    const paidRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Paid'", [userId]);
    const pendingRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Pending'", [userId]);
    const overdueRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Overdue'", [userId]);

    res.json({
      success: true,
      invoices,
      stats: {
        paid_amount: paidRow.total,
        pending_amount: pendingRow.total,
        overdue_amount: overdueRow.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    const invoice = await dbGet(
      `SELECT i.*, COALESCE(c.name, 'Unassigned Client') as client_name, COALESCE(c.company, 'Individual') as client_company, c.email as client_email, c.phone as client_phone, c.address as client_address, c.city as client_city, c.state as client_state, c.gstin as client_gstin, COALESCE(p.name, 'General Project') as project_name
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       LEFT JOIN projects p ON i.project_id = p.id
       WHERE i.id = ? AND i.user_id = ?`,
      [invoiceId, userId]
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const items = await dbQuery('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    const userProfile = await dbGet('SELECT full_name, email, phone, location FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      invoice,
      items,
      freelancer: userProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving invoice details.' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { client_id, project_id, invoice_number, issue_date, due_date, subtotal, tax_rate, items, notes, status } = req.body;

    if (!client_id || !project_id || !issue_date || !due_date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Client, Project, Dates, and Line Items are required.' });
    }

    const taxRate = tax_rate !== undefined ? parseFloat(tax_rate) : 18.0;
    const calculatedSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxAmount = (calculatedSubtotal * taxRate) / 100;
    const totalAmount = calculatedSubtotal + taxAmount;

    // Generate unique invoice number if not provided
    let invNum = invoice_number;
    if (!invNum) {
      const settings = await dbGet('SELECT invoice_prefix FROM settings WHERE user_id = ?', [userId]);
      const prefix = settings ? settings.invoice_prefix : 'INV';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      invNum = `${prefix}-${new Date().getFullYear()}-${randomNum}`;
    }

    const result = await dbRun(
      `INSERT INTO invoices (user_id, client_id, project_id, invoice_number, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, client_id, project_id, invNum, issue_date, due_date, calculatedSubtotal, taxRate, taxAmount, totalAmount, status || 'Pending', notes || '']
    );

    const invoiceId = result.lastID;

    // Insert Items
    for (const item of items) {
      await dbRun(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity || 1, item.unit_price, item.amount]
      );
    }

    // Notification
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'New Invoice Created', `Invoice ${invNum} created for ₹${totalAmount.toLocaleString('en-IN')}.`, 'info']
    );

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully!',
      invoice_id: invoiceId
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ success: false, message: 'Error creating invoice.' });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;
    const { status } = req.body;

    const inv = await dbGet('SELECT * FROM invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    await dbRun(
      `UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [status, invoiceId, userId]
    );

    if (status === 'Paid') {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [userId, 'Invoice Marked as Paid', `Invoice ${inv.invoice_number} was marked as Paid.`, 'success']
      );
    }

    res.json({ success: true, message: 'Invoice status updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating invoice status.' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    await dbRun('DELETE FROM invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

    res.json({ success: true, message: 'Invoice deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting invoice.' });
  }
};
