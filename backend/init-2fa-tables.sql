-- Two-Factor Authentication Database Tables
-- Run this script to create the required tables for 2FA functionality

-- Add two_factor_enabled column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Create user_2fa table for storing 2FA secrets and settings
CREATE TABLE IF NOT EXISTS user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(500) NOT NULL,
    backup_codes TEXT, -- JSON array of backup codes
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    UNIQUE(user_id)
);

-- Create twofa_attempts table for logging 2FA attempts
CREATE TABLE IF NOT EXISTS twofa_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_type VARCHAR(50) NOT NULL, -- 'setup', 'login', 'disable'
    code_used VARCHAR(20), -- The code that was used (for tracking)
    is_successful BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_twofa_attempts_user_id ON twofa_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_twofa_attempts_type ON twofa_attempts(attempt_type);
CREATE INDEX IF NOT EXISTS idx_twofa_attempts_time ON twofa_attempts(created_at);

-- Insert some initial data if needed (optional)
-- You can add any default configurations here

COMMIT;