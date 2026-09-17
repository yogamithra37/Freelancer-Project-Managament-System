import { dbQuery, dbGet } from '../config/db.js';
import { calculateProjectHealth } from './projectController.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total counts
    const projTotal = await dbGet('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId]);
    const projActive = await dbGet("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status IN ('In Progress', 'Planning')", [userId]);
    const projCompleted = await dbGet("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'Completed'", [userId]);
    const projPending = await dbGet("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status IN ('Planning', 'On Hold')", [userId]);

    const clientsTotal = await dbGet('SELECT COUNT(*) as count FROM clients WHERE user_id = ?', [userId]);

    const revRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Paid'", [userId]);
    const expRow = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?', [userId]);
    const pendingPayRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Pending'", [userId]);
    const overdueRow = await dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE user_id = ? AND status = 'Overdue'", [userId]);

    const totalRevenue = revRow ? revRow.total : 0;
    const totalExpenses = expRow ? expRow.total : 0;
    const netProfit = totalRevenue - totalExpenses;
    const pendingPayments = pendingPayRow ? pendingPayRow.total : 0;
    const overdueInvoices = overdueRow ? overdueRow.total : 0;

    // Productivity Score Calculation
    const taskTotalRow = await dbGet('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]);
    const taskCompletedRow = await dbGet("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'Completed'", [userId]);

    const totalTasks = taskTotalRow ? taskTotalRow.count : 0;
    const completedTasks = taskCompletedRow ? taskCompletedRow.count : 0;
    const taskRate = totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 40;

    const projectTotalCount = projTotal ? projTotal.count : 0;
    const projectCompletedCount = projCompleted ? projCompleted.count : 0;
    const projectRate = projectTotalCount > 0 ? (projectCompletedCount / projectTotalCount) * 40 : 30;

    const productivityScore = Math.min(100, Math.round(taskRate + projectRate + 10));

    // Settings for Monthly Goal
    const settings = await dbGet('SELECT monthly_income_goal FROM settings WHERE user_id = ?', [userId]);
    const monthlyGoal = settings ? settings.monthly_income_goal : 150000;
    const monthlyProgress = Math.min(100, Math.round((totalRevenue / monthlyGoal) * 100));

    // Today's Tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = await dbQuery(
      `SELECT t.*, COALESCE(p.name, 'General Project') as project_name 
       FROM tasks t 
       LEFT JOIN projects p ON t.project_id = p.id 
       WHERE t.user_id = ? AND (t.due_date = ? OR t.status != 'Completed')
       ORDER BY t.due_date ASC LIMIT 5`,
      [userId, todayStr]
    );

    // Upcoming Deadlines (Projects & Tasks)
    const upcomingDeadlines = await dbQuery(
      `SELECT 'Project' as type, name as title, deadline as due_date, status, priority, id 
       FROM projects WHERE user_id = ? AND status != 'Completed' AND deadline IS NOT NULL
       UNION ALL
       SELECT 'Task' as type, title, due_date, status, priority, id 
       FROM tasks WHERE user_id = ? AND status != 'Completed' AND due_date IS NOT NULL
       ORDER BY due_date ASC LIMIT 6`,
      [userId, userId]
    );

    // Project Health Breakdown
    const allProjects = await dbQuery('SELECT * FROM projects WHERE user_id = ?', [userId]);
    let healthCounts = { healthy: 0, atRisk: 0, delayed: 0 };

    for (const p of allProjects) {
      const pendingTaskRow = await dbGet("SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status != 'Completed'", [p.id]);
      const h = calculateProjectHealth(p, pendingTaskRow ? pendingTaskRow.count : 0);
      if (h.status === 'Healthy') healthCounts.healthy++;
      else if (h.status === 'At Risk') healthCounts.atRisk++;
      else if (h.status === 'Delayed') healthCounts.delayed++;
    }

    // Recent Activities
    const recentActivities = await dbQuery(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 6',
      [userId]
    );

    // Revenue Overview Chart Data (Monthly)
    const monthlyRevenue = await dbQuery(
      `SELECT strftime('%Y-%m', issue_date) as month, SUM(total_amount) as revenue
       FROM invoices
       WHERE user_id = ? AND status = 'Paid'
       GROUP BY month
       ORDER BY month ASC LIMIT 6`,
      [userId]
    );

    // Expense Overview Chart Data (by Category)
    const categoryExpenses = await dbQuery(
      `SELECT category, SUM(amount) as total
       FROM expenses
       WHERE user_id = ?
       GROUP BY category`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        total_projects: projectTotalCount,
        active_projects: projActive ? projActive.count : 0,
        completed_projects: projectCompletedCount,
        pending_projects: projPending ? projPending.count : 0,
        total_clients: clientsTotal ? clientsTotal.count : 0,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        pending_payments: pendingPayments,
        overdue_invoices: overdueInvoices,
        productivity_score: productivityScore,
        monthly_goal: monthlyGoal,
        monthly_progress: monthlyProgress,
        project_health: healthCounts
      },
      today_tasks: todayTasks,
      upcoming_deadlines: upcomingDeadlines,
      recent_activities: recentActivities,
      charts: {
        revenue: monthlyRevenue,
        expenses: categoryExpenses
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};
