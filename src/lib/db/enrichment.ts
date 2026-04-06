import Anthropic from '@anthropic-ai/sdk';
import { runActorSync, getActorInput, getTrendActorInput } from '../apify';
import type { Platform, Post, PlatformProfile } from '../types';
import type { InsightSection, InsightType, DbPlatformConnection } from './types';
import {
  getActiveConnections,
  saveSnapshot,
  getLatestSnapshot,
  saveInsight,
  getLatestInsight,
  canRefresh,
  createRefreshLog,
  completeRefreshLog,
} from './queries';

// ============ Configuration ============

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 2048;
const BATCH_SIZE = 3;              // accounts per batch to avoid rate limits
const BATCH_DELAY_MS = 2_000;      // pause between batches

// ============ Platform-specific post normalization ============

function normalizeInstagramPosts(raw: Record<string, unknown>[]): { profile: PlatformProfile; posts: Post[] } {
  const first = raw[0] ?? {};
  const profile: PlatformProfile = {
    platform: 'instagram',
    username: String(first.username ?? first.ownerUsername ?? ''),
    displayName: String(first.ownerFullName ?? first.fullName ?? ''),
    avatarUrl: String(first.profilePicUrlHD ?? first.profilePicUrl ?? ''),
    followers: Number(first.followersCount ?? first.followCount ?? 0),
    following: Number(first.followingCount ?? first.followsCount ?? 0),
    totalPosts: Number(first.profilePostsCount ?? first.postsCount ?? 0),
    bio: first.biography as string | undefined,
    verified: Boolean(first.isVerified ?? first.verified),
    isBusinessAccount: Boolean(first.isBusinessAccount),
    businessCategory: first.businessCategoryName as string | undefined,
  };

  const latestPosts = (first.latestPosts ?? raw) as Record<string, unknown>[];
  const posts: Post[] = latestPosts.map((p, i) => {
    const likes = Number(p.likesCount ?? p.likes ?? 0);
    const comments = Number(p.commentsCount ?? p.comments ?? 0);
    const views = Number(p.videoViewCount ?? p.views ?? 0);
    const engagement = profile.followers > 0
      ? ((likes + comments) / profile.followers) * 100
      : 0;

    return {
      id: String(p.id ?? p.shortCode ?? `ig-${i}`),
      platform: 'instagram' as Platform,
      url: p.url ? String(p.url) : `https://instagram.com/p/${p.shortCode}`,
      caption: String(p.caption ?? ''),
      thumbnailUrl: String(p.displayUrl ?? ''),
      hashtags: (p.hashtags as string[]) ?? [],
      mentions: (p.mentions as string[]) ?? [],
      publishedAt: String(p.timestamp ?? p.publishedAt ?? new Date().toISOString()),
      metrics: { likes, comments, views, shares: 0 },
      engagementRate: Math.round(engagement * 100) / 100,
      shortCode: p.shortCode as string | undefined,
      locationName: p.locationName as string | undefined,
    };
  });

  return { profile, posts };
}

function normalizeTikTokPosts(raw: Record<string, unknown>[]): { profile: PlatformProfile; posts: Post[] } {
  const first = raw[0] ?? {};
  const authorMeta = (first.authorMeta ?? {}) as Record<string, unknown>;

  const profile: PlatformProfile = {
    platform: 'tiktok',
    username: String(authorMeta.name ?? first.author ?? ''),
    displayName: String(authorMeta.nickName ?? authorMeta.name ?? ''),
    avatarUrl: String(authorMeta.avatar ?? ''),
    followers: Number(authorMeta.fans ?? 0),
    following: Number(authorMeta.following ?? 0),
    totalPosts: Number(authorMeta.video ?? 0),
    bio: authorMeta.signature as string | undefined,
    verified: Boolean(authorMeta.verified),
  };

  const posts: Post[] = raw.map((p, i) => {
    const likes = Number(p.diggCount ?? p.likes ?? 0);
    const comments = Number(p.commentCount ?? p.comments ?? 0);
    const shares = Number(p.shareCount ?? p.shares ?? 0);
    const views = Number(p.playCount ?? p.views ?? 0);
    const engagement = profile.followers > 0
      ? ((likes + comments + shares) / profile.followers) * 100
      : 0;

    return {
      id: String(p.id ?? `tt-${i}`),
      platform: 'tiktok' as Platform,
      url: String(p.webVideoUrl ?? p.url ?? ''),
      caption: String(p.text ?? p.caption ?? ''),
      thumbnailUrl: String((p.covers as Record<string, unknown>)?.default ?? p.thumbnailUrl ?? ''),
      hashtags: ((p.hashtags as Record<string, unknown>[]) ?? []).map(h => String(h.name ?? h)),
      publishedAt: p.createTimeISO ? String(p.createTimeISO) : new Date(Number(p.createTime ?? 0) * 1000).toISOString(),
      metrics: { likes, comments, shares, views },
      engagementRate: Math.round(engagement * 100) / 100,
    };
  });

  return { profile, posts };
}

