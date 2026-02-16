// ═══════════════════════════════════════════════════════════════
// Authentication Functions
// ═══════════════════════════════════════════════════════════════

// ─── Screen Navigation ───
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('registrationScreen').style.display = 'none';
  document.getElementById('setPasswordScreen').style.display = 'none';
  document.getElementById('forgotPasswordScreen').style.display = 'none';
  document.getElementById('resetPasswordScreen').style.display = 'none';
  clearErrors();
}

function showRegistration() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registrationScreen').style.display = 'flex';
  clearErrors();
}

function showSetPassword(user) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('setPasswordScreen').style.display = 'flex';
  clearErrors();

  document.getElementById('setPwdUserName').textContent = user.name;
  document.getElementById('setPwdUserEmail').textContent = user.email || user.staffId;
  document.getElementById('setPwdStaffId').value = user.staffId;
}

function showForgotPassword() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('forgotPasswordScreen').style.display = 'flex';
  clearErrors();
}

function showResetPassword(token) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registrationScreen').style.display = 'none';
  document.getElementById('setPasswordScreen').style.display = 'none';
  document.getElementById('forgotPasswordScreen').style.display = 'none';
  document.getElementById('resetPasswordScreen').style.display = 'flex';
  document.getElementById('resetPwdToken').value = token;
  clearErrors();
}

function clearErrors() {
  document.querySelectorAll('.login-error').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
  document.querySelectorAll('.login-success').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

// ─── Password Validation UI ───
function validatePasswordUI(password, prefix = 'req') {
  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password)
  };

  Object.keys(reqs).forEach(key => {
    const el = document.getElementById(`${prefix}-${key}`);
    if (el) {
      el.className = 'req ' + (reqs[key] ? 'valid' : 'invalid');
    }
  });

  return Object.values(reqs).every(v => v);
}

// ─── Login ───
async function handleLogin() {
  const staffId = document.getElementById('loginStaffId').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  if (!staffId) {
    errEl.textContent = 'Please enter your Admission Number or email.';
    errEl.style.display = 'block';
    return;
  }

  if (!password) {
    errEl.textContent = 'Please enter your password.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    const data = await api('POST', '/api/login', { staffId, password });
    console.log('[Login] Server response:', data);

    // Check if password setup required
    if (data.requirePasswordSetup) {
      if (!data.user) {
        console.error('[Login] Password setup required but no user data:', data);
        throw new Error('Server error: Missing user data. Please contact support.');
      }
      showSetPassword(data.user);
      return;
    }

    // Successful login - validate response structure
    if (!data.user) {
      console.error('[Login] Invalid response structure:', data);
      throw new Error('Invalid response from server. Please try again.');
    }

    PSTAR_STATE.currentUser = data.user;
    PSTAR_STATE.completed = (data.state && data.state.completed) || {};
    PSTAR_STATE.quizAnswers = (data.state && data.state.quizAnswers) || {};

    document.getElementById('loginScreen').style.display = 'none';

    const completedCount = Object.keys(PSTAR_STATE.completed).length;

    if (completedCount > 0) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('topbar').classList.add('active');
      PSTAR_STATE.started = true;
      showDashboard();
    } else {
      document.getElementById('splash').style.display = 'flex';
    }
  } catch (err) {
    console.error('[Login] Error:', err);
    errEl.textContent = err.message || 'An error occurred. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
}

// ─── Registration ───
async function handleRegistration() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const staffId = document.getElementById('regStaffId').value.trim();
  const role = document.getElementById('regRole').value;
  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;
  const errEl = document.getElementById('regError');

  // Validation
  if (!name || !email || !staffId || !role || !password || !passwordConfirm) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }

  if (!validatePasswordUI(password, 'req')) {
    errEl.textContent = 'Password does not meet requirements.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';

  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const data = await api('POST', '/api/register', {
      name, email, staffId, role, password
    });

    // Successful registration
    PSTAR_STATE.currentUser = data.user;
    PSTAR_STATE.completed = {};
    PSTAR_STATE.quizAnswers = {};

    document.getElementById('registrationScreen').style.display = 'none';
    document.getElementById('splash').style.display = 'flex';
  } catch (err) {
    console.error('[Registration] Error:', err);
    errEl.textContent = err.message || 'Registration failed. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
}

// ─── Set Password (existing users) ───
async function handleSetPassword() {
  const staffId = document.getElementById('setPwdStaffId').value;
  const password = document.getElementById('setPwdPassword').value;
  const passwordConfirm = document.getElementById('setPwdPasswordConfirm').value;
  const errEl = document.getElementById('setPwdError');

  if (!password || !passwordConfirm) {
    errEl.textContent = 'Please fill in both password fields.';
    errEl.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }

  if (!validatePasswordUI(password, 'setpwd-req')) {
    errEl.textContent = 'Password does not meet requirements.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';

  const btn = document.getElementById('setPwdBtn');
  btn.disabled = true;
  btn.textContent = 'Setting password...';

  try {
    const data = await api('POST', '/api/set-password', { staffId, password });

    // Successful - continue to course - validate response structure
    if (!data.user) {
      throw new Error('Invalid response from server. Please try again.');
    }

    PSTAR_STATE.currentUser = data.user;
    PSTAR_STATE.completed = (data.state && data.state.completed) || {};
    PSTAR_STATE.quizAnswers = (data.state && data.state.quizAnswers) || {};

    document.getElementById('setPasswordScreen').style.display = 'none';

    const completedCount = Object.keys(PSTAR_STATE.completed).length;

    if (completedCount > 0) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('topbar').classList.add('active');
      PSTAR_STATE.started = true;
      showDashboard();
    } else {
      document.getElementById('splash').style.display = 'flex';
    }
  } catch (err) {
    console.error('[SetPassword] Error:', err);
    errEl.textContent = err.message || 'Failed to set password. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Set Password & Continue →';
  }
}

