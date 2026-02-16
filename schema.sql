-- ═══════════════════════════════════════════════════════════════
-- Project STAR Safeguarding Course — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════
-- Run this file against your PostgreSQL database to create the
-- required tables. Safe to re-run (uses IF NOT EXISTS).
--
-- Usage:
--   psql -h <host> -U <user> -d <database> -f schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── Learner accounts ───
CREATE TABLE IF NOT EXISTS users (
  staff_id     VARCHAR(255) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(100) DEFAULT '',
  first_login  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_active  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_last_active ON users (last_active DESC);

-- ─── Module completion records ───
CREATE TABLE IF NOT EXISTS progress (
  staff_id     VARCHAR(255) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  module_id    VARCHAR(50)  NOT NULL,
  score        INTEGER      NOT NULL,
  total        INTEGER      NOT NULL,
  passed       BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (staff_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_staff ON progress (staff_id);

-- ─── Saved quiz answers (for resume) ───
CREATE TABLE IF NOT EXISTS quiz_answers (
  staff_id     VARCHAR(255) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  module_id    VARCHAR(50)  NOT NULL,
  answers      JSONB        NOT NULL DEFAULT '{}',
  PRIMARY KEY (staff_id, module_id)
);

-- ─── Certificate records ───
CREATE TABLE IF NOT EXISTS certificates (
  staff_id         VARCHAR(255) PRIMARY KEY REFERENCES users(staff_id) ON DELETE CASCADE,
  certificate_date TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Modules (Course Content) ───
CREATE TABLE IF NOT EXISTS modules (
  id              SERIAL PRIMARY KEY,
  module_id       VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'm1', 'm2'
  num             VARCHAR(50) NOT NULL,         -- e.g., 'Module 1'
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  content_html    TEXT NOT NULL,                -- HTML content for the module
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_order ON modules (display_order ASC, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules (is_active);

-- ─── Quiz Questions ───
CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  module_id       VARCHAR(50) NOT NULL,         -- References modules.module_id
  question_text   TEXT NOT NULL,
  explanation     TEXT NOT NULL,                -- Shown after answer
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_module ON questions (module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions (is_active);

-- ─── Quiz Answer Options ───
CREATE TABLE IF NOT EXISTS question_options (
  id              SERIAL PRIMARY KEY,
  question_id     INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text     TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_question ON question_options (question_id, display_order);

-- ═══════════════════════════════════════════════════════════════
-- Verification: list all tables created
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '✅ Schema created successfully.';
  RAISE NOTICE '   Tables: users, progress, quiz_answers, certificates, modules, questions, question_options';
END $$;
