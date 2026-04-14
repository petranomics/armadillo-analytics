import { NextRequest, NextResponse } from 'next/server';
import { enrichAllAccounts } from '@/lib/db/enrichment';

/**
 * GET /api/cron/enrich
 *
 * Scheduled endpoint — runs daily at 3:00 AM UTC via Vercel Cron.
 * Enriches all active platform connections in batches.
 * Model and interval configurable via env vars (CLAUDE_MODEL, etc.)
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
    const startTime = Date.now();
    console.log(`[cron/enrich] Starting scheduled enrichment at ${new Date().toISOString()} (trigger: scheduled)`);
    const results = await enrichAllAccounts();
    const durationMs = Date.now() - startTime;
    console.log(`[cron/enrich] Complete: ${results.succeeded}/${results.total} succeeded, ${results.failed} failed (${durationMs}ms)`);

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
