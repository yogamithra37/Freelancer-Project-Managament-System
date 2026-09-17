/* ========================================================
   FreelanceHub Expenses Management JS
   ======================================================== */

let projectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('expenses');
  await loadProjectsDropdown();
  await loadExpenses();

  document.getElementById('expenseSearch')?.addEventListener('input', debounce(loadExpenses, 300));
  document.getElementById('expenseCategoryFilter')?.addEventListener('change', loadExpenses);
  document.getElementById('expenseForm')?.addEventListener('submit', handleExpenseSave);
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

async function loadProjectsDropdown() {
  const data = await apiRequest('/projects');
  if (data.success) {
    projectsList = data.projects || [];
    const select = document.getElementById('expenseProjectSelect');
    if (select) {
      select.innerHTML = `<option value="">General Expense (No Project)</option>` +
        projectsList.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  }
}

async function loadExpenses() {
  const search = document.getElementById('expenseSearch')?.value || '';
  const category = document.getElementById('expenseCategoryFilter')?.value || '';
  const query = new URLSearchParams({ search, category }).toString();
  const data = await apiRequest(`/expenses?${query}`);

  if (!data.success) {
    showToast('Failed to load expenses', 'danger');
    return;
  }

  document.getElementById('totalExpenseSum').innerText = formatINR(data.summary.total_expenses);
  renderExpensesList(data.expenses || []);
}

function renderExpensesList(expenses) {
  const container = document.getElementById('expensesContainer');
  if (!container) return;

  if (expenses.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-icon">💸</div>
          <div class="empty-title">No expenses logged</div>
          <button class="btn btn-primary" onclick="openExpenseModal()" style="margin-top:12px;">+ Add Expense</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = expenses.map(e => `
    <tr>
      <td><strong>${e.description}</strong></td>
      <td><span class="badge badge-secondary">${e.category}</span></td>
      <td>${e.project_name || 'General Workspace'}</td>
      <td><strong>${formatINR(e.amount)}</strong></td>
      <td>${formatDate(e.expense_date)}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="editExpense(${e.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteExpense(${e.id}, '${escapeJs(e.description)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escapeJs(str) {
  return str.replace(/'/g, "\\'");
}

function openExpenseModal(expense = null) {
  const modal = document.getElementById('expenseModal');
  const form = document.getElementById('expenseForm');
  if (!modal || !form) return;

  form.reset();
  if (expense) {
    document.getElementById('modalExpenseTitle').innerText = 'Edit Expense';
    document.getElementById('expenseId').value = expense.id;
    document.getElementById('expenseProjectSelect').value = expense.project_id || '';
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseDate').value = expense.expense_date;
    document.getElementById('expensePaymentMethod').value = expense.payment_method || 'UPI';
    document.getElementById('expenseNotes').value = expense.notes || '';
  } else {
    document.getElementById('modalExpenseTitle').innerText = 'Add New Expense';
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
  }

  modal.classList.add('active');
}

function closeExpenseModal() {
  document.getElementById('expenseModal')?.classList.remove('active');
}

async function handleExpenseSave(e) {
  e.preventDefault();
  const id = document.getElementById('expenseId').value;

  const payload = {
    project_id: document.getElementById('expenseProjectSelect').value || null,
    category: document.getElementById('expenseCategory').value,
    description: document.getElementById('expenseDescription').value.trim(),
    amount: document.getElementById('expenseAmount').value,
    expense_date: document.getElementById('expenseDate').value,
    payment_method: document.getElementById('expensePaymentMethod').value,
    notes: document.getElementById('expenseNotes').value.trim()
  };

  const endpoint = id ? `/expenses/${id}` : '/expenses';
  const method = id ? 'PUT' : 'POST';

  const res = await apiRequest(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  if (res.success) {
    showToast(res.message || 'Expense saved!', 'success');
    closeExpenseModal();
    loadExpenses();
  } else {
    showToast(res.message || 'Error saving expense', 'danger');
  }
}

async function editExpense(id) {
  const data = await apiRequest('/expenses');
  if (data.success) {
    const expense = data.expenses.find(e => e.id === id);
    if (expense) openExpenseModal(expense);
  }
}

function confirmDeleteExpense(id, description) {
  showConfirmModal('Delete Expense', `Are you sure you want to delete expense "${description}"?`, async () => {
    const res = await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Expense deleted successfully.', 'success');
      loadExpenses();
    } else {
      showToast(res.message || 'Failed to delete expense.', 'danger');
    }
  });
}
