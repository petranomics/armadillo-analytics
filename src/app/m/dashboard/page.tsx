'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { USER_TYPES, ALL_METRICS, type MetricDefinition, type MetricCategory, CATEGORY_LABELS } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw, Bell, Sparkles, Info, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import OfflineBanner from '@/components/mobile/OfflineBanner';
import NotificationPanel from '@/components/mobile/NotificationPanel';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Post, Platform } from '@/lib/types';
import { getAIOneLiner } from '@/lib/ai-insights';
import { persistImagesClientSide } from '@/lib/image-cache';
import { computeCompoundMetrics, type CompoundMetrics } from '@/lib/compound-metrics';

const PULL_THRESHOLD = 80;

const EngagementBreakdown = dynamic(() => import('@/components/mobile/charts/EngagementBreakdown'), { ssr: false });
const EngagementTrend = dynamic(() => import('@/components/mobile/charts/EngagementTrend'), { ssr: false });
const PeakHours = dynamic(() => import('@/components/mobile/charts/PeakHours'), { ssr: false });
const WatchDuration = dynamic(() => import('@/components/mobile/charts/WatchDuration'), { ssr: false });

interface LiveMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  totalSaves: number;
  followers: number;
  engagementRate: number;
  followerGrowth: number;
  postCount: number;
}

interface ExportData {
  profile: { followers: number; [key: string]: unknown };
  posts: Post[];
  summary: { avgEngagementRate: number; [key: string]: unknown };
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
}

function loadPlatformData(platforms: string[]): { metrics: LiveMetrics | null; allPosts: Post[] } {
  let totalLikes = 0, totalComments = 0, totalShares = 0, totalViews = 0;
  let followers = 0, engagementRateSum = 0, platformCount = 0, postCount = 0;
  const allPosts: Post[] = [];

  for (const platform of platforms) {
    try {
      const raw = localStorage.getItem(`armadillo-export-data-${platform}`);
      if (!raw) continue;
      const data = JSON.parse(raw) as ExportData;
      const cm = data.computedMetrics;
      totalLikes += cm.totalLikes;
      totalComments += cm.totalComments;
      totalShares += cm.totalShares;
      totalViews += cm.totalViews;
      followers += data.profile.followers || 0;
      engagementRateSum += cm.avgEngagementRate;
      postCount += data.posts?.length || 0;
      platformCount++;
      if (data.posts) allPosts.push(...data.posts);
    } catch { /* ignore parse errors */ }
  }

  // Also try the generic key as fallback
  if (platformCount === 0) {
    try {
      const raw = localStorage.getItem('armadillo-export-data');
      if (raw) {
        const data = JSON.parse(raw) as ExportData;
        const cm = data.computedMetrics;
        totalLikes = cm.totalLikes;
        totalComments = cm.totalComments;
        totalShares = cm.totalShares;
        totalViews = cm.totalViews;
        followers = data.profile.followers || 0;
        engagementRateSum = cm.avgEngagementRate;
        postCount = data.posts?.length || 0;
        platformCount = 1;
        if (data.posts) allPosts.push(...data.posts);
      }
    } catch { /* ignore */ }
  }

  if (platformCount === 0) return { metrics: null, allPosts: [] };

  return {
    metrics: {
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
      totalSaves: 0,
      followers,
      engagementRate: parseFloat((engagementRateSum / platformCount).toFixed(1)),
      followerGrowth: followers,
      postCount,
    },
    allPosts,
  };
}

