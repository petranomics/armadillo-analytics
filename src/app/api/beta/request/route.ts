import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db/neon';
import { syncClerkUser } from '@/lib/db/sync-user';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || null;
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';

    // Ensure user exists in DB
    const account = await syncClerkUser(userId, { displayName, email });

    const sql = getDb();

    // Check if already requested
    const existing = await sql`
      SELECT status FROM beta_requests WHERE clerk_id = ${userId} ORDER BY created_at DESC LIMIT 1
    `;
    if (existing.length > 0 && existing[0].status === 'pending') {
      return NextResponse.json({ status: 'pending', message: 'Request already submitted' });
    }
    if (existing.length > 0 && existing[0].status === 'approved') {
      return NextResponse.json({ status: 'approved' });
    }

    // Insert beta request
    await sql`
      INSERT INTO beta_requests (user_id, clerk_id, email, display_name, reason)
      VALUES (${account.id}, ${userId}, ${email}, ${displayName}, ${reason})
    `;

    // Update user status
    await sql`
      UPDATE user_accounts SET beta_status = 'pending' WHERE id = ${account.id}
    `;

    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('[beta/request]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
