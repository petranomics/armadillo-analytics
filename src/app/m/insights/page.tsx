'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { getMediaKit } from '@/lib/media-kit';
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, ArrowUpRight, Sparkles, Lock, ChevronDown, ChevronUp, Loader2, RefreshCw, Hash, ExternalLink, ArrowDownUp, Calendar, Image as ImageIcon } from 'lucide-react';
import type { Platform, Post, TrendData, HashtagStats, HashtagPost, RedditTrend, TikTokTrend } from '@/lib/types';

type PostSortKey = 'date' | 'likes' | 'engagement';

interface ExportData {
  profile: { followers: number; platform?: string; [key: string]: unknown };
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

function loadPostsFromStorage(platforms: Platform[]): Post[] {
  const allPosts: Post[] = [];

  for (const platform of platforms) {
    try {
      const raw = localStorage.getItem(`armadillo-export-data-${platform}`);
      if (!raw) continue;
      const data = JSON.parse(raw) as ExportData;
      if (data.posts && Array.isArray(data.posts)) {
        allPosts.push(...data.posts);
      }
    } catch { /* ignore parse errors */ }
  }

  // Fallback to the generic key if no platform-specific data found
  if (allPosts.length === 0) {
    try {
      const raw = localStorage.getItem('armadillo-export-data');
      if (raw) {
        const data = JSON.parse(raw) as ExportData;
        if (data.posts && Array.isArray(data.posts)) {
          allPosts.push(...data.posts);
        }
      }
    } catch { /* ignore */ }
  }

  return allPosts;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const yr = d.getFullYear().toString().slice(2);
  return `${mon} ${day}, '${yr}`;
}

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
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function InsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'posts' | 'trends'>('ai');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Trend data state — only fetched when trends tab is activated
  const [hashtagStats, setHashtagStats] = useState<HashtagStats[] | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<HashtagPost[] | null>(null);
  const [redditTrends, setRedditTrends] = useState<RedditTrend[] | null>(null);
  const [tiktokTrends, setTiktokTrends] = useState<TikTokTrend[] | null>(null);
  const [trendLoading, setTrendLoading] = useState<Record<string, boolean>>({});
  const [trendErrors, setTrendErrors] = useState<Record<string, string>>({});
  const [trendsFetched, setTrendsFetched] = useState(false);

