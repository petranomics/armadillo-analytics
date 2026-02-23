'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformPage from '@/components/PlatformPage';
import { mockInstagramData } from '@/lib/mock-data';
import { mockHashtagStats, mockHashtagPosts } from '@/lib/trend-data';
import type { HashtagStats, HashtagPost } from '@/lib/types';
import { Hash, TrendingUp, TrendingDown, Heart, MessageCircle, RefreshCw, Loader2 } from 'lucide-react';

function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function TrendingHashtags() {
    const [stats, setStats] = useState<HashtagStats[] | null>(null);
    const [posts, setPosts] = useState<HashtagPost[] | null>(null);
    const [loading, setLoading] = useState(false);

  const fetchTrends = useCallback(async () => {
        setLoading(true);
        try {
                const [statsRes, postsRes] = await Promise.allSettled([
                          fetch('/api/trends', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ source: 'instagramHashtags', params: { keywords: ['fitness', 'food', 'travel'] } }),
                          }).then(r => r.json()),
                          fetch('/api/trends', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ source: 'instagramHashtagPosts', params: { hashtags: ['austinfood', 'atxlife'], limit: 20 } }),
                          }).then(r => r.json()),
                        ]);
                setStats(statsRes.status === 'fulfilled' && statsRes.value.hashtagStats ? statsRes.value.hashtagStats : mockHashtagStats);
                setPosts(postsRes.status === 'fulfilled' && postsRes.value.hashtagPosts ? postsRes.value.hashtagPosts : mockHashtagPosts);
        } catch {
                setStats(mockHashtagStats);
                setPosts(mockHashtagPosts);
        } finally {
                setLoading(false);
        }
  }, []);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const displayStats = stats || mockHashtagStats;
    const displayPosts = posts || mockHashtagPosts;

  return (
        <div className="space-y-4">
              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                            <Hash size={16} className="text-burnt" />
                                            <h2 className="text-sm font-medium text-armadillo-text">Trending Hashtags</h2>
                                </div>
                                <button onClick={fetchTrends} disabled={loading} className="flex items-center gap-1.5 text-xs text-burnt font-medium disabled:opacity-50">
                                  {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                  {loading ? 'Refreshing...' : 'Refresh'}
                                </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {displayStats.map(tag => (
                      <div key={tag.hashtag} className="bg-armadillo-bg rounded-lg p-3.5">
                                    <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-medium text-armadillo-text">#{tag.hashtag}</span>
                                      {tag.trend === 'rising' && <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp size={10} /> Rising</span>}
                                      {tag.trend === 'declining' && <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded-full flex items-center gap-0.5"><TrendingDown size={10} /> Declining</span>}
                                      {tag.trend === 'stable' && <span className="text-[10px] bg-armadillo-border text-armadillo-muted px-2 py-0.5 rounded-full">Stable</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-armadillo-muted mb-2">
                                                    <span>{formatNumber(tag.postCount)} posts</span>
                                      {tag.avgEngagement && <span>{tag.avgEngagement}% avg eng.</span>}
                                    </div>
                        {tag.relatedHashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {tag.relatedHashtags.slice(0, 5).map(r => (
                                                              <span key={r} className="text-[10px] bg-armadillo-card text-armadillo-muted px-2 py-0.5 rounded">#{r}</span>
                                                            ))}
                                        </div>
                                    )}
                      </div>
                    ))}
                      </div>
              </div>
          {displayPosts.length > 0 && (
                  <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                            <h2 className="text-sm font-medium text-armadillo-text mb-4">Trending Posts by Hashtag</h2>
                            <div className="space-y-3">
                              {displayPosts.slice(0, 6).map(post => (
                                  <div key={post.id} className="bg-armadillo-bg rounded-lg p-3.5">
                                                  <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[10px] bg-burnt/15 text-burnt px-2 py-0.5 rounded">#{post.hashtag}</span>
                                                                    <span className="text-[10px] text-armadillo-muted">{timeAgo(post.publishedAt)}</span>
                                                  </div>
                                                  <p className="text-xs text-armadillo-text leading-relaxed mb-2 line-clamp-2">{post.caption}</p>
                                                  <div className="flex items-center gap-4 text-armadillo-muted">
                                                                    <span className="flex items-center gap-1 text-[11px]"><Heart size={11} />{formatNumber(post.likes)}</span>
                                                                    <span className="flex items-center gap-1 text-[11px]"><MessageCircle size={11} />{formatNumber(post.comments)}</span>
                                                  </div>
                                  </div>
                                ))}
                            </div>
                  </div>
              )}
        </div>
      );
}

export default function InstagramPage() {
    return (
          <div>
                <PlatformPage mockData={mockInstagramData} platform="instagram" />
                <div className="max-w-7xl mx-auto mt-6">
                        <TrendingHashtags />
                </div>
          </div>
        );
}</div>
