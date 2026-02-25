'use client';

import type { Post } from '@/lib/types';
import { Clock } from 'lucide-react';

interface BestTimeCardProps {
  posts: Post[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

interface TimeSlot {
  day: number;
  hour: number;
  totalEng: number;
  count: number;
}

export default function BestTimeCard({ posts }: BestTimeCardProps) {
  const slots: Record<string, TimeSlot> = {};

  for (const post of posts) {
    const d = new Date(post.publishedAt);
    if (isNaN(d.getTime())) continue;
    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    const eng = post.metrics.likes + post.metrics.comments;
    if (!slots[key]) slots[key] = { day, hour, totalEng: 0, count: 0 };
    slots[key].totalEng += eng;
    slots[key].count += 1;
  }

  const ranked = Object.values(slots)
    .map((s) => ({ ...s, avgEng: Math.round(s.totalEng / s.count) }))
    .sort((a, b) => b.avgEng - a.avgEng)
    .slice(0, 3);

  // Compute posting frequency
  const dates = posts
    .map((p) => new Date(p.publishedAt).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  let freqLabel = '';
  if (dates.length >= 2) {
    const rangeMs = dates[dates.length - 1] - dates[0];
    const rangeDays = rangeMs / (1000 * 60 * 60 * 24);
    if (rangeDays > 0) {
      const postsPerWeek = (posts.length / rangeDays) * 7;
      freqLabel = `~${postsPerWeek.toFixed(1)} posts/week`;
    }
  }

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Best Time to Post</h3>
      </div>
      {ranked.length === 0 ? (
        <p className="text-xs text-armadillo-muted">Not enough post data to analyze</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((slot, i) => (
            <div key={`${slot.day}-${slot.hour}`} className="flex items-center gap-3">
              <span className={`text-sm font-display ${i === 0 ? 'text-burnt' : 'text-armadillo-muted'}`}>
                {i + 1}.
              </span>
              <div className="flex-1">
                <div className="text-xs text-armadillo-text">
                  {DAY_NAMES[slot.day]} {formatHour(slot.hour)}
                </div>
                <div className="text-[10px] text-armadillo-muted">
                  {slot.avgEng.toLocaleString()} avg engagement &middot; {slot.count} {slot.count === 1 ? 'post' : 'posts'}
                </div>
              </div>
            </div>
          ))}
          {freqLabel && (
            <div className="pt-2 border-t border-armadillo-border/50">
              <span className="text-[10px] text-armadillo-muted">Posting frequency: </span>
              <span className="text-[10px] text-armadillo-text font-medium">{freqLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
