/* ========================================================
   FreelanceHub Authentication JS
   ======================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        showToast('Please enter both email and password.', 'danger');
        return;
      }

      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success) {
        setToken(res.token);
        localStorage.setItem('freelancehub_user', JSON.stringify(res.user));
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 800);
      } else {
        showToast(res.message || 'Login failed.', 'danger');
      }
    });
  }

  // Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const phone = document.getElementById('signupPhone').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirm_password = document.getElementById('signupConfirmPassword').value;

      if (!full_name || !email || !password || !confirm_password) {
        showToast('Please fill in all required fields.', 'danger');
        return;
      }

      if (password !== confirm_password) {
        showToast('Passwords do not match.', 'danger');
        return;
      }

      const res = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, phone, password, confirm_password })
      });

      if (res.success) {
        setToken(res.token);
        localStorage.setItem('freelancehub_user', JSON.stringify(res.user));
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 800);
      } else {
        showToast(res.message || 'Signup failed.', 'danger');
      }
    });
  }

  // Forgot Password Form
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();

      if (!email) {
        showToast('Please enter your email.', 'danger');
        return;
      }

      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      showToast(res.message || 'Reset link sent.', 'info');
    });
  }
});
