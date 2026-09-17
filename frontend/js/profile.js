/* ========================================================
   FreelanceHub Profile & Settings JS
   ======================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  renderLayout('profile');
  loadProfile();

  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
  document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);
});

async function loadProfile() {
  const data = await apiRequest('/users/profile');
  if (data.success && data.profile) {
    const u = data.profile;
    document.getElementById('profName').value = u.full_name || 'Arun Kumar';
    document.getElementById('profEmail').value = u.email || 'arun@example.com';
    document.getElementById('profPhone').value = u.phone || '+91 9876543210';
    document.getElementById('profHourlyRate').value = u.hourly_rate || 1500;
    document.getElementById('profExp').value = u.experience_years || 5;
    document.getElementById('profLocation').value = u.location || 'Coimbatore, Tamil Nadu, India';
    document.getElementById('profLanguages').value = u.languages || 'English, Tamil, Hindi';
    document.getElementById('profPortfolio').value = u.portfolio_url || 'https://arunkumar.dev';
    document.getElementById('profSkills').value = u.skills || 'Node.js, Express, React, JavaScript, HTML5/CSS3, Tailwind CSS, REST APIs, SQL';
    document.getElementById('profBio').value = u.bio || 'Senior Full-Stack Web Developer & UI/UX Specialist crafting high-performance digital web applications and enterprise portals for global clients.';

    // Update localStorage user object
    localStorage.setItem('freelancehub_user', JSON.stringify(u));
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const payload = {
    full_name: document.getElementById('profName').value.trim(),
    email: document.getElementById('profEmail').value.trim(),
    phone: document.getElementById('profPhone').value.trim(),
    hourly_rate: Number(document.getElementById('profHourlyRate').value),
    experience_years: Number(document.getElementById('profExp').value),
    location: document.getElementById('profLocation').value.trim(),
    languages: document.getElementById('profLanguages').value.trim(),
    portfolio_url: document.getElementById('profPortfolio').value.trim(),
    skills: document.getElementById('profSkills').value.trim(),
    bio: document.getElementById('profBio').value.trim()
  };

  const res = await apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (res.success) {
    showToast('Profile updated successfully!', 'success');
    if (res.user) {
      localStorage.setItem('freelancehub_user', JSON.stringify(res.user));
    }
    renderLayout('profile');
  } else {
    showToast(res.message || 'Failed to update profile', 'danger');
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();

  const current_password = document.getElementById('passCurrent').value;
  const new_password = document.getElementById('passNew').value;
  const confirm_password = document.getElementById('passConfirm').value;

  if (new_password !== confirm_password) {
    showToast('New passwords do not match.', 'danger');
    return;
  }

  const res = await apiRequest('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify({ current_password, new_password, confirm_password })
  });

  if (res.success) {
    showToast('Password changed successfully!', 'success');
    document.getElementById('passwordForm').reset();
  } else {
    showToast(res.message || 'Password change failed.', 'danger');
  }
}
