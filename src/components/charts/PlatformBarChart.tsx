'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockDashboardOverview } from '@/lib/mock-data';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/lib/constants';
import type { Platform } from '@/lib/types';

export default function PlatformBarChart() {
  const data = mockDashboardOverview.platformBreakdown.map((p) => ({
    name: PLATFORM_NAMES[p.platform],
    followers: p.followers,
    platform: p.platform,
  }));

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-armadillo-text mb-4">Followers by Platform</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: '#8B8D97', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#E8E6E3', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1D27',
              border: '1px solid #2A2D37',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#E8E6E3',
            }}
            formatter={(value) => [Number(value).toLocaleString(), 'Followers']}
          />
          <Bar dataKey="followers" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry) => (
              <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform as Platform]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
