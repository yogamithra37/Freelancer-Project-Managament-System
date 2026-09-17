/* ========================================================
   FreelanceHub Analytics & Reports Controller
   ======================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('reports');
  loadReports();

  document.getElementById('reportYearSelect')?.addEventListener('change', loadReports);
});

async function loadReports() {
  const year = document.getElementById('reportYearSelect')?.value || '2026';
  const data = await apiRequest(`/reports?year=${year}`);

  if (!data.success) {
    showToast('Failed to load reports', 'danger');
    return;
  }

  const { financial_summary = [], client_revenue = [], project_profitability = [] } = data;

  // Render Financial Table
  const finTable = document.getElementById('financialReportsTable');
  if (finTable) {
    finTable.innerHTML = financial_summary.map(f => `
      <tr>
        <td><strong>${f.month}</strong></td>
        <td style="color:var(--success); font-weight:700;">${formatINR(f.revenue)}</td>
        <td style="color:var(--danger); font-weight:700;">${formatINR(f.expenses)}</td>
        <td style="color:var(--primary); font-weight:800;">${formatINR(f.profit)}</td>
      </tr>
    `).join('');
  }

  // Render Client Breakdown
  const clientTable = document.getElementById('clientRevenueReportsTable');
  if (clientTable) {
    clientTable.innerHTML = client_revenue.map(c => `
      <tr>
        <td><strong>${c.company}</strong> (${c.client_name})</td>
        <td>${c.completed_projects} / ${c.total_projects}</td>
        <td style="color:var(--success); font-weight:700;">${formatINR(c.paid_revenue)}</td>
        <td style="color:var(--danger); font-weight:700;">${formatINR(c.outstanding_revenue)}</td>
      </tr>
    `).join('');
  }

  // Render Project Profitability
  const projTable = document.getElementById('projectProfitabilityReportsTable');
  if (projTable) {
    projTable.innerHTML = project_profitability.map(p => `
      <tr>
        <td><strong>${p.project_name}</strong></td>
        <td>${formatINR(p.budget)}</td>
        <td>${formatINR(p.expenses)}</td>
        <td style="color:${p.net_profit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:700;">
          ${formatINR(p.net_profit)} (${p.margin}%)
        </td>
      </tr>
    `).join('');
  }
}
