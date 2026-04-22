import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBetaStatus } from '@/lib/db/sync-user';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { status, maxPlatforms } = await getBetaStatus(userId);
    return NextResponse.json({ status, maxPlatforms });
  } catch (error) {
    console.error('[beta/status]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
