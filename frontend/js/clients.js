/* ========================================================
   FreelanceHub Clients Management JS
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('clients');
  loadClients();

  document.getElementById('clientSearch')?.addEventListener('input', debounce(loadClients, 300));
  document.getElementById('clientCityFilter')?.addEventListener('change', loadClients);
  document.getElementById('clientForm')?.addEventListener('submit', handleClientSave);
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    setTimeout(later, wait);
  };
}

async function loadClients() {
  const search = document.getElementById('clientSearch')?.value || '';
  const city = document.getElementById('clientCityFilter')?.value || '';

  const query = new URLSearchParams({ search, city }).toString();
  const data = await apiRequest(`/clients?${query}`);

  if (!data.success) {
    showToast('Failed to load clients', 'danger');
    return;
  }

  renderClientsList(data.clients || []);
}

function renderClientsList(clients) {
  const container = document.getElementById('clientsContainer');
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">👥</div>
        <div class="empty-title">No clients found</div>
        <div class="empty-desc">Add clients to associate projects, generate GST invoices, and track revenue.</div>
        <button class="btn btn-primary" onclick="openClientModal()">+ Add Client</button>
      </div>
    `;
    return;
  }

  container.innerHTML = clients.map(c => `
    <div class="panel" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <div style="width:44px; height:44px; border-radius:50%; background:var(--primary-light); color:var(--primary); font-weight:800; font-size:18px; display:flex; align-items:center; justify-content:center;">
            ${c.name.charAt(0)}
          </div>
          <div>
            <h3 style="font-size:16px; font-weight:800; margin:0;">
              <a href="/client-details.html?id=${c.id}" style="color:var(--text-main); text-decoration:none;">${c.name}</a>
            </h3>
            <div style="font-size:13px; color:var(--text-muted);">${c.company}</div>
          </div>
        </div>

        <div style="font-size:13px; color:var(--text-muted); display:flex; flex-direction:column; gap:6px; margin-bottom:16px;">
          <div>📧 ${c.email}</div>
          <div>📞 ${c.phone || 'N/A'}</div>
          <div>📍 ${c.city}, ${c.state}</div>
          ${c.gstin ? `<div style="font-size:11px; font-family:monospace; background:var(--light-bg); padding:2px 6px; border-radius:4px; width:fit-content;">GSTIN: ${c.gstin}</div>` : ''}
        </div>

        <!-- Revenue Stats -->
        <div style="display:flex; justify-content:space-between; background:var(--light-bg); padding:10px 12px; border-radius:var(--radius-md); font-size:12px; margin-bottom:16px;">
          <div>
            <div style="color:var(--text-muted);">Projects</div>
            <div style="font-weight:700; color:var(--text-main);">${c.total_projects}</div>
          </div>
          <div>
            <div style="color:var(--text-muted);">Paid Revenue</div>
            <div style="font-weight:700; color:var(--success);">${formatINR(c.total_revenue)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted);">Outstanding</div>
            <div style="font-weight:700; color:var(--danger);">${formatINR(c.outstanding_amount)}</div>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
        <a href="/client-details.html?id=${c.id}" class="btn btn-secondary btn-sm">View</a>
        <button class="btn btn-secondary btn-sm" onclick="editClient(${c.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteClient(${c.id}, '${escapeJs(c.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function escapeJs(str) {
  return str.replace(/'/g, "\\'");
}

function openClientModal(client = null) {
  const modal = document.getElementById('clientModal');
  const form = document.getElementById('clientForm');
  if (!modal || !form) return;

  form.reset();
  if (client) {
    document.getElementById('modalClientTitle').innerText = 'Edit Client';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientCompany').value = client.company;
    document.getElementById('clientEmail').value = client.email;
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientAddress').value = client.address || '';
    document.getElementById('clientCity').value = client.city || 'Coimbatore';
    document.getElementById('clientState').value = client.state || 'Tamil Nadu';
    document.getElementById('clientCountry').value = client.country || 'India';
    document.getElementById('clientGSTIN').value = client.gstin || '';
    document.getElementById('clientNotes').value = client.notes || '';
  } else {
    document.getElementById('modalClientTitle').innerText = 'Add New Client';
    document.getElementById('clientId').value = '';
  }

  modal.classList.add('active');
}

function closeClientModal() {
  document.getElementById('clientModal')?.classList.remove('active');
}

async function handleClientSave(e) {
  e.preventDefault();
  const id = document.getElementById('clientId').value;

  const payload = {
    name: document.getElementById('clientName').value.trim(),
    company: document.getElementById('clientCompany').value.trim(),
    email: document.getElementById('clientEmail').value.trim(),
    phone: document.getElementById('clientPhone').value.trim(),
    address: document.getElementById('clientAddress').value.trim(),
    city: document.getElementById('clientCity').value.trim(),
    state: document.getElementById('clientState').value.trim(),
    country: document.getElementById('clientCountry').value.trim(),
    gstin: document.getElementById('clientGSTIN').value.trim(),
    notes: document.getElementById('clientNotes').value.trim()
  };

  const endpoint = id ? `/clients/${id}` : '/clients';
  const method = id ? 'PUT' : 'POST';

  const res = await apiRequest(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  if (res.success) {
    showToast(res.message || 'Client saved!', 'success');
    closeClientModal();
    loadClients();
  } else {
    showToast(res.message || 'Error saving client', 'danger');
  }
}

async function editClient(id) {
  const data = await apiRequest(`/clients/${id}`);
  if (data.success && data.client) {
    openClientModal(data.client);
  }
}

function confirmDeleteClient(id, name) {
  showConfirmModal('Delete Client', `Are you sure you want to delete client "${name}"? This will delete associated projects and invoices.`, async () => {
    const res = await apiRequest(`/clients/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Client deleted successfully.', 'success');
      loadClients();
    } else {
      showToast(res.message || 'Failed to delete client.', 'danger');
    }
  });
}
