import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncClerkUser } from '@/lib/db/sync-user';

/**
 * POST /api/auth/sync
 * Called client-side after sign-in to ensure the Clerk user
 * has a corresponding user_accounts row in Neon.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const email = user.emailAddresses?.[0]?.emailAddress ?? null;
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';

    const account = await syncClerkUser(userId, {
      displayName,
      email,
    });

    return NextResponse.json({
      id: account.id,
      display_name: account.display_name,
      user_type: account.user_type,
      plan: account.plan,
      beta_status: account.beta_status || 'none',
    });
  } catch (error) {
    console.error('[auth/sync]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
