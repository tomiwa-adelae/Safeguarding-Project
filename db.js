// ═══════════════════════════════════════════════════════════════
// Project STAR Safeguarding Course — Database Layer (PostgreSQL)
// ═══════════════════════════════════════════════════════════════

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool;

async function init() {
  console.log('first')
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : (
      process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    ),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  console.log('secondary')

  // Test connection
  const client = await pool.connect();
  try {
    console.log('tomiwa')
    await client.query('SELECT NOW()');
    console.log('[DB] PostgreSQL connected successfully');
  } finally {
    client.release();
  }

  // Run schema migration
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('[DB] Schema migration complete');
  }

  return pool;
}

async function shutdown() {
  if (pool) await pool.end();
}

function getPool() {
  return pool;
}

// ─── User Operations ───

async function upsertUser(staffId, name, role) {
  const now = new Date().toISOString();

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE staff_id = $1', [staffId]
  );

  if (rows.length > 0) {
    await pool.query(
      'UPDATE users SET name = $1, role = $2, last_active = $3 WHERE staff_id = $4',
      [name, role, now, staffId]
    );
    return { ...rows[0], name, role, last_active: now, isReturning: true };
  } else {
    await pool.query(
      'INSERT INTO users (staff_id, name, role, first_login, last_active) VALUES ($1, $2, $3, $4, $5)',
      [staffId, name, role, now, now]
    );
    return { staff_id: staffId, name, role, first_login: now, last_active: now, isReturning: false };
  }
}

async function getUser(staffId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE staff_id = $1', [staffId]);
  return rows[0] || null;
}

async function touchUser(staffId) {
  await pool.query(
    'UPDATE users SET last_active = $1 WHERE staff_id = $2',
    [new Date().toISOString(), staffId]
  );
}

async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY last_active DESC');
  return rows;
}

// ─── Progress Operations ───

async function getProgress(staffId) {
  const { rows } = await pool.query('SELECT * FROM progress WHERE staff_id = $1', [staffId]);
  const completed = {};
  rows.forEach(r => {
    completed[r.module_id] = {
      score: r.score,
      total: r.total,
      passed: r.passed,
      completedAt: r.completed_at
    };
  });
  return completed;
}

async function saveModuleCompletion(staffId, moduleId, score, total, passed) {
  const now = new Date().toISOString();
  await pool.query(`
    INSERT INTO progress (staff_id, module_id, score, total, passed, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (staff_id, module_id) DO UPDATE SET
      score = EXCLUDED.score,
      total = EXCLUDED.total,
      passed = EXCLUDED.passed,
      completed_at = EXCLUDED.completed_at
  `, [staffId, moduleId, score, total, passed, now]);
  await touchUser(staffId);
}

// ─── Quiz Answer Operations ───

async function getQuizAnswers(staffId) {
  const { rows } = await pool.query('SELECT * FROM quiz_answers WHERE staff_id = $1', [staffId]);
  const answers = {};
  rows.forEach(r => {
    answers[r.module_id] = r.answers || {};
  });
  return answers;
}

async function saveQuizAnswers(staffId, moduleId, answers) {
  await pool.query(`
    INSERT INTO quiz_answers (staff_id, module_id, answers)
    VALUES ($1, $2, $3)
    ON CONFLICT (staff_id, module_id) DO UPDATE SET answers = EXCLUDED.answers
  `, [staffId, moduleId, JSON.stringify(answers)]);
  await touchUser(staffId);
}

// ─── Certificate Operations ───

async function saveCertificate(staffId) {
  const now = new Date().toISOString();
  await pool.query(`
    INSERT INTO certificates (staff_id, certificate_date) VALUES ($1, $2)
    ON CONFLICT (staff_id) DO UPDATE SET certificate_date = EXCLUDED.certificate_date
  `, [staffId, now]);
  return now;
}

async function getCertificate(staffId) {
  const { rows } = await pool.query('SELECT * FROM certificates WHERE staff_id = $1', [staffId]);
  return rows[0] || null;
}

// ─── Admin / Tracker Operations ───

async function getTrackerData() {
  const users = await getAllUsers();
  const results = [];
  for (const u of users) {
    const completed = await getProgress(u.staff_id);
    const cert = await getCertificate(u.staff_id);
    results.push({
      staffId: u.staff_id,
      name: u.name,
      role: u.role,
      firstLogin: u.first_login,
      lastActive: u.last_active,
      completed,
      certificateDate: cert?.certificate_date || null
    });
  }
  return results;
}

