'use client';

import type { Post } from '@/lib/types';
import { Zap } from 'lucide-react';

interface ContentPerformanceChartProps {
  posts: Post[];
}

interface Signal {
  label: string;
  withLabel: string;
  withoutLabel: string;
  withAvg: number;
  withoutAvg: number;
  lift: number;
  // Track which posts are in the "with" group so we can dedupe overlapping signals
  withPostIds: string[];
}

function computeAvgEng(posts: Post[]): number {
  if (posts.length === 0) return 0;
  return posts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0) / posts.length;
}

function trySignal(
  label: string,
  withLabel: string,
  withoutLabel: string,
  withPosts: Post[],
  withoutPosts: Post[],
): Signal | null {
  if (withPosts.length < 2 || withoutPosts.length < 2) return null;
  const wAvg = computeAvgEng(withPosts);
  const woAvg = computeAvgEng(withoutPosts);
  // Skip if the difference is negligible (< 5%)
  if (woAvg > 0 && Math.abs(wAvg - woAvg) / woAvg < 0.05) return null;
  if (wAvg === 0 && woAvg === 0) return null;
  return {
    label,
    withLabel,
    withoutLabel,
    withAvg: Math.round(wAvg),
    withoutAvg: Math.round(woAvg),
    lift: woAvg > 0 ? Math.round(((wAvg - woAvg) / woAvg) * 100) : 0,
    withPostIds: withPosts.map(p => p.id).sort(),
  };
}

