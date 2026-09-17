/* ========================================================
   FreelanceHub Project Details View Controller
   ======================================================== */

let currentProjectId = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('projects');

  const urlParams = new URLSearchParams(window.location.search);
  currentProjectId = urlParams.get('id');

  if (!currentProjectId) {
    showToast('Invalid Project ID', 'danger');
    setTimeout(() => window.location.href = '/projects.html', 1000);
    return;
  }

  loadProjectDetails();
});

async function loadProjectDetails() {
  const data = await apiRequest(`/projects/${currentProjectId}`);
  if (!data.success) {
    showToast('Failed to load project details', 'danger');
    return;
  }

  const { project = {}, tasks = [], expenses = [], invoices = [], files = [] } = data;

  // Header & Info
  if (document.getElementById('pdName')) document.getElementById('pdName').innerText = project.name || 'Project Details';
  if (document.getElementById('pdClientName')) document.getElementById('pdClientName').innerText = `${project.client_name || 'Client'} (${project.client_company || 'Individual'})`;
  if (document.getElementById('pdCategory')) document.getElementById('pdCategory').innerText = project.category || 'Web Development';
  if (document.getElementById('pdHealth')) document.getElementById('pdHealth').innerHTML = project.health?.label || 'Healthy';
  if (document.getElementById('pdStatus')) document.getElementById('pdStatus').innerText = project.status || 'In Progress';
  if (document.getElementById('pdPriority')) document.getElementById('pdPriority').innerText = project.priority || 'Medium';
  if (document.getElementById('pdStartDate')) document.getElementById('pdStartDate').innerText = formatDate(project.start_date);
  if (document.getElementById('pdDeadline')) document.getElementById('pdDeadline').innerText = formatDate(project.deadline);
  if (document.getElementById('pdDescription')) document.getElementById('pdDescription').innerText = project.description || 'No description available.';

  // Budget
  if (document.getElementById('pdBudget')) document.getElementById('pdBudget').innerText = formatINR(project.budget || 0);
  if (document.getElementById('pdExpenses')) document.getElementById('pdExpenses').innerText = formatINR(project.total_expenses || 0);
  if (document.getElementById('pdRemaining')) document.getElementById('pdRemaining').innerText = formatINR(project.remaining_budget || 0);
  if (document.getElementById('pdProgressBar')) document.getElementById('pdProgressBar').style.width = `${project.progress || 0}%`;
  if (document.getElementById('pdProgressText')) document.getElementById('pdProgressText').innerText = `${project.progress || 0}% Complete`;

  // Render Tasks
  const taskListEl = document.getElementById('pdTasksList');
  if (taskListEl) {
    if (tasks.length === 0) {
      taskListEl.innerHTML = `<tr><td colspan="5" class="empty-state">No tasks created for this project yet.</td></tr>`;
    } else {
      taskListEl.innerHTML = tasks.map(t => `
        <tr>
          <td><strong>${t.title}</strong></td>
          <td><span class="badge badge-info">${t.assigned_to || 'Self'}</span></td>
          <td><span class="badge ${t.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${t.status}</span></td>
          <td>${formatDate(t.due_date)}</td>
          <td>${t.progress}%</td>
        </tr>
      `).join('');
    }
  }

  // Render Expenses
  const expenseListEl = document.getElementById('pdExpensesList');
  if (expenseListEl) {
    if (expenses.length === 0) {
      expenseListEl.innerHTML = `<tr><td colspan="4" class="empty-state">No expenses logged for this project.</td></tr>`;
    } else {
      expenseListEl.innerHTML = expenses.map(e => `
        <tr>
          <td>${e.description}</td>
          <td><span class="badge badge-secondary">${e.category}</span></td>
          <td><strong>${formatINR(e.amount)}</strong></td>
          <td>${formatDate(e.expense_date)}</td>
        </tr>
      `).join('');
    }
  }

  // Render Invoices
  const invoiceListEl = document.getElementById('pdInvoicesList');
  if (invoiceListEl) {
    if (invoices.length === 0) {
      invoiceListEl.innerHTML = `<tr><td colspan="4" class="empty-state">No invoices generated for this project.</td></tr>`;
    } else {
      invoiceListEl.innerHTML = invoices.map(i => `
        <tr>
          <td><strong>${i.invoice_number}</strong></td>
          <td>${formatDate(i.issue_date)}</td>
          <td><strong>${formatINR(i.total_amount)}</strong></td>
          <td><span class="badge ${i.status === 'Paid' ? 'badge-success' : 'badge-danger'}">${i.status}</span></td>
        </tr>
      `).join('');
    }
  }

  // Render Files
  const filesListEl = document.getElementById('pdFilesList');
  if (filesListEl) {
    if (files.length === 0) {
      filesListEl.innerHTML = `<div class="empty-state" style="padding:20px;">No files uploaded for this project.</div>`;
    } else {
      filesListEl.innerHTML = files.map(f => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:8px;">
          <div>
            <div style="font-weight:600; font-size:13px;">${f.original_name}</div>
            <div style="font-size:11px; color:var(--text-muted);">${(f.file_size / 1024).toFixed(1)} KB • ${formatDate(f.created_at)}</div>
          </div>
          <a href="${f.file_path}" target="_blank" class="btn btn-secondary btn-sm">Download</a>
        </div>
      `).join('');
    }
  }
}
