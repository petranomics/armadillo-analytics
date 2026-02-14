import type { Post } from '@/lib/types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 hover:border-burnt/40 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
          style={{
            backgroundColor: `var(--color-platform-${post.platform})`,
            color: post.platform === 'tiktok' ? '#000' : '#fff',
          }}
        >
          {PLATFORM_NAMES[post.platform]}
        </span>
        <span className="text-[11px] text-armadillo-muted">
          {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className="text-sm text-armadillo-text mb-3 line-clamp-2">{post.caption}</p>
      <div className="flex items-center gap-4 text-armadillo-muted">
        {post.metrics.views !== undefined && (
          <span className="flex items-center gap-1 text-xs">
            <Eye size={12} />
            {formatNumber(post.metrics.views)}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs">
          <Heart size={12} />
          {formatNumber(post.metrics.likes)}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <MessageCircle size={12} />
          {formatNumber(post.metrics.comments)}
        </span>
        {post.metrics.shares !== undefined && (
          <span className="flex items-center gap-1 text-xs">
            <Share2 size={12} />
            {formatNumber(post.metrics.shares)}
          </span>
        )}
        <span className="ml-auto text-xs font-medium text-burnt">
          {post.engagementRate}% eng.
        </span>
      </div>
    </div>
  );
}
