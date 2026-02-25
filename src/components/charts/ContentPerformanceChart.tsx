'use client';

import type { Post } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
}

function computeAvgEng(posts: Post[]): number {
  if (posts.length === 0) return 0;
  return posts.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0) / posts.length;
}

function buildSignals(posts: Post[]): Signal[] {
  const signals: Signal[] = [];

  // Location tagged vs not
  const withLocation = posts.filter(p => !!p.locationName);
  const withoutLocation = posts.filter(p => !p.locationName);
  if (withLocation.length >= 2 && withoutLocation.length >= 2) {
    const wAvg = computeAvgEng(withLocation);
    const woAvg = computeAvgEng(withoutLocation);
    signals.push({
      label: 'Location Tag',
      withLabel: `Tagged (${withLocation.length})`,
      withoutLabel: `No tag (${withoutLocation.length})`,
      withAvg: Math.round(wAvg),
      withoutAvg: Math.round(woAvg),
      lift: woAvg > 0 ? Math.round(((wAvg - woAvg) / woAvg) * 100) : 0,
    });
  }

  // Tagged users (collabs) vs solo
  const withTags = posts.filter(p => p.taggedUsers && p.taggedUsers.length > 0);
  const withoutTags = posts.filter(p => !p.taggedUsers || p.taggedUsers.length === 0);
  if (withTags.length >= 2 && withoutTags.length >= 2) {
    const wAvg = computeAvgEng(withTags);
    const woAvg = computeAvgEng(withoutTags);
    signals.push({
      label: 'Collab Tags',
      withLabel: `Tagged (${withTags.length})`,
      withoutLabel: `Solo (${withoutTags.length})`,
      withAvg: Math.round(wAvg),
      withoutAvg: Math.round(woAvg),
      lift: woAvg > 0 ? Math.round(((wAvg - woAvg) / woAvg) * 100) : 0,
    });
  }

  // Original audio vs licensed
  const withOriginal = posts.filter(p => p.musicInfo?.uses_original_audio === true);
  const withLicensed = posts.filter(p => p.musicInfo && !p.musicInfo.uses_original_audio);
  if (withOriginal.length >= 2 && withLicensed.length >= 2) {
    const oAvg = computeAvgEng(withOriginal);
    const lAvg = computeAvgEng(withLicensed);
    signals.push({
      label: 'Audio Type',
      withLabel: `Original (${withOriginal.length})`,
      withoutLabel: `Licensed (${withLicensed.length})`,
      withAvg: Math.round(oAvg),
      withoutAvg: Math.round(lAvg),
      lift: lAvg > 0 ? Math.round(((oAvg - lAvg) / lAvg) * 100) : 0,
    });
  }

  // Has hashtags vs no hashtags
  const withHashtags = posts.filter(p => p.hashtags && p.hashtags.length > 0);
  const withoutHashtags = posts.filter(p => !p.hashtags || p.hashtags.length === 0);
  if (withHashtags.length >= 2 && withoutHashtags.length >= 2) {
    const wAvg = computeAvgEng(withHashtags);
    const woAvg = computeAvgEng(withoutHashtags);
    signals.push({
      label: 'Hashtags',
      withLabel: `With (${withHashtags.length})`,
      withoutLabel: `Without (${withoutHashtags.length})`,
      withAvg: Math.round(wAvg),
      withoutAvg: Math.round(woAvg),
      lift: woAvg > 0 ? Math.round(((wAvg - woAvg) / woAvg) * 100) : 0,
    });
  }

  // Caption length: short vs long
  const shortCap = posts.filter(p => p.caption.length < 150);
  const longCap = posts.filter(p => p.caption.length >= 150);
  if (shortCap.length >= 2 && longCap.length >= 2) {
    const sAvg = computeAvgEng(shortCap);
    const lAvg = computeAvgEng(longCap);
    signals.push({
      label: 'Caption Length',
      withLabel: `Long (${longCap.length})`,
      withoutLabel: `Short (${shortCap.length})`,
      withAvg: Math.round(lAvg),
      withoutAvg: Math.round(sAvg),
      lift: sAvg > 0 ? Math.round(((lAvg - sAvg) / sAvg) * 100) : 0,
    });
  }

  return signals;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function ContentPerformanceChart({ posts }: ContentPerformanceChartProps) {
  const signals = buildSignals(posts);

  // Fallback: if no comparative signals, show per-post engagement bar chart
  if (signals.length === 0) {
    const perPost = posts
      .map((p, i) => ({
        label: `Post ${i + 1}`,
        eng: p.metrics.likes + p.metrics.comments,
      }))
      .sort((a, b) => b.eng - a.eng)
      .slice(0, 8);

    if (perPost.length === 0) {
      return (
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-burnt" />
            <h3 className="text-sm font-medium text-armadillo-text">Content Performance</h3>
          </div>
          <p className="text-xs text-armadillo-muted">Not enough data to analyze</p>
        </div>
      );
    }

    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-burnt" />
          <h3 className="text-sm font-medium text-armadillo-text">Engagement by Post</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={perPost} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" tick={{ fill: '#8B8D97', fontSize: 10 }} width={50} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1A1D27', border: '1px solid #2A2D37', borderRadius: '8px', fontSize: '12px', color: '#E8E6E3' }}
              formatter={(v) => [Number(v).toLocaleString(), 'Engagement']}
            />
            <Bar dataKey="eng" radius={[0, 4, 4, 0]}>
              {perPost.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#BF5700' : '#E87A2A'} fillOpacity={1 - i * 0.08} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Build chart data: each signal produces two bars
  const chartData = signals.map(s => ({
    label: s.label,
    higher: Math.max(s.withAvg, s.withoutAvg),
    lower: Math.min(s.withAvg, s.withoutAvg),
  }));

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
      <p className="text-[9px] text-armadillo-muted mt-3">Avg engagement (likes + comments) comparison. Signals shown when 2+ posts exist per group.</p>
    </div>
  );
}