export default function MobileDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [compoundMetrics, setCompoundMetrics] = useState<CompoundMetrics | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<{
    bestPostingHour: string | null;
    topHashtags: { tag: string; avgEng: number }[];
    topPostCount: number;
    contentTypes: { type: string; count: number; avgEng: number }[];
  } | null>(null);
  const blobUploadedRef = useRef(false);
  // Track the latest scraped platform + posts for image persistence
  const [lastScrape, setLastScrape] = useState<{ platform: Platform; posts: Post[]; profile: Record<string, unknown> } | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    if (!profile || scraping) return;
    // Use the first selected platform that has a username
    const platform = profile.selectedPlatforms.find(p => profile.platformUsernames[p]) as Platform | undefined;
    if (!platform) {
      setScrapeError('No platform username configured. Go to Settings to add one.');
      return;
    }
    const username = profile.platformUsernames[platform]!;

    setScraping(true);
    setScrapeError(null);
    blobUploadedRef.current = false;

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch data');

      const rawPosts: Post[] = (json.results || []).slice(0, 25).map((item: Record<string, unknown>, i: number) => {
        const metrics = transformMetrics(platform, item);
        const totalEng = metrics.likes + metrics.comments + (metrics.shares || 0);
        const followers = Number(item.followersCount || item.subscribersCount || item.followers || 1);
        return {
          id: `${platform}-live-${i}`,
          platform,
          url: String(item.url || item.postUrl || item.webVideoUrl || item.link || '#'),
          caption: String(item.caption || item.text || item.title || item.description || item.fullText || ''),
          thumbnailUrl: String(item.displayUrl || item.thumbnailUrl || ''),
          contentType: String(item.type || item.productType || 'Image'),
          hashtags: Array.isArray(item.hashtags) ? (item.hashtags as string[]) : [],
          mentions: Array.isArray(item.mentions) ? (item.mentions as string[]) : [],
          publishedAt: String(item.timestamp || item.createTime || item.publishedAt || item.date || item.createdAt || new Date().toISOString()),
          metrics,
          engagementRate: followers > 0 ? parseFloat(((totalEng / followers) * 100).toFixed(1)) : 0,
        };
      });

      const totalLikes = rawPosts.reduce((s, p) => s + p.metrics.likes, 0);
      const totalComments = rawPosts.reduce((s, p) => s + p.metrics.comments, 0);
      const totalShares = rawPosts.reduce((s, p) => s + (p.metrics.shares || 0), 0);
      const totalViews = rawPosts.reduce((s, p) => s + (p.metrics.views || 0), 0);

      const first = json.results?.[0] || {};
      const liveProfile = {
        platform,
        username,
        displayName: String(first.ownerFullName || first.authorName || first.channelName || first.name || first.authorDisplayName || username || ''),
        followers: Number(first.followersCount || first.subscribersCount || first.followers || first.userFollowersCount || 0),
        following: Number(first.followingCount || first.following || 0),
        totalPosts: Number(first.profilePostsCount || first.postsCount || first.videoCount || rawPosts.length),
        bio: String(first.biography || first.bio || first.description || ''),
        verified: Boolean(first.verified || first.isVerified),
        avatarUrlHD: String(first.profilePicUrlHD || '') || undefined,
        externalUrl: String(first.externalUrl || '') || undefined,
      };

      // Compute export payload
      const avgVPP = rawPosts.length > 0 && totalViews > 0 ? Math.round(totalViews / rawPosts.length) : 0;
      const pDates = rawPosts.map(p => new Date(p.publishedAt).getTime()).filter(t => !isNaN(t)).sort((a, b) => a - b);
      let pFreq = '';
      if (pDates.length >= 2) {
        const rangeDays = (pDates[pDates.length - 1] - pDates[0]) / (1000 * 60 * 60 * 24);
        if (rangeDays > 0) {
          const perWeek = (rawPosts.length / rangeDays) * 7;
          pFreq = `~${perWeek.toFixed(1)}/week`;
        }
      }

      const avgEngRate = rawPosts.length > 0
        ? parseFloat((rawPosts.reduce((s, p) => s + p.engagementRate, 0) / rawPosts.length).toFixed(1))
        : 0;

      const exportPayload = {
        profile: liveProfile,
        posts: rawPosts,
        summary: {
          totalEngagement: totalLikes + totalComments + totalShares,
          avgEngagementRate: avgEngRate,
          topPost: [...rawPosts].sort((a, b) =>
            (b.metrics.likes + b.metrics.comments) - (a.metrics.likes + a.metrics.comments)
          )[0] || rawPosts[0],
        },
        computedMetrics: {
          totalLikes,
          totalComments,
          totalShares,
          totalViews,
          avgViewsPerPost: avgVPP,
          postingFreq: pFreq,
          avgEngagementRate: avgEngRate,
        },
        exportedAt: new Date().toISOString(),
      };

      // Persist to localStorage
      localStorage.setItem('armadillo-export-data', JSON.stringify(exportPayload));
      localStorage.setItem(`armadillo-export-data-${platform}`, JSON.stringify(exportPayload));

      // Refresh dashboard metrics from localStorage
      const { metrics, allPosts: posts } = loadPlatformData(profile.selectedPlatforms);
      if (metrics) {
        setLiveMetrics(metrics);
        setAllPosts(posts);
        setIsLive(true);
      }

      // Trigger image persistence
      setLastScrape({ platform, posts: rawPosts, profile: liveProfile as unknown as Record<string, unknown> });
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setScraping(false);
    }
  }, [profile, scraping]);

  // Pull-to-refresh touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (pullRefreshing || scraping) return;
    const container = scrollContainerRef.current;
    // Only activate when scrolled to top
    if (container && container.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [pullRefreshing, scraping]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      // Apply resistance: the further you pull, the harder it gets
      const dampened = Math.min(delta * 0.5, 130);
      setPullDistance(dampened);
    } else {
      // Scrolling up — cancel pull gesture
      isPulling.current = false;
      setPullDistance(0);
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setPullRefreshing(true);
      setPullDistance(PULL_THRESHOLD); // Hold at threshold while refreshing
      await handleRefresh();
      setPullRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, handleRefresh]);

  // Persist images to Vercel Blob after a successful scrape
  useEffect(() => {
    if (!lastScrape || blobUploadedRef.current) return;
    const { platform, posts: scrapedPosts, profile: scrapedProfile } = lastScrape;

    const hasExpirableUrls = scrapedPosts.some(p => p.thumbnailUrl && !p.thumbnailUrl.includes('.vercel-storage.com') && !p.thumbnailUrl.startsWith('data:'));
    if (!hasExpirableUrls) return;
    blobUploadedRef.current = true;

    const avatarUrl = scrapedProfile.avatarUrlHD as string | undefined;
    const imageUrls = [
      avatarUrl,
      ...scrapedPosts.map(p => p.thumbnailUrl).filter(Boolean),
    ].filter(u => u && !u.includes('.vercel-storage.com') && !u.startsWith('data:')) as string[];

    if (imageUrls.length === 0) return;

    console.log(`[Blob] Mobile: Converting ${imageUrls.length} images client-side...`);
    persistImagesClientSide(imageUrls).then(mapping => {
      const uploaded = Object.values(mapping).filter(v => v.includes('.vercel-storage.com')).length;
      console.log(`[Blob] Mobile: Done: ${uploaded}/${imageUrls.length} uploaded`);
      if (uploaded === 0) return;

      // Update localStorage with permanent URLs
      try {
        const rawExport = localStorage.getItem(`armadillo-export-data-${platform}`);
        if (rawExport) {
          const updated = JSON.parse(rawExport);
          if (updated.profile?.avatarUrlHD && mapping[updated.profile.avatarUrlHD]) {
            updated.profile.avatarUrlHD = mapping[updated.profile.avatarUrlHD];
          }
          if (updated.posts) {
            updated.posts = updated.posts.map((p: Record<string, unknown>) => ({
              ...p,
              thumbnailUrl: (p.thumbnailUrl && mapping[p.thumbnailUrl as string]) || p.thumbnailUrl,
            }));
          }
          localStorage.setItem('armadillo-export-data', JSON.stringify(updated));
          localStorage.setItem(`armadillo-export-data-${platform}`, JSON.stringify(updated));
        }
      } catch { /* ignore */ }
    }).catch(err => { console.error('[Blob] Mobile upload failed:', err); });
  }, [lastScrape]);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) {
      router.push('/m/onboarding');
      return;
    }
    setProfile(p);
    const { metrics, allPosts: posts } = loadPlatformData(p.selectedPlatforms);
    if (metrics) {
      setLiveMetrics(metrics);
      setAllPosts(posts);
      setIsLive(true);
    }
    setLoaded(true);
  }, [router]);

  // Listen for export data updates from other tabs
  useEffect(() => {
    if (!profile) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('armadillo-export-data') && e.newValue) {
        const { metrics, allPosts: posts } = loadPlatformData(profile.selectedPlatforms);
        if (metrics) {
          setLiveMetrics(metrics);
          setAllPosts(posts);
          setIsLive(true);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [profile]);

  // Compute compound metrics + content analysis from post data
  useEffect(() => {
    if (allPosts.length === 0 || !liveMetrics) return;

    // Compound metrics
    const cm = computeCompoundMetrics(allPosts, liveMetrics.followers);
    setCompoundMetrics(cm);

    // Content analysis: best posting hour
    const hourBuckets: Record<number, { count: number; totalEng: number }> = {};
    for (const p of allPosts) {
      const h = new Date(p.publishedAt).getHours();
      if (isNaN(h)) continue;
      if (!hourBuckets[h]) hourBuckets[h] = { count: 0, totalEng: 0 };
      hourBuckets[h].count++;
      hourBuckets[h].totalEng += (p.metrics.likes ?? 0) + (p.metrics.comments ?? 0) + (p.metrics.shares ?? 0);
    }
    let bestHour: number | null = null;
    let bestAvg = 0;
    for (const [h, b] of Object.entries(hourBuckets)) {
      const a = b.totalEng / b.count;
      if (a > bestAvg && b.count >= 2) { bestAvg = a; bestHour = parseInt(h); }
    }
    const bestPostingHour = bestHour !== null
      ? `${bestHour % 12 || 12}${bestHour >= 12 ? 'PM' : 'AM'}`
      : null;

    // Top hashtags
    const hashEng: Record<string, { totalEng: number; count: number }> = {};
    for (const p of allPosts) {
      const eng = (p.metrics.likes ?? 0) + (p.metrics.comments ?? 0) + (p.metrics.shares ?? 0);
      for (const tag of p.hashtags ?? []) {
        const t = tag.toLowerCase().replace(/^#/, '');
        if (!hashEng[t]) hashEng[t] = { totalEng: 0, count: 0 };
        hashEng[t].totalEng += eng;
        hashEng[t].count++;
      }
    }
    const topHashtags = Object.entries(hashEng)
      .filter(([, v]) => v.count >= 2)
      .map(([tag, v]) => ({ tag, avgEng: Math.round(v.totalEng / v.count) }))
      .sort((a, b) => b.avgEng - a.avgEng)
      .slice(0, 5);

    // Content types
    const typeEng: Record<string, { count: number; totalEng: number }> = {};
    for (const p of allPosts) {
      const raw = (p.contentType ?? 'Post').toLowerCase();
      let type = 'Post';
      if (raw.includes('video') || raw.includes('reel') || raw === 'clip') type = 'Reels / Video';
      else if (raw.includes('carousel') || raw.includes('sidecar')) type = 'Carousel';
      else if (raw.includes('image') || raw.includes('photo')) type = 'Photo';
      if (!typeEng[type]) typeEng[type] = { count: 0, totalEng: 0 };
      typeEng[type].count++;
      typeEng[type].totalEng += (p.metrics.likes ?? 0) + (p.metrics.comments ?? 0) + (p.metrics.shares ?? 0);
    }
    const contentTypes = Object.entries(typeEng)
      .map(([type, v]) => ({ type, count: v.count, avgEng: Math.round(v.totalEng / v.count) }))
      .sort((a, b) => b.avgEng - a.avgEng);

    setContentAnalysis({
      bestPostingHour,
      topHashtags,
      topPostCount: allPosts.length,
      contentTypes,
    });
  }, [allPosts, liveMetrics]);

  if (!loaded || !profile) return null;

  const userConfig = USER_TYPES.find(u => u.id === profile.userType);
  const selectedMetricDefs = profile.selectedMetrics
    .map(id => ALL_METRICS.find(m => m.id === id))
    .filter(Boolean) as MetricDefinition[];

  const grouped: Record<string, MetricDefinition[]> = {};
  for (const m of selectedMetricDefs) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  const heroMetrics = selectedMetricDefs.slice(0, 4);

  const videoPlatforms = ['tiktok', 'youtube', 'instagram'] as const;
  const hasVideoMetrics = profile.selectedPlatforms.some(p => videoPlatforms.includes(p as typeof videoPlatforms[number]));

  const toggleExpand = (id: string) => {
    setExpandedMetric(prev => prev === id ? null : id);
  };

  // Returns real scraped data or '--' when unavailable
  function getMetricValue(metric: MetricDefinition): { value: string; trend: number; raw: number } {
    if (!liveMetrics) return { value: '--', trend: 0, raw: 0 };

    const formatNum = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      return n.toLocaleString();
    };

    const pct = (n: number | null | undefined) =>
      n !== null && n !== undefined ? { value: `${n}%`, trend: 0, raw: n } : null;
    const num = (n: number | null | undefined) =>
      n !== null && n !== undefined ? { value: formatNum(n), trend: 0, raw: n } : null;

    const cm = compoundMetrics;
    const ca = contentAnalysis;

    switch (metric.id) {
      // === Core engagement (from liveMetrics) ===
      case 'engagement_rate':
        return { value: `${liveMetrics.engagementRate}%`, trend: 0, raw: liveMetrics.engagementRate };
      case 'likes':
        return { value: formatNum(liveMetrics.totalLikes), trend: 0, raw: liveMetrics.totalLikes };
      case 'follower_growth':
        return { value: formatNum(liveMetrics.followers), trend: 0, raw: liveMetrics.followers };
      case 'comments':
        return { value: formatNum(liveMetrics.totalComments), trend: 0, raw: liveMetrics.totalComments };
      case 'shares':
      case 'reposts':
        return liveMetrics.totalShares > 0
          ? { value: formatNum(liveMetrics.totalShares), trend: 0, raw: liveMetrics.totalShares }
          : { value: '--', trend: 0, raw: 0 };
      case 'saves':
        return liveMetrics.totalSaves > 0
          ? { value: formatNum(liveMetrics.totalSaves), trend: 0, raw: liveMetrics.totalSaves }
          : { value: '--', trend: 0, raw: 0 };
      case 'views':
      case 'video_views':
        return liveMetrics.totalViews > 0
          ? { value: formatNum(liveMetrics.totalViews), trend: 0, raw: liveMetrics.totalViews }
          : { value: '--', trend: 0, raw: 0 };

      // === Compound metrics (from post analysis) ===
      case 'conversation_rate':
        return pct(cm?.conversationRate) ?? { value: '--', trend: 0, raw: 0 };
      case 'amplification_rate':
        return pct(cm?.amplificationRate) ?? { value: '--', trend: 0, raw: 0 };
      case 'virality_rate':
        return pct(cm?.viralityRate) ?? { value: '--', trend: 0, raw: 0 };
      case 'comment_to_like_ratio':
        return pct(cm?.commentToLikeRatio) ?? { value: '--', trend: 0, raw: 0 };
      case 'views_to_eng_rate':
        return pct(cm?.viewsToEngRate) ?? { value: '--', trend: 0, raw: 0 };
      case 'save_rate':
        return pct(cm?.saveRate) ?? { value: '--', trend: 0, raw: 0 };
      case 'follower_to_view_ratio':
        return cm?.followerToViewRatio !== null && cm?.followerToViewRatio !== undefined
          ? { value: `${cm.followerToViewRatio}x`, trend: 0, raw: cm.followerToViewRatio }
          : { value: '--', trend: 0, raw: 0 };

      // === Content intelligence (from compound metrics) ===
      case 'hashtag_performance':
        if (cm?.hashtagLift !== null && cm?.hashtagLift !== undefined) {
          return { value: `${cm.hashtagLift > 0 ? '+' : ''}${cm.hashtagLift}%`, trend: 0, raw: cm.hashtagLift };
        }
        if (ca && ca.topHashtags.length > 0) {
          return { value: `#${ca.topHashtags[0].tag}`, trend: 0, raw: ca.topHashtags[0].avgEng };
        }
        return { value: '--', trend: 0, raw: 0 };
      case 'content_topic_analysis':
        if (ca && ca.contentTypes.length > 0) {
          return { value: ca.contentTypes[0].type, trend: 0, raw: ca.contentTypes[0].avgEng };
        }
        return { value: '--', trend: 0, raw: 0 };
      case 'best_posting_times':
        return ca?.bestPostingHour
          ? { value: ca.bestPostingHour, trend: 0, raw: 0 }
          : { value: '--', trend: 0, raw: 0 };
      case 'content_velocity':
        return num(cm?.engagementVelocity) ?? { value: '--', trend: 0, raw: 0 };
      case 'top_posts':
      case 'top_videos':
        return ca
          ? { value: `${ca.topPostCount} posts`, trend: 0, raw: ca.topPostCount }
          : { value: '--', trend: 0, raw: 0 };

      // === Brand / monetization (from compound metrics) ===
      case 'media_kit_score':
        return num(cm?.brandReadinessScore) ?? { value: '--', trend: 0, raw: 0 };
      case 'rate_recommendation':
      case 'sponsorship_roi':
        return cm?.estimatedPostValue
          ? { value: `$${formatNum(cm.estimatedPostValue)}`, trend: 0, raw: cm.estimatedPostValue }
          : { value: '--', trend: 0, raw: 0 };
      case 'revenue_per_mille':
        return cm?.estimatedCPM
          ? { value: `$${cm.estimatedCPM.toFixed(2)}`, trend: 0, raw: cm.estimatedCPM }
          : { value: '--', trend: 0, raw: 0 };

      // === Content consistency ===
      case 'content_lifecycle':
      case 'seasonal_trends':
        return num(cm?.postingConsistency) ?? { value: '--', trend: 0, raw: 0 };

      // === Not available from scraping ===
      case 'profile_views':
      case 'reach':
      case 'impressions':
      case 'website_taps':
      case 'directions_taps':
      case 'call_taps':
      case 'link_clicks':
      case 'traffic_sources':
      case 'article_amplification_rate':
      case 'cross_platform_reach':
      case 'audience_demographics':
      case 'audience_authenticity':
      case 'audience_seniority':
      case 'audience_industries':
      case 'audience_company_size':
      case 'audience_overlap':
      case 'local_audience_percentage':
      case 'brand_affinity':
      case 'returning_viewers':
      case 'competitor_benchmark':
      case 'competitor_local_benchmark':
      case 'product_trending_score':
      case 'watch_time':
      case 'avg_view_duration':
      case 'audience_retention_curve':
      case 'story_completion':
      case 'reel_retention':
      case 'click_through_rate':
      case 'sentiment_analysis':
      case 'shop_clicks':
      case 'conversion_rate':
      case 'revenue_per_video':
      case 'add_to_cart_rate':
      case 'customer_acquisition_cost':
      case 'affiliate_performance':
      case 'promo_code_performance':
      case 'content_roi':
      case 'ugc_tracking':
      case 'shorts_vs_long_performance':
      case 'optimal_video_length':
      case 'subscriber_growth':
      case 'reactions_breakdown':
        return { value: '--', trend: 0, raw: 0 };

      default:
        return { value: '--', trend: 0, raw: 0 };
    }
  }

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const spinnerRotation = pullRefreshing ? undefined : pullProgress * 270;

  return (
    <div
      ref={scrollContainerRef}
      className="pb-20 overscroll-none"
      style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{
          height: pullDistance > 0 || pullRefreshing ? `${pullDistance}px` : '0px',
          transition: isPulling.current ? 'none' : 'height 0.3s ease-out',
        }}
      >
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{
            opacity: pullProgress,
            transform: `scale(${0.5 + pullProgress * 0.5})`,
          }}
        >
          {pullRefreshing ? (
            <Loader2 size={20} className="text-burnt animate-spin" />
          ) : (
            <RefreshCw
              size={20}
              className="text-burnt"
              style={{
                transform: `rotate(${spinnerRotation}deg)`,
                transition: isPulling.current ? 'none' : 'transform 0.2s ease',
              }}
            />
          )}
          <span className="text-[10px] text-armadillo-muted font-medium">
            {pullRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-burnt flex items-center justify-center">
              <svg viewBox="0 0 40 40" width="16" height="16" fill="none">
                <ellipse cx="20" cy="22" rx="12" ry="8" fill="#FFF3E6" />
                <ellipse cx="20" cy="22" rx="10" ry="6" fill="#BF5700" />
              </svg>
            </div>
            <h1 className="font-display text-xl text-armadillo-text">Dashboard</h1>
            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
              </span>
            )}
          </div>
          <p className="text-[11px] text-armadillo-muted mt-1 ml-10">
            {userConfig?.label} &middot; {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="w-9 h-9 rounded-full bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted active:scale-90 transition-transform"
          >
            <Bell size={16} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={scraping}
            className="w-9 h-9 rounded-full bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted disabled:opacity-50"
          >
            {scraping ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* Scrape error message */}
      {scrapeError && (
        <div className="px-5 mb-3">
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertCircle size={14} className="text-danger shrink-0" />
            <span className="text-xs text-danger">{scrapeError}</span>
            <button onClick={() => setScrapeError(null)} className="ml-auto text-danger/60 text-xs font-medium">Dismiss</button>
          </div>
        </div>
      )}

      <OfflineBanner />

      {/* Platform Pills — tap to view platform dashboard */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {profile.selectedPlatforms.map((platform) => (
            <Link
              key={platform}
              href={`/m/${platform}`}
              className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border rounded-xl px-3 py-2.5 shrink-0 active:scale-95 transition-transform min-h-[44px]"
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: `var(--color-platform-${platform})`, color: platform === 'tiktok' ? '#000' : '#fff' }}
              >
                {PLATFORM_NAMES[platform].charAt(0)}
              </div>
              <div>
                <div className="text-xs font-medium text-armadillo-text">{PLATFORM_NAMES[platform]}</div>
                <div className="text-[9px] text-armadillo-muted">
                  {profile.platformUsernames[platform] ? `@${profile.platformUsernames[platform]}` : 'Not connected'}
                </div>
              </div>
              <ChevronRight size={14} className="text-armadillo-muted ml-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* Hero KPIs - Top 4 in a 2x2 grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {heroMetrics.map((metric) => {
            const { value, trend } = getMetricValue(metric);
            const isExpanded = expandedMetric === metric.id;
            const aiLine = isLive ? getAIOneLiner(metric, trend) : null;
            return (
              <button
                key={metric.id}
                onClick={() => toggleExpand(metric.id)}
                className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{metric.icon}</span>
                  <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium truncate">{metric.label}</span>
                </div>
                <div className="font-display text-2xl text-armadillo-text mb-1">{value}</div>
                {trend !== 0 && (
                  <div className={`flex items-center gap-1 text-[11px] ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                    {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trend)}% this period
                  </div>
                )}
                {/* AI one-liner - only when live data */}
                {aiLine && (
                  <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-armadillo-border/50">
                    <Sparkles size={10} className="text-burnt shrink-0 mt-0.5" />
                    <p className={`text-[10px] leading-relaxed text-armadillo-muted ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {aiLine}
                    </p>
                  </div>
                )}
                {isExpanded && (
                  <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-armadillo-border/50">
                    <Info size={10} className="text-armadillo-muted shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-armadillo-muted/70">
                      {metric.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No data banner */}
      {!isLive && (
        <div className="px-5 mb-5">
          <div className="bg-burnt/10 border border-burnt/30 rounded-lg px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-burnt shrink-0" />
            <div>
              <span className="text-sm text-burnt font-medium">No live data yet.</span>
              <span className="text-sm text-armadillo-muted ml-1">
                Visit your platform dashboard to fetch live data.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section */}
      <div className="px-5 mb-5 space-y-3">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-0.5">Analytics Overview</h3>
        <EngagementBreakdown realData={liveMetrics ? { likes: liveMetrics.totalLikes, comments: liveMetrics.totalComments, shares: liveMetrics.totalShares, saves: liveMetrics.totalSaves } : undefined} />
        <EngagementTrend posts={allPosts.length > 0 ? allPosts : undefined} />
        <PeakHours posts={allPosts.length > 0 ? allPosts : undefined} />
        {hasVideoMetrics && <WatchDuration />}
      </div>

      {/* Remaining Metrics by Category — hide categories where every metric is '--' */}
      {Object.entries(grouped).map(([category, metrics]) => {
        const categoryMetrics = metrics.filter(m => !heroMetrics.includes(m));
        if (categoryMetrics.length === 0) return null;

        // Skip entire category if all metrics would show '--'
        const hasAnyData = categoryMetrics.some(m => getMetricValue(m).value !== '--');
        if (!hasAnyData) return null;

        return (
          <div key={category} className="px-5 mb-5">
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">
              {CATEGORY_LABELS[category as MetricCategory]}
            </h3>
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
              {categoryMetrics.map((metric, i) => {
                const { value, trend } = getMetricValue(metric);
                const isExpanded = expandedMetric === metric.id;
                const aiLine = isLive ? getAIOneLiner(metric, trend) : null;
                return (
                  <div
                    key={metric.id}
                    className={i < categoryMetrics.length - 1 ? 'border-b border-armadillo-border/50' : ''}
                  >
                    <button
                      onClick={() => toggleExpand(metric.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="text-base shrink-0">{metric.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-armadillo-text">{metric.label}</div>
                        {aiLine && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Sparkles size={8} className="text-burnt shrink-0" />
                            <p className="text-[10px] text-armadillo-muted truncate">{aiLine}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-display text-armadillo-text">{value}</div>
                        {trend !== 0 && (
                          <div className={`text-[10px] flex items-center justify-end gap-0.5 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                            {trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {Math.abs(trend)}%
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-armadillo-border shrink-0" />
                      ) : (
                        <ChevronDown size={14} className="text-armadillo-border shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3.5 -mt-1 space-y-2">
                        {aiLine && (
                          <div className="bg-burnt/5 border border-burnt/20 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles size={12} className="text-burnt shrink-0 mt-0.5" />
                              <p className="text-[11px] text-armadillo-text/80 leading-relaxed">{aiLine}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2 px-1">
                          <Info size={10} className="text-armadillo-muted shrink-0 mt-0.5" />
                          <p className="text-[10px] text-armadillo-muted/70 leading-relaxed">{metric.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quick Actions */}
      <div className="px-5 mb-6">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/m/export')}
            className="bg-burnt/10 border border-burnt/30 rounded-2xl p-4 text-left"
          >
            <div className="text-sm font-medium text-burnt mb-1">Export Report</div>
            <div className="text-[10px] text-armadillo-muted">Share with brands or clients</div>
          </button>
          <button
            onClick={() => router.push('/m/customize')}
            className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 text-left"
          >
            <div className="text-sm font-medium text-armadillo-text mb-1">Customize Metrics</div>
            <div className="text-[10px] text-armadillo-muted">Add or remove tracked metrics</div>
          </button>
        </div>
      </div>

      <BottomNav />
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