// ─── Forgot Password ───
async function handleForgotPassword() {
  const email = document.getElementById('forgotPwdEmail').value.trim();
  const errEl = document.getElementById('forgotPwdError');
  const successEl = document.getElementById('forgotPwdSuccess');

  if (!email) {
    errEl.textContent = 'Please enter your email address.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';
  successEl.style.display = 'none';

  const btn = document.getElementById('forgotPwdBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    await api('POST', '/api/forgot-password', { email });

    successEl.textContent = 'If an account exists with that email, a password reset link has been sent. Please check your inbox.';
    successEl.style.display = 'block';

    document.getElementById('forgotPwdEmail').value = '';
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    errEl.textContent = err.message || 'Failed to send reset email. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Reset Link →';
  }
}

// ─── Reset Password (with token) ───
async function handleResetPassword() {
  const token = document.getElementById('resetPwdToken').value;
  const password = document.getElementById('resetPwdPassword').value;
  const passwordConfirm = document.getElementById('resetPwdPasswordConfirm').value;
  const errEl = document.getElementById('resetPwdError');

  if (!password || !passwordConfirm) {
    errEl.textContent = 'Please fill in both password fields.';
    errEl.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }

  if (!validatePasswordUI(password, 'resetpwd-req')) {
    errEl.textContent = 'Password does not meet requirements.';
    errEl.style.display = 'block';
    return;
  }

  errEl.style.display = 'none';

  const btn = document.getElementById('resetPwdBtn');
  btn.disabled = true;
  btn.textContent = 'Resetting password...';

  try {
    await api('POST', '/api/reset-password', { token, password });

    // Success - redirect to login
    alert('Password reset successful! You can now log in with your new password.');
    showLogin();
  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    errEl.textContent = err.message || 'Failed to reset password. The link may have expired.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset Password →';
  }
}

// ─── Check for reset token in URL ───
function checkForResetToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    // Verify token
    api('GET', '/api/verify-reset-token/' + token)
      .then(data => {
        if (data.valid) {
          document.getElementById('resetPwdWelcome').textContent = `Hi ${data.name}, enter your new password below`;
          showResetPassword(token);

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          alert('Invalid or expired reset link. Please request a new one.');
          showLogin();
        }
      })
      .catch(err => {
        console.error('[ResetToken] Verification error:', err);
        alert('Failed to verify reset link. Please try again.');
        showLogin();
      });
  }
}

// ─── Check for existing session (restore login on page reload) ───
async function checkSession() {
  try {
    console.log('[Session] Checking for existing session...');
    const data = await api('GET', '/api/session');

    if (!data.authenticated) {
      console.log('[Session] No active session');
      return false;
    }

    console.log('[Session] Active session found:', data.user);

    // Check if password setup is required
    if (data.requirePasswordSetup) {
      console.log('[Session] Password setup required');
      showSetPassword(data.user);
      return true;
    }

    // Restore user state
    PSTAR_STATE.currentUser = data.user;
    PSTAR_STATE.completed = (data.state && data.state.completed) || {};
    PSTAR_STATE.quizAnswers = (data.state && data.state.quizAnswers) || {};

    // Hide login screen
    document.getElementById('loginScreen').style.display = 'none';

    const completedCount = Object.keys(PSTAR_STATE.completed).length;
    console.log('[Session] Restored session. Completed modules:', completedCount);

    // Show appropriate screen
    if (completedCount > 0) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('topbar').classList.add('active');
      PSTAR_STATE.started = true;
      showDashboard();
    } else {
      document.getElementById('splash').style.display = 'flex';
    }

    return true;
  } catch (err) {
    console.error('[Session] Check failed:', err);
    return false;
  }
}

// ─── Logout ───
async function logoutUser() {
  try {
    await api('POST', '/api/logout');
  } catch (err) {
    console.error('[Logout] Error:', err);
  }

  PSTAR_STATE.currentUser = null;
  PSTAR_STATE.started = false;
  PSTAR_STATE.currentModule = null;
  PSTAR_STATE.completed = {};
  PSTAR_STATE.quizAnswers = {};

  // Hide all screens
  document.getElementById('splash').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('moduleContainer').style.display = 'none';
  document.getElementById('certificate').style.display = 'none';
  document.getElementById('topbar').classList.remove('active');

  // Show login
  showLogin();
}
