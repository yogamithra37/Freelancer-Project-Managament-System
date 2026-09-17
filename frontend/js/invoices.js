/* ========================================================
   FreelanceHub Invoices Management JS
   ======================================================== */

let clientsList = [];
let projectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('invoices');
  await loadDropdowns();
  await loadInvoices();

  document.getElementById('invoiceSearch')?.addEventListener('input', debounce(loadInvoices, 300));
  document.getElementById('invoiceStatusFilter')?.addEventListener('change', loadInvoices);
  document.getElementById('invoiceForm')?.addEventListener('submit', handleInvoiceSave);
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

async function loadDropdowns() {
  const cData = await apiRequest('/clients');
  if (cData.success) {
    clientsList = cData.clients || [];
    const clientSelect = document.getElementById('invClientSelect');
    if (clientSelect) {
      clientSelect.innerHTML = `<option value="">Select Client *</option>` +
        clientsList.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('');
    }
  }

  const pData = await apiRequest('/projects');
  if (pData.success) {
    projectsList = pData.projects || [];
    const projectSelect = document.getElementById('invProjectSelect');
    if (projectSelect) {
      projectSelect.innerHTML = `<option value="">Select Project *</option>` +
        projectsList.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  }
}

async function loadInvoices() {
  const search = document.getElementById('invoiceSearch')?.value || '';
  const status = document.getElementById('invoiceStatusFilter')?.value || '';
  const query = new URLSearchParams({ search, status }).toString();
  const data = await apiRequest(`/invoices?${query}`);

  if (!data.success) {
    showToast('Failed to load invoices', 'danger');
    return;
  }

  document.getElementById('statPaidInvoices').innerText = formatINR(data.stats.paid_amount);
  document.getElementById('statPendingInvoices').innerText = formatINR(data.stats.pending_amount);
  document.getElementById('statOverdueInvoices').innerText = formatINR(data.stats.overdue_amount);

  renderInvoicesList(data.invoices || []);
}

function renderInvoicesList(invoices) {
  const container = document.getElementById('invoicesContainer');
  if (!container) return;

  if (invoices.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">🧾</div>
          <div class="empty-title">No invoices found</div>
          <button class="btn btn-primary" onclick="openInvoiceModal()" style="margin-top:12px;">+ Create Invoice</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = invoices.map(i => `
    <tr>
      <td><strong>${i.invoice_number}</strong></td>
      <td><strong>${i.client_company}</strong> (${i.client_name})</td>
      <td>${i.project_name}</td>
      <td>${formatDate(i.issue_date)}</td>
      <td><strong>${formatINR(i.total_amount)}</strong></td>
      <td><span class="badge ${i.status === 'Paid' ? 'badge-success' : i.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}">${i.status}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="viewInvoicePreview(${i.id})">Preview</button>
          ${i.status !== 'Paid' ? `<button class="btn btn-primary btn-sm" onclick="markInvoicePaid(${i.id})">Mark Paid</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteInvoice(${i.id}, '${escapeJs(i.invoice_number)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escapeJs(str) {
  return str.replace(/'/g, "\\'");
}

function openInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  const form = document.getElementById('invoiceForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('invIssueDate').value = new Date().toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  document.getElementById('invDueDate').value = dueDate.toISOString().split('T')[0];

  // Default single item row
  const itemsContainer = document.getElementById('invoiceItemsContainer');
  itemsContainer.innerHTML = `
    <div class="form-row invoice-item-row" style="margin-bottom:8px;">
      <input type="text" class="form-control item-desc" placeholder="Item / Service Description" required style="flex:2;">
      <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" oninput="recalculateInvoiceTotal()" style="flex:0.6;">
      <input type="number" class="form-control item-rate" placeholder="Rate (₹)" required oninput="recalculateInvoiceTotal()" style="flex:1;">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); recalculateInvoiceTotal();">X</button>
    </div>
  `;

  recalculateInvoiceTotal();
  modal.classList.add('active');
}

function addInvoiceItemRow() {
  const container = document.getElementById('invoiceItemsContainer');
  const row = document.createElement('div');
  row.className = 'form-row invoice-item-row';
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <input type="text" class="form-control item-desc" placeholder="Item / Service Description" required style="flex:2;">
    <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" oninput="recalculateInvoiceTotal()" style="flex:0.6;">
    <input type="number" class="form-control item-rate" placeholder="Rate (₹)" required oninput="recalculateInvoiceTotal()" style="flex:1;">
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); recalculateInvoiceTotal();">X</button>
  `;
  container.appendChild(row);
}

function recalculateInvoiceTotal() {
  let subtotal = 0;
  const rows = document.querySelectorAll('.invoice-item-row');
  rows.forEach(r => {
    const qty = parseFloat(r.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(r.querySelector('.item-rate').value) || 0;
    subtotal += qty * rate;
  });

  const taxRate = parseFloat(document.getElementById('invTaxRate').value) || 18;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  document.getElementById('invCalcSubtotal').innerText = formatINR(subtotal);
  document.getElementById('invCalcTax').innerText = formatINR(tax);
  document.getElementById('invCalcTotal').innerText = formatINR(total);
}

function closeInvoiceModal() {
  document.getElementById('invoiceModal')?.classList.remove('active');
}

async function handleInvoiceSave(e) {
  e.preventDefault();

  const itemRows = document.querySelectorAll('.invoice-item-row');
  const items = [];
  itemRows.forEach(r => {
    const desc = r.querySelector('.item-desc').value.trim();
    const qty = parseFloat(r.querySelector('.item-qty').value) || 1;
    const rate = parseFloat(r.querySelector('.item-rate').value) || 0;
    if (desc && rate > 0) {
      items.push({
        description: desc,
        quantity: qty,
        unit_price: rate,
        amount: qty * rate
      });
    }
  });

  if (items.length === 0) {
    showToast('Please add at least one item line.', 'danger');
    return;
  }

  const payload = {
    client_id: document.getElementById('invClientSelect').value,
    project_id: document.getElementById('invProjectSelect').value,
    invoice_number: document.getElementById('invNumberInput').value.trim(),
    issue_date: document.getElementById('invIssueDate').value,
    due_date: document.getElementById('invDueDate').value,
    tax_rate: document.getElementById('invTaxRate').value,
    notes: document.getElementById('invNotes').value.trim(),
    items
  };

  const res = await apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.success) {
    showToast('Invoice created successfully!', 'success');
    closeInvoiceModal();
    loadInvoices();
  } else {
    showToast(res.message || 'Error creating invoice', 'danger');
  }
}

async function markInvoicePaid(id) {
  const res = await apiRequest(`/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Paid' })
  });

  if (res.success) {
    showToast('Invoice marked as Paid!', 'success');
    loadInvoices();
  } else {
    showToast('Failed to update invoice status', 'danger');
  }
}

async function viewInvoicePreview(id) {
  const data = await apiRequest(`/invoices/${id}`);
  if (!data.success) {
    showToast('Failed to load invoice preview', 'danger');
    return;
  }

  const { invoice, items, freelancer } = data;
  const modal = document.getElementById('invoicePreviewModal');
  const previewBody = document.getElementById('invoicePreviewBody');

  if (!modal || !previewBody) return;

  previewBody.innerHTML = `
    <div style="background:#fff; color:#0f172a; padding:32px; font-family:sans-serif; border:1px solid #e2e8f0; border-radius:12px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px;">
        <div>
          <h2 style="font-size:24px; font-weight:800; color:var(--primary); margin:0;">${freelancer.full_name}</h2>
          <div style="font-size:13px; color:#64748b;">${freelancer.location}</div>
          <div style="font-size:13px; color:#64748b;">Email: ${freelancer.email} | Phone: ${freelancer.phone}</div>
        </div>
        <div style="text-align:right;">
          <h1 style="font-size:28px; font-weight:900; margin:0; color:#0f172a;">TAX INVOICE</h1>
          <div style="font-size:16px; font-weight:700; color:var(--primary); margin-top:4px;">${invoice.invoice_number}</div>
          <div style="font-size:12px; color:#64748b;">Status: <strong>${invoice.status.toUpperCase()}</strong></div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:24px; font-size:13px;">
        <div>
          <strong style="color:#64748b; text-transform:uppercase; font-size:11px;">Billed To:</strong>
          <div style="font-size:16px; font-weight:700; color:#0f172a; margin-top:4px;">${invoice.client_company}</div>
          <div>Attn: ${invoice.client_name}</div>
          <div>${invoice.client_address ? invoice.client_address + ', ' : ''}${invoice.client_city}, ${invoice.client_state}</div>
          ${invoice.client_gstin ? `<div><strong>GSTIN:</strong> ${invoice.client_gstin}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</div>
          <div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>
          <div><strong>Project:</strong> ${invoice.project_name}</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:14px;">
        <thead>
          <tr style="background:#0f172a; color:#fff;">
            <th style="padding:10px 14px; text-align:left;">Item Description</th>
            <th style="padding:10px 14px; text-align:center;">Qty</th>
            <th style="padding:10px 14px; text-align:right;">Rate</th>
            <th style="padding:10px 14px; text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:12px 14px;">${item.description}</td>
              <td style="padding:12px 14px; text-align:center;">${item.quantity}</td>
              <td style="padding:12px 14px; text-align:right;">${formatINR(item.unit_price)}</td>
              <td style="padding:12px 14px; text-align:right; font-weight:700;">${formatINR(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
        <div style="width:280px; font-size:14px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between;">
            <span>Subtotal:</span>
            <strong>${formatINR(invoice.subtotal)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>GST (${invoice.tax_rate}%):</span>
            <strong>${formatINR(invoice.tax_amount)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:800; border-top:2px solid #0f172a; padding-top:8px;">
            <span>Total Payable:</span>
            <span style="color:var(--primary);">${formatINR(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      <div style="border-top:1px solid #e2e8f0; padding-top:16px; font-size:12px; color:#64748b;">
        <strong>Payment Terms & Notes:</strong>
        <p>${invoice.notes || 'Thank you for your business. Please remit payment via UPI / Bank Transfer.'}</p>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeInvoicePreviewModal() {
  document.getElementById('invoicePreviewModal')?.classList.remove('active');
}

function confirmDeleteInvoice(id, invNum) {
  showConfirmModal('Delete Invoice', `Are you sure you want to delete invoice "${invNum}"?`, async () => {
    const res = await apiRequest(`/invoices/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Invoice deleted successfully.', 'success');
      loadInvoices();
    } else {
      showToast(res.message || 'Failed to delete invoice.', 'danger');
    }
  });
}