// LinkedIn placeholder — same shape, will fill in when API is live
function normalizeLinkedInPosts(raw: Record<string, unknown>[]): { profile: PlatformProfile; posts: Post[] } {
  const profile: PlatformProfile = {
    platform: 'linkedin',
    username: '',
    displayName: '',
    followers: 0,
    totalPosts: 0,
  };

  const posts: Post[] = raw.map((p, i) => ({
    id: String(p.id ?? `li-${i}`),
    platform: 'linkedin' as Platform,
    url: String(p.url ?? ''),
    caption: String(p.text ?? p.caption ?? ''),
    publishedAt: String(p.publishedAt ?? new Date().toISOString()),
    metrics: {
      likes: Number(p.numLikes ?? p.likes ?? 0),
      comments: Number(p.numComments ?? p.comments ?? 0),
      shares: Number(p.numShares ?? p.shares ?? 0),
    },
    engagementRate: 0,
  }));

  return { profile, posts };
}

export function normalizePosts(platform: Platform, raw: Record<string, unknown>[]): { profile: PlatformProfile; posts: Post[] } {
  switch (platform) {
    case 'instagram': return normalizeInstagramPosts(raw);
    case 'tiktok':    return normalizeTikTokPosts(raw);
    case 'linkedin':  return normalizeLinkedInPosts(raw);
    default:          throw new Error(`Normalization not yet implemented for ${platform}`);
  }
}

// ============ Apify data fetching ============

function getApifyKey(): string {
  const key = process.env.APIFY_API_KEY
    || process.env.APIFY_API_KEY_IG
    || process.env.APIFY_API_KEY_TIKTOK
    || process.env.APIFY_API_KEY_LINKEDIN;
  if (!key) throw new Error('No Apify API key configured');
  return key;
}

export async function scrapeAccount(platform: Platform, username: string): Promise<{ profile: PlatformProfile; posts: Post[] }> {
  const token = getApifyKey();
  const { actorId, input } = getActorInput(platform, username);
  const raw = await runActorSync(actorId, input, token) as Record<string, unknown>[];
  return normalizePosts(platform, raw);
}

async function fetchTrendContext(platform: Platform): Promise<Record<string, unknown>> {
  const token = getApifyKey();
  const trends: Record<string, unknown> = {};

  try {
    if (platform === 'instagram') {
      const { actorId, input } = getTrendActorInput('instagramHashtags', { keywords: ['trending'] });
      trends.hashtagStats = await runActorSync(actorId, input, token);
    }
    if (platform === 'tiktok') {
      const { actorId, input } = getTrendActorInput('tiktokTrends', {});
      trends.tiktokTrends = await runActorSync(actorId, input, token);
    }
  } catch (err) {
    console.warn(`[enrichment] Trend fetch failed for ${platform}:`, err);
  }

  return trends;
}

// ============ Claude insight generation ============

const ENRICHMENT_SYSTEM_PROMPT = `You are a senior social media strategist producing a concise performance brief. These reports are cached and displayed on dashboards — keep them tight and specific.

Rules:
- Every claim must cite a specific number from the data. Never invent metrics.
- Lead with the finding, then the implication. Skip preamble.
- Avoid: "This means...", "Interestingly...", "It's worth noting...", "In today's landscape..."
- Write like a consultant delivering a weekly briefing — factual, direct, actionable.
- Recommendations must be specific enough to execute immediately.

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "summary": "One sentence stating the account's current trajectory and primary opportunity.",
  "sections": [
    { "icon": "📊", "title": "Performance Overview",     "body": "..." },
    { "icon": "📈", "title": "Engagement Patterns",      "body": "...", "bullets": ["..."] },
    { "icon": "🎯", "title": "Content Strategy",         "body": "...", "bullets": ["..."] },
    { "icon": "👥", "title": "Audience Signals",          "body": "..." },
    { "icon": "🔥", "title": "Opportunities",            "body": null, "bullets": ["..."] },
    { "icon": "💡", "title": "Next Steps",               "body": null, "bullets": ["..."] }
  ]
}`;

