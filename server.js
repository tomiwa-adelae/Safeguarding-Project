// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — Server (PostgreSQL)
// ═══════════════════════════════════════════════════════════════

try { require('dotenv').config(); } catch(e) {}

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('./db');
const { requireAuth, requirePasswordSet, attachUser } = require('./middleware/auth');
const { validatePassword, validateEmail, validateStaffId } = require('./utils/validation');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./utils/email');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || 'ProjectSTAR2025';

// ─── Middleware ───
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(morgan('short'));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Session Configuration ───
app.use(session({
  store: new pgSession({
    pool: db.getPool(),
    tableName: 'sessions',
    pruneSessionInterval: 60 * 15 // Clean up expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
  resave: false,
  saveUninitialized: false,
  name: process.env.SESSION_NAME || 'pstar_sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevents XSS attacks
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '28800000'), // 8 hours default
    sameSite: 'lax' // CSRF protection
  },
  rolling: true // Extend session on activity
}));

app.use(attachUser); // Attach user data to request from session

// ─── Rate Limiting ───
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: { error: 'Too many password reset requests. Please try again in 1 hour.' }
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour
  message: { error: 'Too many registration attempts. Please try again later.' }
});

// ═══════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════

// ─── Auth / Login (with password) ───
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { staffId, password } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({ error: 'Admission Number and password are required.' });
    }

    // Get user - check if input is email or admission number
    const identifier = staffId.trim();
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await db.getUserByEmail(identifier)
      : await db.getUser(identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if account is locked
    if (user.account_locked) {
      return res.status(423).json({
        error: 'Account locked due to too many failed login attempts. Please reset your password.'
      });
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(200).json({
        requirePasswordSetup: true,
        user: {
          staffId: user.staff_id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      await db.incrementFailedLogin(staffId.trim());
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if password reset is required
    if (user.password_reset_required) {
      req.session.userId = user.staff_id;
      req.session.userName = user.name;
      req.session.userRole = user.role;
      req.session.passwordResetRequired = true;

      return res.json({
        requirePasswordSetup: true,
        user: {
          staffId: user.staff_id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    }

    // Reset failed attempts
    await db.resetFailedLoginAttempts(staffId.trim());

    // Create session
    req.session.userId = user.staff_id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.passwordResetRequired = false;

    // Update last active
    await db.touchUser(staffId.trim());

    // Get progress
    const completed = await db.getProgress(user.staff_id);
    const quizAnswers = await db.getQuizAnswers(user.staff_id);
    const cert = await db.getCertificate(user.staff_id);

    res.json({
      user: {
        staffId: user.staff_id,
        name: user.name,
        role: user.role,
        email: user.email,
        firstLogin: user.first_login,
        lastActive: user.last_active,
        isReturning: true
      },
      state: {
        completed,
        quizAnswers,
        certificateDate: cert?.certificate_date || null
      }
    });
  } catch (err) {
    console.error('[API] Login error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Registration ───
app.post('/api/register', registrationLimiter, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('staffId').trim().isLength({ min: 3 }).withMessage('Admission Number must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').trim().notEmpty().withMessage('Class/Year is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, staffId, email, password, role } = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    // Check if user already exists
    const existingUser = await db.getUser(staffId.trim());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this Admission Number already exists.' });
    }

    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.createUserWithPassword(
      staffId.trim(),
      name.trim(),
      email.trim(),
      role.trim(),
      passwordHash
    );

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(email, name).catch(err =>
      console.error('[Email] Welcome email failed:', err)
    );

    // Create session
    req.session.userId = user.staff_id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.passwordResetRequired = false;

    res.json({
      user: {
        staffId: user.staff_id,
        name: user.name,
        role: user.role,
        email: user.email,
        firstLogin: user.first_login
      },
      state: {
        completed: {},
        quizAnswers: {},
        certificateDate: null
      }
    });
  } catch (err) {
    console.error('[API] Registration error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Set Password (for existing students without passwords) ───
app.post('/api/set-password', [
  body('staffId').trim().notEmpty().withMessage('Admission Number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { staffId, password } = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    // Get user
    const user = await db.getUser(staffId.trim());
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if user already has a password
    if (user.password_hash && !user.password_reset_required) {
      return res.status(400).json({ error: 'User already has a password set.' });
    }

    // Hash and save password
    const passwordHash = await bcrypt.hash(password, 12);
    await db.updateUserPassword(staffId.trim(), passwordHash);

    // Create session
    req.session.userId = user.staff_id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.passwordResetRequired = false;

    // Get progress
    const completed = await db.getProgress(user.staff_id);
    const quizAnswers = await db.getQuizAnswers(user.staff_id);
    const cert = await db.getCertificate(user.staff_id);

    res.json({
      user: {
        staffId: user.staff_id,
        name: user.name,
        role: user.role,
        email: user.email,
        firstLogin: user.first_login,
        lastActive: user.last_active
      },
      state: {
        completed,
        quizAnswers,
        certificateDate: cert?.certificate_date || null
      }
    });
  } catch (err) {
    console.error('[API] Set password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Forgot Password (request reset) ───
app.post('/api/forgot-password', passwordResetRequestLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email } = req.body;

    // Always return success (security: don't reveal if email exists)
    // But only send email if user exists
    const user = await db.getUserByEmail(email);

    if (user) {
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Save token
      await db.createPasswordResetToken(user.staff_id, token, expiresAt, ipAddress);

      // Send email
      const emailResult = await sendPasswordResetEmail(user.email, user.name, token);

      if (!emailResult.success) {
        console.error('[API] Failed to send reset email:', emailResult.error);
        // Still return success to user (don't reveal email delivery issues)
      }
    }

    // Always return success message
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  } catch (err) {
    console.error('[API] Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Verify Reset Token ───
app.get('/api/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resetToken = await db.getPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid or expired reset link.'
      });
    }

    res.json({
      valid: true,
      email: resetToken.email,
      name: resetToken.name
    });
  } catch (err) {
    console.error('[API] Verify token error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Reset Password (with token) ───
app.post('/api/reset-password', [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] });
    }

    // Verify token
    const resetToken = await db.getPasswordResetToken(token);

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await db.updateUserPassword(resetToken.staff_id, passwordHash);

    // Mark token as used
    await db.markTokenAsUsed(token);

    // Invalidate all other tokens for this user
    await db.invalidateAllUserTokens(resetToken.staff_id);

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[API] Reset password error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Logout ───
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[API] Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout.' });
    }
    res.clearCookie(process.env.SESSION_NAME || 'pstar_sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// ─── Check Session ───
app.get('/api/session', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ authenticated: false });
    }

    // Get fresh user data from database
    const user = await db.getUser(req.session.userId);
    if (!user) {
      // Session exists but user doesn't - clear session
      req.session.destroy();
      return res.json({ authenticated: false });
    }

    // Check if password reset is required
    if (req.session.passwordResetRequired || user.password_reset_required) {
      return res.json({
        authenticated: true,
        requirePasswordSetup: true,
        user: {
          staffId: user.staff_id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    }

    // Get user's progress
    const completed = await db.getProgress(user.staff_id);
    const quizAnswers = await db.getQuizAnswers(user.staff_id);
    const cert = await db.getCertificate(user.staff_id);

    res.json({
      authenticated: true,
      user: {
        staffId: user.staff_id,
        name: user.name,
        role: user.role,
        email: user.email,
        firstLogin: user.first_login,
        lastActive: user.last_active
      },
      state: {
        completed,
        quizAnswers,
        certificateDate: cert?.certificate_date || null
      }
    });
  } catch (err) {
    console.error('[API] Session check error:', err.message);
    res.status(500).json({ authenticated: false, error: 'Server error' });
  }
});

// ─── Check if a user exists (for returning user hint) ───
app.get('/api/user/:staffId', async (req, res) => {
  try {
    const user = await db.getUser(req.params.staffId);
    if (!user) return res.json({ exists: false });
    const completed = await db.getProgress(user.staff_id);
    res.json({
      exists: true,
      name: user.name,
      role: user.role,
      completedCount: Object.keys(completed).length
    });
  } catch (err) {
    console.error('[API] User check error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Save module completion ───
app.post('/api/progress', requireAuth, requirePasswordSet, async (req, res) => {
  try {
    const { staffId, moduleId, score, total, passed } = req.body;
    if (!staffId || !moduleId) {
      return res.status(400).json({ error: 'staffId and moduleId required.' });
    }
    await db.saveModuleCompletion(staffId, moduleId, score, total, passed);
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Progress save error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Save quiz answers (for resume) ───
app.post('/api/quiz-answers', requireAuth, requirePasswordSet, async (req, res) => {
  try {
    const { staffId, moduleId, answers } = req.body;
    if (!staffId || !moduleId) {
      return res.status(400).json({ error: 'staffId and moduleId required.' });
    }
    await db.saveQuizAnswers(staffId, moduleId, answers || {});
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Quiz answers save error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Save certificate ───
app.post('/api/certificate', requireAuth, requirePasswordSet, async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ error: 'staffId required.' });
    const date = await db.saveCertificate(staffId);
    res.json({ ok: true, certificateDate: date });
  } catch (err) {
    console.error('[API] Certificate save error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Verify passphrase ───
app.post('/api/admin/login', (req, res) => {
  const { passphrase } = req.body;
  if (passphrase === ADMIN_PASSPHRASE) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Incorrect passphrase.' });
  }
});

// ─── Admin: Get tracker data ───
app.get('/api/admin/tracker', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const data = await db.getTrackerData();
    const modules = await db.getAllModules(false); // Only count active modules
    res.json({ users: data, totalModules: modules.length });
  } catch (err) {
    console.error('[API] Tracker error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Export CSV ───
app.get('/api/admin/export', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }

    const data = await db.getTrackerData();
    const modules = await db.getAllModules(false); // Only active modules
    const moduleIds = modules.map(m => m.module_id);
    const moduleTitles = modules.map(m => m.title);
    const totalModules = modules.length;

    const headers = [
      'Name', 'Staff ID', 'Role', 'Progress %', 'Modules Completed',
      'Enrolled Date', 'Last Active', 'Certificate Date',
      ...moduleTitles.map(t => t + ' (Score)'),
      ...moduleTitles.map(t => t + ' (Date)')
    ];

    const rows = data.map(u => {
      const completedCount = Object.keys(u.completed).length;
      const pct = totalModules > 0 ? Math.round(completedCount / totalModules * 100) : 0;
      const scores = moduleIds.map(id => u.completed[id] ? `${u.completed[id].score}/${u.completed[id].total}` : '');
      const dates = moduleIds.map(id => u.completed[id]?.completedAt ? new Date(u.completed[id].completedAt).toLocaleDateString('en-GB') : '');
      return [
        u.name, u.staffId, u.role || '', pct, `${completedCount}/${totalModules}`,
        u.firstLogin ? new Date(u.firstLogin).toLocaleDateString('en-GB') : '',
        u.lastActive ? new Date(u.lastActive).toLocaleDateString('en-GB') : '',
        u.certificateDate ? new Date(u.certificateDate).toLocaleDateString('en-GB') : '',
        ...scores, ...dates
      ];
    });

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const filename = `safeguarding_tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('[API] Export error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Delete user ───
app.delete('/api/admin/user/:staffId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    await db.deleteUser(req.params.staffId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: MODULE & QUESTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// ─── Admin: Get all modules (including inactive) ───
app.get('/api/admin/modules', async (req, res) => {
  console.log('[API] GET /api/admin/modules - Request received');
  console.log('[API] Query params:', req.query);

  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      console.log('[API] Auth failed - invalid key');
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const includeInactive = req.query.includeInactive === 'true';
    console.log('[API] Loading modules. Include inactive:', includeInactive);
    const modules = await db.getAllModules(includeInactive);
    console.log('[API] Modules loaded successfully. Count:', modules.length);
    res.json({ modules });
  } catch (err) {
    console.error('[API] Get modules error:', err.message);
    console.error('[API] Error stack:', err.stack);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Get single module with questions ───
app.get('/api/admin/modules/:moduleId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const module = await db.getModuleWithQuestions(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }
    res.json({ module });
  } catch (err) {
    console.error('[API] Get module error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Create new module ───
app.post('/api/admin/modules', async (req, res) => {
  console.log('[API] POST /api/admin/modules - Request received');
  console.log('[API] Query params:', req.query);
  console.log('[API] Body:', req.body);

  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      console.log('[API] Auth failed - invalid key');
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const { module_id, num, title, description, content_html, display_order } = req.body;
    if (!module_id || !num || !title || !description || !content_html) {
      console.log('[API] Validation failed - missing fields');
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    console.log('[API] Creating module:', module_id);
    const module = await db.createModule({
      module_id, num, title, description, content_html, display_order: display_order || 0
    });
    console.log('[API] Module created successfully:', module.module_id);
    res.json({ module });
  } catch (err) {
    console.error('[API] Create module error:', err.message);
    console.error('[API] Error stack:', err.stack);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Update module ───
app.put('/api/admin/modules/:moduleId', async (req, res) => {
  console.log('[API] PUT /api/admin/modules/:moduleId - Request received');
  console.log('[API] Module ID:', req.params.moduleId);
  console.log('[API] Query params:', req.query);
  console.log('[API] Body:', req.body);

  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      console.log('[API] Auth failed - invalid key');
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const { num, title, description, content_html, display_order, is_active } = req.body;
    console.log('[API] Updating module:', req.params.moduleId);
    const module = await db.updateModule(req.params.moduleId, {
      num, title, description, content_html, display_order, is_active
    });
    if (!module) {
      console.log('[API] Module not found:', req.params.moduleId);
      return res.status(404).json({ error: 'Module not found.' });
    }
    console.log('[API] Module updated successfully:', module.module_id);
    res.json({ module });
  } catch (err) {
    console.error('[API] Update module error:', err.message);
    console.error('[API] Error stack:', err.stack);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Delete module (soft delete) ───
app.delete('/api/admin/modules/:moduleId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const module = await db.deleteModule(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }
    res.json({ ok: true, module });
  } catch (err) {
    console.error('[API] Delete module error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Toggle module active status ───
app.post('/api/admin/modules/:moduleId/toggle', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const module = await db.toggleModuleActive(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }
    res.json({ module });
  } catch (err) {
    console.error('[API] Toggle module error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Get questions for a module ───
app.get('/api/admin/questions/:moduleId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const includeInactive = req.query.includeInactive === 'true';
    const questions = await db.getQuestionsByModule(req.params.moduleId, includeInactive);

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const options = await db.getQuestionOptions(q.id);
        return { ...q, options };
      })
    );

    res.json({ questions: questionsWithOptions });
  } catch (err) {
    console.error('[API] Get questions error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Get single question with options ───
app.get('/api/admin/questions/single/:questionId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const question = await db.getQuestion(req.params.questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    const options = await db.getQuestionOptions(question.id);
    res.json({ question: { ...question, options } });
  } catch (err) {
    console.error('[API] Get question error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Create new question with options ───
app.post('/api/admin/questions', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const { module_id, question_text, explanation, options, display_order } = req.body;

    if (!module_id || !question_text || !explanation || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate at least one correct answer
    const hasCorrectAnswer = options.some(opt => opt.is_correct);
    if (!hasCorrectAnswer) {
      return res.status(400).json({ error: 'At least one option must be marked as correct.' });
    }

    // Create question
    const question = await db.createQuestion({
      module_id, question_text, explanation, display_order: display_order || 0
    });

    // Create options
    const createdOptions = await db.replaceQuestionOptions(question.id, options);

    res.json({ question: { ...question, options: createdOptions } });
  } catch (err) {
    console.error('[API] Create question error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Update question with options ───
app.put('/api/admin/questions/:questionId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    const { question_text, explanation, options, display_order, is_active } = req.body;

    // Update question
    const question = await db.updateQuestion(req.params.questionId, {
      question_text, explanation, display_order, is_active
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    // Update options if provided
    let updatedOptions = [];
    if (options && Array.isArray(options)) {
      // Validate at least one correct answer
      const hasCorrectAnswer = options.some(opt => opt.is_correct);
      if (!hasCorrectAnswer) {
        return res.status(400).json({ error: 'At least one option must be marked as correct.' });
      }
      updatedOptions = await db.replaceQuestionOptions(question.id, options);
    } else {
      updatedOptions = await db.getQuestionOptions(question.id);
    }

    res.json({ question: { ...question, options: updatedOptions } });
  } catch (err) {
    console.error('[API] Update question error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Delete question (hard delete) ───
app.delete('/api/admin/questions/:questionId', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }
    await db.deleteQuestion(req.params.questionId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete question error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Admin: Bulk upload questions ───
app.post('/api/admin/questions/bulk', async (req, res) => {
  try {
    const { key } = req.query;
    if (key !== ADMIN_PASSPHRASE) {
      return res.status(401).json({ error: 'Unauthorised.' });
    }

    const { module_id, questions } = req.body;

    if (!module_id || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'module_id and questions array required.' });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const q = questions[i];

        // Validate structure
        if (!q.question || !q.options || !Array.isArray(q.options)) {
          errors.push({ index: i, error: 'Missing question or options' });
          continue;
        }

        // Determine correct answer
        let correctIndex = q.correctIndex ?? q.correct_answer_index ?? -1;
        if (correctIndex < 0 || correctIndex >= q.options.length) {
          errors.push({ index: i, error: 'Invalid correct_answer_index' });
          continue;
        }

        // Create question
        const question = await db.createQuestion({
          module_id,
          question_text: q.question || q.question_text,
          explanation: q.explanation || '',
          display_order: i
        });

        // Create options
        const options = q.options.map((optText, idx) => ({
          text: optText,
          is_correct: idx === correctIndex
        }));

        const createdOptions = await db.replaceQuestionOptions(question.id, options);
        created.push({ ...question, options: createdOptions });

      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    res.json({
      ok: true,
      created: created.length,
      errors: errors.length,
      details: { created, errors }
    });

  } catch (err) {
    console.error('[API] Bulk upload error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC: MODULE API (for learners)
// ═══════════════════════════════════════════════════════════════

// ─── Get all active modules with questions ───
app.get('/api/modules', async (req, res) => {
  try {
    const modules = await db.getAllModulesWithQuestions(false); // Only active modules
    res.json({ modules });
  } catch (err) {
    console.error('[API] Get modules error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Get single module with questions ───
app.get('/api/modules/:moduleId', async (req, res) => {
  try {
    const module = await db.getModuleWithQuestions(req.params.moduleId);
    if (!module || !module.is_active) {
      return res.status(404).json({ error: 'Module not found.' });
    }
    res.json({ module });
  } catch (err) {
    console.error('[API] Get module error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Catch-all: serve index.html for SPA ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════════════════════════════════════════
// PERIODIC CLEANUP
// ═══════════════════════════════════════════════════════════════

// Clean expired password reset tokens every hour
setInterval(async () => {
  try {
    await db.cleanExpiredTokens();
    console.log('[Cleanup] Expired password reset tokens removed');
  } catch (err) {
    console.error('[Cleanup] Error removing expired tokens:', err.message);
  }
}, 60 * 60 * 1000); // Every hour

// ─── Start ───
async function start() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`\n  ╔══════════════════════════════════════════════╗`);
      console.log(`  ║  Project STAR Safeguarding Training Server   ║`);
      console.log(`  ║  PostgreSQL · http://localhost:${PORT}           ║`);
      console.log(`  ╚══════════════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  await db.shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await db.shutdown();
  process.exit(0);
});

start();
