'use client';

import { useState } from 'react';
import type { Post } from '@/lib/types';
import { ChevronUp, ChevronDown, Heart, MessageCircle, Eye, Share2 } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

type SortKey = 'date' | 'likes' | 'comments' | 'views' | 'engagement';

export default function DataTable({ posts, hideShares }: { posts: Post[]; hideShares?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...posts].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortKey) {
      case 'date':
        aVal = new Date(a.publishedAt).getTime();
        bVal = new Date(b.publishedAt).getTime();
        break;
      case 'likes':
        aVal = a.metrics.likes;
        bVal = b.metrics.likes;
        break;
      case 'comments':
        aVal = a.metrics.comments;
        bVal = b.metrics.comments;
        break;
      case 'views':
        aVal = a.metrics.views || 0;
        bVal = b.metrics.views || 0;
        break;
      case 'engagement':
        aVal = a.engagementRate;
        bVal = b.engagementRate;
        break;
      default:
        return 0;
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={12} className="text-armadillo-border" />;
    return sortAsc ? <ChevronUp size={12} className="text-burnt" /> : <ChevronDown size={12} className="text-burnt" />;
  };

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-armadillo-border">
            <th className="text-left px-4 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted w-[45%]">
              Post
            </th>
            <th
              className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted cursor-pointer hover:text-armadillo-text text-right"
              onClick={() => handleSort('date')}
            >
              <span className="flex items-center justify-end gap-1">Date <SortIcon col="date" /></span>
            </th>
            <th
              className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted cursor-pointer hover:text-armadillo-text text-right"
              onClick={() => handleSort('views')}
            >
              <span className="flex items-center justify-end gap-1"><Eye size={10} /> Views <SortIcon col="views" /></span>
            </th>
            <th
              className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted cursor-pointer hover:text-armadillo-text text-right"
              onClick={() => handleSort('likes')}
            >
              <span className="flex items-center justify-end gap-1"><Heart size={10} /> Likes <SortIcon col="likes" /></span>
            </th>
            <th
              className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted cursor-pointer hover:text-armadillo-text text-right"
              onClick={() => handleSort('comments')}
            >
              <span className="flex items-center justify-end gap-1"><MessageCircle size={10} /> Comments <SortIcon col="comments" /></span>
            </th>
            {!hideShares && (
            <th className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted text-right">
              <span className="flex items-center justify-end gap-1"><Share2 size={10} /> Shares</span>
            </th>
            )}
            <th
              className="px-3 py-3 text-[10px] font-medium tracking-wider uppercase text-armadillo-muted cursor-pointer hover:text-armadillo-text text-right"
              onClick={() => handleSort('engagement')}
            >
              <span className="flex items-center justify-end gap-1">Eng. Rate <SortIcon col="engagement" /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => (
            <tr key={post.id} className="border-b border-armadillo-border/50 hover:bg-armadillo-border/20 transition-colors">
              <td className="px-4 py-3">
                <p className="text-sm text-armadillo-text truncate max-w-sm">{post.caption}</p>
              </td>
              <td className="px-3 py-3 text-right text-xs text-armadillo-muted whitespace-nowrap">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
              <td className="px-3 py-3 text-right text-xs text-armadillo-text tabular-nums">
                {post.metrics.views !== undefined ? formatNumber(post.metrics.views) : '-'}
              </td>
              <td className="px-3 py-3 text-right text-xs text-armadillo-text tabular-nums">
                {formatNumber(post.metrics.likes)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-armadillo-text tabular-nums">
                {formatNumber(post.metrics.comments)}
              </td>
              {!hideShares && (
              <td className="px-3 py-3 text-right text-xs text-armadillo-text tabular-nums">
                {post.metrics.shares !== undefined ? formatNumber(post.metrics.shares) : '-'}
              </td>
              )}
              <td className="px-3 py-3 text-right text-xs font-medium text-burnt tabular-nums">
                {post.engagementRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
