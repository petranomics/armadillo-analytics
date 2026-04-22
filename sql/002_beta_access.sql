-- Beta Access Gating
-- Run this against your Neon database after 001_enrichment_schema.sql

-- Beta access requests
CREATE TABLE IF NOT EXISTS beta_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user_accounts(id),
  clerk_id      TEXT NOT NULL,
  email         TEXT NOT NULL,
  display_name  TEXT,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'denied')),
  max_platforms INTEGER NOT NULL DEFAULT 3,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add beta fields to user_accounts
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS beta_status TEXT DEFAULT 'none'
  CHECK (beta_status IN ('none', 'pending', 'approved', 'denied'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_beta_requests_status ON beta_requests(status);
CREATE INDEX IF NOT EXISTS idx_beta_requests_clerk ON beta_requests(clerk_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_clerk_id ON user_accounts(clerk_id);
