import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/neon';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = request.headers.get('x-admin-key');
  if (key !== process.env.BETA_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const sql = getDb();

  // Get the request
  const rows = await sql`SELECT * FROM beta_requests WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const betaRequest = rows[0] as { clerk_id: string; user_id: string | null };

  // Approve
  await sql`
    UPDATE beta_requests SET status = 'approved', reviewed_at = now() WHERE id = ${id}
  `;

  // Update user account
  if (betaRequest.user_id) {
    await sql`
      UPDATE user_accounts SET beta_status = 'approved' WHERE id = ${betaRequest.user_id}
    `;
  } else {
    await sql`
      UPDATE user_accounts SET beta_status = 'approved' WHERE clerk_id = ${betaRequest.clerk_id}
    `;
  }

  return NextResponse.json({ success: true, status: 'approved' });
}
