import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/neon';

function checkAdminKey(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key')?.trim();
  const envKey = process.env.BETA_ADMIN_KEY?.trim();
  if (!envKey) {
    console.error('[admin/beta] BETA_ADMIN_KEY env var is not set');
    return false;
  }
  return key === envKey;
}

export async function GET(request: NextRequest) {
  if (!checkAdminKey(request)) {
    const hasEnv = !!process.env.BETA_ADMIN_KEY;
    return NextResponse.json({ error: 'Unauthorized', _debug: { envSet: hasEnv } }, { status: 401 });
  }

  const sql = getDb();
  const statusFilter = request.nextUrl.searchParams.get('status');

  const rows = statusFilter
    ? await sql`
        SELECT * FROM beta_requests WHERE status = ${statusFilter} ORDER BY created_at DESC
      `
    : await sql`
        SELECT * FROM beta_requests ORDER BY created_at DESC
      `;

  // Get counts
  const counts = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'denied') as denied,
      COUNT(*) as total
    FROM beta_requests
  `;

  return NextResponse.json({
    requests: rows,
    counts: counts[0] || { pending: 0, approved: 0, denied: 0, total: 0 },
  });
}
