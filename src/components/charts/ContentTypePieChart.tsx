'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Post } from '@/lib/types';

interface ContentTypePieChartProps {
  posts: Post[];
}

const COLORS: Record<string, string> = {
  Video: '#BF5700',
  Image: '#E87A2A',
  Sidecar: '#8C3F00',
  Carousel: '#8C3F00',
};

const DEFAULT_COLOR = '#F5A623';

function formatLabel(type: string): string {
  if (type === 'Sidecar') return 'Carousel';
  return type;
}

export default function ContentTypePieChart({ posts }: ContentTypePieChartProps) {
  const counts: Record<string, number> = {};
  for (const post of posts) {
    const type = post.contentType || 'Image';
    const label = formatLabel(type);
    counts[label] = (counts[label] || 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-armadillo-text mb-4">Content Types</h3>
        <p className="text-xs text-armadillo-muted">No post data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-armadillo-text mb-4">Content Types</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || DEFAULT_COLOR} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1A1D27',
                  border: '1px solid #2A2D37',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#E8E6E3',
                }}
                formatter={(value) => [`${value} posts`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-lg text-armadillo-text">{total}</span>
            <span className="text-[9px] text-armadillo-muted uppercase tracking-wider">Posts</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[d.name] || DEFAULT_COLOR }} />
              <span className="text-xs text-armadillo-muted">{d.name}</span>
              <span className="text-xs text-armadillo-text ml-auto font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
