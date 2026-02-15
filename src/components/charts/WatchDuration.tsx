'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { mockRetentionCurve, mockWatchDurations } from '@/lib/mock-data';

type ViewMode = 'retention' | 'durations';

export default function WatchDuration() {
  const [view, setView] = useState<ViewMode>('retention');

  const avgRetention = Math.round(
    mockRetentionCurve.reduce((s, d) => s + d.retention, 0) / mockRetentionCurve.length
  );

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider">Watch Duration</h3>
        <div className="flex gap-1">
          {(['retention', 'durations'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                view === v ? 'bg-burnt/20 text-burnt' : 'text-armadillo-muted'
              }`}
            >
              {v === 'retention' ? 'Retention' : 'By Type'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Avg Retention</div>
          <div className="text-sm font-display text-burnt">{avgRetention}%</div>
        </div>
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Avg Watch</div>
          <div className="text-sm font-display text-burnt">1m 42s</div>
        </div>
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Drop-off</div>
          <div className="text-sm font-display text-burnt">First 10%</div>
        </div>
      </div>

      {/* Retention Curve */}
      {view === 'retention' && (
        <div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mockRetentionCurve} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="retention-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BF5700" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#BF5700" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D37" vertical={false} />
              <XAxis
                dataKey="position"
                tick={{ fill: '#8B8D97', fontSize: 8 }}
                tickLine={false}
                axisLine={{ stroke: '#2A2D37' }}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#8B8D97', fontSize: 8 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <ReferenceLine
                y={avgRetention}
                stroke="#8B8D97"
                strokeDasharray="4 4"
                label={{ value: `Avg ${avgRetention}%`, fill: '#8B8D97', fontSize: 8, position: 'right' }}
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
                formatter={(value) => [`${Number(value) || 0}% still watching`, 'Retention']}
                labelFormatter={(label) => `At ${label} of video`}
              />
              <Area
                type="monotone"
                dataKey="retention"
                stroke="#BF5700"
                strokeWidth={2}
                fill="url(#retention-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-armadillo-muted mt-2 text-center">
            Steepest drop in the first 10% — hook viewers faster in the opening seconds
          </p>
        </div>
      )}

      {/* Duration by Content Type */}
      {view === 'durations' && (
        <div className="space-y-2">
          {mockWatchDurations.map(d => {
            const barPct = d.retentionPct;
            return (
              <div key={d.type} className="bg-armadillo-bg rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-armadillo-text">{d.type}</span>
                  <span className="text-[11px] font-display text-burnt">{d.avgDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-armadillo-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-burnt transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-armadillo-muted w-10 text-right shrink-0">{barPct}% ret.</span>
                </div>
                <div className="text-[9px] text-armadillo-muted mt-1">
                  Avg {d.avgDuration} of {d.totalAvg >= 60 ? `${Math.floor(d.totalAvg / 60)}m ${d.totalAvg % 60}s` : `${d.totalAvg}s`} total
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
