'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface EngagementDonutProps {
  likes: number;
  comments: number;
  shares?: number;
  saves?: number;
  platform?: string;
}

const COLORS = ['#BF5700', '#E87A2A', '#8C3F00', '#FFF3E6'];

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function EngagementDonut({ likes, comments, shares, saves }: EngagementDonutProps) {
  const data = [
    { name: 'Likes', value: likes },
    { name: 'Comments', value: comments },
    ...(shares ? [{ name: 'Shares', value: shares }] : []),
    ...(saves ? [{ name: 'Saves', value: saves }] : []),
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-armadillo-text mb-4">Engagement Breakdown</h3>
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
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
                formatter={(value) => [Number(value).toLocaleString(), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-lg text-armadillo-text">{formatNumber(total)}</span>
            <span className="text-[9px] text-armadillo-muted uppercase tracking-wider">Total</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-xs text-armadillo-muted">{d.name}</span>
              <span className="text-xs text-armadillo-text ml-auto font-medium">{formatNumber(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
