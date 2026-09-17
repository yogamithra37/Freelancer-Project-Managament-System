/* ========================================================
   FreelanceHub Core Application Engine & Client Utilities
   ======================================================== */

const API_BASE = '/api';

// Auth Token Helper
function getToken() {
  return localStorage.getItem('freelancehub_token');
}

function setToken(token) {
  localStorage.setItem('freelancehub_token', token);
}

function clearAuth() {
  localStorage.removeItem('freelancehub_token');
  localStorage.removeItem('freelancehub_user');
}

function getCurrentUser() {
  const user = localStorage.getItem('freelancehub_user');
  return user ? JSON.parse(user) : null;
}

// Ensure token exists, otherwise auto-fetch demo session
async function ensureAuthToken() {
  let token = getToken();
  if (!token) {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-session`);
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('freelancehub_user', JSON.stringify(data.user));
        return data.token;
      }
    } catch (err) {
      console.error('Failed to get demo session token:', err);
    }
  }
  return token;
}

// API Fetch Wrapper
async function apiRequest(endpoint, options = {}, isRetry = false) {
  let token = getToken();
  if (!token && !endpoint.startsWith('/auth/')) {
    token = await ensureAuthToken();
  }

  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if ((response.status === 401 || response.status === 403) && !isRetry && !endpoint.startsWith('/auth/')) {
      clearAuth();
      const newToken = await ensureAuthToken();
      if (newToken) {
        return apiRequest(endpoint, options, true);
      }
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, message: 'Network error. Please check your backend connection.' };
  }
}

// Indian Rupee Currency Formatter
function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

// Date Formatter (DD/MM/YYYY or MMM DD, YYYY)
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Toast Notification Engine
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Confirmation Modal Helper
function showConfirmModal(title, message, onConfirm) {
  let modal = document.getElementById('globalConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'globalConfirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:420px; text-align:center;">
        <h3 class="modal-title" id="confirmModalTitle" style="margin-bottom:12px;"></h3>
        <p id="confirmModalMessage" style="color:var(--text-muted); margin-bottom:24px; font-size:14px;"></p>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button class="btn btn-secondary" id="confirmModalCancel">Cancel</button>
          <button class="btn btn-danger" id="confirmModalOk">Confirm Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('confirmModalTitle').innerText = title;
  document.getElementById('confirmModalMessage').innerText = message;

  modal.classList.add('active');

  const cancelBtn = document.getElementById('confirmModalCancel');
  const okBtn = document.getElementById('confirmModalOk');

  const cleanup = () => {
    modal.classList.remove('active');
    cancelBtn.onclick = null;
    okBtn.onclick = null;
  };

  cancelBtn.onclick = cleanup;
  okBtn.onclick = () => {
    cleanup();
    onConfirm();
  };
}

// Render Sidebar & Header
function renderLayout(activePage = 'dashboard') {
  const user = getCurrentUser() || { full_name: 'Arun Kumar', email: 'arun@example.com' };
  const currentLang = localStorage.getItem('freelancehub_lang') || 'en';

  // Render Sidebar
  const sidebarEl = document.getElementById('appSidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-logo">FH</div>
        <div class="brand-title">FreelanceHub</div>
      </div>
      <div class="sidebar-menu">
        <div class="menu-label" data-i18n="main">Main</div>
        <a href="/dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span data-i18n="dashboard">Dashboard</span>
        </a>
        <a href="/projects.html" class="nav-item ${activePage === 'projects' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <span data-i18n="projects">Projects</span>
        </a>
        <a href="/clients.html" class="nav-item ${activePage === 'clients' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span data-i18n="clients">Clients</span>
        </a>
        <a href="/tasks.html" class="nav-item ${activePage === 'tasks' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          <span data-i18n="tasks">Tasks</span>
        </a>
        <a href="/calendar.html" class="nav-item ${activePage === 'calendar' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span data-i18n="calendar">Calendar</span>
        </a>

        <div class="menu-label" data-i18n="financeAndAssets">Finance & Assets</div>
        <a href="/invoices.html" class="nav-item ${activePage === 'invoices' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span data-i18n="invoices">Invoices</span>
        </a>
        <a href="/expenses.html" class="nav-item ${activePage === 'expenses' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span data-i18n="expenses">Expenses</span>
        </a>
        <a href="/reports.html" class="nav-item ${activePage === 'reports' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          <span data-i18n="reports">Reports</span>
        </a>

        <div class="menu-label" data-i18n="account">Account</div>
        <a href="/profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span data-i18n="profile">Profile</span>
        </a>
        <a href="/settings.html" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span data-i18n="settings">Settings</span>
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="user-mini-card" style="padding:10px 12px; background:rgba(255,255,255,0.06); border-radius:var(--radius-md); display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div class="user-mini-info">
            <div class="user-mini-name" id="sidebarUserName" style="font-weight:700; color:#ffffff; font-size:13px;">${user.full_name || 'Arun Kumar'}</div>
            <div class="user-mini-role" style="font-size:11px; color:#94a3b8;">Freelancer</div>
          </div>
          <button class="icon-btn" id="logoutBtn" title="Logout" style="width:30px; height:30px; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.1); color:#94a3b8;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      clearAuth();
      window.location.href = '/login.html';
    });
  }

  // Render Top Navbar
  const headerEl = document.getElementById('appHeader');
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="navbar-search">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; height:18px; color:#94a3b8;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" id="globalSearchInput" placeholder="Search projects, clients..." data-i18n="search">
      </div>
      <div class="navbar-actions" style="display:flex; align-items:center; gap:12px;">
        <!-- Language Switcher Dropdown -->
        <div style="display:flex; align-items:center; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:2px 8px;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px; height:16px; color:var(--text-muted); margin-right:6px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
          <select id="globalLangSelect" class="lang-selector-select" style="background:transparent; border:none; color:var(--text-main); font-size:13px; font-weight:600; cursor:pointer; padding:4px 0;">
            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
            <option value="ta" ${currentLang === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
            <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>हिंदी (Hindi)</option>
          </select>
        </div>

        <a href="/notifications.html" class="icon-btn" id="notificationNavBtn" title="Notifications">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span class="notification-badge" id="headerNotificationBadge" style="display:none;">0</span>
        </a>

        <a href="/profile.html" class="user-name-link" style="text-decoration:none; color:var(--text-main); font-weight:600; font-size:13px; padding:6px 12px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius-md); display:flex; align-items:center; gap:6px;">
          <span>${user.full_name || 'Arun Kumar'}</span>
        </a>
      </div>
    `;

    // Global Search listener
    document.getElementById('globalSearchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          window.location.href = `/projects.html?search=${encodeURIComponent(query)}`;
        }
      }
    });

    // Language Selector listener
    document.getElementById('globalLangSelect')?.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      if (typeof setLanguage === 'function') {
        setLanguage(selectedLang);
      }
    });
  }

  // Apply i18n
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }

  // Update Notification Badge Count
  fetchNotificationBadge();
}

async function fetchNotificationBadge() {
  const badgeEl = document.getElementById('headerNotificationBadge');
  if (!badgeEl || !getToken()) return;

  const data = await apiRequest('/notifications');
  if (data.success) {
    const unread = data.unread_count || 0;
    // CRITICAL REQUIREMENT: If unread notification count = 0, DO NOT display "0". Hide badge completely!
    if (unread > 0) {
      badgeEl.innerText = unread;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}
