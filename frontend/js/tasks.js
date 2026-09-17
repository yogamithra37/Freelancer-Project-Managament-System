/* ========================================================
   FreelanceHub Tasks Management JS
   ======================================================== */

let projectsList = [];
let loadedTasksList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('tasks');
  await loadProjectsDropdown();
  await loadTasks();

  document.getElementById('taskSearch')?.addEventListener('input', debounce(loadTasks, 300));
  document.getElementById('taskStatusFilter')?.addEventListener('change', loadTasks);
  document.getElementById('taskPriorityFilter')?.addEventListener('change', loadTasks);
  document.getElementById('taskForm')?.addEventListener('submit', handleTaskSave);
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
  if (data && data.success) {
    projectsList = data.projects || [];
    const select = document.getElementById('taskProjectSelect');
    if (select) {
      select.innerHTML = `<option value="">Select Project *</option>` +
        projectsList.map(p => `<option value="${p.id}">${p.name} (${p.client_company || p.client_name || 'Client'})</option>`).join('');
    }
  }
}

async function loadTasks() {
  const search = document.getElementById('taskSearch')?.value.trim() || '';
  const status = document.getElementById('taskStatusFilter')?.value || '';
  const priority = document.getElementById('taskPriorityFilter')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (priority) params.append('priority', priority);

  const data = await apiRequest(`/tasks?${params.toString()}`);

  if (!data || !data.success) {
    showToast('Failed to load tasks', 'danger');
    renderTasksList([]);
    return;
  }

  loadedTasksList = data.tasks || [];
  renderTasksList(loadedTasksList);
}

function renderTasksList(tasks) {
  const container = document.getElementById('tasksContainer');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state" style="padding: 40px; text-align: center;">
          <div class="empty-icon" style="font-size: 32px; margin-bottom: 8px;">✓</div>
          <div class="empty-title" style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: var(--text-muted);">No tasks found</div>
          <button class="btn btn-primary" onclick="openTaskModal()">+ Add Task</button>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const badgeClass = t.priority === 'Urgent' ? 'badge-danger' : t.priority === 'High' ? 'badge-warning' : t.priority === 'Low' ? 'badge-secondary' : 'badge-info';
    const projectName = t.project_name || 'General Project';

    return `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--text-main); font-size:14px;">${escapeHtml(t.title)}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHtml(t.description || 'No notes')}</div>
        </td>
        <td><strong>${escapeHtml(projectName)}</strong></td>
        <td><span class="badge ${badgeClass}">${t.priority || 'Medium'}</span></td>
        <td>
          <select onchange="updateTaskStatus(${t.id}, this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-color); font-size:12px; font-weight:600; cursor:pointer; background:var(--card-bg); color:var(--text-main);">
            <option value="To Do" ${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
            <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Review" ${t.status === 'Review' ? 'selected' : ''}>Review</option>
            <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>${formatDate(t.due_date)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="editTask(${t.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteTask(${t.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openTaskModal(task = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  if (!modal || !form) return;

  form.reset();
  if (task) {
    document.getElementById('modalTaskTitle').innerText = 'Edit Task';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskProjectSelect').value = task.project_id || '';
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskAssigned').value = task.assigned_to || 'Self';
    document.getElementById('taskPriority').value = task.priority || 'Medium';
    document.getElementById('taskStatus').value = task.status || 'To Do';
    document.getElementById('taskProgress').value = task.progress || 0;
    document.getElementById('taskStartDate').value = task.start_date || '';
    document.getElementById('taskDueDate').value = task.due_date || '';
    document.getElementById('taskDescription').value = task.description || '';
  } else {
    document.getElementById('modalTaskTitle').innerText = 'Add New Task';
    document.getElementById('taskId').value = '';
    if (projectsList.length > 0) {
      document.getElementById('taskProjectSelect').value = projectsList[0].id;
    }
  }

  modal.classList.add('active');
}

function closeTaskModal() {
  document.getElementById('taskModal')?.classList.remove('active');
}

async function handleTaskSave(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;

  const payload = {
    project_id: document.getElementById('taskProjectSelect').value,
    title: document.getElementById('taskTitle').value.trim(),
    assigned_to: document.getElementById('taskAssigned').value.trim(),
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    progress: Number(document.getElementById('taskProgress').value) || 0,
    start_date: document.getElementById('taskStartDate').value,
    due_date: document.getElementById('taskDueDate').value,
    description: document.getElementById('taskDescription').value.trim()
  };

  if (!payload.project_id || !payload.title) {
    showToast('Please select a project and enter a task title.', 'warning');
    return;
  }

  const endpoint = id ? `/tasks/${id}` : '/tasks';
  const method = id ? 'PUT' : 'POST';

  const res = await apiRequest(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  if (res && res.success) {
    showToast(res.message || 'Task saved successfully!', 'success');
    closeTaskModal();
    await loadTasks();
  } else {
    showToast(res?.message || 'Error saving task', 'danger');
  }
}

async function updateTaskStatus(id, newStatus) {
  const res = await apiRequest(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  });

  if (res && res.success) {
    showToast('Task status updated', 'success');
    await loadTasks();
  } else {
    showToast('Failed to update task status', 'danger');
  }
}

function editTask(id) {
  const task = loadedTasksList.find(t => t.id === id);
  if (task) {
    openTaskModal(task);
  } else {
    showToast('Task details not found.', 'warning');
  }
}

function confirmDeleteTask(id) {
  const task = loadedTasksList.find(t => t.id === id);
  const taskTitle = task ? task.title : 'this task';

  showConfirmModal('Delete Task', `Are you sure you want to delete task "${taskTitle}"?`, async () => {
    const res = await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      showToast('Task deleted successfully.', 'success');
      await loadTasks();
    } else {
      showToast(res?.message || 'Failed to delete task.', 'danger');
    }
  });
}

