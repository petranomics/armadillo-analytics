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
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIFY_API_KEY is not configured on the server. Add it to .env.local' },
        { status: 500 }
      );
    }

    const { actorId, input } = getActorInput(platform, username);
    const results = await runActorSync(actorId, input, apiKey);

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
