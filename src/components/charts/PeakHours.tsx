'use client';

import { useState, useMemo } from 'react';
import type { Post } from '@/lib/types';

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function intensityColor(value: number): string {
  if (value < 0.1) return 'rgba(191, 87, 0, 0.05)';
  if (value < 0.25) return 'rgba(191, 87, 0, 0.12)';
  if (value < 0.4) return 'rgba(191, 87, 0, 0.22)';
  if (value < 0.55) return 'rgba(191, 87, 0, 0.35)';
  if (value < 0.7) return 'rgba(191, 87, 0, 0.50)';
  if (value < 0.85) return 'rgba(191, 87, 0, 0.68)';
  return 'rgba(191, 87, 0, 0.88)';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_SHORTS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function computeFromPosts(posts: Post[]) {
  const hourEngagement = Array.from({ length: 24 }, () => 0);
  const dayEngagement = Array.from({ length: 7 }, () => 0);
  const heatmap: Record<string, number> = {};

  for (const p of posts) {
    const d = new Date(p.publishedAt);
    if (isNaN(d.getTime())) continue;
    const eng = p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0);
    const hour = d.getHours();
    const day = d.getDay();
    hourEngagement[hour] += eng;
    dayEngagement[day] += eng;
    heatmap[`${day}-${hour}`] = (heatmap[`${day}-${hour}`] || 0) + eng;
  }

  const maxHeatVal = Math.max(...Object.values(heatmap), 1);
  const peakHoursData = hourEngagement.map((engagement, hour) => ({
    hour,
    label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
    engagement,
  }));
  const peakDaysData = dayEngagement.map((engagement, i) => ({
    day: DAY_NAMES[i],
    short: DAY_SHORTS[i],
    engagement,
  }));
  // Reorder to Mon-Sun for display
  const monFirst = [...peakDaysData.slice(1), peakDaysData[0]];
  const heatmapData = [];
  for (let di = 0; di < 7; di++) {
    // Map display index (Mon=0..Sun=6) to JS day (Mon=1..Sun=0)
    const jsDay = (di + 1) % 7;
    for (let hour = 0; hour < 24; hour++) {
      const val = heatmap[`${jsDay}-${hour}`] || 0;
      heatmapData.push({
        dayIndex: di,
        day: DAY_NAMES[jsDay],
        hour,
        value: maxHeatVal > 0 ? val / maxHeatVal : 0,
      });
    }
  }

  return { peakHoursData, peakDaysData: monFirst, heatmapData };
}

type ViewMode = 'heatmap' | 'hours' | 'days';

interface PeakHoursProps {
  posts?: Post[];
}

export default function PeakHours({ posts }: PeakHoursProps) {
  const [view, setView] = useState<ViewMode>('heatmap');
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number; value: number } | null>(null);

  const computed = useMemo(() => posts && posts.length > 0 ? computeFromPosts(posts) : null, [posts]);

  if (!computed) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Peak Activity</h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted">
          No data yet — fetch your analytics to see this chart
        </div>
      </div>
    );
  }

  const peakHoursData = computed.peakHoursData;
  const peakDaysData = computed.peakDaysData;
  const heatmapData = computed.heatmapData;

  const peakHour = peakHoursData.reduce((a, b) => a.engagement > b.engagement ? a : b);
  const peakDay = peakDaysData.reduce((a, b) => a.engagement > b.engagement ? a : b);

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
          <div className="text-sm font-display text-burnt">{peakHour.label}</div>
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
                {heatmapData
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
          {peakHoursData.map(h => {
            const maxEng = peakHoursData.reduce((a, b) => Math.max(a, b.engagement), 0);
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
          {peakDaysData.map(d => {
            const maxEng = peakDaysData.reduce((a, b) => Math.max(a, b.engagement), 0);
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
