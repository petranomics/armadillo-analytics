'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockEngagementTimeline } from '@/lib/mock-data';
import type { Post } from '@/lib/types';

interface EngagementChartProps {
    platform?: string;
    posts?: Post[];
}

function buildTimelineFromPosts(posts: Post[]): { date: string; total: number }[] {
    const grouped: Record<string, number> = {};

  posts.forEach((post) => {
        const d = new Date(post.publishedAt);
        if (isNaN(d.getTime())) return;
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        const eng = (post.metrics.likes || 0) + (post.metrics.comments || 0) + (post.metrics.shares || 0);
        grouped[key] = (grouped[key] || 0) + eng;
  });

  return Object.entries(grouped)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => {
              const [am, ad] = a.date.split('/').map(Number);
              const [bm, bd] = b.date.split('/').map(Number);
              return am !== bm ? am - bm : ad - bd;
      });
}

export default function EngagementChart({ platform, posts }: EngagementChartProps) {
    const dataKey = platform || 'total';

  const color = platform
      ? `var(--color-platform-${platform})`
        : '#BF5700';

  const chartData = useMemo(() => {
        if (posts && posts.length > 0) {
                const timeline = buildTimelineFromPosts(posts);
                if (timeline.length > 0) {
                          return { data: timeline, key: 'total', isLive: true };
                }
        }
        return { data: mockEngagementTimeline, key: dataKey, isLive: false };
  }, [posts, dataKey]);

  return (
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-armadillo-text">Engagement Over Time</h3>
                      <span className="text-[11px] text-armadillo-muted bg-armadillo-bg px-3 py-1 rounded border border-armadillo-border">
                        {chartData.isLive ? 'Live Data' : 'Last 30 days'}
                      </span>
              </div>
        
              <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                                          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                                          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                                            </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D37" vertical={false} />
                                <XAxis
                                              dataKey="date"
                                              tick={{ fill: '#8B8D97', fontSize: 10 }}
                                              tickLine={false}
                                              axisLine={{ stroke: '#2A2D37' }}
                                              interval={chartData.isLive ? 0 : 4}
                                            />
                                <YAxis
                                              tick={{ fill: '#8B8D97', fontSize: 10 }}
                                              tickLine={false}
                                              axisLine={false}
                                              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                                            />
                                <Tooltip
                                              contentStyle={{
                                                              background: '#1A1D27',
                                                              border: '1px solid #2A2D37',
                                                              borderRadius: '8px',
                                                              fontSize: '12px',
                                                              color: '#E8E6E3',
                                              }}
                                              formatter={(value) => [Number(value).toLocaleString(), 'Engagement']}
                                            />
                                <Area
                                              type="monotone"
                                              dataKey={chartData.key}
                                              stroke={color}
                                              strokeWidth={2}
                                              fill={`url(#gradient-${dataKey})`}
                                            />
                      </AreaChart>
              </ResponsiveContainer>
        </div>
      );
}