async function deleteUser(staffId) {
  await pool.query('DELETE FROM users WHERE staff_id = $1', [staffId]);
}

// ─── Password Authentication Functions ───

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function createUserWithPassword(staffId, name, email, role, passwordHash) {
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO users (staff_id, name, email, role, password_hash, first_login, last_active, password_reset_required)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING *`,
    [staffId, name, email.toLowerCase().trim(), role, passwordHash, now, now]
  );
  return rows[0];
}

async function updateUserPassword(staffId, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, password_reset_required = FALSE,
         failed_login_attempts = 0, account_locked = FALSE
     WHERE staff_id = $2`,
    [passwordHash, staffId]
  );
}

async function incrementFailedLogin(staffId) {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = failed_login_attempts + 1,
         last_failed_login = NOW(),
         account_locked = CASE
           WHEN failed_login_attempts + 1 >= 5 THEN TRUE
           ELSE FALSE
         END
     WHERE staff_id = $1`,
    [staffId]
  );
}

async function resetFailedLoginAttempts(staffId) {
  await pool.query(
    'UPDATE users SET failed_login_attempts = 0, last_failed_login = NULL WHERE staff_id = $1',
    [staffId]
  );
}

async function createPasswordResetToken(staffId, token, expiresAt, ipAddress) {
  const { rows } = await pool.query(
    `INSERT INTO password_reset_tokens (token, staff_id, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [token, staffId, expiresAt, ipAddress]
  );
  return rows[0];
}

async function getPasswordResetToken(token) {
  const { rows } = await pool.query(
    `SELECT prt.*, u.email, u.name
     FROM password_reset_tokens prt
     JOIN users u ON prt.staff_id = u.staff_id
     WHERE prt.token = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

async function markTokenAsUsed(token) {
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1',
    [token]
  );
}

async function invalidateAllUserTokens(staffId) {
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE staff_id = $1 AND used_at IS NULL',
    [staffId]
  );
}

async function cleanExpiredTokens() {
  await pool.query(
    'DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL \'7 days\''
  );
}

// ─── Module Operations ───

async function getAllModules(includeInactive = false) {
  const query = includeInactive
    ? 'SELECT * FROM modules ORDER BY display_order ASC, id ASC'
    : 'SELECT * FROM modules WHERE is_active = true ORDER BY display_order ASC, id ASC';
  const { rows } = await pool.query(query);
  return rows;
}

async function getModule(moduleId) {
  const { rows } = await pool.query('SELECT * FROM modules WHERE module_id = $1', [moduleId]);
  return rows[0] || null;
}

async function createModule(data) {
  const { module_id, num, title, description, content_html, display_order = 0 } = data;
  const { rows } = await pool.query(`
    INSERT INTO modules (module_id, num, title, description, content_html, display_order)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [module_id, num, title, description, content_html, display_order]);
  return rows[0];
}

async function updateModule(moduleId, data) {
  const { num, title, description, content_html, display_order, is_active } = data;
  const { rows } = await pool.query(`
    UPDATE modules
    SET num = $1, title = $2, description = $3, content_html = $4,
        display_order = $5, is_active = $6, updated_at = NOW()
    WHERE module_id = $7
    RETURNING *
  `, [num, title, description, content_html, display_order, is_active, moduleId]);
  return rows[0] || null;
}

async function deleteModule(moduleId) {
  // Soft delete - set is_active to false
  const { rows } = await pool.query(`
    UPDATE modules SET is_active = false, updated_at = NOW()
    WHERE module_id = $1
    RETURNING *
  `, [moduleId]);
  return rows[0] || null;
}

async function toggleModuleActive(moduleId) {
  const { rows } = await pool.query(`
    UPDATE modules SET is_active = NOT is_active, updated_at = NOW()
    WHERE module_id = $1
    RETURNING *
  `, [moduleId]);
  return rows[0] || null;
}

// ─── Question Operations ───

async function getQuestionsByModule(moduleId, includeInactive = false) {
  const query = includeInactive
    ? 'SELECT * FROM questions WHERE module_id = $1 ORDER BY display_order ASC, id ASC'
    : 'SELECT * FROM questions WHERE module_id = $1 AND is_active = true ORDER BY display_order ASC, id ASC';
  const { rows } = await pool.query(query, [moduleId]);
  return rows;
}

