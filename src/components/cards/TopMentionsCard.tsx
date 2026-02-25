'use client';

import type { Post } from '@/lib/types';
import { AtSign } from 'lucide-react';

interface TopMentionsCardProps {
  posts: Post[];
}

export default function TopMentionsCard({ posts }: TopMentionsCardProps) {
  const counts: Record<string, number> = {};

  for (const post of posts) {
    for (const mention of post.mentions || []) {
      const normalized = mention.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '');
      if (!normalized) continue;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AtSign size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Most Mentioned</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-armadillo-muted">No mentions found in recent posts</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => (
            <div key={item.username} className="flex items-center justify-between">
              <span className="text-xs text-armadillo-text">@{item.username}</span>
              <span className="text-[10px] text-armadillo-muted">{item.count} {item.count === 1 ? 'mention' : 'mentions'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
