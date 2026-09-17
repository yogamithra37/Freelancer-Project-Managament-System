/* ========================================================
   FreelanceHub Interactive Calendar Controller
   ======================================================== */

let currentDate = new Date(2026, 6, 1); // Default July 2026

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('calendar');
  await renderCalendar();

  document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
});

async function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = document.getElementById('currentMonthLabel');
  if (monthLabel) monthLabel.innerText = `${monthNames[month]} ${year}`;

  // Fetch events
  const tasksRes = await apiRequest('/tasks');
  const projectsRes = await apiRequest('/projects');
  const invoicesRes = await apiRequest('/invoices');

  const tasks = tasksRes.tasks || [];
  const projects = projectsRes.projects || [];
  const invoices = invoicesRes.invoices || [];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const gridEl = document.getElementById('calendarGrid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  // Empty cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.style.background = 'var(--light-bg)';
    emptyCell.style.minHeight = '100px';
    emptyCell.style.padding = '8px';
    emptyCell.style.border = '1px solid var(--border-color)';
    gridEl.appendChild(emptyCell);
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.style.background = 'var(--card-bg)';
    cell.style.minHeight = '110px';
    cell.style.padding = '8px';
    cell.style.border = '1px solid var(--border-color)';
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column';
    cell.style.gap = '4px';

    const dayNum = document.createElement('div');
    dayNum.style.fontWeight = '700';
    dayNum.style.fontSize = '12px';
    dayNum.style.marginBottom = '4px';
    dayNum.innerText = day;
    cell.appendChild(dayNum);

    // Filter events for this day
    const dayTasks = tasks.filter(t => t.due_date === dayStr);
    const dayProjects = projects.filter(p => p.deadline === dayStr);
    const dayInvoices = invoices.filter(i => i.due_date === dayStr);

    dayProjects.forEach(p => {
      const tag = document.createElement('div');
      tag.className = 'badge badge-danger';
      tag.style.fontSize = '10px';
      tag.style.overflow = 'hidden';
      tag.style.textOverflow = 'ellipsis';
      tag.innerText = `📁 ${p.name}`;
      cell.appendChild(tag);
    });

    dayTasks.forEach(t => {
      const tag = document.createElement('div');
      tag.className = 'badge badge-info';
      tag.style.fontSize = '10px';
      tag.style.overflow = 'hidden';
      tag.style.textOverflow = 'ellipsis';
      tag.innerText = `✓ ${t.title}`;
      cell.appendChild(tag);
    });

    dayInvoices.forEach(inv => {
      const tag = document.createElement('div');
      tag.className = 'badge badge-warning';
      tag.style.fontSize = '10px';
      tag.style.overflow = 'hidden';
      tag.style.textOverflow = 'ellipsis';
      tag.innerText = `💰 ${inv.invoice_number}`;
      cell.appendChild(tag);
    });

    gridEl.appendChild(cell);
  }
}
