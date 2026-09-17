import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, status, priority, project_id } = req.query;

    let sql = `
      SELECT t.*, COALESCE(p.name, 'General Project') as project_name, c.name as client_name, c.company as client_company
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR p.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (priority) {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (project_id) {
      sql += ` AND t.project_id = ?`;
      params.push(project_id);
    }

    sql += ` ORDER BY t.due_date ASC`;

    const tasks = await dbQuery(sql, params);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, title, description, assigned_to, priority, status, progress, start_date, due_date } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ success: false, message: 'Project and Task Title are required.' });
    }

    // Get client_id from project
    const proj = await dbGet('SELECT client_id FROM projects WHERE id = ?', [project_id]);
    const clientId = proj ? proj.client_id : null;

    const result = await dbRun(
      `INSERT INTO tasks (user_id, project_id, client_id, title, description, assigned_to, priority, status, progress, start_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, project_id, clientId, title, description || '', assigned_to || 'Self', priority || 'Medium', status || 'To Do', progress || 0, start_date || null, due_date || null]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task_id: result.lastID
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating task.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { project_id, title, description, assigned_to, priority, status, progress, start_date, due_date } = req.body;

    const proj = await dbGet('SELECT client_id FROM projects WHERE id = ?', [project_id]);
    const clientId = proj ? proj.client_id : null;

    await dbRun(
      `UPDATE tasks SET project_id = ?, client_id = ?, title = ?, description = ?, assigned_to = ?, priority = ?, status = ?, progress = ?, start_date = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [project_id, clientId, title, description, assigned_to, priority, status, progress, start_date, due_date, taskId, userId]
    );

    res.json({ success: true, message: 'Task updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task.' });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { status, progress } = req.body;

    let newProgress = progress;
    if (newProgress === undefined) {
      if (status === 'Completed') newProgress = 100;
      else if (status === 'In Progress') newProgress = 50;
      else if (status === 'To Do') newProgress = 0;
    }

    await dbRun(
      `UPDATE tasks SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [status, newProgress !== undefined ? newProgress : 0, taskId, userId]
    );

    res.json({ success: true, message: 'Task status updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task status.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    await dbRun('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);

    res.json({ success: true, message: 'Task deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting task.' });
  }
};
