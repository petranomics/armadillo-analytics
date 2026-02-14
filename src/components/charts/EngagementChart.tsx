'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockEngagementTimeline } from '@/lib/mock-data';

interface EngagementChartProps {
  platform?: string;
}

export default function EngagementChart({ platform }: EngagementChartProps) {
  const dataKey = platform || 'total';

  const color = platform
    ? `var(--color-platform-${platform})`
    : '#BF5700';

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-armadillo-text">Engagement Over Time</h3>
        <span className="text-[11px] text-armadillo-muted bg-armadillo-bg px-3 py-1 rounded border border-armadillo-border">
          Last 30 days
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={mockEngagementTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            interval={4}
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
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
