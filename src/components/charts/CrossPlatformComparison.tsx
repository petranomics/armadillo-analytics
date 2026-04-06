'use client';

import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/lib/constants';
import type { Platform } from '@/lib/types';
import type { PlatformSummary } from '@/lib/compound-metrics';

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function CrossPlatformComparison({ data }: { data: PlatformSummary[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Platform Comparison</h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted text-center px-4">
          Fetch data from 2+ platforms to see comparisons
        </div>
      </div>
    );
  }

  const maxEng = Math.max(...data.map(d => d.engagementRate), 0.1);
  const maxFollowers = Math.max(...data.map(d => d.followers), 1);

  // Find the platform leader for each metric
  const bestEngagement = data.reduce((a, b) => a.engagementRate > b.engagementRate ? a : b);
  const bestReach = data.reduce((a, b) => a.followers > b.followers ? a : b);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-4">Platform Comparison</h3>

      {/* Platform rows */}
      <div className="space-y-3">
        {data.map((d) => {
          const color = PLATFORM_COLORS[d.platform as Platform] ?? '#888';
          const engWidth = (d.engagementRate / maxEng) * 100;
          const reachWidth = (d.followers / maxFollowers) * 100;
          const isBestEng = d.platform === bestEngagement.platform && data.length > 1;
          const isBestReach = d.platform === bestReach.platform && data.length > 1;

          return (
            <div key={d.platform} className="bg-armadillo-bg rounded-xl p-3">
              {/* Platform name + badges */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: color, color: d.platform === 'tiktok' ? '#000' : '#fff' }}
                  >
                    {PLATFORM_NAMES[d.platform as Platform]?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-armadillo-text">
                    {PLATFORM_NAMES[d.platform as Platform]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isBestEng && (
                    <span className="text-[8px] bg-success/15 text-success px-1.5 py-0.5 rounded-full font-medium">
                      Top Engagement
                    </span>
                  )}
                  {isBestReach && (
                    <span className="text-[8px] bg-burnt/15 text-burnt px-1.5 py-0.5 rounded-full font-medium">
                      Top Reach
                    </span>
                  )}
                </div>
              </div>

              {/* Engagement bar */}
              <div className="mb-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-armadillo-muted">Engagement Rate</span>
                  <span className="text-[10px] font-medium text-armadillo-text">{d.engagementRate}%</span>
                </div>
                <div className="h-1.5 bg-armadillo-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${engWidth}%`, backgroundColor: color }}
                  />
                </div>
              </div>

              {/* Reach + posts row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-armadillo-muted">
                  {formatNum(d.followers)} followers &middot; {d.postCount} posts
                </span>
                <span className="text-[10px] text-armadillo-muted">
                  {formatNum(d.totalEng)} total eng
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      {data.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-armadillo-border/50">
          <p className="text-[11px] text-armadillo-muted leading-relaxed">
            <span className="text-burnt font-medium">{PLATFORM_NAMES[bestEngagement.platform as Platform]}</span> drives your highest engagement rate ({bestEngagement.engagementRate}%),
            while <span className="text-burnt font-medium">{PLATFORM_NAMES[bestReach.platform as Platform]}</span> has the broadest reach ({formatNum(bestReach.followers)} followers).
          </p>
        </div>
      )}
    </div>
  );
}
