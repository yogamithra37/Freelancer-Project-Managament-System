/* ========================================================
   FreelanceHub Settings Controller
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderLayout('settings');

  // Load language preference
  const langSelect = document.getElementById('settingsLangSelect');
  if (langSelect) {
    langSelect.value = localStorage.getItem('freelancehub_lang') || 'en';
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
      showToast('Language updated!', 'info');
    });
  }

  // Load theme preference
  const themeSelect = document.getElementById('settingsThemeSelect');
  if (themeSelect) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    themeSelect.value = currentTheme;
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('freelancehub_theme', theme);
      showToast('Theme updated!', 'info');
    });
  }

  // Monthly Goal Form
  document.getElementById('settingsGoalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const monthly_goal = document.getElementById('settingsMonthlyGoal').value;

    const res = await apiRequest('/users/settings', {
      method: 'PUT',
      body: JSON.stringify({
        monthly_goal,
        language: localStorage.getItem('freelancehub_lang') || 'en',
        currency: 'INR'
      })
    });

    if (res.success) {
      showToast('Settings saved successfully!', 'success');
    } else {
      showToast(res.message || 'Error saving settings', 'danger');
    }
  });
});
