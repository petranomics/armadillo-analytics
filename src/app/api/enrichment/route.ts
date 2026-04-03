import { NextRequest, NextResponse } from 'next/server';
import { enrichOnDemand } from '@/lib/db/enrichment';
import { getLatestSnapshot, getLatestInsight, canRefresh } from '@/lib/db/queries';
import type { EnrichedAccountResponse, InsightType } from '@/lib/db/types';

/**
 * GET /api/enrichment?connectionId=<uuid>&type=full_analysis
 * Returns cached enriched data for a connection.
 */
export async function GET(request: NextRequest) {
  try {
    const connectionId = request.nextUrl.searchParams.get('connectionId');
    const insightType = (request.nextUrl.searchParams.get('type') ?? 'full_analysis') as InsightType;

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    const [snapshot, insight, refreshStatus] = await Promise.all([
      getLatestSnapshot(connectionId),
      getLatestInsight(connectionId, insightType),
      canRefresh(connectionId),
    ]);

    const response: Partial<EnrichedAccountResponse> = {
      latest_snapshot: snapshot ? {
        id: snapshot.id,
        post_count: snapshot.post_count,
        total_likes: snapshot.total_likes,
        total_comments: snapshot.total_comments,
        total_views: snapshot.total_views,
        avg_engagement: snapshot.avg_engagement,
        fetched_at: snapshot.fetched_at,
      } : null,
      insights: insight ? {
        id: insight.id,
        insight_type: insight.insight_type,
        sections: insight.sections,
        summary: insight.summary,
        generated_at: insight.generated_at,
        expires_at: insight.expires_at,
      } : null,
      refresh_status: {
        can_refresh: refreshStatus.allowed,
        cooldown_remaining_ms: refreshStatus.remainingMs,
        last_refresh_at: refreshStatus.lastRefreshAt,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[enrichment GET]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/enrichment
 * Triggers on-demand enrichment for a single connection.
 * Body: { connectionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { connectionId } = (await request.json()) as { connectionId: string };

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    const result = await enrichOnDemand(connectionId);

    if (!result.success) {
      const status = 'cooldown_remaining_ms' in result ? 429 : 500;
      return NextResponse.json(result, { status });
    }

    // Return the freshly enriched data
    const [snapshot, insight, refreshStatus] = await Promise.all([
      getLatestSnapshot(connectionId),
      getLatestInsight(connectionId),
      canRefresh(connectionId),
    ]);

    return NextResponse.json({
      cached: result.cached,
      latest_snapshot: snapshot ? {
        id: snapshot.id,
        post_count: snapshot.post_count,
        total_likes: snapshot.total_likes,
        total_comments: snapshot.total_comments,
        total_views: snapshot.total_views,
        avg_engagement: snapshot.avg_engagement,
        fetched_at: snapshot.fetched_at,
      } : null,
      insights: insight ? {
        id: insight.id,
        insight_type: insight.insight_type,
        sections: insight.sections,
        summary: insight.summary,
        generated_at: insight.generated_at,
        expires_at: insight.expires_at,
      } : null,
      refresh_status: {
        can_refresh: refreshStatus.allowed,
        cooldown_remaining_ms: refreshStatus.remainingMs,
        last_refresh_at: refreshStatus.lastRefreshAt,
      },
    });
  } catch (error) {
    console.error('[enrichment POST]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
