'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Post } from '@/lib/types';

const SERIES = [
  { key: 'likes', label: 'Likes', color: '#BF5700' },
  { key: 'comments', label: 'Comments', color: '#E87A2A' },
  { key: 'shares', label: 'Shares', color: '#F5A623' },
  { key: 'saves', label: 'Saves', color: '#8C3F00' },
] as const;

type SeriesKey = typeof SERIES[number]['key'];

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

interface EngagementTrendProps {
  posts?: Post[];
}

export default function EngagementTrend({ posts }: EngagementTrendProps) {
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(
    new Set(SERIES.map(s => s.key))
  );

  const chartData = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const byDate: Record<string, { likes: number; comments: number; shares: number; saves: number }> = {};
    for (const p of posts) {
      const d = new Date(p.publishedAt);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { likes: 0, comments: 0, shares: 0, saves: 0 };
      byDate[key].likes += p.metrics.likes || 0;
      byDate[key].comments += p.metrics.comments || 0;
      byDate[key].shares += p.metrics.shares || 0;
      byDate[key].saves += p.metrics.saves || 0;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        shortDate: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...vals,
      }));
  }, [posts]);

  const isLive = posts && posts.length > 0;

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider">Engagement Trend</h3>
        <span className="text-[10px] text-armadillo-muted">{isLive ? 'Live data' : '30 days'}</span>
      </div>

      {/* Toggle Pills */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {SERIES.map(s => {
          const isOn = activeSeries.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                isOn
                  ? 'border border-transparent'
                  : 'border border-armadillo-border text-armadillo-muted opacity-50'
              }`}
              style={isOn ? { backgroundColor: s.color + '20', color: s.color, borderColor: s.color + '40' } : {}}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isOn ? s.color : '#8B8D97' }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted">
          No data yet — fetch your analytics to see this chart
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            {SERIES.map(s => (
              <linearGradient key={s.key} id={`m-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D37" vertical={false} />
          <XAxis
            dataKey="shortDate"
            tick={{ fill: '#8B8D97', fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: '#2A2D37' }}
            interval={6}
          />
          <YAxis
            tick={{ fill: '#8B8D97', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1D27',
              border: '1px solid #2A2D37',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#E8E6E3',
              padding: '8px 12px',
            }}
            formatter={(value, name) => [formatNumber(Number(value) || 0), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
            labelFormatter={(label) => label}
          />
          {SERIES.map(s => (
            activeSeries.has(s.key) && (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId="1"
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#m-grad-${s.key})`}
              />
            )
          ))}
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
