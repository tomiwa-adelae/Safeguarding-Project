// ═══════════════════════════════════════════════════════════════
// Authentication Middleware
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware to require authentication (valid session)
 * Returns 401 if user is not logged in
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to ensure user has set their password
 * Returns 403 if user needs to set password
 */
function requirePasswordSet(req, res, next) {
  if (req.session && req.session.passwordResetRequired) {
    return res.status(403).json({
      error: 'Password setup required',
      requirePasswordSetup: true
    });
  }
  next();
}

/**
 * Middleware to attach user data to request from session
 * Adds req.user if session exists
 */
function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = {
      staffId: req.session.userId,
      name: req.session.userName,
      role: req.session.userRole
    };
  }
  next();
}

module.exports = { requireAuth, requirePasswordSet, attachUser };
