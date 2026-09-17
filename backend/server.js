import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads
const uploadDir = path.resolve(process.cwd(), 'backend', 'uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Simple backend/database health check for local development and deployment debugging.
app.get('/api/health', async (req, res) => {
  try {
    const { dbGet } = await import('./config/db.js');
    const [clients, projects, tasks, invoices, expenses, notifications] = await Promise.all([
      dbGet('SELECT COUNT(*) AS count FROM clients WHERE user_id = 1'),
      dbGet('SELECT COUNT(*) AS count FROM projects WHERE user_id = 1'),
      dbGet('SELECT COUNT(*) AS count FROM tasks WHERE user_id = 1'),
      dbGet('SELECT COUNT(*) AS count FROM invoices WHERE user_id = 1'),
      dbGet('SELECT COUNT(*) AS count FROM expenses WHERE user_id = 1'),
      dbGet('SELECT COUNT(*) AS count FROM notifications WHERE user_id = 1')
    ]);
    res.json({ success: true, database: 'SQLite connected', counts: {
      clients: clients.count, projects: projects.count, tasks: tasks.count,
      invoices: invoices.count, expenses: expenses.count, notifications: notifications.count
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database health check failed', error: error.message });
  }
});

// Serve Frontend static files
const frontendDir = path.resolve(process.cwd(), 'frontend');
app.use(express.static(frontendDir));

// Route handlers for HTML pages
app.get('/login', (req, res) => res.sendFile(path.join(frontendDir, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(frontendDir, 'signup.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(frontendDir, 'forgot-password.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(frontendDir, 'dashboard.html')));
app.get('/projects', (req, res) => res.sendFile(path.join(frontendDir, 'projects.html')));
app.get('/project-details', (req, res) => res.sendFile(path.join(frontendDir, 'project-details.html')));
app.get('/clients', (req, res) => res.sendFile(path.join(frontendDir, 'clients.html')));
app.get('/client-details', (req, res) => res.sendFile(path.join(frontendDir, 'client-details.html')));
app.get('/tasks', (req, res) => res.sendFile(path.join(frontendDir, 'tasks.html')));
app.get('/calendar', (req, res) => res.sendFile(path.join(frontendDir, 'calendar.html')));
app.get('/expenses', (req, res) => res.sendFile(path.join(frontendDir, 'expenses.html')));
app.get('/invoices', (req, res) => res.sendFile(path.join(frontendDir, 'invoices.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(frontendDir, 'reports.html')));
app.get('/notifications', (req, res) => res.sendFile(path.join(frontendDir, 'notifications.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(frontendDir, 'profile.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(frontendDir, 'settings.html')));

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start Server & Init DB
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FreelanceHub Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
