import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const calculateProjectHealth = (project, pendingTasksCount = 0) => {
  if (project.status === 'Completed') return { status: 'Healthy', color: 'green', label: '🟢 Healthy' };
  if (project.status === 'Cancelled') return { status: 'At Risk', color: 'red', label: '🔴 Cancelled' };
  if (project.status === 'On Hold') return { status: 'At Risk', color: 'yellow', label: '🟡 On Hold' };

  if (!project.deadline) return { status: 'Healthy', color: 'green', label: '🟢 Healthy' };

  const today = new Date();
  const deadlineDate = new Date(project.deadline);
  const diffTime = deadlineDate - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0 && project.progress < 100) {
    return { status: 'Delayed', color: 'red', label: '🔴 Delayed' };
  } else if (daysRemaining <= 5 && project.progress < 70) {
    return { status: 'At Risk', color: 'yellow', label: '🟡 At Risk' };
  } else if (daysRemaining <= 2 && project.progress < 90) {
    return { status: 'At Risk', color: 'yellow', label: '🟡 At Risk' };
  }

  return { status: 'Healthy', color: 'green', label: '🟢 Healthy' };
};

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, status, priority, client_id } = req.query;

    let sql = `
      SELECT p.*, COALESCE(c.name, 'Unassigned Client') as client_name, COALESCE(c.company, 'Individual') as client_company,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE project_id = p.id) as total_expenses,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'Completed') as pending_tasks
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    if (search) {
      sql += ` AND (p.name LIKE ? OR c.name LIKE ? OR c.company LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    if (priority) {
      sql += ` AND p.priority = ?`;
      params.push(priority);
    }

    if (client_id) {
      sql += ` AND p.client_id = ?`;
      params.push(client_id);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const projects = await dbQuery(sql, params);

    const enrichedProjects = projects.map(p => {
      const remaining_budget = p.budget - p.total_expenses;
      const health = calculateProjectHealth(p, p.pending_tasks);
      return {
        ...p,
        remaining_budget,
        health
      };
    });

    res.json({ success: true, projects: enrichedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const project = await dbGet(
      `SELECT p.*, COALESCE(c.name, 'Unassigned Client') as client_name, COALESCE(c.company, 'Individual') as client_company, c.email as client_email, c.phone as client_phone
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = ? AND p.user_id = ?`,
      [projectId, userId]
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const tasks = await dbQuery('SELECT * FROM tasks WHERE project_id = ? AND user_id = ? ORDER BY due_date ASC', [projectId, userId]);
    const expenses = await dbQuery('SELECT * FROM expenses WHERE project_id = ? AND user_id = ? ORDER BY expense_date DESC', [projectId, userId]);
    const invoices = await dbQuery('SELECT * FROM invoices WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC', [projectId, userId]);
    const files = await dbQuery('SELECT * FROM files WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC', [projectId, userId]);

    const totalExpRow = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE project_id = ?', [projectId]);
    const totalExpenses = totalExpRow.total;
    const remainingBudget = project.budget - totalExpenses;

    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
    const health = calculateProjectHealth(project, pendingTasks);

    res.json({
      success: true,
      project: {
        ...project,
        total_expenses: totalExpenses,
        remaining_budget: remainingBudget,
        health
      },
      tasks,
      expenses,
      invoices,
      files
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching project details.' });
  }
};

export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { client_id, name, description, category, budget, start_date, deadline, priority, status, progress, notes } = req.body;

    if (!client_id || !name) {
      return res.status(400).json({ success: false, message: 'Client and Project Name are required.' });
    }

    const result = await dbRun(
      `INSERT INTO projects (user_id, client_id, name, description, category, budget, start_date, deadline, priority, status, progress, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, client_id, name, description || '', category || 'Web Development', budget || 0, start_date || null, deadline || null, priority || 'Medium', status || 'In Progress', progress || 0, notes || '']
    );

    // Notification & Activity
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'New Project Created', `Project "${name}" was created successfully.`, 'info']
    );

    await dbRun(
      `INSERT INTO activities (user_id, title, description, type) VALUES (?, ?, ?, ?)`,
      [userId, 'Created Project', `Added project "${name}".`, 'project']
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project_id: result.lastID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating project.' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { client_id, name, description, category, budget, start_date, deadline, priority, status, progress, notes } = req.body;

    await dbRun(
      `UPDATE projects SET client_id = ?, name = ?, description = ?, category = ?, budget = ?, start_date = ?, deadline = ?, priority = ?, status = ?, progress = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [client_id, name, description, category, budget, start_date, deadline, priority, status, progress, notes, projectId, userId]
    );

    res.json({ success: true, message: 'Project updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project.' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    await dbRun('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);

    res.json({ success: true, message: 'Project deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting project.' });
  }
};