function buildSignals(posts: Post[]): Signal[] {
  const candidates: (Signal | null)[] = [
    // Location tagged vs not
    trySignal(
      'Location Tag',
      `Tagged (${posts.filter(p => !!p.locationName).length})`,
      `No tag (${posts.filter(p => !p.locationName).length})`,
      posts.filter(p => !!p.locationName),
      posts.filter(p => !p.locationName),
    ),
    // Collab tags vs solo
    trySignal(
      'Collab Tags',
      `Tagged (${posts.filter(p => p.taggedUsers && p.taggedUsers.length > 0).length})`,
      `Solo (${posts.filter(p => !p.taggedUsers || p.taggedUsers.length === 0).length})`,
      posts.filter(p => p.taggedUsers && p.taggedUsers.length > 0),
      posts.filter(p => !p.taggedUsers || p.taggedUsers.length === 0),
    ),
    // Original audio vs licensed
    trySignal(
      'Audio Type',
      `Original (${posts.filter(p => p.musicInfo?.uses_original_audio === true).length})`,
      `Licensed (${posts.filter(p => p.musicInfo && !p.musicInfo.uses_original_audio).length})`,
      posts.filter(p => p.musicInfo?.uses_original_audio === true),
      posts.filter(p => p.musicInfo !== undefined && !p.musicInfo.uses_original_audio),
    ),
    // Has hashtags vs no hashtags
    trySignal(
      'Hashtags',
      `With (${posts.filter(p => p.hashtags && p.hashtags.length > 0).length})`,
      `Without (${posts.filter(p => !p.hashtags || p.hashtags.length === 0).length})`,
      posts.filter(p => p.hashtags && p.hashtags.length > 0),
      posts.filter(p => !p.hashtags || p.hashtags.length === 0),
    ),
    // Caption length: short vs long
    trySignal(
      'Caption Length',
      `Long (${posts.filter(p => p.caption.length >= 150).length})`,
      `Short (${posts.filter(p => p.caption.length < 150).length})`,
      posts.filter(p => p.caption.length >= 150),
      posts.filter(p => p.caption.length < 150),
    ),
    // Has mentions vs none
    trySignal(
      'Mentions',
      `With (${posts.filter(p => p.mentions && p.mentions.length > 0).length})`,
      `Without (${posts.filter(p => !p.mentions || p.mentions.length === 0).length})`,
      posts.filter(p => p.mentions && p.mentions.length > 0),
      posts.filter(p => !p.mentions || p.mentions.length === 0),
    ),
  ];

  // Filter nulls, then deduplicate signals that have the same post grouping
  const valid = candidates.filter((s): s is Signal => s !== null);
  const seen = new Set<string>();
  const unique: Signal[] = [];
  for (const signal of valid) {
    const key = signal.withPostIds.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(signal);
  }

  return unique;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function ContentPerformanceChart({ posts }: ContentPerformanceChartProps) {
  const signals = buildSignals(posts);

  // Fallback: show post-level insights when signals don't have enough variance
  if (signals.length === 0) {
    // Show a quick content profile summary instead
    const totalEng = posts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0);
    const avgEng = posts.length > 0 ? Math.round(totalEng / posts.length) : 0;
    const topPost = [...posts].sort((a, b) => (b.metrics.likes + b.metrics.comments) - (a.metrics.likes + a.metrics.comments))[0];
    const medianEng = posts.length > 0 ? (() => {
      const sorted = [...posts].map(p => p.metrics.likes + p.metrics.comments).sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    })() : 0;

    // Content mix
    const withHashtags = posts.filter(p => p.hashtags && p.hashtags.length > 0).length;
    const withLocation = posts.filter(p => !!p.locationName).length;
    const withCollabs = posts.filter(p => p.taggedUsers && p.taggedUsers.length > 0).length;
    const withMentions = posts.filter(p => p.mentions && p.mentions.length > 0).length;

    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-burnt" />
          <h3 className="text-sm font-medium text-armadillo-text">Content Profile</h3>
        </div>
        {posts.length === 0 ? (
          <p className="text-xs text-armadillo-muted">Not enough data to analyze</p>
        ) : (
          <div className="space-y-3">
            {/* Engagement stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-armadillo-bg rounded-lg p-2.5 text-center">
                <div className="text-xs font-display text-armadillo-text">{formatNumber(avgEng)}</div>
                <div className="text-[9px] text-armadillo-muted">Avg Eng</div>
              </div>
              <div className="bg-armadillo-bg rounded-lg p-2.5 text-center">
                <div className="text-xs font-display text-armadillo-text">{formatNumber(medianEng)}</div>
                <div className="text-[9px] text-armadillo-muted">Median</div>
              </div>
              <div className="bg-armadillo-bg rounded-lg p-2.5 text-center">
                <div className="text-xs font-display text-burnt">{topPost ? formatNumber(topPost.metrics.likes + topPost.metrics.comments) : '—'}</div>
                <div className="text-[9px] text-armadillo-muted">Best Post</div>
              </div>
            </div>

            {/* Content usage rates */}
            <div className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">Content Mix</div>
            <div className="space-y-1.5">
              {[
                { label: 'Use hashtags', count: withHashtags },
                { label: 'Tag location', count: withLocation },
                { label: 'Tag collaborators', count: withCollabs },
                { label: 'Include mentions', count: withMentions },
              ].map(item => {
                const pct = posts.length > 0 ? Math.round((item.count / posts.length) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-armadillo-muted w-28 truncate">{item.label}</span>
                    <div className="flex-1 h-3 bg-armadillo-bg rounded overflow-hidden">
                      <div className="h-full bg-burnt/60 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-armadillo-text tabular-nums w-16 text-right">{item.count}/{posts.length} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Content Performance Signals</h3>
      </div>
      <div className="space-y-3">
        {signals.map((signal) => {
          const max = Math.max(signal.withAvg, signal.withoutAvg);
          const withPct = max > 0 ? (signal.withAvg / max) * 100 : 0;
          const withoutPct = max > 0 ? (signal.withoutAvg / max) * 100 : 0;
          const liftPositive = signal.lift >= 0;

          return (
            <div key={signal.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-armadillo-text">{signal.label}</span>
                <span className={`text-[10px] font-medium ${liftPositive ? 'text-success' : 'text-danger'}`}>
                  {liftPositive ? '+' : ''}{signal.lift}% lift
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-armadillo-muted w-20 text-right truncate">{signal.withLabel}</span>
                  <div className="flex-1 h-4 bg-armadillo-bg rounded overflow-hidden">
                    <div className="h-full bg-burnt rounded" style={{ width: `${withPct}%` }} />
                  </div>
                  <span className="text-[10px] text-armadillo-text tabular-nums w-12 text-right">{formatNumber(signal.withAvg)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-armadillo-muted w-20 text-right truncate">{signal.withoutLabel}</span>
                  <div className="flex-1 h-4 bg-armadillo-bg rounded overflow-hidden">
                    <div className="h-full bg-armadillo-border rounded" style={{ width: `${withoutPct}%` }} />
                  </div>
                  <span className="text-[10px] text-armadillo-text tabular-nums w-12 text-right">{formatNumber(signal.withoutAvg)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-armadillo-muted mt-3">Avg engagement comparison. Only unique signals with 5%+ difference shown.</p>
    </div>
  );
}
