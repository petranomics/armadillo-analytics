-- Armadillo Analytics: Enrichment Schema for Neon PostgreSQL
-- Run this against your Neon database to set up enrichment tables.

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. User Accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS user_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT NOT NULL,
  email         TEXT UNIQUE,
  user_type     TEXT NOT NULL CHECK (user_type IN (
                  'influencer', 'linkedin-creator', 'tiktok-shop',
                  'youtuber', 'local-business', 'media-outlet'
                )),
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'lite', 'pro')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Platform Connections
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN (
                    'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin'
                  )),
  username        TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  followers       INTEGER DEFAULT 0,
  following       INTEGER DEFAULT 0,
  total_posts     INTEGER DEFAULT 0,
  bio             TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, platform, username)
);

CREATE INDEX idx_platform_connections_user ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);

-- ============================================================
-- 3. Analytics Snapshots (cached raw data from Apify scrapes)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  snapshot_data   JSONB NOT NULL,        -- Full Post[] + PlatformProfile from scraper
  post_count      INTEGER NOT NULL DEFAULT 0,
  total_likes     BIGINT DEFAULT 0,
  total_comments  BIGINT DEFAULT 0,
  total_views     BIGINT DEFAULT 0,
  avg_engagement  REAL DEFAULT 0,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_connection ON analytics_snapshots(connection_id);
CREATE INDEX idx_snapshots_fetched ON analytics_snapshots(fetched_at DESC);

-- ============================================================
-- 4. Enriched Insights (Claude-generated analysis)
-- ============================================================
CREATE TABLE IF NOT EXISTS enriched_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  snapshot_id     UUID REFERENCES analytics_snapshots(id) ON DELETE SET NULL,
  insight_type    TEXT NOT NULL CHECK (insight_type IN (
                    'full_analysis', 'engagement_patterns',
                    'content_trends', 'audience_signals', 'recommendations'
                  )),
  sections        JSONB NOT NULL,        -- Array of { icon, title, body, bullets? }
  summary         TEXT,                  -- One-line TL;DR
  tokens_used     INTEGER DEFAULT 0,    -- Track Anthropic token spend
  model_used      TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '12 hours')
);

CREATE INDEX idx_insights_connection ON enriched_insights(connection_id);
CREATE INDEX idx_insights_type ON enriched_insights(insight_type);
CREATE INDEX idx_insights_expires ON enriched_insights(expires_at);

-- ============================================================
-- 5. Refresh Log (tracks scheduled + on-demand refreshes)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'on_demand')),
  status          TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_refresh_log_connection ON refresh_log(connection_id);
CREATE INDEX idx_refresh_log_started ON refresh_log(started_at DESC);

-- ============================================================
-- Helper: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_accounts_updated
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_platform_connections_updated
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