function buildUserPrompt(profile: PlatformProfile, posts: Post[], trends: Record<string, unknown>): string {
  const totalLikes = posts.reduce((s, p) => s + (p.metrics.likes ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.metrics.comments ?? 0), 0);
  const totalViews = posts.reduce((s, p) => s + (p.metrics.views ?? 0), 0);
  const avgEngagement = posts.length > 0
    ? (posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length).toFixed(2)
    : '0';

  const topPosts = [...posts].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5);

  const postSummaries = topPosts.map((p, i) => ({
    rank: i + 1,
    caption: p.caption.slice(0, 200),
    likes: p.metrics.likes,
    comments: p.metrics.comments,
    views: p.metrics.views,
    engagement: p.engagementRate + '%',
    hashtags: p.hashtags?.slice(0, 5),
    publishedAt: p.publishedAt,
  }));

  return `Account: @${profile.username} on ${profile.platform}
Followers: ${profile.followers.toLocaleString()}
Total posts analyzed: ${posts.length}

Aggregates:
- Total likes: ${totalLikes.toLocaleString()}
- Total comments: ${totalComments.toLocaleString()}
- Total views: ${totalViews.toLocaleString()}
- Avg engagement rate: ${avgEngagement}%

Top 5 posts by engagement:
${JSON.stringify(postSummaries, null, 2)}

${Object.keys(trends).length > 0 ? `Platform trends:\n${JSON.stringify(trends, null, 2)}` : 'No trend context available.'}

Generate the enrichment report. JSON only.`;
}

export async function generateInsights(
  profile: PlatformProfile,
  posts: Post[],
  trends: Record<string, unknown>,
): Promise<{ sections: InsightSection[]; summary: string; tokensUsed: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ENRICHMENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(profile, posts, trends) }],
  });

  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  const json = textBlock.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(json);

  const tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);

  return {
    sections: parsed.sections as InsightSection[],
    summary: parsed.summary ?? null,
    tokensUsed,
  };
}

// ============ Single-account enrichment pipeline ============

export async function enrichAccount(
  connection: DbPlatformConnection,
  triggerType: 'scheduled' | 'on_demand',
): Promise<{ success: boolean; error?: string }> {
  const logId = await createRefreshLog(connection.id, triggerType);

  try {
    // 1. Scrape fresh data
    const { profile, posts } = await scrapeAccount(connection.platform, connection.username);

    // 2. Save snapshot
    const snapshot = await saveSnapshot(connection.id, profile, posts);

    // 3. Fetch trend context (best-effort)
    const trends = await fetchTrendContext(connection.platform);

    // 4. Generate Claude insights
    const { sections, summary, tokensUsed } = await generateInsights(profile, posts, trends);

    // 5. Store enriched insights
    await saveInsight({
      connectionId: connection.id,
      snapshotId: snapshot.id,
      insightType: 'full_analysis' as InsightType,
      sections,
      summary,
      tokensUsed,
      modelUsed: MODEL,
    });

    await completeRefreshLog(logId, 'success');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[enrichment] Failed for ${connection.platform}/@${connection.username}:`, message);
    await completeRefreshLog(logId, 'failed', message);
    return { success: false, error: message };
  }
}

// ============ Batch enrichment (scheduled refresh) ============

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function enrichAllAccounts(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  errors: { platform: string; username: string; error: string }[];
}> {
  const connections = await getActiveConnections();
  const results = { total: connections.length, succeeded: 0, failed: 0, errors: [] as { platform: string; username: string; error: string }[] };

  // Process in batches
  for (let i = 0; i < connections.length; i += BATCH_SIZE) {
    const batch = connections.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(conn => enrichAccount(conn, 'scheduled')),
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const conn = batch[j];
      if (result.status === 'fulfilled' && result.value.success) {
        results.succeeded++;
      } else {
        results.failed++;
        const error = result.status === 'rejected'
          ? String(result.reason)
          : (result.value.error ?? 'Unknown error');
        results.errors.push({ platform: conn.platform, username: conn.username, error });
      }
    }

    // Pause between batches to respect rate limits
    if (i + BATCH_SIZE < connections.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return results;
}

// ============ On-demand enrichment (with cooldown) ============

export async function enrichOnDemand(connectionId: string): Promise<
  | { success: true; cached: boolean }
  | { success: false; error: string; cooldown_remaining_ms?: number }
> {
  // Check cooldown
  const { allowed, remainingMs } = await canRefresh(connectionId);
  if (!allowed) {
    // Return cached insight if available
    const cached = await getLatestInsight(connectionId);
    if (cached) return { success: true, cached: true };
    return { success: false, error: 'Cooldown active', cooldown_remaining_ms: remainingMs };
  }

  // Fetch connection
  const sql = (await import('./neon')).getDb();
  const rows = await sql`SELECT * FROM platform_connections WHERE id = ${connectionId} AND is_active = true`;
  if (rows.length === 0) return { success: false, error: 'Connection not found' };

  const connection = rows[0] as DbPlatformConnection;
  const result = await enrichAccount(connection, 'on_demand');

  if (result.success) return { success: true, cached: false };
  return { success: false, error: result.error ?? 'Enrichment failed' };
}
