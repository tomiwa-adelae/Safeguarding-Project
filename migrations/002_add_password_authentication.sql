-- ═══════════════════════════════════════════════════════════════
-- Migration: Add Password Authentication
-- Created: 2026-02-13
-- Description: Adds password-based authentication system with email
--              reset tokens, and session management tables
-- ═══════════════════════════════════════════════════════════════

-- ─── Add authentication columns to users table ───
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ DEFAULT NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Create password_reset_tokens table ───
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              SERIAL PRIMARY KEY,
  token           VARCHAR(255) UNIQUE NOT NULL,
  staff_id        VARCHAR(255) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ DEFAULT NULL,
  ip_address      VARCHAR(45) DEFAULT NULL  -- For audit trail (supports IPv4 and IPv6)
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_staff_id ON password_reset_tokens (staff_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens (expires_at);

-- ─── Create sessions table for express-session ───
CREATE TABLE IF NOT EXISTS sessions (
  sid           VARCHAR(255) PRIMARY KEY,
  sess          JSONB NOT NULL,
  expire        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);

-- ─── Mark all existing users as requiring password setup ───
UPDATE users
SET password_reset_required = TRUE
WHERE password_hash IS NULL;

-- ─── Create migrations tracking table ───
CREATE TABLE IF NOT EXISTS migrations (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) UNIQUE NOT NULL,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Record this migration
INSERT INTO migrations (name)
VALUES ('002_add_password_authentication')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Verification: Display migration status
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  user_count INTEGER;
  users_needing_password INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO users_needing_password FROM users WHERE password_reset_required = TRUE;

  RAISE NOTICE '✅ Password authentication migration complete';
  RAISE NOTICE '   - Added password_hash, email, password_reset_required to users table';
  RAISE NOTICE '   - Added account_locked, failed_login_attempts, last_failed_login columns';
  RAISE NOTICE '   - Created password_reset_tokens table';
  RAISE NOTICE '   - Created sessions table';
  RAISE NOTICE '   - Created migrations tracking table';
  RAISE NOTICE '   - Total users: %', user_count;
  RAISE NOTICE '   - Users requiring password setup: %', users_needing_password;
END $$;
