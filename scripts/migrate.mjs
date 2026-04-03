import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Run statements individually using sql.query() for raw SQL strings
const statements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  `CREATE TABLE IF NOT EXISTS user_accounts (
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
  )`,

  `CREATE TABLE IF NOT EXISTS platform_connections (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform)`,

  `CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    snapshot_data   JSONB NOT NULL,
    post_count      INTEGER NOT NULL DEFAULT 0,
    total_likes     BIGINT DEFAULT 0,
    total_comments  BIGINT DEFAULT 0,
    total_views     BIGINT DEFAULT 0,
    avg_engagement  REAL DEFAULT 0,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_snapshots_connection ON analytics_snapshots(connection_id)`,
  `CREATE INDEX IF NOT EXISTS idx_snapshots_fetched ON analytics_snapshots(fetched_at DESC)`,

  `CREATE TABLE IF NOT EXISTS enriched_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    snapshot_id     UUID REFERENCES analytics_snapshots(id) ON DELETE SET NULL,
    insight_type    TEXT NOT NULL CHECK (insight_type IN (
                      'full_analysis', 'engagement_patterns',
                      'content_trends', 'audience_signals', 'recommendations'
                    )),
    sections        JSONB NOT NULL,
    summary         TEXT,
    tokens_used     INTEGER DEFAULT 0,
    model_used      TEXT,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '12 hours')
  )`,

  `CREATE INDEX IF NOT EXISTS idx_insights_connection ON enriched_insights(connection_id)`,
  `CREATE INDEX IF NOT EXISTS idx_insights_type ON enriched_insights(insight_type)`,
  `CREATE INDEX IF NOT EXISTS idx_insights_expires ON enriched_insights(expires_at)`,

  `CREATE TABLE IF NOT EXISTS refresh_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('scheduled', 'on_demand')),
    status          TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
  )`,

  `CREATE INDEX IF NOT EXISTS idx_refresh_log_connection ON refresh_log(connection_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_log_started ON refresh_log(started_at DESC)`,

  `CREATE OR REPLACE FUNCTION update_updated_at()
   RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS trg_user_accounts_updated ON user_accounts`,
  `CREATE TRIGGER trg_user_accounts_updated BEFORE UPDATE ON user_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,

  `DROP TRIGGER IF EXISTS trg_platform_connections_updated ON platform_connections`,
  `CREATE TRIGGER trg_platform_connections_updated BEFORE UPDATE ON platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
];

console.log(`Running ${statements.length} statements against Neon...\n`);

let ok = 0;
let fail = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 65);
  try {
    await sql.query(stmt);
    console.log(`  [${i + 1}] OK: ${preview}...`);
    ok++;
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log(`  [${i + 1}] SKIP: ${preview}...`);
      ok++;
    } else {
      console.error(`  [${i + 1}] FAIL: ${preview}...`);
      console.error(`         ${err.message}`);
      fail++;
    }
  }
}

console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);

// Verify
const result = await sql.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name');
console.log('\nTables in database:');
result.rows.forEach(r => console.log(`  - ${r.table_name}`));
