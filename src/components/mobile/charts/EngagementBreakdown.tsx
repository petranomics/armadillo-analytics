'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { mockEngagementBreakdown } from '@/lib/mock-data';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const ENGAGEMENT_COLORS: Record<string, string> = {
  Likes: '#BF5700',
  Comments: '#E87A2A',
  Shares: '#F5A623',
  Saves: '#8C3F00',
};

const data = [
  { name: 'Likes', value: mockEngagementBreakdown.likes },
  { name: 'Comments', value: mockEngagementBreakdown.comments },
  { name: 'Shares', value: mockEngagementBreakdown.shares },
  { name: 'Saves', value: mockEngagementBreakdown.saves },
].filter(d => d.value > 0);

const total = data.reduce((s, d) => s + d.value, 0);

export default function EngagementBreakdown() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const focused = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider">Engagement Breakdown</h3>
        <span className="text-[10px] text-armadillo-muted">All platforms</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Donut */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={activeIndex !== null ? 58 : 54}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, index) => setActiveIndex(prev => prev === index ? null : index)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={ENGAGEMENT_COLORS[entry.name]}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                    cursor="pointer"
                    strokeWidth={activeIndex === index ? 2 : 0}
                    stroke={activeIndex === index ? '#E8E6E3' : 'none'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1A1D27',
                  border: '1px solid #2A2D37',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#E8E6E3',
                }}
                formatter={(value) => [Number(value).toLocaleString(), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {focused ? (
              <>
                <span className="font-display text-lg text-armadillo-text">{formatNumber(focused.value)}</span>
                <span className="text-[8px] text-armadillo-muted uppercase tracking-wider">{focused.name}</span>
              </>
            ) : (
              <>
                <span className="font-display text-lg text-armadillo-text">{formatNumber(total)}</span>
                <span className="text-[8px] text-armadillo-muted uppercase tracking-wider">Total</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((d, i) => {
            const pct = ((d.value / total) * 100).toFixed(1);
            const isActive = activeIndex === i;
            return (
              <button
                key={d.name}
                onClick={() => setActiveIndex(prev => prev === i ? null : i)}
                className={`w-full flex items-center gap-2 transition-opacity ${
                  activeIndex !== null && !isActive ? 'opacity-40' : ''
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ENGAGEMENT_COLORS[d.name] }}
                />
                <span className="text-[11px] text-armadillo-muted flex-1 text-left">{d.name}</span>
                <span className="text-[11px] text-armadillo-text font-medium">{formatNumber(d.value)}</span>
                <span className="text-[9px] text-armadillo-muted w-8 text-right">{pct}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
