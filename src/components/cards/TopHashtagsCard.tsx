'use client';

import type { Post } from '@/lib/types';
import { Hash } from 'lucide-react';

interface TopHashtagsCardProps {
  posts: Post[];
}

export default function TopHashtagsCard({ posts }: TopHashtagsCardProps) {
  const counts: Record<string, { count: number; totalEng: number }> = {};

  for (const post of posts) {
    const eng = post.metrics.likes + post.metrics.comments;
    for (const tag of post.hashtags || []) {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      if (!normalized) continue;
      if (!counts[normalized]) counts[normalized] = { count: 0, totalEng: 0 };
      counts[normalized].count += 1;
      counts[normalized].totalEng += eng;
    }
  }

  const sorted = Object.entries(counts)
    .map(([tag, { count, totalEng }]) => ({ tag, count, avgEng: Math.round(totalEng / count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Check if avg engagement is meaningfully different across hashtags
  const uniqueAvgs = new Set(sorted.map(s => s.avgEng));
  const showAvgEng = uniqueAvgs.size > 1;

  // Count how many posts actually use hashtags
  const postsWithHashtags = posts.filter(p => p.hashtags && p.hashtags.length > 0).length;

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Hash size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Top Hashtags</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-armadillo-muted">No hashtags found in recent posts</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => (
            <div key={item.tag} className="flex items-center justify-between">
              <span className="text-xs text-armadillo-text">#{item.tag}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-armadillo-muted">{item.count} {item.count === 1 ? 'post' : 'posts'}</span>
                {showAvgEng && (
                  <span className="text-[10px] text-burnt font-medium">{item.avgEng.toLocaleString()} avg eng</span>
                )}
              </div>
            </div>
          ))}
          {postsWithHashtags < posts.length && (
            <div className="pt-2 border-t border-armadillo-border/50">
              <span className="text-[10px] text-armadillo-muted">
                {postsWithHashtags} of {posts.length} posts use hashtags
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
