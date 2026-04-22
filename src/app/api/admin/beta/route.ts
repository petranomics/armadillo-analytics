import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/neon';

function checkAdminKey(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-key');
  return key === process.env.BETA_ADMIN_KEY;
}

export async function GET(request: NextRequest) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