async function getQuestion(questionId) {
  const { rows } = await pool.query('SELECT * FROM questions WHERE id = $1', [questionId]);
  return rows[0] || null;
}

async function createQuestion(data) {
  const { module_id, question_text, explanation, display_order = 0 } = data;
  const { rows } = await pool.query(`
    INSERT INTO questions (module_id, question_text, explanation, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [module_id, question_text, explanation, display_order]);
  return rows[0];
}

async function updateQuestion(questionId, data) {
  const { question_text, explanation, display_order, is_active } = data;
  const { rows } = await pool.query(`
    UPDATE questions
    SET question_text = $1, explanation = $2, display_order = $3,
        is_active = $4, updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `, [question_text, explanation, display_order, is_active, questionId]);
  return rows[0] || null;
}

async function deleteQuestion(questionId) {
  // Hard delete - will cascade to options
  await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
}

// ─── Question Option Operations ───

async function getQuestionOptions(questionId) {
  const { rows } = await pool.query(`
    SELECT * FROM question_options
    WHERE question_id = $1
    ORDER BY display_order ASC, id ASC
  `, [questionId]);
  return rows;
}

async function createQuestionOption(data) {
  const { question_id, option_text, is_correct, display_order = 0 } = data;
  const { rows } = await pool.query(`
    INSERT INTO question_options (question_id, option_text, is_correct, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [question_id, option_text, is_correct, display_order]);
  return rows[0];
}

async function updateQuestionOption(optionId, data) {
  const { option_text, is_correct, display_order } = data;
  const { rows } = await pool.query(`
    UPDATE question_options
    SET option_text = $1, is_correct = $2, display_order = $3
    WHERE id = $4
    RETURNING *
  `, [option_text, is_correct, display_order, optionId]);
  return rows[0] || null;
}

async function deleteQuestionOption(optionId) {
  await pool.query('DELETE FROM question_options WHERE id = $1', [optionId]);
}

// Delete all options for a question and recreate (easier for bulk updates)
async function replaceQuestionOptions(questionId, options) {
  await pool.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);
  const created = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const result = await createQuestionOption({
      question_id: questionId,
      option_text: opt.text || opt.option_text,
      is_correct: opt.is_correct || false,
      display_order: i
    });
    created.push(result);
  }
  return created;
}

// ─── Combined Module + Questions Retrieval ───

async function getModuleWithQuestions(moduleId) {
  const module = await getModule(moduleId);
  if (!module) return null;

  const questions = await getQuestionsByModule(moduleId);
  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const options = await getQuestionOptions(q.id);
      return { ...q, options };
    })
  );

  return { ...module, questions: questionsWithOptions };
}

async function getAllModulesWithQuestions(includeInactive = false) {
  const modules = await getAllModules(includeInactive);
  const modulesWithQuestions = await Promise.all(
    modules.map(async (m) => {
      const questions = await getQuestionsByModule(m.module_id, includeInactive);
      const questionsWithOptions = await Promise.all(
        questions.map(async (q) => {
          const options = await getQuestionOptions(q.id);
          return { ...q, options };
        })
      );
      return { ...m, questions: questionsWithOptions };
    })
  );
  return modulesWithQuestions;
}

module.exports = {
  init,
  shutdown,
  getPool,
  upsertUser,
  getUser,
  touchUser,
  getAllUsers,
  getProgress,
  saveModuleCompletion,
  getQuizAnswers,
  saveQuizAnswers,
  saveCertificate,
  getCertificate,
  getTrackerData,
  deleteUser,
  // Password authentication functions
  getUserByEmail,
  createUserWithPassword,
  updateUserPassword,
  incrementFailedLogin,
  resetFailedLoginAttempts,
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenAsUsed,
  invalidateAllUserTokens,
  cleanExpiredTokens,
  // Module operations
  getAllModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleActive,
  // Question operations
  getQuestionsByModule,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  // Question option operations
  getQuestionOptions,
  createQuestionOption,
  updateQuestionOption,
  deleteQuestionOption,
  replaceQuestionOptions,
  // Combined operations
  getModuleWithQuestions,
  getAllModulesWithQuestions
};
