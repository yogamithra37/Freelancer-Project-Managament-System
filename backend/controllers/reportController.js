import { dbQuery, dbGet } from '../config/db.js';

export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year = '2026' } = req.query;

    // 1. Monthly Financial P&L Summary
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const financialSummary = [];
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      const monthStr = `${year}-${m}`;

      const revRow = await dbGet(
        `SELECT COALESCE(SUM(total_amount), 0) as rev FROM invoices WHERE user_id = ? AND status = 'Paid' AND strftime('%Y-%m', issue_date) = ?`,
        [userId, monthStr]
      );
      const expRow = await dbGet(
        `SELECT COALESCE(SUM(amount), 0) as exp FROM expenses WHERE user_id = ? AND strftime('%Y-%m', expense_date) = ?`,
        [userId, monthStr]
      );

      const revenue = revRow ? revRow.rev : 0;
      const expenses = expRow ? expRow.exp : 0;
      const profit = revenue - expenses;

      if (revenue > 0 || expenses > 0) {
        financialSummary.push({
          month: `${monthNames[i]} ${year}`,
          revenue,
          expenses,
          profit
        });
      }
    }

    // 2. Client Revenue Breakdown
    const clientRevenue = await dbQuery(
      `SELECT c.id, c.name as client_name, c.company,
         (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND user_id = ?) as total_projects,
         (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND user_id = ? AND status = 'Completed') as completed_projects,
         (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE client_id = c.id AND user_id = ? AND status = 'Paid') as paid_revenue,
         (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE client_id = c.id AND user_id = ? AND status IN ('Pending', 'Overdue')) as outstanding_revenue
       FROM clients c
       WHERE c.user_id = ?
       ORDER BY paid_revenue DESC`,
      [userId, userId, userId, userId, userId]
    );

    // 3. Project Profitability Margins
    const projects = await dbQuery(
      `SELECT p.id, p.name as project_name, p.budget,
         (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE project_id = p.id AND user_id = ?) as expenses
       FROM projects p
       WHERE p.user_id = ?`,
      [userId, userId]
    );

    const projectProfitability = projects.map(p => {
      const net_profit = p.budget - p.expenses;
      const margin = p.budget > 0 ? Math.round((net_profit / p.budget) * 100) : 0;
      return {
        project_name: p.project_name,
        budget: p.budget,
        expenses: p.expenses,
        net_profit,
        margin
      };
    });

    res.json({
      success: true,
      financial_summary: financialSummary,
      client_revenue: clientRevenue,
      project_profitability: projectProfitability
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

