import { NextRequest, NextResponse } from 'next/server';
import { runActorSync, getTrendActorInput } from '@/lib/apify';
import { normalizeTrendResults } from '@/lib/trend-data';
import type { TrendSource } from '@/lib/types';

const VALID_SOURCES: TrendSource[] = ['instagramHashtags', 'instagramHashtagPosts', 'redditTrends', 'tiktokTrends'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, params } = body as {
      source: TrendSource;
      params: Record<string, unknown>;
    };

    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    // Resolve API key with fallback chain
    const apiKey =
      process.env.APIFY_API_KEY ||
      process.env.APIFY_API_KEY_IG ||
      process.env.APIFY_API_KEY_TIKTOK ||
      process.env.APIFY_API_KEY_LINKEDIN;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Apify API key configured. Add APIFY_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { actorId, input } = getTrendActorInput(source, params || {});
    const rawResults = await runActorSync(actorId, input, apiKey);
    const normalized = normalizeTrendResults(source, rawResults);

    return NextResponse.json(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
