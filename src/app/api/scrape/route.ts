import { NextRequest, NextResponse } from 'next/server';
import { runActorSync, getActorInput } from '@/lib/apify';
import type { Platform } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, username } = body as {
      platform: Platform;
      username: string;
    };

    if (!platform || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, username' },
        { status: 400 }
      );
    }

    // API key lives server-side only — never sent from the client
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

    const { actorId, input } = getActorInput(platform, username);
    const rawResults = await runActorSync(actorId, input, apiKey);

    // Instagram "details" response: first item is the profile with latestPosts inside
    if (platform === 'instagram' && rawResults.length > 0) {
      const profile = rawResults[0] as Record<string, unknown>;
      const posts = (profile.latestPosts || []) as Record<string, unknown>[];
      // Attach profile-level data to each post so PlatformPage can extract it
      const enrichedPosts = posts.map(post => ({
        ...post,
        followersCount: profile.followersCount,
        followingCount: profile.followsCount,
        ownerFullName: profile.fullName,
        biography: profile.biography,
        isVerified: profile.verified,
        profilePostsCount: profile.postsCount,
      }));
      return NextResponse.json({ results: enrichedPosts });
    }

    return NextResponse.json({ results: rawResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
