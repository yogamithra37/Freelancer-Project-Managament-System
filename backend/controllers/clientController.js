import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const getClients = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, city } = req.query;

    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as total_projects,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE client_id = c.id AND status = 'Paid') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE client_id = c.id AND status IN ('Pending', 'Overdue')) as outstanding_amount
      FROM clients c 
      WHERE c.user_id = ?
    `;
    const params = [userId];

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.city LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (city) {
      sql += ` AND c.city = ?`;
      params.push(city);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const clients = await dbQuery(sql, params);
    res.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clients.' });
  }
};

export const getClientById = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.params.id;

    const client = await dbGet('SELECT * FROM clients WHERE id = ? AND user_id = ?', [clientId, userId]);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const projects = await dbQuery('SELECT * FROM projects WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC', [clientId, userId]);
    const invoices = await dbQuery('SELECT * FROM invoices WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC', [clientId, userId]);
    const tasks = await dbQuery('SELECT * FROM tasks WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC', [clientId, userId]);

    const revRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE client_id = ? AND status = 'Paid'", [clientId]);
    const outRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE client_id = ? AND status IN ('Pending', 'Overdue')", [clientId]);

    res.json({
      success: true,
      client,
      projects,
      invoices,
      tasks,
      stats: {
        total_projects: projects.length,
        total_revenue: revRow.total,
        outstanding_amount: outRow.total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving client details.' });
  }
};

export const createClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, company, email, phone, address, city, state, country, gstin, notes } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({ success: false, message: 'Name, Company, and Email are required.' });
    }

    const result = await dbRun(
      `INSERT INTO clients (user_id, name, company, email, phone, address, city, state, country, gstin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, company, email, phone || '', address || '', city || 'Coimbatore', state || 'Tamil Nadu', country || 'India', gstin || '', notes || '']
    );

    // Create notification
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'New Client Added', `Client "${name}" from ${company} added successfully.`, 'info']
    );

    res.status(201).json({
      success: true,
      message: 'Client created successfully!',
      client_id: result.lastID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating client.' });
  }
};

export const updateClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.params.id;
    const { name, company, email, phone, address, city, state, country, gstin, notes } = req.body;

    await dbRun(
      `UPDATE clients SET name = ?, company = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, gstin = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, company, email, phone, address, city, state, country, gstin, notes, clientId, userId]
    );

    res.json({ success: true, message: 'Client updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating client.' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.params.id;

    await dbRun('DELETE FROM clients WHERE id = ? AND user_id = ?', [clientId, userId]);

    res.json({ success: true, message: 'Client deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting client.' });
  }
};