  // Posts loaded from localStorage export data
  const [posts, setPosts] = useState<Post[]>([]);
  const [postSort, setPostSort] = useState<PostSortKey>('date');

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{ generatedAt: string; sections: { icon: string; title: string; body?: string | null; bullets?: string[] }[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) { router.push('/m/onboarding'); return; }
    setProfile(p);
    setLoaded(true);

    // Load posts from localStorage export data (platform-specific keys first, generic fallback)
    const loadedPosts = loadPostsFromStorage(p.selectedPlatforms);
    if (loadedPosts.length > 0) setPosts(loadedPosts);
  }, [router]);

  // Fetch a single trend source — only called on demand
  const fetchTrend = useCallback(async (source: string, params: Record<string, unknown>) => {
    setTrendLoading(prev => ({ ...prev, [source]: true }));
    setTrendErrors(prev => { const n = { ...prev }; delete n[source]; return n; });

    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, params }),
      });
      const data: TrendData & { error?: string } = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      if (data.hashtagStats) setHashtagStats(data.hashtagStats);
      if (data.hashtagPosts) setHashtagPosts(data.hashtagPosts);
      if (data.redditTrends) setRedditTrends(data.redditTrends);
      if (data.tiktokTrends) setTiktokTrends(data.tiktokTrends);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setTrendErrors(prev => ({ ...prev, [source]: message }));
    } finally {
      setTrendLoading(prev => ({ ...prev, [source]: false }));
    }
  }, []);

  // Lazy-load trends when the tab is first activated — use personalized keywords
  useEffect(() => {
    if (activeTab === 'trends' && !trendsFetched && profile) {
      setTrendsFetched(true);

      const hasIg = profile.selectedPlatforms.includes('instagram');
      const hasTiktok = profile.selectedPlatforms.includes('tiktok');

      // Pull personalized topics from media kit and profile
      const mediaKit = getMediaKit();
      const contentTopics = mediaKit.contentTopics.length > 0
        ? mediaKit.contentTopics.map(t => t.replace(/^#/, ''))
        : [];
      const niche = profile.tiktokNiche || '';

      // Build keyword list: contentTopics first, then niche as fallback, then generic defaults
      const hashtagKeywords = contentTopics.length > 0
        ? contentTopics.slice(0, 5)
        : niche
          ? [niche]
          : ['fitness', 'food', 'travel'];

      // Use user's tracked hashtags for post search, fall back to first few keywords
      const trackedHashtags = profile.trackedHashtags.length > 0
        ? profile.trackedHashtags.map(h => h.replace(/^#/, ''))
        : hashtagKeywords.slice(0, 2);

      // Use user's tracked subreddits, fall back to r/popular
      const subreddits = profile.trackedSubreddits.length > 0
        ? profile.trackedSubreddits
        : ['https://old.reddit.com/r/popular/'];

      // TikTok category from niche or content topics
      const tiktokCategory = niche || (contentTopics.length > 0 ? contentTopics[0] : 'General');

      // Fire relevant fetches in parallel — data only pulled when needed
      if (hasIg) {
        fetchTrend('instagramHashtags', { keywords: hashtagKeywords });
        fetchTrend('instagramHashtagPosts', { hashtags: trackedHashtags, limit: 20 });
      }

      fetchTrend('redditTrends', { subreddits, maxPosts: 15 });

      if (hasTiktok) {
        fetchTrend('tiktokTrends', { category: tiktokCategory, maxProducts: 8 });
      }
    }
  }, [activeTab, trendsFetched, profile, fetchTrend]);

  // Fetch AI insights on demand
  const fetchAIInsights = useCallback(async () => {
    if (!profile || posts.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts,
          platform: profile.selectedPlatforms[0],
          username: profile.platformUsernames?.[profile.selectedPlatforms[0]] || 'unknown',
          userType: profile.userType,
          niche: profile.tiktokNiche || undefined,
          trends: {
            hashtagStats: hashtagStats || [],
            redditTrends: redditTrends || [],
            tiktokTrends: tiktokTrends || [],
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate insights');
      setAiAnalysis(json);
    } catch (err) {
      console.error('AI insights error:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setAiLoading(false);
    }
  }, [profile, posts, hashtagStats, redditTrends, tiktokTrends]);

  if (!loaded || !profile) return null;

  const isPro = profile.plan === 'pro';
  const isLiteOrAbove = profile.plan === 'lite' || profile.plan === 'pro';

  const tabs = (['ai', 'posts', 'trends'] as const);

  const anyTrendLoading = Object.values(trendLoading).some(Boolean);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-display text-xl text-armadillo-text">Insights</h1>
        <p className="text-[11px] text-armadillo-muted mt-0.5">
          {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')} &middot; Last 30 days
        </p>
      </div>

      {/* Tab Bar */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 bg-armadillo-card border border-armadillo-border rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === tab ? 'bg-burnt text-white' : 'text-armadillo-muted'
              }`}
            >
              {tab === 'ai' && <Sparkles size={11} />}
              {tab === 'ai' ? 'AI Analysis' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* AI Analysis Tab (Pro only) */}
      {activeTab === 'ai' && (
        <div className="px-5 space-y-3">
          <div className="bg-gradient-to-br from-burnt/20 to-burnt/5 border border-burnt/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-burnt" />
                  <span className="text-sm font-medium text-armadillo-text">AI Analytics Writeup</span>
                </div>
                <p className="text-[11px] text-armadillo-muted">
                  {aiAnalysis
                    ? `Generated ${aiAnalysis.generatedAt} — powered by your data + market trends`
                    : 'Analyze your content performance with AI-powered insights'}
                </p>
              </div>
              <button
                onClick={fetchAIInsights}
                disabled={aiLoading}
                className="flex items-center gap-1.5 bg-burnt hover:bg-burnt-light disabled:opacity-60 text-white px-3 py-2 rounded-xl text-[11px] font-medium transition-colors shrink-0"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {aiLoading ? 'Analyzing...' : aiAnalysis ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {aiLoading && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-8 text-center">
              <Loader2 size={24} className="text-burnt animate-spin mx-auto mb-3" />
              <p className="text-xs text-armadillo-muted">Analyzing your content...</p>
            </div>
          )}

          {/* Error state */}
          {aiError && !aiLoading && (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-xs text-danger">
              {aiError}
            </div>
          )}

          {/* No insights yet */}
          {!aiLoading && !aiAnalysis && !aiError && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-8 text-center">
              <Sparkles size={24} className="text-armadillo-muted/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-armadillo-text mb-1">No AI insights yet</p>
              <p className="text-[11px] text-armadillo-muted">
                {posts.length > 0
                  ? 'Tap "Generate" above to analyze your content performance.'
                  : 'No post data available. Scrape your account first, then generate insights.'}
              </p>
            </div>
          )}

          {/* Sections */}
          {!aiLoading && aiAnalysis && aiAnalysis.sections.map((section, i) => (
            <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <span className="text-lg shrink-0">{section.icon}</span>
                <span className="flex-1 text-sm font-medium text-armadillo-text">{section.title}</span>
                {expandedSection === i ? (
                  <ChevronUp size={16} className="text-armadillo-muted shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-armadillo-muted shrink-0" />
                )}
              </button>
              {expandedSection === i && (
                <div className="px-4 pb-4 -mt-1">
                  {section.body && (
                    <p className="text-xs text-armadillo-text/80 leading-relaxed">{section.body}</p>
                  )}
                  {section.bullets && (
                    <ul className="space-y-2 mt-1">
                      {section.bullets.map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-armadillo-text/80 leading-relaxed">
                          <span className="text-burnt mt-0.5 shrink-0">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}

          {!aiLoading && aiAnalysis && (
            <button
              onClick={() => setExpandedSection(expandedSection !== null ? null : 0)}
              className="w-full text-center text-[11px] text-burnt font-medium py-2"
            >
              {expandedSection !== null ? 'Collapse all' : 'Expand all sections'}
            </button>
          )}
        </div>
      )}

      {/* AI Upgrade CTA for non-Pro */}
      {activeTab === 'posts' && !isPro && (
        <div className="px-5 mb-4">
          <div className="bg-burnt/10 border border-burnt/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-burnt" />
              <span className="text-xs font-medium text-armadillo-text">AI-Powered Analytics</span>
              <Lock size={10} className="text-armadillo-muted" />
              <span className="text-[8px] bg-burnt text-white px-1.5 py-0.5 rounded-full uppercase font-bold">Pro</span>
            </div>
            <p className="text-[11px] text-armadillo-muted mb-2">
              Get a personalized AI writeup that analyzes your posting patterns, compares content performance, suggests optimal posting times, and prepares you for upcoming trends.
            </p>
            <button className="text-[11px] text-burnt font-medium flex items-center gap-1">
              Upgrade to Pro — $19.99/mo <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Posts Tab — card-based feed */}
      {activeTab === 'posts' && (() => {
        const sortedPosts = [...posts].sort((a, b) => {
          switch (postSort) {
            case 'likes':
              return b.metrics.likes - a.metrics.likes;
            case 'engagement':
              return b.engagementRate - a.engagementRate;
            case 'date':
            default:
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          }
        });
        const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0);
        const avgEng = posts.length > 0 ? (posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length).toFixed(1) : '0';

        return (
          <div className="px-5 space-y-3">
            {posts.length > 0 ? (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
                    <div className="font-display text-lg text-armadillo-text">{posts.length}</div>
                    <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Posts</div>
                  </div>
                  <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
                    <div className="font-display text-lg text-armadillo-text">{formatNumber(totalLikes)}</div>
                    <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Total Likes</div>
                  </div>
                  <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
                    <div className="font-display text-lg text-burnt">{avgEng}%</div>
                    <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Avg Eng.</div>
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-armadillo-muted uppercase tracking-widest font-semibold">Post Feed</span>
                  <div className="relative">
                    <select
                      value={postSort}
                      onChange={(e) => setPostSort(e.target.value as PostSortKey)}
                      className="appearance-none bg-armadillo-card border border-armadillo-border rounded-lg pl-2.5 pr-7 py-1.5 text-[11px] text-armadillo-text cursor-pointer focus:outline-none focus:border-burnt"
                    >
                      <option value="date">Newest first</option>
                      <option value="likes">Most liked</option>
                      <option value="engagement">Top engagement</option>
                    </select>
                    <ArrowDownUp size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-armadillo-muted pointer-events-none" />
                  </div>
                </div>

                {/* Post cards */}
                {sortedPosts.map((post) => {
                  const platformColor = PLATFORM_COLORS[post.platform] || '#E1306C';
                  const hasViews = (post.metrics.views ?? 0) > 0;
                  const hasShares = (post.metrics.shares ?? 0) > 0;

                  return (
                    <div
                      key={post.id}
                      className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden"
                      style={{ borderLeftWidth: '3px', borderLeftColor: platformColor }}
                    >
                      {/* Thumbnail */}
                      {post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-32 bg-armadillo-border/30 flex items-center justify-center">
                          <ImageIcon size={28} className="text-armadillo-muted/30" />
                        </div>
                      )}

                      <div className="p-4">
                        {/* Date + engagement badge row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-armadillo-muted">
                            <Calendar size={10} />
                            <span className="text-[11px]">{formatDate(post.publishedAt)}</span>
                          </div>
                          <div className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            post.engagementRate > 10 ? 'bg-success/20 text-success' :
                            post.engagementRate > 5 ? 'bg-burnt/20 text-burnt' :
                            'bg-armadillo-border text-armadillo-muted'
                          }`}>
                            {post.engagementRate}% eng.
                          </div>
                        </div>

                        {/* Caption (2-line clamp) */}
                        {post.caption && (
                          <p className="text-sm text-armadillo-text leading-relaxed mb-3 line-clamp-2">
                            {post.caption}
                          </p>
                        )}

                        {/* Metrics row */}
                        <div className="flex items-center gap-3 text-armadillo-muted flex-wrap">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Heart size={12} />
                            {post.metrics.likes > 0 ? formatNumber(post.metrics.likes) : <span className="text-armadillo-muted/50">n/a</span>}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <MessageCircle size={12} />
                            {post.metrics.comments > 0 ? formatNumber(post.metrics.comments) : <span className="text-armadillo-muted/50">n/a</span>}
                          </span>
                          {hasViews && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Eye size={12} />
                              {formatNumber(post.metrics.views!)}
                            </span>
                          )}
                          {hasShares && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Share2 size={12} />
                              {formatNumber(post.metrics.shares!)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-8 text-center">
                <ImageIcon size={24} className="text-armadillo-muted/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-armadillo-text mb-1">No posts yet</p>
                <p className="text-[11px] text-armadillo-muted">
                  Post data will appear here once your account has been scraped. Go to the Dashboard to scrape your account.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Trends Tab — live data, lazy-loaded */}
      {activeTab === 'trends' && (
        <div className="px-5 space-y-5">
          {/* Tier gate — trends require at least Lite */}
          {!isLiteOrAbove ? (
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-6 text-center">
              <Lock size={24} className="text-armadillo-muted mx-auto mb-3" />
              <div className="text-sm font-medium text-armadillo-text mb-1">Live Trends</div>
              <p className="text-[11px] text-armadillo-muted mb-4 max-w-xs mx-auto">
                Unlock hashtag analytics, Reddit trends, and TikTok product insights with Lite or Pro.
              </p>
              <button className="bg-burnt hover:bg-burnt-light text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">
                Upgrade to Lite — $4.99/mo
              </button>
            </div>
          ) : (
            <>
              {/* Loading indicator */}
              {anyTrendLoading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 size={14} className="text-burnt animate-spin" />
                  <span className="text-[11px] text-armadillo-muted">Fetching live trend data...</span>
                </div>
              )}

              {/* Refresh */}
              {trendsFetched && !anyTrendLoading && (
                <button
                  onClick={() => {
                    setTrendsFetched(false);
                    setHashtagStats(null);
                    setHashtagPosts(null);
                    setRedditTrends(null);
                    setTiktokTrends(null);
                  }}
                  className="flex items-center gap-1.5 text-[11px] text-burnt font-medium"
                >
                  <RefreshCw size={11} /> Refresh trends
                </button>
              )}

              {/* Instagram Hashtag Stats */}
              {hashtagStats && hashtagStats.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
                    <Hash size={10} /> Instagram Hashtag Trends
                    {trendErrors.instagramHashtags && <span className="text-[8px] text-danger font-normal">(failed to load)</span>}
                  </h3>
                  <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
                    {hashtagStats.map((tag, i) => (
                      <div key={tag.hashtag} className={`px-4 py-3 ${i < hashtagStats.length - 1 ? 'border-b border-armadillo-border/50' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-armadillo-text">#{tag.hashtag}</span>
                          <div className="flex items-center gap-2">
                            {tag.trend === 'rising' && <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp size={8} />Rising</span>}
                            {tag.trend === 'declining' && <span className="text-[9px] bg-danger/20 text-danger px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><TrendingDown size={8} />Declining</span>}
                            {tag.trend === 'stable' && <span className="text-[9px] bg-armadillo-border text-armadillo-muted px-1.5 py-0.5 rounded-full">Stable</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-armadillo-muted">
                          <span>{formatNumber(tag.postCount)} posts</span>
                          {tag.avgEngagement && <span>{tag.avgEngagement}% avg eng.</span>}
                        </div>
                        {tag.relatedHashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {tag.relatedHashtags.slice(0, 4).map(r => (
                              <span key={r} className="text-[9px] bg-armadillo-bg text-armadillo-muted px-1.5 py-0.5 rounded">#{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Hashtag Posts */}
              {hashtagPosts && hashtagPosts.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Trending Posts by Hashtag</h3>
                  <div className="space-y-2">
                    {hashtagPosts.slice(0, 5).map(post => (
                      <div key={post.id} className="bg-armadillo-card border border-armadillo-border rounded-2xl p-3.5">
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[9px] bg-burnt/15 text-burnt px-1.5 py-0.5 rounded">#{post.hashtag}</span>
                          <span className="text-[9px] text-armadillo-muted">{timeAgo(post.publishedAt)}</span>
                        </div>
                        <p className="text-xs text-armadillo-text leading-relaxed mb-2 line-clamp-2">{post.caption}</p>
                        <div className="flex items-center gap-3 text-armadillo-muted">
                          <span className="flex items-center gap-1 text-[10px]"><Heart size={10} />{formatNumber(post.likes)}</span>
                          <span className="flex items-center gap-1 text-[10px]"><MessageCircle size={10} />{formatNumber(post.comments)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reddit Trends — Pro only */}
              {redditTrends && redditTrends.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
                    Reddit Trending Topics
                    {!isPro && <Lock size={8} className="text-armadillo-muted" />}
                    {trendErrors.redditTrends && <span className="text-[8px] text-danger font-normal">(failed to load)</span>}
                  </h3>
                  {!isPro ? (
                    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 text-center">
                      <p className="text-[11px] text-armadillo-muted mb-2">Reddit trends require Pro</p>
                      <button className="text-[11px] text-burnt font-medium flex items-center gap-1 mx-auto">
                        Upgrade — $19.99/mo <ArrowUpRight size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
                      {redditTrends.map((trend, i) => (
                        <div key={i} className={`px-4 py-3 ${i < redditTrends.length - 1 ? 'border-b border-armadillo-border/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#FF4500]/10 text-[#FF4500] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold">
                              {formatNumber(trend.upvotes)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-armadillo-text leading-relaxed line-clamp-2">{trend.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-armadillo-muted">{trend.subreddit}</span>
                                {trend.flair && <span className="text-[8px] bg-armadillo-bg text-armadillo-muted px-1.5 py-0.5 rounded">{trend.flair}</span>}
                                <span className="text-[9px] text-armadillo-muted">{formatNumber(trend.comments)} comments</span>
                              </div>
                            </div>
                            <ExternalLink size={12} className="text-armadillo-border shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TikTok Trends — Pro only */}
              {tiktokTrends && tiktokTrends.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5 flex items-center gap-1.5">
                    TikTok Trending Content
                    {!isPro && <Lock size={8} className="text-armadillo-muted" />}
                    {trendErrors.tiktokTrends && <span className="text-[8px] text-danger font-normal">(failed to load)</span>}
                  </h3>
                  {!isPro ? (
                    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 text-center">
                      <p className="text-[11px] text-armadillo-muted mb-2">TikTok trends require Pro</p>
                      <button className="text-[11px] text-burnt font-medium flex items-center gap-1 mx-auto">
                        Upgrade — $19.99/mo <ArrowUpRight size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tiktokTrends.map((trend, i) => (
                        <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-2xl p-3.5">
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="text-xs font-medium text-armadillo-text">{trend.productName}</span>
                            {trend.trendScore && (
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                trend.trendScore >= 85 ? 'bg-success/20 text-success' : trend.trendScore >= 70 ? 'bg-burnt/20 text-burnt' : 'bg-armadillo-border text-armadillo-muted'
                              }`}>
                                Score: {trend.trendScore}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] bg-[#00F2EA]/10 text-[#00F2EA] px-1.5 py-0.5 rounded inline-block mb-1.5">{trend.category}</span>
                          {trend.description && (
                            <p className="text-[11px] text-armadillo-muted leading-relaxed">{trend.description}</p>
                          )}
                          {trend.relatedVideos && (
                            <span className="text-[9px] text-armadillo-muted mt-1 block">{formatNumber(trend.relatedVideos)} related videos</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No trends data empty state */}
              {!anyTrendLoading && !hashtagStats && !hashtagPosts && !redditTrends && !tiktokTrends && (
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-6 text-center">
                  <TrendingUp size={20} className="text-armadillo-muted/40 mx-auto mb-2" />
                  <p className="text-xs font-medium text-armadillo-text mb-1">No trend data yet</p>
                  <p className="text-[11px] text-armadillo-muted">
                    Trend data will appear here once live trends can be fetched.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
