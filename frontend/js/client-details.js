/* ========================================================
   FreelanceHub Client Details View Controller
   ======================================================== */

let currentClientId = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('clients');

  const urlParams = new URLSearchParams(window.location.search);
  currentClientId = urlParams.get('id');

  if (!currentClientId) {
    showToast('Invalid Client ID', 'danger');
    setTimeout(() => window.location.href = '/clients.html', 1000);
    return;
  }

  loadClientDetails();
});

async function loadClientDetails() {
  const data = await apiRequest(`/clients/${currentClientId}`);
  if (!data.success) {
    showToast('Failed to load client details', 'danger');
    return;
  }

  const { client = {}, projects = [], invoices = [], tasks = [], stats = {} } = data;

  // Header & Info
  if (document.getElementById('cdName')) document.getElementById('cdName').innerText = client.name || 'Client Details';
  if (document.getElementById('cdCompany')) document.getElementById('cdCompany').innerText = client.company || '';
  if (document.getElementById('cdEmail')) document.getElementById('cdEmail').innerText = client.email || 'N/A';
  if (document.getElementById('cdPhone')) document.getElementById('cdPhone').innerText = client.phone || 'N/A';
  if (document.getElementById('cdAddress')) document.getElementById('cdAddress').innerText = `${client.address ? client.address + ', ' : ''}${client.city || ''}, ${client.state || ''}, ${client.country || 'India'}`;
  if (document.getElementById('cdGSTIN')) document.getElementById('cdGSTIN').innerText = client.gstin || 'Not Provided';
  if (document.getElementById('cdNotes')) document.getElementById('cdNotes').innerText = client.notes || 'No notes added.';

  // Stats
  if (document.getElementById('cdTotalProjects')) document.getElementById('cdTotalProjects').innerText = stats.total_projects ?? projects.length;
  if (document.getElementById('cdTotalRevenue')) document.getElementById('cdTotalRevenue').innerText = formatINR(stats.total_revenue || 0);
  if (document.getElementById('cdOutstanding')) document.getElementById('cdOutstanding').innerText = formatINR(stats.outstanding_amount || 0);

  // Render Projects
  const projectListEl = document.getElementById('cdProjectsList');
  if (projectListEl) {
    if (projects.length === 0) {
      projectListEl.innerHTML = `<tr><td colspan="5" class="empty-state">No projects associated with this client.</td></tr>`;
    } else {
      projectListEl.innerHTML = projects.map(p => `
        <tr>
          <td><strong><a href="/project-details.html?id=${p.id}" style="color:var(--text-main); text-decoration:none;">${p.name}</a></strong></td>
          <td><span class="badge badge-info">${p.category || 'Web'}</span></td>
          <td><strong>${formatINR(p.budget)}</strong></td>
          <td>${p.progress}%</td>
          <td><span class="badge ${p.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${p.status}</span></td>
        </tr>
      `).join('');
    }
  }

  // Render Invoices
  const invoiceListEl = document.getElementById('cdInvoicesList');
  if (invoiceListEl) {
    if (invoices.length === 0) {
      invoiceListEl.innerHTML = `<tr><td colspan="4" class="empty-state">No invoices issued to this client yet.</td></tr>`;
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

  // Render Tasks
  const taskListEl = document.getElementById('cdTasksList');
  if (taskListEl) {
    if (tasks.length === 0) {
      taskListEl.innerHTML = `<tr><td colspan="4" class="empty-state">No tasks assigned for this client.</td></tr>`;
    } else {
      taskListEl.innerHTML = tasks.map(t => `
        <tr>
          <td><strong>${t.title}</strong></td>
          <td><span class="badge ${t.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${t.status}</span></td>
          <td><span class="badge badge-secondary">${t.priority}</span></td>
          <td>${formatDate(t.due_date)}</td>
        </tr>
      `).join('');
    }
  }
}
