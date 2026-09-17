/* ========================================================
   FreelanceHub Notifications Controller
   ======================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('notifications');
  loadNotifications();

  document.getElementById('markAllReadBtn')?.addEventListener('click', markAllNotificationsRead);
});

async function loadNotifications() {
  const data = await apiRequest('/notifications');
  if (!data.success) {
    showToast('Failed to load notifications', 'danger');
    return;
  }

  const listEl = document.getElementById('notificationsList');
  if (!listEl) return;

  const notifications = data.notifications || [];

  if (notifications.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔔</div>
        <div class="empty-title">No notifications</div>
        <div class="empty-desc">You are all caught up! Deadline alerts and invoice reminders will appear here.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = notifications.map(n => `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; padding:16px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:${n.is_read ? 'var(--card-bg)' : 'var(--primary-light)'}; margin-bottom:12px;">
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="font-size:20px;">
          ${n.type === 'deadline' ? '⏰' : n.type === 'overdue' ? '⚠️' : 'ℹ️'}
        </div>
        <div>
          <div style="font-weight:700; font-size:15px; color:var(--text-main);">${n.title}</div>
          <div style="font-size:13px; color:var(--text-muted); margin-top:2px;">${n.message}</div>
          <div style="font-size:11px; color:var(--text-light); margin-top:6px;">${formatDate(n.created_at)}</div>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        ${!n.is_read ? `<button class="btn btn-secondary btn-sm" onclick="markNotificationRead(${n.id})">Mark Read</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteNotificationItem(${n.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function markNotificationRead(id) {
  const res = await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
  if (res.success) {
    loadNotifications();
    fetchNotificationBadge();
  }
}

async function markAllNotificationsRead() {
  const res = await apiRequest('/notifications/read-all', { method: 'PUT' });
  if (res.success) {
    showToast('All notifications marked as read', 'success');
    loadNotifications();
    fetchNotificationBadge();
  }
}

async function deleteNotificationItem(id) {
  const res = await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast('Notification deleted', 'success');
    loadNotifications();
    fetchNotificationBadge();
  }
}
