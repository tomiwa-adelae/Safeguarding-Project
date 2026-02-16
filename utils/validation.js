// ═══════════════════════════════════════════════════════════════
// Password & Input Validation Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'letmein', 'welcome', 'monkey', '1234567', 'password1'
  ];
  if (password && commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate staff ID format
 * @param {string} staffId - Staff ID to validate
 * @returns {boolean} - True if valid staff ID
 */
function validateStaffId(staffId) {
  // Staff ID should be at least 3 characters and alphanumeric (with dots, underscores, @ allowed)
  if (!staffId || staffId.length < 3) return false;
  return /^[a-zA-Z0-9._@-]+$/.test(staffId);
}

module.exports = { validatePassword, validateEmail, validateStaffId };
