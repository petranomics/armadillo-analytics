import { NextRequest, NextResponse } from 'next/server';
import { enrichAllAccounts } from '@/lib/db/enrichment';

/**
 * GET /api/cron/enrich
 *
 * Scheduled endpoint — call every 12 hours via Vercel Cron.
 * Enriches all active platform connections in batches.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocation.
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or an authorized caller
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[cron/enrich] Starting scheduled enrichment...');
    const results = await enrichAllAccounts();
    console.log(`[cron/enrich] Complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed`);

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    console.error('[cron/enrich] Fatal error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
