'use client';

import { useState } from 'react';
import { mockPeakHours, mockPeakDays, mockHourlyHeatmap } from '@/lib/mock-data';

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function intensityColor(value: number): string {
  // Map 0-1 to transparent burnt orange -> full burnt orange
  if (value < 0.1) return 'rgba(191, 87, 0, 0.05)';
  if (value < 0.25) return 'rgba(191, 87, 0, 0.12)';
  if (value < 0.4) return 'rgba(191, 87, 0, 0.22)';
  if (value < 0.55) return 'rgba(191, 87, 0, 0.35)';
  if (value < 0.7) return 'rgba(191, 87, 0, 0.50)';
  if (value < 0.85) return 'rgba(191, 87, 0, 0.68)';
  return 'rgba(191, 87, 0, 0.88)';
}

type ViewMode = 'heatmap' | 'hours' | 'days';

export default function PeakHours() {
  const [view, setView] = useState<ViewMode>('heatmap');
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number; value: number } | null>(null);

  const peakHour = mockPeakHours.reduce((a, b) => a.engagement > b.engagement ? a : b);
  const peakDay = mockPeakDays.reduce((a, b) => a.engagement > b.engagement ? a : b);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider">Peak Activity</h3>
        <div className="flex gap-1">
          {(['heatmap', 'hours', 'days'] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setSelectedCell(null); }}
              className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                view === v ? 'bg-burnt/20 text-burnt' : 'text-armadillo-muted'
              }`}
            >
              {v === 'heatmap' ? 'Grid' : v === 'hours' ? 'Hours' : 'Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Best Hour</div>
          <div className="text-sm font-display text-burnt">{peakHour.label}</div>
        </div>
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Best Day</div>
          <div className="text-sm font-display text-burnt">{peakDay.day}</div>
        </div>
        <div className="flex-1 bg-armadillo-bg rounded-lg px-3 py-2">
          <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Peak Window</div>
          <div className="text-sm font-display text-burnt">6-9pm</div>
        </div>
      </div>

      {/* Heatmap View */}
      {view === 'heatmap' && (
        <div>
          {/* Hour labels across top - show every 3rd hour */}
          <div className="flex ml-6 mb-0.5">
            {Array.from({ length: 8 }, (_, i) => i * 3).map(h => (
              <div key={h} className="text-[7px] text-armadillo-muted" style={{ width: `${100/8}%` }}>
                {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`}
              </div>
            ))}
          </div>
          {/* Grid rows per day */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, di) => (
            <div key={day} className="flex items-center gap-0.5 mb-0.5">
              <span className="text-[8px] text-armadillo-muted w-5 shrink-0 text-right">{day.slice(0, 2)}</span>
              <div className="flex-1 flex gap-px">
                {mockHourlyHeatmap
                  .filter(c => c.dayIndex === di)
                  .map(cell => (
                    <button
                      key={`${cell.dayIndex}-${cell.hour}`}
                      className="flex-1 rounded-[2px] transition-all"
                      style={{
                        backgroundColor: intensityColor(cell.value),
                        height: '14px',
                        outline: selectedCell?.day === cell.day && selectedCell?.hour === cell.hour
                          ? '1.5px solid #BF5700' : 'none',
                      }}
                      onClick={() => setSelectedCell(
                        selectedCell?.day === cell.day && selectedCell?.hour === cell.hour
                          ? null : cell
                      )}
                    />
                  ))}
              </div>
            </div>
          ))}
          {/* Selected cell tooltip */}
          {selectedCell && (
            <div className="mt-2 bg-burnt/10 border border-burnt/20 rounded-lg px-3 py-2 text-center">
              <span className="text-[10px] text-armadillo-text">
                <span className="font-medium text-burnt">{selectedCell.day}</span> at{' '}
                <span className="font-medium text-burnt">
                  {selectedCell.hour === 0 ? '12am' : selectedCell.hour < 12 ? `${selectedCell.hour}am` : selectedCell.hour === 12 ? '12pm' : `${selectedCell.hour - 12}pm`}
                </span>
                {' '}&mdash; {Math.round(selectedCell.value * 100)}% of peak engagement
              </span>
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[8px] text-armadillo-muted">Low</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
              <div key={v} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: intensityColor(v) }} />
            ))}
            <span className="text-[8px] text-armadillo-muted">High</span>
          </div>
        </div>
      )}

      {/* Hours Bar View */}
      {view === 'hours' && (
        <div className="space-y-0.5">
          {mockPeakHours.map(h => {
            const maxEng = mockPeakHours.reduce((a, b) => Math.max(a, b.engagement), 0);
            const widthPct = (h.engagement / maxEng) * 100;
            const isPeak = h.engagement > maxEng * 0.85;
            return (
              <div key={h.hour} className="flex items-center gap-1.5">
                <span className="text-[9px] text-armadillo-muted w-6 text-right shrink-0">{h.label}</span>
                <div className="flex-1 h-4 bg-armadillo-bg rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: isPeak ? '#BF5700' : 'rgba(191, 87, 0, 0.35)',
                    }}
                  />
                </div>
                <span className="text-[8px] text-armadillo-muted w-8 text-right shrink-0">{formatNumber(h.engagement)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Days Bar View */}
      {view === 'days' && (
        <div className="flex items-end gap-2 h-[120px] px-2">
          {mockPeakDays.map(d => {
            const maxEng = mockPeakDays.reduce((a, b) => Math.max(a, b.engagement), 0);
            const heightPct = (d.engagement / maxEng) * 100;
            const isPeak = d.engagement === maxEng;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-armadillo-muted">{formatNumber(d.engagement)}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isPeak ? '#BF5700' : 'rgba(191, 87, 0, 0.40)',
                    }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isPeak ? 'text-burnt' : 'text-armadillo-muted'}`}>{d.short}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
