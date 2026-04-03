import { getDb } from './neon';
import type {
  DbPlatformConnection,
  DbAnalyticsSnapshot,
  DbEnrichedInsight,
  InsightSection,
  InsightType,
} from './types';
import type { Platform, Post, PlatformProfile } from '../types';

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Neon's tagged-template returns Record<string, unknown>[] — cast through unknown.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rows = any[];

// ============ Platform Connections ============

export async function getActiveConnections(): Promise<DbPlatformConnection[]> {
  const sql = getDb();
  const rows: Rows = await sql`
    SELECT * FROM platform_connections
    WHERE is_active = true
    ORDER BY platform, username
  `;
  return rows as DbPlatformConnection[];
}

export async function getConnectionsByUser(userId: string): Promise<DbPlatformConnection[]> {
  const sql = getDb();
  const rows: Rows = await sql`
    SELECT * FROM platform_connections
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY platform
  `;
  return rows as DbPlatformConnection[];
}

export async function upsertConnection(
  userId: string,
  platform: Platform,
  username: string,
  profile?: Partial<PlatformProfile>,
): Promise<DbPlatformConnection> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO platform_connections (user_id, platform, username, display_name, avatar_url, followers, following, total_posts, bio, verified)
    VALUES (
      ${userId}, ${platform}, ${username},
      ${profile?.displayName ?? null},
      ${profile?.avatarUrl ?? null},
      ${profile?.followers ?? 0},
      ${profile?.following ?? 0},
      ${profile?.totalPosts ?? 0},
      ${profile?.bio ?? null},
      ${profile?.verified ?? false}
    )
    ON CONFLICT (user_id, platform, username)
    DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, platform_connections.display_name),
      avatar_url   = COALESCE(EXCLUDED.avatar_url, platform_connections.avatar_url),
      followers    = EXCLUDED.followers,
      following    = EXCLUDED.following,
      total_posts  = EXCLUDED.total_posts,
      bio          = COALESCE(EXCLUDED.bio, platform_connections.bio),
      verified     = EXCLUDED.verified
    RETURNING *
  `;
  return rows[0] as DbPlatformConnection;
}

// ============ Analytics Snapshots ============

export async function saveSnapshot(
  connectionId: string,
  profile: PlatformProfile,
  posts: Post[],
): Promise<DbAnalyticsSnapshot> {
  const sql = getDb();
  const totalLikes = posts.reduce((s, p) => s + (p.metrics.likes ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.metrics.comments ?? 0), 0);
  const totalViews = posts.reduce((s, p) => s + (p.metrics.views ?? 0), 0);
  const avgEngagement = posts.length > 0
    ? posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length
    : 0;

  const rows = await sql`
    INSERT INTO analytics_snapshots (connection_id, snapshot_data, post_count, total_likes, total_comments, total_views, avg_engagement)
    VALUES (
      ${connectionId},
      ${JSON.stringify({ profile, posts })}::jsonb,
      ${posts.length},
      ${totalLikes},
      ${totalComments},
      ${totalViews},
      ${avgEngagement}
    )
    RETURNING *
  `;

  // Update last_scraped_at on the connection
  await sql`
    UPDATE platform_connections
    SET last_scraped_at = now()
    WHERE id = ${connectionId}
  `;

  return rows[0] as DbAnalyticsSnapshot;
}

export async function getLatestSnapshot(connectionId: string): Promise<DbAnalyticsSnapshot | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM analytics_snapshots
    WHERE connection_id = ${connectionId}
    ORDER BY fetched_at DESC
    LIMIT 1
  `;
  return (rows[0] as DbAnalyticsSnapshot) ?? null;
}

// ============ Enriched Insights ============

export async function saveInsight(params: {
  connectionId: string;
  snapshotId: string | null;
  insightType: InsightType;
  sections: InsightSection[];
  summary: string | null;
  tokensUsed: number;
  modelUsed: string;
}): Promise<DbEnrichedInsight> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO enriched_insights (connection_id, snapshot_id, insight_type, sections, summary, tokens_used, model_used)
    VALUES (
      ${params.connectionId},
      ${params.snapshotId},
      ${params.insightType},
      ${JSON.stringify(params.sections)}::jsonb,
      ${params.summary},
      ${params.tokensUsed},
      ${params.modelUsed}
    )
    RETURNING *
  `;
  return rows[0] as DbEnrichedInsight;
}

export async function getLatestInsight(
  connectionId: string,
  insightType: InsightType = 'full_analysis',
): Promise<DbEnrichedInsight | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM enriched_insights
    WHERE connection_id = ${connectionId}
      AND insight_type = ${insightType}
      AND expires_at > now()
    ORDER BY generated_at DESC
    LIMIT 1
  `;
  return (rows[0] as DbEnrichedInsight) ?? null;
}

// ============ Refresh Log + Cooldown ============

export async function canRefresh(connectionId: string): Promise<{ allowed: boolean; remainingMs: number; lastRefreshAt: string | null }> {
  const sql = getDb();
  const rows = await sql`
    SELECT started_at FROM refresh_log
    WHERE connection_id = ${connectionId}
      AND status IN ('success', 'running')
    ORDER BY started_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) return { allowed: true, remainingMs: 0, lastRefreshAt: null };

  const lastRefresh = new Date(rows[0].started_at as string);
  const elapsed = Date.now() - lastRefresh.getTime();
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);

  return {
    allowed: remaining === 0,
    remainingMs: remaining,
    lastRefreshAt: rows[0].started_at as string,
  };
}

export async function createRefreshLog(
  connectionId: string,
  triggerType: 'scheduled' | 'on_demand',
): Promise<string> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO refresh_log (connection_id, trigger_type, status)
    VALUES (${connectionId}, ${triggerType}, 'running')
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function completeRefreshLog(
  logId: string,
  status: 'success' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE refresh_log
    SET status = ${status}, error_message = ${errorMessage ?? null}, completed_at = now()
    WHERE id = ${logId}
  `;
}
