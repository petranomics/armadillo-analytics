'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import { PLATFORM_NAMES } from '@/lib/constants';
import { getAIAnalysis } from '@/lib/ai-insights';
import { mockHashtagStats, mockRedditTrends, mockTikTokTrends } from '@/lib/trend-data';
import type { HashtagStats, RedditTrend, TikTokTrend } from '@/lib/types';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, Sparkles, Lock, ChevronDown, ChevronUp, RefreshCw, Loader2, Clock, Film, Image } from 'lucide-react';

interface AISection {
  icon: string;
  title: string;
  body?: string | null;
  bullets?: string[];
}

interface AIAnalysisData {
  generatedAt: string;
  sections: AISection[];
}

function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

interface LivePosts {
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    engagement: number;
    daysAgo: number;
    id: number;
}

export default function InsightsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<'ai' | 'posts' | 'trends' | 'audience'>('posts');
    const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Live data state
  const [livePosts, setLivePosts] = useState<LivePosts[] | null>(null);
    const [postsLoading, setPostsLoading] = useState(false);
    const [hashtagStats, setHashtagStats] = useState<HashtagStats[] | null>(null);
    const [redditTrends, setRedditTrends] = useState<RedditTrend[] | null>(null);
    const [tiktokTrends, setTiktokTrends] = useState<TikTokTrend[] | null>(null);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [trendsError, setTrendsError] = useState<string | null>(null);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
        const p = getUserProfile();
        if (!p.onboardingComplete) { router.push('/onboarding'); return; }
        setProfile(p);
        setLoaded(true);
        if (p.plan === 'pro') setActiveTab('ai');
  }, [router]);

  // Fetch live posts from scrape API
  const fetchLivePosts = useCallback(async () => {
        if (!profile) return;
        const platform = profile.selectedPlatforms[0];
        const username = profile.platformUsernames[platform];
        if (!username) return;

                                         setPostsLoading(true);
        try {
                const res = await fetch('/api/scrape', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ platform, username }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);

          const results = (json.results || []).slice(0, 12);
                const mapped: LivePosts[] = results.map((item: Record<string, unknown>, i: number) => {
                          const likes = Number(item.likesCount || item.likes || item.diggCount || 0);
                          const comments = Number(item.commentsCount || item.comments || item.commentCount || 0);
                          const shares = Number(item.sharesCount || item.shares || item.shareCount || 0);
                          const views = Number(item.videoViewCount || item.viewCount || item.playCount || item.views || 0);
                          const total = likes + comments + shares;
                          const followers = Number(item.followersCount || item.subscribersCount || 1);
                          const ts = item.timestamp || item.createTime || item.publishedAt;
                          const daysAgo = ts ? Math.max(1, Math.floor((Date.now() - new Date(String(ts)).getTime()) / 86400000)) : i + 1;
                          return {
                                      id: i + 1,
                                      caption: String(item.caption || item.text || item.title || item.description || '').slice(0, 120),
                                      likes,
                                      comments,
                                      shares,
                                      views,
                                      engagement: followers > 0 ? parseFloat(((total / followers) * 100).toFixed(1)) : 0,
                                      daysAgo,
                          };
                });
                if (mapped.length > 0) setLivePosts(mapped);
        } catch {
                // Keep using fallback posts
        } finally {
                setPostsLoading(false);
        }
  }, [profile]);

  // Fetch live trends from trends API
  const fetchTrends = useCallback(async () => {
        setTrendsLoading(true);
        setTrendsError(null);
        try {
                const trackedHashtags = profile?.trackedHashtags?.length
                  ? profile.trackedHashtags
                          : ['austinfood', 'atxlife', 'texascreator'];
                const trackedSubreddits = profile?.trackedSubreddits?.length
                  ? profile.trackedSubreddits.map(s => s.startsWith('http') ? s : `https://old.reddit.com/r/${s}/`)
                          : ['https://old.reddit.com/r/popular/'];

          const [statsRes, redditRes, tiktokRes] = await Promise.allSettled([
                    fetch('/api/trends', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ source: 'instagramHashtags', params: { keywords: trackedHashtags } }),
                    }).then(r => r.json()),
                    fetch('/api/trends', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ source: 'redditTrends', params: { subreddits: trackedSubreddits } }),
                    }).then(r => r.json()),
                    fetch('/api/trends', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ source: 'tiktokTrends', params: { category: profile?.tiktokNiche || 'General' } }),
                    }).then(r => r.json()),
                  ]);

          setHashtagStats(
                    statsRes.status === 'fulfilled' && statsRes.value.hashtagStats?.length
                      ? statsRes.value.hashtagStats : mockHashtagStats
                  );
                setRedditTrends(
                          redditRes.status === 'fulfilled' && redditRes.value.redditTrends?.length
                            ? redditRes.value.redditTrends : mockRedditTrends
                        );
                setTiktokTrends(
                          tiktokRes.status === 'fulfilled' && tiktokRes.value.tiktokTrends?.length
                            ? tiktokRes.value.tiktokTrends : mockTikTokTrends
                        );
        } catch {
                setHashtagStats(mockHashtagStats);
                setRedditTrends(mockRedditTrends);
                setTiktokTrends(mockTikTokTrends);
                setTrendsError('Could not fetch live trends, showing cached data');
        } finally {
                setTrendsLoading(false);
        }
  }, [profile]);

  // Fetch AI-powered insights from Claude
  const fetchAIInsights = useCallback(async (postData: LivePosts[]) => {
    if (!profile) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: postData,
          platform: profile.selectedPlatforms[0],
          username: profile.platformUsernames[profile.selectedPlatforms[0]] || 'unknown',
          followers: undefined,
          userType: profile.userType,
          niche: profile.tiktokNiche || undefined,
          trends: {
            hashtagStats: hashtagStats || mockHashtagStats,
            redditTrends: redditTrends || mockRedditTrends,
            tiktokTrends: tiktokTrends || mockTikTokTrends,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate insights');
      setAiAnalysis(json);
    } catch (err) {
      console.error('AI insights error:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate insights');
      // Fall back to static analysis
      setAiAnalysis(getAIAnalysis() as AIAnalysisData);
    } finally {
      setAiLoading(false);
    }
  }, [profile, hashtagStats, redditTrends, tiktokTrends]);

  // Auto-fetch on mount
  useEffect(() => {
        if (loaded && profile) {
                fetchLivePosts();
                fetchTrends();
        }
  }, [loaded, profile, fetchLivePosts, fetchTrends]);

  if (!loaded || !profile) return null;

  const isPro = profile.plan === 'pro';
  const staticAnalysis = getAIAnalysis() as AIAnalysisData;
  const displayAnalysis = aiAnalysis || staticAnalysis;

  // Use live posts or fallback
  const fallbackPosts: LivePosts[] = [
    { id: 1, caption: 'Austin sunrise hits different from Mount Bonnell', likes: 4200, comments: 186, shares: 320, views: 45000, engagement: 10.5, daysAgo: 1 },
    { id: 2, caption: 'Best breakfast tacos ranked (this got spicy in the comments)', likes: 8300, comments: 520, shares: 610, views: 82000, engagement: 11.5, daysAgo: 3 },
    { id: 3, caption: 'POV: First time at Barton Springs Pool', likes: 2100, comments: 98, shares: 280, views: 18900, engagement: 13.1, daysAgo: 5 },
    { id: 4, caption: 'South Congress vintage shopping haul - found some gems', likes: 1840, comments: 72, shares: 210, views: 15600, engagement: 13.6, daysAgo: 7 },
    { id: 5, caption: 'Rating every coffee shop on South Lamar (thread)', likes: 6800, comments: 560, shares: 340, views: 52300, engagement: 14.7, daysAgo: 9 },
    { id: 6, caption: 'Lady Bird Lake kayak day - perfect weather', likes: 1520, comments: 64, shares: 190, views: 13400, engagement: 13.2, daysAgo: 11 },
    { id: 7, caption: 'Franklin BBQ: was the 4 hour wait worth it? Full review', likes: 12100, comments: 780, shares: 540, views: 96700, engagement: 13.9, daysAgo: 14 },
    { id: 8, caption: 'Rainey Street bar guide for 2026 - save this', likes: 3400, comments: 110, shares: 420, views: 28800, engagement: 13.7, daysAgo: 17 },
      ];
    const posts = livePosts || fallbackPosts;

  const tabs: { key: typeof activeTab; label: string; locked?: boolean }[] = [
    { key: 'ai', label: 'AI Analysis', locked: !isPro },
    { key: 'posts', label: 'Posts' },
    { key: 'trends', label: 'Trends' },
    { key: 'audience', label: 'Audience', locked: !isPro },
      ];

  return (
        <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                      <h1 className="font-display text-3xl text-armadillo-text">Insights</h1>
                      <p className="text-sm text-armadillo-muted mt-1">
                        {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')} &middot; Last 30 days
                      </p>
              </div>
        
              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-1 inline-flex mb-8">
                {tabs.map((tab) => (
                    <button
                                  key={tab.key}
                                  onClick={() => tab.locked ? router.push('/settings') : setActiveTab(tab.key)}
                                  title={tab.locked ? 'Upgrade to Pro to unlock' : undefined}
                                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                                  activeTab === tab.key
                                                    ? 'bg-burnt text-white'
                                                    : tab.locked
                                                    ? 'text-armadillo-muted/50 hover:text-armadillo-muted hover:bg-armadillo-border/20 cursor-pointer'
                                                    : 'text-armadillo-muted hover:text-armadillo-text'
                                  }`}
                                >
                      {tab.key === 'ai' && <Sparkles size={12} />}
                      {tab.label}
                      {tab.locked && <Lock size={10} />}
                    </button>
                  ))}
              </div>
        
          {/* AI Analysis Tab */}
          {activeTab === 'ai' && isPro && (
                  <div className="space-y-4">
                            <div className="bg-gradient-to-r from-burnt/20 to-burnt/5 border border-burnt/30 rounded-2xl p-6">
                                        <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-3">
                                                                      <div className="w-10 h-10 rounded-xl bg-burnt/20 flex items-center justify-center">
                                                                                      <Sparkles size={20} className="text-burnt" />
                                                                      </div>
                                                                      <div>
                                                                                      <h2 className="font-display text-xl text-armadillo-text font-semibold">AI Analytics Writeup</h2>
                                                                                      <p className="text-xs text-armadillo-muted">
                                                                                        {aiAnalysis
                                                                                          ? `Generated ${displayAnalysis.generatedAt} — powered by your data + market trends`
                                                                                          : 'Analyze your content performance with AI-powered insights'}
                                                                                      </p>
                                                                      </div>
                                                      </div>
                                                      <button
                                                        onClick={() => fetchAIInsights(posts)}
                                                        disabled={aiLoading}
                                                        className="flex items-center gap-2 bg-burnt hover:bg-burnt-light disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-colors shrink-0"
                                                      >
                                                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                        {aiLoading ? 'Analyzing...' : aiAnalysis ? 'Regenerate' : 'Generate Insights'}
                                                      </button>
                                        </div>
                            </div>

                    {/* Loading state */}
                    {aiLoading && (
                      <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-12 text-center">
                        <Loader2 size={32} className="text-burnt animate-spin mx-auto mb-4" />
                        <h3 className="font-display text-lg text-armadillo-text mb-2">Analyzing your content</h3>
                        <p className="text-sm text-armadillo-muted max-w-md mx-auto">
                          Cross-referencing your posts with internet trends, platform data, and industry benchmarks...
                        </p>
                      </div>
                    )}

                    {/* Error state */}
                    {aiError && !aiLoading && (
                      <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-sm text-danger">
                        {aiError} — showing cached analysis below.
                      </div>
                    )}

                    {/* Sections */}
                    {!aiLoading && displayAnalysis.sections.map((section, i) => (
                                <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
                                              <button
                                                                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                                                                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-armadillo-border/20 transition-colors"
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
                                                  <div className="px-5 pb-5 border-t border-armadillo-border pt-4">
                                                    {section.body && (
                                                                        <p className="text-sm text-armadillo-muted leading-relaxed">{section.body}</p>
                                                                    )}
                                                    {section.bullets && (
                                                                        <ul className="space-y-2 mt-1">
                                                                          {section.bullets.map((bullet, j) => (
                                                                                                  <li key={j} className="flex items-start gap-2 text-sm text-armadillo-muted leading-relaxed">
                                                                                                                            <span className="text-burnt mt-0.5 shrink-0">&bull;</span>
                                                                                                    {bullet}
                                                                                                    </li>
                                                                                                ))}
                                                                        </ul>
                                                                    )}
                                                  </div>
                                              )}
                                </div>
                              ))}
                    {!aiLoading && (
                            <button
                                          onClick={() => setExpandedSection(expandedSection !== null ? null : 0)}
                                          className="w-full text-center text-xs text-burnt font-medium py-2"
                                        >
                              {expandedSection !== null ? 'Collapse all' : 'Expand all sections'}
                            </button>
                    )}
                  </div>
              )}
        
          {activeTab === 'ai' && !isPro && (
                  <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-burnt/15 flex items-center justify-center mx-auto mb-4">
                                        <Lock size={28} className="text-burnt" />
                            </div>
                            <h2 className="font-display text-2xl text-armadillo-text mb-2">AI Analysis is a Pro Feature</h2>
                            <p className="text-armadillo-muted mb-6 max-w-md mx-auto">
                                        Unlock AI-powered analytics writeups, content recommendations, and growth strategies tailored to your account.
                            </p>
                            <button onClick={() => router.push('/settings')} className="bg-burnt hover:bg-burnt-light text-white px-6 py-3 rounded-xl font-medium transition-colors">
                                        Upgrade to Pro
                            </button>
                  </div>
              )}
        
          {/* Posts Tab - now uses live data */}
          {activeTab === 'posts' && (
                  <div>
                            <div className="flex items-center justify-between mb-4">
                                        <div />
                              {postsLoading && (
                                  <span className="flex items-center gap-1.5 text-xs text-burnt">
                                                  <Loader2 size={12} className="animate-spin" /> Loading live posts...
                                  </span>
                                        )}
                              {!postsLoading && livePosts && (
                                  <span className="flex items-center gap-1.5 text-xs text-success">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-success" /> Live data
                                  </span>
                                        )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl px-5 py-4">
                                                      <p className="text-armadillo-muted text-xs uppercase tracking-wider mb-1">Posts</p>
                                                      <p className="text-armadillo-text text-2xl font-display">{posts.length}</p>
                                        </div>
                                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl px-5 py-4">
                                                      <p className="text-armadillo-muted text-xs uppercase tracking-wider mb-1">Total Likes</p>
                                                      <p className="text-armadillo-text text-2xl font-display">{formatNumber(posts.reduce((s, p) => s + p.likes, 0))}</p>
                                        </div>
                                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl px-5 py-4">
                                                      <p className="text-armadillo-muted text-xs uppercase tracking-wider mb-1">Avg Engagement</p>
                                                      <p className="text-burnt text-2xl font-display">{(posts.reduce((s, p) => s + p.engagement, 0) / posts.length).toFixed(1)}%</p>
                                        </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {posts.map((post, i) => (
                                  <div key={post.id} className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                                                  <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-burnt font-bold text-lg">#{i + 1}</span>
                                                                                        <span className="text-xs text-armadillo-muted">{post.daysAgo === 1 ? '1 day ago' : `${post.daysAgo} days ago`}</span>
                                                                    </div>
                                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                                        post.engagement > 13 ? 'bg-success/15 text-success' : post.engagement > 10 ? 'bg-burnt/15 text-burnt' : 'bg-armadillo-muted/15 text-armadillo-muted'
                                  }`}>
                                                                      {post.engagement}%
                                                                    </span>
                                                  </div>
                                                  <p className="text-sm text-armadillo-text font-medium mb-4">{post.caption}</p>
                                                  <div className="flex items-center gap-4 text-armadillo-muted text-xs">
                                                                    <span className="flex items-center gap-1.5"><Eye size={14} />{formatNumber(post.views)}</span>
                                                                    <span className="flex items-center gap-1.5"><Heart size={14} />{formatNumber(post.likes)}</span>
                                                                    <span className="flex items-center gap-1.5"><MessageCircle size={14} />{formatNumber(post.comments)}</span>
                                                                    <span className="flex items-center gap-1.5"><Share2 size={14} />{formatNumber(post.shares)}</span>
                                                  </div>
                                  </div>
                                ))}
                            </div>
                  </div>
              )}
        
          {/* Trends Tab - now fetches live data */}
          {activeTab === 'trends' && (
                  <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                        <div />
                                        <div className="flex items-center gap-3">
                                          {trendsError && <span className="text-xs text-danger">{trendsError}</span>}
                                          {trendsLoading ? (
                                    <span className="flex items-center gap-1.5 text-xs text-burnt">
                                                      <Loader2 size={12} className="animate-spin" /> Fetching live trends...
                                    </span>
                                  ) : (
                                    <button onClick={fetchTrends} className="flex items-center gap-1.5 text-xs text-burnt font-medium">
                                                      <RefreshCw size={12} /> Refresh trends
                                    </button>
                                                      )}
                                        </div>
                            </div>
                  
                    {/* Hashtag Stats */}
                    {(hashtagStats || mockHashtagStats).length > 0 && (
                                <div>
                                              <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Trending Hashtags</h3>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(hashtagStats || mockHashtagStats).map(tag => (
                                                    <div key={tag.hashtag} className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                                              <span className="text-sm font-medium text-armadillo-text">#{tag.hashtag}</span>
                                                                          {tag.trend === 'rising' && (
                                                                              <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                                                                        <TrendingUp size={10} /> Rising
                                                                                </span>
                                                                                              )}
                                                                          {tag.trend === 'declining' && (
                                                                              <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                                                                        <TrendingDown size={10} /> Declining
                                                                                </span>
                                                                                              )}
                                                                          {tag.trend === 'stable' && (
                                                                              <span className="text-[10px] bg-armadillo-border text-armadillo-muted px-2 py-0.5 rounded-full">Stable</span>
                                                                                              )}
                                                                        </div>
                                                                        <div className="flex items-center gap-3 text-xs text-armadillo-muted mb-2">
                                                                                              <span>{formatNumber(tag.postCount)} posts</span>
                                                                          {tag.avgEngagement && <span>{tag.avgEngagement}% avg eng.</span>}
                                                                        </div>
                                                      {tag.relatedHashtags.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1">
                                                                              {tag.relatedHashtags.slice(0, 5).map(r => (
                                                                                                        <span key={r} className="text-[10px] bg-armadillo-bg text-armadillo-muted px-2 py-0.5 rounded">#{r}</span>
                                                                                                      ))}
                                                                            </div>
                                                                        )}
                                                    </div>
                                                  ))}
                                              </div>
                                </div>
                            )}
                  
                    {/* Content Performance Analysis */}
                    {posts.length > 0 && (() => {
                      // Compute best posting times from user's own data
                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const hourBuckets: Record<number, { totalEng: number; count: number }> = {};
                      const dayBuckets: Record<number, { totalEng: number; count: number }> = {};
                      const formatBuckets: Record<string, { totalEng: number; count: number; totalLikes: number; totalComments: number }> = {};

                      for (const post of posts) {
                        // Determine content format from caption heuristics
                        const captionLower = post.caption.toLowerCase();
                        let format = 'Image';
                        if (post.views > 0 || captionLower.includes('reel') || captionLower.includes('video') || captionLower.includes('pov')) format = 'Video/Reel';
                        else if (captionLower.includes('thread') || captionLower.includes('ranked') || captionLower.includes('guide') || captionLower.includes('rating')) format = 'Carousel/Thread';

                        if (!formatBuckets[format]) formatBuckets[format] = { totalEng: 0, count: 0, totalLikes: 0, totalComments: 0 };
                        formatBuckets[format].totalEng += post.engagement;
                        formatBuckets[format].count += 1;
                        formatBuckets[format].totalLikes += post.likes;
                        formatBuckets[format].totalComments += post.comments;

                        // Time analysis from daysAgo (approximate day-of-week)
                        const postDate = new Date(Date.now() - post.daysAgo * 86400000);
                        const day = postDate.getDay();
                        const hour = 12 + (post.id % 12); // approximate since we don't have exact hours from fallback
                        if (!dayBuckets[day]) dayBuckets[day] = { totalEng: 0, count: 0 };
                        dayBuckets[day].totalEng += post.engagement;
                        dayBuckets[day].count += 1;
                        if (!hourBuckets[hour]) hourBuckets[hour] = { totalEng: 0, count: 0 };
                        hourBuckets[hour].totalEng += post.engagement;
                        hourBuckets[hour].count += 1;
                      }

                      const bestDay = Object.entries(dayBuckets)
                        .map(([d, v]) => ({ day: Number(d), avgEng: v.totalEng / v.count, count: v.count }))
                        .sort((a, b) => b.avgEng - a.avgEng)[0];

                      const formats = Object.entries(formatBuckets)
                        .map(([name, v]) => ({ name, avgEng: parseFloat((v.totalEng / v.count).toFixed(1)), count: v.count, totalLikes: v.totalLikes, totalComments: v.totalComments }))
                        .sort((a, b) => b.avgEng - a.avgEng);

                      const avgCaptionLength = Math.round(posts.reduce((s, p) => s + p.caption.length, 0) / posts.length);
                      const shortCaptions = posts.filter(p => p.caption.length < 60);
                      const longCaptions = posts.filter(p => p.caption.length >= 60);
                      const shortAvgEng = shortCaptions.length > 0 ? parseFloat((shortCaptions.reduce((s, p) => s + p.engagement, 0) / shortCaptions.length).toFixed(1)) : 0;
                      const longAvgEng = longCaptions.length > 0 ? parseFloat((longCaptions.reduce((s, p) => s + p.engagement, 0) / longCaptions.length).toFixed(1)) : 0;

                      return (
                        <div>
                          <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Your Content Performance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Best Posting Day */}
                            {bestDay && (
                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock size={14} className="text-burnt" />
                                  <span className="text-sm font-medium text-armadillo-text">Best Posting Day</span>
                                </div>
                                <div className="text-2xl font-display text-burnt mb-1">{dayNames[bestDay.day]}</div>
                                <p className="text-xs text-armadillo-muted">{bestDay.avgEng.toFixed(1)}% avg engagement ({bestDay.count} posts)</p>
                                <div className="flex gap-1 mt-3">
                                  {dayNames.map((name, i) => {
                                    const bucket = dayBuckets[i];
                                    const pct = bucket ? Math.round((bucket.totalEng / bucket.count / (bestDay.avgEng || 1)) * 100) : 0;
                                    return (
                                      <div key={name} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full bg-armadillo-bg rounded-sm overflow-hidden h-12 flex items-end">
                                          <div className={`w-full rounded-t-sm ${i === bestDay.day ? 'bg-burnt' : 'bg-armadillo-border'}`} style={{ height: `${Math.max(pct, 5)}%` }} />
                                        </div>
                                        <span className="text-[8px] text-armadillo-muted">{name}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Content Format Breakdown */}
                            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Film size={14} className="text-burnt" />
                                <span className="text-sm font-medium text-armadillo-text">Format Performance</span>
                              </div>
                              <div className="space-y-3">
                                {formats.map((fmt, i) => (
                                  <div key={fmt.name}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        {fmt.name.includes('Video') ? <Film size={12} className="text-armadillo-muted" /> : <Image size={12} className="text-armadillo-muted" />}
                                        <span className="text-xs text-armadillo-text">{fmt.name}</span>
                                        <span className="text-[10px] text-armadillo-muted">({fmt.count} posts)</span>
                                      </div>
                                      <span className={`text-xs font-medium ${i === 0 ? 'text-success' : 'text-armadillo-muted'}`}>{fmt.avgEng}%</span>
                                    </div>
                                    <div className="h-1.5 bg-armadillo-bg rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${i === 0 ? 'bg-success' : 'bg-armadillo-border'}`} style={{ width: `${Math.round((fmt.avgEng / (formats[0]?.avgEng || 1)) * 100)}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Caption Length Impact */}
                            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 md:col-span-2">
                              <div className="flex items-center gap-2 mb-3">
                                <MessageCircle size={14} className="text-burnt" />
                                <span className="text-sm font-medium text-armadillo-text">Caption Length Impact</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-armadillo-bg rounded-lg p-3 text-center">
                                  <div className="text-[10px] text-armadillo-muted mb-1">Avg Caption</div>
                                  <div className="text-lg font-display text-armadillo-text">{avgCaptionLength}</div>
                                  <div className="text-[10px] text-armadillo-muted">characters</div>
                                </div>
                                <div className="bg-armadillo-bg rounded-lg p-3 text-center">
                                  <div className="text-[10px] text-armadillo-muted mb-1">Short (&lt;60 chars)</div>
                                  <div className={`text-lg font-display ${shortAvgEng >= longAvgEng ? 'text-success' : 'text-armadillo-text'}`}>{shortAvgEng}%</div>
                                  <div className="text-[10px] text-armadillo-muted">{shortCaptions.length} posts</div>
                                </div>
                                <div className="bg-armadillo-bg rounded-lg p-3 text-center">
                                  <div className="text-[10px] text-armadillo-muted mb-1">Long (60+ chars)</div>
                                  <div className={`text-lg font-display ${longAvgEng > shortAvgEng ? 'text-success' : 'text-armadillo-text'}`}>{longAvgEng}%</div>
                                  <div className="text-[10px] text-armadillo-muted">{longCaptions.length} posts</div>
                                </div>
                              </div>
                              <p className="text-[10px] text-armadillo-muted mt-2">
                                {longAvgEng > shortAvgEng
                                  ? `Longer captions outperform by ${(longAvgEng - shortAvgEng).toFixed(1)} pts — your audience engages more with detailed content.`
                                  : shortAvgEng > longAvgEng
                                  ? `Short captions outperform by ${(shortAvgEng - longAvgEng).toFixed(1)} pts — keep it punchy for better engagement.`
                                  : 'Caption length has minimal impact on your engagement — experiment freely.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  
                    {/* Reddit Trends */}
                    {(redditTrends || mockRedditTrends).length > 0 && (
                                <div>
                                              <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Reddit Trends</h3>
                                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
                                                {(redditTrends || mockRedditTrends).slice(0, 5).map((item, i) => (
                                                    <div key={i} className={`flex items-center gap-3 px-5 py-4 ${i < 4 ? 'border-b border-armadillo-border/50' : ''}`}>
                                                                        <div className="flex-1 min-w-0">
                                                                                              <div className="text-sm text-armadillo-text font-medium truncate">{item.title}</div>

                                                                                              <div className="flex items-center gap-2 mt-1 text-xs text-armadillo-muted">
                                                                                                                      <span>{item.subreddit}</span>
                                                                                                {item.flair && <span className="bg-burnt/10 text-burnt px-1.5 py-0.5 rounded text-[10px]">{item.flair}</span>}
                                                                                                </div>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                                              <div className="text-sm font-display text-armadillo-text flex items-center gap-1">
                                                                                                                      <TrendingUp size={12} className="text-success" /> {formatNumber(item.upvotes)}
                                                                                                </div>
                                                                                              <div className="text-xs text-armadillo-muted">{formatNumber(item.comments)} comments</div>
                                                                        </div>
                                                    </div>
                                                  ))}
                                              </div>
                                </div>
                            )}
                  
                    {/* TikTok Trends */}
                    {(tiktokTrends || mockTikTokTrends).length > 0 && (
                                <div>
                                              <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">TikTok Trending Products</h3>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(tiktokTrends || mockTikTokTrends).slice(0, 6).map((item, i) => (
                                                    <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                                              <span className="text-sm font-medium text-armadillo-text">{item.productName}</span>
                                                                          {item.trendScore && (
                                                                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                                                                          item.trendScore >= 85 ? 'bg-success/15 text-success' : 'bg-burnt/15 text-burnt'
                                                                                }`}>
                                                                                                        Score: {item.trendScore}
                                                                                </span>
                                                                                              )}
                                                                        </div>
                                                                        <div className="text-[10px] text-armadillo-muted mb-1">{item.category}</div>
                                                      {item.description && <p className="text-xs text-armadillo-muted leading-relaxed">{item.description}</p>}
                                                      {item.relatedVideos && (
                                                                            <div className="text-[10px] text-armadillo-muted mt-2">{formatNumber(item.relatedVideos)} related videos</div>
                                                                        )}
                                                    </div>
                                                  ))}
                                              </div>
                                </div>
                            )}
                  </div>
              )}
        
          {/* Audience Tab */}
          {activeTab === 'audience' && (
                  <div>
                    {!isPro ? (
                                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-12 text-center">
                                              <div className="w-16 h-16 rounded-full bg-burnt/15 flex items-center justify-center mx-auto mb-4">
                                                              <Lock size={28} className="text-burnt" />
                                              </div>
                                              <h2 className="font-display text-2xl text-armadillo-text mb-2">Audience Demographics</h2>
                                              <p className="text-armadillo-muted mb-6 max-w-md mx-auto">
                                                              Upgrade to Pro to unlock detailed audience demographics, including gender, age, location, and active hours.
                                              </p>
                                              <button onClick={() => router.push('/settings')} className="bg-burnt hover:bg-burnt-light text-white px-6 py-3 rounded-xl font-medium transition-colors">
                                                              Upgrade to Pro
                                              </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
                                                              <h3 className="font-display text-lg text-armadillo-text mb-5">Gender Breakdown</h3>
                                                              <div className="space-y-4">
                                                                {[
                                  { label: 'Female', value: 64, color: 'bg-burnt' },
                                  { label: 'Male', value: 33, color: 'bg-burnt/50' },
                                  { label: 'Other', value: 3, color: 'bg-armadillo-muted' },
                                                    ].map((item) => (
                                                                          <div key={item.label}>
                                                                                                <div className="flex justify-between text-sm mb-1.5">
                                                                                                                        <span className="text-armadillo-text">{item.label}</span>
                                                                                                                        <span className="text-armadillo-muted">{item.value}%</span>
                                                                                                  </div>
                                                                                                <div className="h-2.5 bg-armadillo-border rounded-full overflow-hidden">
                                                                                                                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                                                                                                  </div>
                                                                          </div>
                                                                        ))}
                                                              </div>
                                              </div>
                                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
                                                              <h3 className="font-display text-lg text-armadillo-text mb-5">Age Range</h3>
                                                              <div className="space-y-4">
                                                                {[
                                  { range: '18-24', pct: 28 },
                                  { range: '25-34', pct: 42 },
                                  { range: '35-44', pct: 18 },
                                  { range: '45-54', pct: 8 },
                                  { range: '55+', pct: 4 },
                                                    ].map((age) => (
                                                                          <div key={age.range}>
                                                                                                <div className="flex justify-between text-sm mb-1.5">
                                                                                                                        <span className="text-armadillo-text">{age.range}</span>
                                                                                                                        <span className="text-armadillo-muted">{age.pct}%</span>
                                                                                                  </div>
                                                                                                <div className="h-2.5 bg-armadillo-border rounded-full overflow-hidden">
                                                                                                                        <div className="h-full bg-burnt rounded-full" style={{ width: `${(age.pct / 42) * 100}%` }} />
                                                                                                  </div>
                                                                          </div>
                                                                        ))}
                                                              </div>
                                              </div>
                                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
                                                              <h3 className="font-display text-lg text-armadillo-text mb-5">Top Locations</h3>
                                                              <div className="space-y-3">
                                                                {[
                                  { location: 'Austin, TX', pct: 24, emoji: '\uD83E\uDD20' },
                                  { location: 'Los Angeles, CA', pct: 12, emoji: '\uD83C\uDF34' },
                                  { location: 'New York, NY', pct: 9, emoji: '\uD83D\uDDFD' },
                                  { location: 'Houston, TX', pct: 7, emoji: '\uD83D\uDE80' },
                                  { location: 'Dallas, TX', pct: 6, emoji: '\u26F3' },
                                                    ].map((loc) => (
                                                                          <div key={loc.location} className="flex items-center justify-between py-2">
                                                                                                <div className="flex items-center gap-3">
                                                                                                                        <span className="text-lg">{loc.emoji}</span>
                                                                                                                        <span className="text-sm text-armadillo-text">{loc.location}</span>
                                                                                                  </div>
                                                                                                <span className="text-sm text-armadillo-muted font-medium">{loc.pct}%</span>
                                                                          </div>
                                                                        ))}
                                                              </div>
                                              </div>
                                              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
                                                              <h3 className="font-display text-lg text-armadillo-text mb-5">Most Active Hours</h3>
                                                              <div className="flex items-end justify-between gap-1.5 h-36">
                                                                {[15, 22, 35, 48, 62, 78, 95, 88, 72, 55, 40, 25].map((height, i) => {
                                                      const isPeak = height > 80;
                                                      return (
                                                                              <div key={i} className="flex flex-col items-center flex-1">
                                                                                                      <div className={`w-full rounded-t-sm ${isPeak ? 'bg-burnt' : 'bg-armadillo-border'}`} style={{ height: `${height}%` }} />
                                                                                                      <span className="text-armadillo-muted text-[9px] mt-1.5">
                                                                                                        {6 + i * 1.5 < 12 ? `${Math.floor(6 + i * 1.5)}a` : `${Math.floor(6 + i * 1.5) - 12 || 12}p`}
                                                                                                        </span>
                                                                                </div>
                                                                            );
                                })}
                                                              </div>
                                                              <p className="text-armadillo-muted text-xs mt-4 text-center">Peak activity: 5 PM - 7 PM CT</p>
                                              </div>
                                </div>
                            )}
                  </div>
              )}
        </div>
      );
}
