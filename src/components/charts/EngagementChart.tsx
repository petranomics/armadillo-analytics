'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Post } from '@/lib/types';
import { Trophy } from 'lucide-react';

interface EngagementChartProps {
    platform?: string;
    posts?: Post[];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function truncate(s: string, len: number): string {
  if (s.length <= len) return s;
  return s.slice(0, len).trim() + '…';
}

interface PostBar {
  label: string;
  engagement: number;
  engRate: number;
  caption: string;
}

function buildPostBars(posts: Post[]): PostBar[] {
  return posts
    .map((p, i) => ({
      label: `#${i + 1}`,
      engagement: p.metrics.likes + p.metrics.comments,
      engRate: p.engagementRate,
      caption: p.caption || `Post ${i + 1}`,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 12);
}

export default function EngagementChart({ platform, posts }: EngagementChartProps) {
  const color = platform
      ? `var(--color-platform-${platform})`
        : '#BF5700';

  const bars = useMemo(() => {
    if (posts && posts.length > 0) {
      return buildPostBars(posts);
    }
    return [];
  }, [posts]);

  if (bars.length === 0) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={14} className="text-burnt" />
          <h3 className="text-sm font-medium text-armadillo-text">Top Posts by Engagement</h3>
        </div>
        <p className="text-xs text-armadillo-muted">No post data available</p>
      </div>
    );
  }

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-burnt" />
          <h3 className="text-sm font-medium text-armadillo-text">Top Posts by Engagement</h3>
        </div>
        <span className="text-[11px] text-armadillo-muted bg-armadillo-bg px-3 py-1 rounded border border-armadillo-border">
          {posts ? 'Live Data' : 'Demo'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bars} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D37" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8B8D97', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#2A2D37' }}
          />
          <YAxis
            tick={{ fill: '#8B8D97', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1D27',
              border: '1px solid #2A2D37',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#E8E6E3',
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as PostBar;
              return (
                <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-lg px-3 py-2 max-w-[240px]">
                  <p className="text-[11px] text-[#E8E6E3] mb-1">{truncate(data.caption, 80)}</p>
                  <p className="text-[11px] text-[#BF5700] font-medium">{formatNumber(data.engagement)} engagement &middot; {data.engRate}% rate</p>
                </div>
              );
            }}
          />
          <Bar dataKey="engagement" radius={[4, 4, 0, 0]} fill={color} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
