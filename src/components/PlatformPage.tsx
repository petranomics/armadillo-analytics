'use client';

import { useState } from 'react';
import type { Platform, PlatformData, Post } from '@/lib/types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { useSettings } from '@/hooks/useSettings';
import KpiCard from '@/components/cards/KpiCard';
import EngagementChart from '@/components/charts/EngagementChart';
import EngagementDonut from '@/components/charts/EngagementDonut';
import DataTable from '@/components/ui/DataTable';
import { Users, TrendingUp, Eye, Heart, MessageCircle, Bookmark, RefreshCw, AlertCircle, Database } from 'lucide-react';

function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

interface PlatformPageProps {
    mockData: PlatformData;
    platform: Platform;
}

export default function PlatformPage({ mockData, platform }: PlatformPageProps) {
    const { settings } = useSettings();
    const [liveData, setLiveData] = useState<PlatformData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  const data = liveData || mockData;
    const isLive = !!liveData;
    const { profile, posts, summary } = data;
    const platformName = PLATFORM_NAMES[profile.platform];
    const hasCredentials = !!settings.usernames[platform];

  const fetchLiveData = async () => {
        if (!settings.usernames[platform]) return;
        setLoading(true);
        setError(null);

        try {
                const res = await fetch('/api/scrape', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                                      platform,
                                      username: settings.usernames[platform],
                          }),
                });

          const json = await res.json();
                if (!res.ok) {
                          throw new Error(json.error || 'Failed to fetch data');
                }

          // Transform raw results into PlatformData
          const rawPosts: Post[] = (json.results || []).slice(0, 25).map((item: Record<string, unknown>, i: number) => {
                    const metrics = transformMetrics(platform, item);
                    const totalEng = metrics.likes + metrics.comments + (metrics.shares || 0);
                    const followers = Number(item.followersCount || item.subscribersCount || item.followers || 1);

                                                                                 return {
                                                                                             id: `${platform}-live-${i}`,
                                                                                             platform,
                                                                                             url: String(item.url || item.postUrl || item.webVideoUrl || item.link || '#'),
                                                                                             caption: String(item.caption || item.text || item.title || item.description || item.fullText || ''),
                                                                                             thumbnailUrl: String(item.displayUrl || item.thumbnailUrl || item.thumbnail || ''),
                                                                                             publishedAt: String(item.timestamp || item.createTime || item.publishedAt || item.date || item.createdAt || new Date().toISOString()),
                                                                                             metrics,
                                                                                             engagementRate: followers > 0 ? parseFloat(((totalEng / followers) * 100).toFixed(1)) : 0,
                                                                                 };
          });

          const totalLikes = rawPosts.reduce((s, p) => s + p.metrics.likes, 0);
                const totalComments = rawPosts.reduce((s, p) => s + p.metrics.comments, 0);
                const totalShares = rawPosts.reduce((s, p) => s + (p.metrics.shares || 0), 0);
                const totalViews = rawPosts.reduce((s, p) => s + (p.metrics.views || 0), 0);
                const totalEng = totalLikes + totalComments + totalShares;

          // Try to extract profile info from the first result
          const first = json.results?.[0] || {};

          const liveProfile = {
                    platform,
                    username: settings.usernames[platform] || '',
                    displayName: String(first.fullName || first.ownerFullName || first.authorName || first.channelName || first.name || first.authorDisplayName || settings.usernames[platform] || ''),
                    avatarUrl: String(first.profilePicUrlHD || first.profilePicUrl || first.avatarUrl || first.profileImageUrl || ''),
                    followers: Number(first.followersCount || first.subscribersCount || first.followers || first.userFollowersCount || 0),
                    following: Number(first.followsCount || first.followingCount || first.following || 0),
                    totalPosts: rawPosts.length,
                    bio: String(first.biography || first.bio || first.description || ''),
                    verified: Boolean(first.verified || first.isVerified),
          };

          const newData: PlatformData = {
                    profile: liveProfile,
                    posts: rawPosts,
                    summary: {
                                totalEngagement: totalEng,
                                avgEngagementRate:
                                              rawPosts.length > 0
                                    ? parseFloat((rawPosts.reduce((s, p) => s + p.engagementRate, 0) / rawPosts.length).toFixed(1))
                                                : 0,
                                topPost:
                                              rawPosts.sort(
                                                              (a, b) => (b.metrics.likes + b.metrics.comments) - (a.metrics.likes + a.metrics.comments)
                                                            )[0] || rawPosts[0],
                                totalViews: totalViews > 0 ? totalViews : undefined,
                    },
          };

          setLiveData(newData);
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
                setLoading(false);
        }
  };

  const totalLikes = posts.reduce((sum, p) => sum + p.metrics.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.metrics.comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.metrics.shares || 0), 0);
    const totalSaves = posts.reduce((sum, p) => sum + (p.metrics.saves || 0), 0);

  return (
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
              <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        {profile.avatarUrl ? (
                      <img
                                      src={profile.avatarUrl}
                                      alt={profile.displayName}
                                      className="w-14 h-14 rounded-full object-cover"
                                    />
                    ) : (
                      <div
                                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-display font-bold"
                                      style={{
                                                        backgroundColor: `var(--color-platform-${profile.platform})`,
                                                        color: profile.platform === 'tiktok' ? '#000' : '#fff',
                                      }}
                                    >
                        {profile.displayName.charAt(0)}
                      </div>div>
                                )}
                                <div>
                                            <div className="flex items-center gap-2">
                                                          <h1 className="font-display text-2xl text-armadillo-text">{profile.displayName}</h1>h1>
                                                          <span
                                                                            className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                                                            style={{
                                                                                                backgroundColor: `var(--color-platform-${profile.platform})`,
                                                                                                color: profile.platform === 'tiktok' ? '#000' : '#fff',
                                                                            }}
                                                                          >
                                                            {platformName}
                                                          </span>span>
                                              {profile.verified && (
                          <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded">Verified</span>span>
                                                          )}
                                            </div>div>
                                            <p className="text-sm text-armadillo-muted">@{profile.username}</p>p>
                                  {profile.bio && <p className="text-xs text-armadillo-muted mt-1 max-w-lg">{profile.bio}</p>p>}
                                </div>div>
                      </div>div>
              
                {/* Live Data Controls */}
                      <div className="flex items-center gap-3">
                        {isLive && (
                      <span className="flex items-center gap-1.5 text-[11px] text-success">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    Live Data
                      </span>span>
                                )}
                        {!isLive && (
                      <span className="flex items-center gap-1.5 text-[11px] text-armadillo-muted">
                                    <Database size={12} />
                                    Demo Data
                      </span>span>
                                )}
                        {hasCredentials ? (
                      <button
                                      onClick={fetchLiveData}
                                      disabled={loading}
                                      className="flex items-center gap-2 bg-burnt hover:bg-burnt-light disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                                    >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Fetching...' : isLive ? 'Refresh' : 'Fetch Live Data'}
                      </button>button>
                    ) : (
                      <a
                                      href="/settings"
                                      className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-lg text-xs hover:border-burnt/50 transition-colors"
                                    >
                                    Configure in Settings
                      </a>a>
                                )}
                      </div>div>
              </div>div>
        
          {/* Error */}
          {error && (
                  <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
                            <AlertCircle size={16} className="text-danger" />
                            <span className="text-sm text-danger">{error}</span>span>
                  </div>div>
              )}
        
          {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                      <KpiCard label="Followers" value={formatNumber(profile.followers)} trend={3.2} icon={<Users size={14} />} />
                      <KpiCard
                                  label="Engagement Rate"
                                  value={`${summary.avgEngagementRate}%`}
                                  trend={1.8}
                                  icon={<TrendingUp size={14} />}
                                />
                {summary.totalViews !== undefined && (
                    <KpiCard label="Total Views" value={formatNumber(summary.totalViews)} trend={12.4} icon={<Eye size={14} />} />
                  )}
                      <KpiCard label="Total Likes" value={formatNumber(totalLikes)} icon={<Heart size={14} />} />
                      <KpiCard label="Total Comments" value={formatNumber(totalComments)} icon={<MessageCircle size={14} />} />
                {totalSaves > 0 && (
                    <KpiCard label="Total Saves" value={formatNumber(totalSaves)} icon={<Bookmark size={14} />} />
                  )}
              </div>div>
        
          {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <EngagementChart platform={profile.platform} posts={posts} />
                      <EngagementDonut
                                  likes={totalLikes}
                                  comments={totalComments}
                                  shares={totalShares}
                                  saves={totalSaves > 0 ? totalSaves : undefined}
                                />
              </div>div>
        
          {/* Posts Table */}
              <div>
                      <h2 className="text-sm font-medium text-armadillo-text mb-3">All Posts ({posts.length})</h2>h2>
                      <DataTable posts={posts} />
              </div>div>
        </div>div>
      );
}

function transformMetrics(platform: Platform, item: Record<string, unknown>) {
    switch (platform) {
      case 'tiktok':
              return {
                        views: Number(item.playCount || item.views || item.videoPlayCount || 0),
                        likes: Number(item.diggCount || item.likes || item.heartCount || 0),
                        comments: Number(item.commentCount || item.comments || 0),
                        shares: Number(item.shareCount || item.shares || 0),
                        saves: Number(item.collectCount || item.bookmarks || 0),
              };
      case 'instagram':
              return {
                        views: Number(item.videoViewCount || item.videoPlayCount || item.viewCount || 0),
                        likes: Number(item.likesCount || item.likes || 0),
                        comments: Number(item.commentsCount || item.comments || 0),
                        shares: Number(item.sharesCount || item.shares || 0),
                        saves: Number(item.savesCount || item.saves || 0),
              };
      case 'youtube':
              return {
                        views: Number(item.viewCount || item.views || 0),
                        likes: Number(item.likes || item.likeCount || 0),
                        comments: Number(item.commentCount || item.comments || item.numberOfComments || 0),
                        shares: 0,
              };
      case 'twitter':
              return {
                        views: Number(item.viewCount || item.views || 0),
                        likes: Number(item.likeCount || item.likes || item.favoriteCount || 0),
                        comments: Number(item.replyCount || item.replies || 0),
                        shares: Number(item.retweetCount || item.retweets || 0),
                        retweets: Number(item.retweetCount || item.retweets || 0),
                        quotes: Number(item.quoteCount || item.quotes || 0),
              };
      case 'linkedin':
              return {
                        likes: Number(item.likeCount || item.likes || item.numLikes || 0),
                        comments: Number(item.commentCount || item.comments || item.numComments || 0),
                        shares: Number(item.shareCount || item.shares || item.numShares || 0),
              };
      default:
              return { likes: 0, comments: 0 };
    }
}</div>
