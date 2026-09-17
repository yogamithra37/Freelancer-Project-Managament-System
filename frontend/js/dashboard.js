/* ========================================================
   FreelanceHub Dashboard Controller
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('dashboard');
  loadDashboardData();
});

async function loadDashboardData() {
  const data = await apiRequest('/dashboard/stats');
  if (!data.success) {
    showToast('Failed to load dashboard data.', 'danger');
    return;
  }

  const {
    stats = {},
    today_tasks = [],
    upcoming_deadlines = [],
    recent_activities = [],
    charts = {}
  } = data;

  // Stat cards
  if (document.getElementById('statTotalProjects')) document.getElementById('statTotalProjects').innerText = stats.total_projects ?? 0;
  if (document.getElementById('statActiveProjects')) document.getElementById('statActiveProjects').innerText = stats.active_projects ?? 0;
  if (document.getElementById('statTotalClients')) document.getElementById('statTotalClients').innerText = stats.total_clients ?? 0;
  if (document.getElementById('statTotalRevenue')) document.getElementById('statTotalRevenue').innerText = formatINR(stats.total_revenue || 0);
  if (document.getElementById('statTotalExpenses')) document.getElementById('statTotalExpenses').innerText = formatINR(stats.total_expenses || 0);
  if (document.getElementById('statNetProfit')) document.getElementById('statNetProfit').innerText = formatINR(stats.net_profit || 0);
  if (document.getElementById('statPendingPayments')) document.getElementById('statPendingPayments').innerText = formatINR(stats.pending_payments || 0);

  // Productivity Score
  if (document.getElementById('productivityScoreVal')) document.getElementById('productivityScoreVal').innerText = `${stats.productivity_score || 0}/100`;
  if (document.getElementById('productivityScoreBar')) document.getElementById('productivityScoreBar').style.width = `${stats.productivity_score || 0}%`;

  // Monthly Goal
  if (document.getElementById('monthlyGoalVal')) document.getElementById('monthlyGoalVal').innerText = formatINR(stats.monthly_goal || 0);
  if (document.getElementById('monthlyGoalProgressVal')) document.getElementById('monthlyGoalProgressVal').innerText = `${stats.monthly_progress || 0}%`;
  if (document.getElementById('monthlyGoalBar')) document.getElementById('monthlyGoalBar').style.width = `${stats.monthly_progress || 0}%`;

  // Project Health Breakdown
  if (stats.project_health) {
    if (document.getElementById('healthHealthyCount')) document.getElementById('healthHealthyCount').innerText = stats.project_health.healthy ?? 0;
    if (document.getElementById('healthAtRiskCount')) document.getElementById('healthAtRiskCount').innerText = stats.project_health.atRisk ?? 0;
    if (document.getElementById('healthDelayedCount')) document.getElementById('healthDelayedCount').innerText = stats.project_health.delayed ?? 0;
  }

  // Today's Tasks
  const todayTasksContainer = document.getElementById('todayTasksList');
  if (todayTasksContainer) {
    if (!today_tasks || today_tasks.length === 0) {
      todayTasksContainer.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-title">No tasks due today</div></div>`;
    } else {
      todayTasksContainer.innerHTML = today_tasks.map(t => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-color);">
          <div>
            <div style="font-weight:600; font-size:14px; color:var(--text-main);">${t.title}</div>
            <div style="font-size:12px; color:var(--text-muted);">${t.project_name || 'General'} • Due: ${formatDate(t.due_date)}</div>
          </div>
          <span class="badge ${t.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${t.status}</span>
        </div>
      `).join('');
    }
  }

  // Upcoming Deadlines
  const deadlinesContainer = document.getElementById('upcomingDeadlinesList');
  if (deadlinesContainer) {
    if (!upcoming_deadlines || upcoming_deadlines.length === 0) {
      deadlinesContainer.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-title">No upcoming deadlines</div></div>`;
    } else {
      deadlinesContainer.innerHTML = upcoming_deadlines.map(d => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-color);">
          <div>
            <div style="font-weight:600; font-size:14px; color:var(--text-main);">${d.title}</div>
            <div style="font-size:12px; color:var(--text-muted);">${d.type} • Deadline: ${formatDate(d.due_date)}</div>
          </div>
          <span class="badge ${d.priority === 'Urgent' ? 'badge-danger' : 'badge-info'}">${d.priority}</span>
        </div>
      `).join('');
    }
  }

  // Recent Activities
  const activityContainer = document.getElementById('recentActivityList');
  if (activityContainer) {
    if (!recent_activities || recent_activities.length === 0) {
      activityContainer.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-title">No recent activity</div></div>`;
    } else {
      activityContainer.innerHTML = recent_activities.map(a => `
        <div style="display:flex; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-color);">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; flex-shrink:0;">
            •
          </div>
          <div>
            <div style="font-weight:600; font-size:13px; color:var(--text-main);">${a.title}</div>
            <div style="font-size:12px; color:var(--text-muted);">${a.description || ''}</div>
            <div style="font-size:10px; color:var(--text-light); margin-top:2px;">${formatDate(a.created_at)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Simple CSS/SVG Revenue Bar Chart
  renderRevenueChart(charts?.revenue || []);
  renderExpenseChart(charts?.expenses || []);
}

function renderRevenueChart(revenueData = []) {
  const chartEl = document.getElementById('revenueChartCanvas');
  if (!chartEl) return;

  if (revenueData.length === 0) {
    chartEl.innerHTML = `<div class="empty-state" style="padding:40px;"><div class="empty-title">No revenue data yet</div></div>`;
    return;
  }

  const maxVal = Math.max(...revenueData.map(r => r.revenue), 10000);

  chartEl.innerHTML = `
    <div style="display:flex; align-items:flex-end; gap:16px; height:200px; padding:20px 10px; justify-content:space-around;">
      ${revenueData.map(r => {
        const heightPct = Math.max(15, Math.round((r.revenue / maxVal) * 100));
        return `
          <div style="display:flex; flex-direction:column; align-items:center; flex:1; height:100%; justify-content:flex-end;">
            <div style="font-size:11px; font-weight:700; color:var(--primary); margin-bottom:6px;">${formatINR(r.revenue)}</div>
            <div style="width:100%; max-width:40px; background:linear-gradient(180deg, var(--primary), var(--secondary)); height:${heightPct}%; border-radius:6px 6px 0 0; transition:height 0.5s ease;"></div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:8px;">${r.month}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderExpenseChart(expenseData = []) {
  const chartEl = document.getElementById('expenseChartCanvas');
  if (!chartEl) return;

  if (expenseData.length === 0) {
    chartEl.innerHTML = `<div class="empty-state" style="padding:40px;"><div class="empty-title">No expenses logged</div></div>`;
    return;
  }

  const total = expenseData.reduce((sum, e) => sum + e.total, 0);

  chartEl.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; padding:10px 0;">
      ${expenseData.map(e => {
        const pct = total > 0 ? Math.round((e.total / total) * 100) : 0;
        return `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:4px;">
              <span>${e.category}</span>
              <span>${formatINR(e.total)} (${pct}%)</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar warning" style="width:${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
