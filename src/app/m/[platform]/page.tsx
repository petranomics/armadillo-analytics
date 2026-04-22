'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMobileProfile } from '@/lib/mobile-store';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import OfflineBanner from '@/components/mobile/OfflineBanner';
import { SkeletonPlatform } from '@/components/mobile/SkeletonDashboard';
import type { Platform, Post, HashtagStats, HashtagPost } from '@/lib/types';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Hash,
  ExternalLink,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'];

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface PlatformExportData {
  profile: {
    followers: number;
    following?: number;
    totalPosts: number;
    displayName?: string;
    bio?: string;
    avatarUrlHD?: string;
    verified?: boolean;
    [key: string]: unknown;
  };
  posts: Post[];
  computedMetrics: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    avgViewsPerPost: number;
    postingFreq: string;
    avgEngagementRate: number;
  };
}

export default function MobilePlatformPage() {
  const router = useRouter();
  const params = useParams();
  const platformSlug = params.platform as string;

  const [data, setData] = useState<PlatformExportData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [hashtagStats, setHashtagStats] = useState<HashtagStats[] | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<HashtagPost[] | null>(null);

  // Validate platform
  const isValid = VALID_PLATFORMS.includes(platformSlug);
  const platform = platformSlug as Platform;
  const platformName = PLATFORM_NAMES[platform] || platformSlug;
  const platformColor = PLATFORM_COLORS[platform] || '#BF5700';

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(`armadillo-export-data-${platform}`);
      if (raw) {
        setData(JSON.parse(raw));
        return true;
      }
      // Fallback to generic key
      const fallback = localStorage.getItem('armadillo-export-data');
      if (fallback) {
        setData(JSON.parse(fallback));
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, [platform]);

  const handleScrape = useCallback(async () => {
    const profile = getMobileProfile();
    const username = profile.platformUsernames[platform];
    if (!username) {
      setScrapeError(`No ${platformName} username configured. Go to Settings.`);
      return;
    }

    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Scrape failed');

      // Reload from storage after scrape populates it
      setTimeout(() => {
        loadFromStorage();
        setScraping(false);
      }, 500);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Failed to fetch data');
      setScraping(false);
    }
  }, [platform, platformName, loadFromStorage]);

  // Load trending hashtags for Instagram
  const fetchTrends = useCallback(async () => {
    if (platform !== 'instagram') return;
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
          body: JSON.stringify({ source: 'instagramHashtagPosts', params: { hashtags: ['austinfood', 'atxlife'], limit: 10 } }),
        }).then(r => r.json()),
      ]);
      setHashtagStats(statsRes.status === 'fulfilled' && statsRes.value.hashtagStats ? statsRes.value.hashtagStats : null);
      setHashtagPosts(postsRes.status === 'fulfilled' && postsRes.value.hashtagPosts ? postsRes.value.hashtagPosts : null);
    } catch { /* ignore */ }
  }, [platform]);

  useEffect(() => {
    if (!isValid) {
      router.replace('/m/dashboard');
      return;
    }
    const profile = getMobileProfile();
    if (!profile.onboardingComplete) {
      router.replace('/m/onboarding');
      return;
    }

    loadFromStorage();
    fetchTrends();
    setLoaded(true);
  }, [isValid, router, loadFromStorage, fetchTrends]);

  if (!isValid) return null;

  if (!loaded) return <SkeletonPlatform />;

  const posts = data?.posts || [];
  const metrics = data?.computedMetrics;
  const profileData = data?.profile;
  const topPosts = [...posts].sort((a, b) => (b.metrics.likes + b.metrics.comments) - (a.metrics.likes + a.metrics.comments)).slice(0, 10);

  return (
    <div className="min-h-screen bg-armadillo-bg pb-24">
      <OfflineBanner />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-armadillo-bg/95 backdrop-blur-sm border-b border-armadillo-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/m/dashboard" className="flex items-center gap-2 text-armadillo-muted active:scale-95 transition-transform min-h-[44px]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-lg" style={{ color: platformColor }}>{platformName}</h1>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-1.5 text-armadillo-muted active:scale-95 transition-transform min-h-[44px] min-w-[44px] justify-center disabled:opacity-50"
          >
            {scraping ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {scrapeError && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {scrapeError}
          </div>
        )}

        {/* Profile card */}
        {profileData && (
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {profileData.avatarUrlHD && (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: platformColor }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profileData.avatarUrlHD} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-armadillo-text font-semibold text-sm truncate">{profileData.displayName || 'Unknown'}</span>
                  {profileData.verified && (
                    <span className="text-xs" style={{ color: platformColor }}>✓</span>
                  )}
                </div>
                {profileData.bio && (
                  <p className="text-xs text-armadillo-muted line-clamp-2 mt-0.5">{profileData.bio}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-armadillo-text">{formatNumber(profileData.followers)}</div>
                <div className="text-xs text-armadillo-muted">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-armadillo-text">{formatNumber(profileData.totalPosts)}</div>
                <div className="text-xs text-armadillo-muted">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: platformColor }}>
                  {metrics?.avgEngagementRate ? `${metrics.avgEngagementRate}%` : '—'}
                </div>
                <div className="text-xs text-armadillo-muted">Engagement</div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics grid */}
        {metrics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-armadillo-muted mb-1">
                <Heart size={14} />
                <span className="text-xs">Total Likes</span>
              </div>
              <div className="text-lg font-bold text-armadillo-text">{formatNumber(metrics.totalLikes)}</div>
            </div>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-armadillo-muted mb-1">
                <MessageCircle size={14} />
                <span className="text-xs">Comments</span>
              </div>
              <div className="text-lg font-bold text-armadillo-text">{formatNumber(metrics.totalComments)}</div>
            </div>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-armadillo-muted mb-1">
                <Eye size={14} />
                <span className="text-xs">Total Views</span>
              </div>
              <div className="text-lg font-bold text-armadillo-text">{formatNumber(metrics.totalViews)}</div>
            </div>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-armadillo-muted mb-1">
                <Share2 size={14} />
                <span className="text-xs">Shares</span>
              </div>
              <div className="text-lg font-bold text-armadillo-text">{formatNumber(metrics.totalShares)}</div>
            </div>
          </div>
        )}

        {/* No data state */}
        {!data && !scraping && (
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-8 text-center">
            <BarChart3 size={32} className="mx-auto text-armadillo-muted mb-3" />
            <p className="text-armadillo-text font-medium mb-1">No {platformName} data yet</p>
            <p className="text-xs text-armadillo-muted mb-4">Tap refresh to pull your latest analytics</p>
            <button
              onClick={handleScrape}
              className="inline-flex items-center gap-2 bg-burnt text-white px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform min-h-[44px]"
            >
              <RefreshCw size={16} />
              Fetch Data
            </button>
          </div>
        )}

        {/* Top Posts */}
        {topPosts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText size={14} /> Top Posts
            </h3>
            <div className="space-y-3">
              {topPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-armadillo-card border border-armadillo-border rounded-xl p-3 active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-3">
                    {post.thumbnailUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-armadillo-border shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-armadillo-text line-clamp-2">{post.caption || 'No caption'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-armadillo-muted">
                        <span className="flex items-center gap-0.5"><Heart size={10} /> {formatNumber(post.metrics.likes)}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {formatNumber(post.metrics.comments)}</span>
                        {post.metrics.views ? <span className="flex items-center gap-0.5"><Eye size={10} /> {formatNumber(post.metrics.views)}</span> : null}
                        <span className="ml-auto">{timeAgo(post.publishedAt)}</span>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-armadillo-muted shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trending Hashtags (Instagram only) */}
        {platform === 'instagram' && hashtagStats && hashtagStats.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Hash size={14} /> Trending Hashtags
            </h3>
            <div className="space-y-2">
              {hashtagStats.map((hs) => (
                <div key={hs.hashtag} className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-armadillo-text font-medium">#{hs.hashtag}</span>
                    <div className="text-xs text-armadillo-muted mt-0.5">{formatNumber(hs.postCount)} posts</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {hs.trend === 'rising' ? (
                      <TrendingUp size={14} className="text-success" />
                    ) : hs.trend === 'declining' ? (
                      <TrendingDown size={14} className="text-danger" />
                    ) : null}
                    <span className={hs.trend === 'rising' ? 'text-success' : hs.trend === 'declining' ? 'text-danger' : 'text-armadillo-muted'}>
                      {hs.trend || 'stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Posts */}
        {platform === 'instagram' && hashtagPosts && hashtagPosts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3">Trending Posts</h3>
            <div className="space-y-2">
              {hashtagPosts.slice(0, 5).map((hp) => (
                <a
                  key={hp.id}
                  href={hp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-armadillo-card border border-armadillo-border rounded-xl p-3 active:scale-[0.98] transition-transform"
                >
                  <div className="flex gap-3">
                    {hp.thumbnailUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-armadillo-border shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={hp.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-armadillo-text line-clamp-1">{hp.caption}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-armadillo-muted">
                        <span className="text-platform-instagram">#{hp.hashtag}</span>
                        <span className="flex items-center gap-0.5"><Heart size={10} /> {formatNumber(hp.likes)}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {formatNumber(hp.comments)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
