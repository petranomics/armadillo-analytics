'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { PLATFORM_NAMES } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, ArrowUpRight, Sparkles, Lock, ChevronDown, ChevronUp, Loader2, RefreshCw, Hash, ExternalLink } from 'lucide-react';
import type { TrendData, HashtagStats, HashtagPost, RedditTrend, TikTokTrend } from '@/lib/types';
import { mockHashtagStats, mockHashtagPosts, mockRedditTrends, mockTikTokTrends } from '@/lib/trend-data';

// Mock posts for the insights feed
function getMockPosts() {
  return [
    { id: 1, caption: 'Austin sunrise hits different from Mount Bonnell', likes: 4200, comments: 186, shares: 320, views: 45000, engagement: 10.5, daysAgo: 1 },
    { id: 2, caption: 'Best breakfast tacos ranked (this got spicy in the comments)', likes: 8300, comments: 520, shares: 610, views: 82000, engagement: 11.5, daysAgo: 3 },
    { id: 3, caption: 'POV: First time at Barton Springs Pool', likes: 2100, comments: 98, shares: 280, views: 18900, engagement: 13.1, daysAgo: 5 },
    { id: 4, caption: 'South Congress vintage shopping haul - found some gems', likes: 1840, comments: 72, shares: 210, views: 15600, engagement: 13.6, daysAgo: 7 },
    { id: 5, caption: 'Rating every coffee shop on South Lamar (thread)', likes: 6800, comments: 560, shares: 340, views: 52300, engagement: 14.7, daysAgo: 9 },
    { id: 6, caption: 'Lady Bird Lake kayak day - perfect weather', likes: 1520, comments: 64, shares: 190, views: 13400, engagement: 13.2, daysAgo: 11 },
    { id: 7, caption: 'Franklin BBQ: was the 4 hour wait worth it? Full review', likes: 12100, comments: 780, shares: 540, views: 96700, engagement: 13.9, daysAgo: 14 },
    { id: 8, caption: 'Rainey Street bar guide for 2026 - save this', likes: 3400, comments: 110, shares: 420, views: 28800, engagement: 13.7, daysAgo: 17 },
  ];
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

// Mock AI analysis writeup
function getAIAnalysis() {
  return {
    generatedAt: 'Feb 17, 2026 at 9:14 AM CT',
    sections: [
      {
        icon: '📊',
        title: 'Performance Summary',
        body: "You're trending higher this week with a 14.8% increase in engagement rate. 68% of your followers are actively interacting with your posts — not just scrolling past. Your total reach hit 284K this month, up 17.8% from January.",
      },
      {
        icon: '⏰',
        title: 'Posting Optimization',
        body: "You typically post around 10 AM CT, but your content performs 40% better when published between 1-2 PM CT. Tuesday and Thursday are your strongest engagement days — your Tuesday posts average 2.1x more saves than other days.",
      },
      {
        icon: '🖼️',
        title: 'Content Insights',
        body: 'Your "Franklin BBQ" review sparked a 96% increase in profile visits compared to your "Lady Bird Lake" post, which had 28% lower engagement. Food reviews consistently outperform lifestyle content by 2.3x. Carousel posts are getting 1.8x more saves than single images.',
      },
      {
        icon: '📅',
        title: 'Coming Up',
        body: "St. Patrick's Day is coming up on March 17 — your audience engagement typically spikes 35% during holiday-themed content. Consider preparing a themed post for Austin bars and restaurants. Spring Break (mid-March) is also a strong engagement window for Austin lifestyle content.",
      },
      {
        icon: '💡',
        title: 'Recommendations',
        body: null,
        bullets: [
          'Shift your posting schedule to 1 PM CT for maximum reach',
          'Double down on food review content — it\'s your top performer by a wide margin',
          'Create a St. Patrick\'s Day post leveraging your restaurant review format',
          'Try more carousel posts — your audience saves them 1.8x more often',
          'Your Reels under 30 seconds have 22% higher completion rates than longer ones',
        ],
      },
    ],
  };
}

export default function InsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'posts' | 'trends' | 'audience'>('ai');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Trend data state — only fetched when trends tab is activated
  const [hashtagStats, setHashtagStats] = useState<HashtagStats[] | null>(null);
  const [hashtagPosts, setHashtagPosts] = useState<HashtagPost[] | null>(null);
  const [redditTrends, setRedditTrends] = useState<RedditTrend[] | null>(null);
  const [tiktokTrends, setTiktokTrends] = useState<TikTokTrend[] | null>(null);
  const [trendLoading, setTrendLoading] = useState<Record<string, boolean>>({});
  const [trendErrors, setTrendErrors] = useState<Record<string, string>>({});
  const [trendsFetched, setTrendsFetched] = useState(false);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) { router.push('/m/onboarding'); return; }
    setProfile(p);
    setLoaded(true);
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
      // Fall back to mock data on error
      const message = err instanceof Error ? err.message : 'Unknown error';
      setTrendErrors(prev => ({ ...prev, [source]: message }));

      if (source === 'instagramHashtags') setHashtagStats(mockHashtagStats);
      if (source === 'instagramHashtagPosts') setHashtagPosts(mockHashtagPosts);
      if (source === 'redditTrends') setRedditTrends(mockRedditTrends);
      if (source === 'tiktokTrends') setTiktokTrends(mockTikTokTrends);
    } finally {
      setTrendLoading(prev => ({ ...prev, [source]: false }));
    }
  }, []);

  // Lazy-load trends when the tab is first activated
  useEffect(() => {
    if (activeTab === 'trends' && !trendsFetched && profile) {
      setTrendsFetched(true);

      const hasIg = profile.selectedPlatforms.includes('instagram');
      const hasTiktok = profile.selectedPlatforms.includes('tiktok');

      // Fire relevant fetches in parallel — data only pulled when needed
      if (hasIg) {
        fetchTrend('instagramHashtags', { keywords: ['fitness', 'food', 'travel'] });
        fetchTrend('instagramHashtagPosts', { hashtags: ['austinfood', 'atxlife'], limit: 20 });
      } else {
        setHashtagStats(mockHashtagStats);
        setHashtagPosts(mockHashtagPosts);
      }

      fetchTrend('redditTrends', { subreddits: ['https://old.reddit.com/r/popular/'], maxPosts: 15 });

      if (hasTiktok) {
        fetchTrend('tiktokTrends', { category: 'General', maxProducts: 8 });
      } else {
        setTiktokTrends(mockTikTokTrends);
      }
    }
  }, [activeTab, trendsFetched, profile, fetchTrend]);

  if (!loaded || !profile) return null;

  const isPro = profile.plan === 'pro';
  const isLiteOrAbove = profile.plan === 'lite' || profile.plan === 'pro';
  const posts = getMockPosts();
  const aiAnalysis = getAIAnalysis();

  const tabs = isPro
    ? (['ai', 'posts', 'trends', 'audience'] as const)
    : (['posts', 'trends', 'audience'] as const);

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
      {activeTab === 'ai' && isPro && (
        <div className="px-5 space-y-3">
          <div className="bg-gradient-to-br from-burnt/20 to-burnt/5 border border-burnt/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-burnt" />
              <span className="text-sm font-medium text-armadillo-text">AI Analytics Writeup</span>
            </div>
            <p className="text-[11px] text-armadillo-muted">
              Generated {aiAnalysis.generatedAt} based on your last 30 days of data across {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')}.
            </p>
          </div>

          {aiAnalysis.sections.map((section, i) => (
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

          <button
            onClick={() => setExpandedSection(expandedSection !== null ? null : 0)}
            className="w-full text-center text-[11px] text-burnt font-medium py-2"
          >
            {expandedSection !== null ? 'Collapse all' : 'Expand all sections'}
          </button>
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

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="px-5 space-y-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
              <div className="font-display text-lg text-armadillo-text">{posts.length}</div>
              <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Posts</div>
            </div>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
              <div className="font-display text-lg text-armadillo-text">{formatNumber(posts.reduce((s, p) => s + p.likes, 0))}</div>
              <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Total Likes</div>
            </div>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-3 text-center">
              <div className="font-display text-lg text-burnt">{(posts.reduce((s, p) => s + p.engagement, 0) / posts.length).toFixed(1)}%</div>
              <div className="text-[9px] text-armadillo-muted uppercase tracking-wider">Avg Eng.</div>
            </div>
          </div>

          {posts.map((post, i) => (
            <div key={post.id} className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-armadillo-border flex items-center justify-center text-[10px] text-armadillo-muted font-bold">
                    {i + 1}
                  </div>
                  <span className="text-[11px] text-armadillo-muted">{post.daysAgo}d ago</span>
                </div>
                <div className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  post.engagement > 13 ? 'bg-success/20 text-success' : post.engagement > 10 ? 'bg-burnt/20 text-burnt' : 'bg-armadillo-border text-armadillo-muted'
                }`}>
                  {post.engagement}% eng.
                </div>
              </div>
              <p className="text-sm text-armadillo-text mb-3">{post.caption}</p>
              <div className="flex items-center gap-4 text-armadillo-muted">
                <span className="flex items-center gap-1 text-[11px]"><Eye size={12} />{formatNumber(post.views)}</span>
                <span className="flex items-center gap-1 text-[11px]"><Heart size={12} />{formatNumber(post.likes)}</span>
                <span className="flex items-center gap-1 text-[11px]"><MessageCircle size={12} />{formatNumber(post.comments)}</span>
                <span className="flex items-center gap-1 text-[11px]"><Share2 size={12} />{formatNumber(post.shares)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    {trendErrors.instagramHashtags && <span className="text-[8px] text-armadillo-muted font-normal">(demo data)</span>}
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
                    {trendErrors.redditTrends && <span className="text-[8px] text-armadillo-muted font-normal">(demo data)</span>}
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
                    {trendErrors.tiktokTrends && <span className="text-[8px] text-armadillo-muted font-normal">(demo data)</span>}
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

              {/* Week-over-week comparison */}
              <div>
                <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">This Week vs Last Week</h3>
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
                  {[
                    { name: 'Engagement Rate', current: '12.4%', prev: '10.8%', change: 14.8 },
                    { name: 'Avg Views', current: '42.3K', prev: '38.1K', change: 11.0 },
                    { name: 'Followers Gained', current: '+847', prev: '+623', change: 36.0 },
                    { name: 'Comments', current: '1.2K', prev: '980', change: 22.4 },
                  ].map((m, i, arr) => (
                    <div key={m.name} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-armadillo-border/50' : ''}`}>
                      <div className="flex-1">
                        <div className="text-xs text-armadillo-text">{m.name}</div>
                        <div className="text-[10px] text-armadillo-muted mt-0.5">prev: {m.prev}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-display text-armadillo-text">{m.current}</div>
                        <div className={`text-[10px] flex items-center justify-end gap-0.5 ${m.change >= 0 ? 'text-success' : 'text-danger'}`}>
                          {m.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {Math.abs(m.change)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="px-5 space-y-4">
          {!isPro ? (
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-6 text-center">
              <Lock size={24} className="text-armadillo-muted mx-auto mb-3" />
              <div className="text-sm font-medium text-armadillo-text mb-1">Audience Demographics</div>
              <p className="text-[11px] text-armadillo-muted mb-4 max-w-xs mx-auto">
                Unlock detailed audience breakdowns including age, gender, location, and active hours with Pro.
              </p>
              <button className="bg-burnt hover:bg-burnt-light text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">
                Upgrade to Pro — $19.99/mo
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Demographics</h3>
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 space-y-4">
                  <div>
                    <div className="text-xs text-armadillo-muted mb-2">Gender</div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-armadillo-border overflow-hidden">
                          <div className="h-full bg-burnt rounded-full" style={{ width: '64%' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-armadillo-muted">Female</span>
                          <span className="text-[10px] text-armadillo-text font-medium">64%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-armadillo-border overflow-hidden">
                          <div className="h-full bg-burnt/50 rounded-full" style={{ width: '33%' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-armadillo-muted">Male</span>
                          <span className="text-[10px] text-armadillo-text font-medium">33%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-armadillo-muted mb-2">Age Range</div>
                    {[
                      { range: '18-24', pct: 28 },
                      { range: '25-34', pct: 42 },
                      { range: '35-44', pct: 18 },
                      { range: '45-54', pct: 8 },
                      { range: '55+', pct: 4 },
                    ].map((age) => (
                      <div key={age.range} className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] text-armadillo-muted w-10">{age.range}</span>
                        <div className="flex-1 h-2 rounded-full bg-armadillo-border overflow-hidden">
                          <div className="h-full bg-burnt rounded-full transition-all" style={{ width: `${age.pct}%` }} />
                        </div>
                        <span className="text-[11px] text-armadillo-text font-medium w-8 text-right">{age.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Top Locations</h3>
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
                  {[
                    { location: 'Austin, TX', pct: 24, flag: '🤠' },
                    { location: 'Los Angeles, CA', pct: 12, flag: '🌴' },
                    { location: 'New York, NY', pct: 9, flag: '🗽' },
                    { location: 'Houston, TX', pct: 7, flag: '🚀' },
                    { location: 'Dallas, TX', pct: 6, flag: '⛳' },
                  ].map((loc, i) => (
                    <div key={loc.location} className={`flex items-center gap-3 px-4 py-3 ${i < 4 ? 'border-b border-armadillo-border/50' : ''}`}>
                      <span className="text-sm">{loc.flag}</span>
                      <span className="flex-1 text-xs text-armadillo-text">{loc.location}</span>
                      <span className="text-xs font-medium text-armadillo-text">{loc.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Most Active Hours (CT)</h3>
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
                  <div className="flex justify-between items-end h-24 gap-1">
                    {[15, 22, 35, 48, 62, 78, 95, 88, 72, 55, 40, 25].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-sm ${height > 80 ? 'bg-burnt' : height > 50 ? 'bg-burnt/60' : 'bg-armadillo-border'}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[7px] text-armadillo-muted">{6 + i * 1.5 < 12 ? `${Math.floor(6 + i * 1.5)}a` : `${Math.floor(6 + i * 1.5) - 12 || 12}p`}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[11px] text-burnt font-medium">Peak: 5-7 PM CT</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
