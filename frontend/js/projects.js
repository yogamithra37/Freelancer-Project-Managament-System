/* ========================================================
   FreelanceHub Projects Management JS
   ======================================================== */

let clientsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('projects');
  await loadClientsDropdown();
  await loadProjects();

  // Search & Filter Listeners
  document.getElementById('projectSearch')?.addEventListener('input', debounce(loadProjects, 300));
  document.getElementById('projectStatusFilter')?.addEventListener('change', loadProjects);
  document.getElementById('projectPriorityFilter')?.addEventListener('change', loadProjects);

  // Add Project Form
  document.getElementById('projectForm')?.addEventListener('submit', handleProjectSave);
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

async function loadClientsDropdown() {
  const data = await apiRequest('/clients');
  if (data.success) {
    clientsList = data.clients || [];
    const select = document.getElementById('projectClientSelect');
    if (select) {
      select.innerHTML = `<option value="">Select Client *</option>` +
        clientsList.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('');
    }
  }
}

async function loadProjects() {
  const search = document.getElementById('projectSearch')?.value || '';
  const status = document.getElementById('projectStatusFilter')?.value || '';
  const priority = document.getElementById('projectPriorityFilter')?.value || '';

  const query = new URLSearchParams({ search, status, priority }).toString();
  const data = await apiRequest(`/projects?${query}`);

  if (!data.success) {
    showToast('Failed to load projects', 'danger');
    return;
  }

  renderProjectsList(data.projects || []);
}

function renderProjectsList(projects) {
  const container = document.getElementById('projectsContainer');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">📁</div>
        <div class="empty-title">No projects found</div>
        <div class="empty-desc">Create your first project to start tracking budget, progress, and tasks.</div>
        <button class="btn btn-primary" onclick="openProjectModal()">+ Add Project</button>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(p => `
    <div class="panel" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <span class="badge badge-info">${p.category || 'Web Development'}</span>
          <span style="font-size:13px; font-weight:700;">${p.health.label}</span>
        </div>

        <h3 style="font-size:18px; font-weight:800; margin-bottom:6px;">
          <a href="/project-details.html?id=${p.id}" style="color:var(--text-main); text-decoration:none;">${p.name}</a>
        </h3>
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Client: <strong>${p.client_name}</strong> (${p.client_company})</div>

        <p style="font-size:13px; color:var(--text-muted); line-height:1.4; margin-bottom:16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${p.description || 'No description provided.'}
        </p>

        <!-- Progress -->
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
            <span>Progress</span>
            <span>${p.progress}%</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar ${p.progress === 100 ? 'success' : ''}" style="width:${p.progress}%;"></div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div style="display:flex; justify-content:space-between; background:var(--light-bg); padding:10px 12px; border-radius:var(--radius-md); font-size:12px; margin-bottom:16px;">
          <div>
            <div style="color:var(--text-muted);">Budget</div>
            <div style="font-weight:700; color:var(--text-main);">${formatINR(p.budget)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted);">Expenses</div>
            <div style="font-weight:700; color:var(--danger);">${formatINR(p.total_expenses)}</div>
          </div>
          <div>
            <div style="color:var(--text-muted);">Remaining</div>
            <div style="font-weight:700; color:var(--success);">${formatINR(p.remaining_budget)}</div>
          </div>
        </div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:12px; font-size:12px; color:var(--text-muted);">
          <div>Deadline: <strong>${formatDate(p.deadline)}</strong></div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="editProject(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteProject(${p.id}, '${escapeJs(p.name)}')">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeJs(str) {
  return str.replace(/'/g, "\\'");
}

function openProjectModal(project = null) {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  if (!modal || !form) return;

  form.reset();
  if (project) {
    document.getElementById('modalProjectTitle').innerText = 'Edit Project';
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectClientSelect').value = project.client_id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectCategory').value = project.category || 'Web Development';
    document.getElementById('projectBudget').value = project.budget;
    document.getElementById('projectStartDate').value = project.start_date || '';
    document.getElementById('projectDeadline').value = project.deadline || '';
    document.getElementById('projectPriority').value = project.priority || 'Medium';
    document.getElementById('projectStatus').value = project.status || 'In Progress';
    document.getElementById('projectProgress').value = project.progress || 0;
    document.getElementById('projectDescription').value = project.description || '';
  } else {
    document.getElementById('modalProjectTitle').innerText = 'Add New Project';
    document.getElementById('projectId').value = '';
  }

  modal.classList.add('active');
}

function closeProjectModal() {
  document.getElementById('projectModal')?.classList.remove('active');
}

async function handleProjectSave(e) {
  e.preventDefault();
  const id = document.getElementById('projectId').value;

  const payload = {
    client_id: document.getElementById('projectClientSelect').value,
    name: document.getElementById('projectName').value.trim(),
    category: document.getElementById('projectCategory').value,
    budget: document.getElementById('projectBudget').value,
    start_date: document.getElementById('projectStartDate').value,
    deadline: document.getElementById('projectDeadline').value,
    priority: document.getElementById('projectPriority').value,
    status: document.getElementById('projectStatus').value,
    progress: document.getElementById('projectProgress').value,
    description: document.getElementById('projectDescription').value.trim()
  };

  const endpoint = id ? `/projects/${id}` : '/projects';
  const method = id ? 'PUT' : 'POST';

  const res = await apiRequest(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  if (res.success) {
    showToast(res.message || 'Project saved!', 'success');
    closeProjectModal();
    loadProjects();
  } else {
    showToast(res.message || 'Error saving project', 'danger');
  }
}

async function editProject(id) {
  const data = await apiRequest(`/projects/${id}`);
  if (data.success && data.project) {
    openProjectModal(data.project);
  }
}

function confirmDeleteProject(id, name) {
  showConfirmModal('Delete Project', `Are you sure you want to delete project "${name}"? This will delete associated tasks and invoices.`, async () => {
    const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Project deleted successfully.', 'success');
      loadProjects();
    } else {
      showToast(res.message || 'Failed to delete project.', 'danger');
    }
  });
}
