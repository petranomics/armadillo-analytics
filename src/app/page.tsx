'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import { USER_TYPES, ALL_METRICS, type MetricDefinition, type MetricCategory, CATEGORY_LABELS } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { getMockValue, getAIOneLiner } from '@/lib/ai-insights';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw, Bell, Sparkles, Info, ArrowRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamc';
import Link from 'next/link';

const EngagementBreakdown = dynamic(() => import('@/components/charts/EngagementBreakdown'), { ssr: false });
const EngagementTrend = dynamic(() => import('@/components/charts/EngagementTrend'), { ssr: false });
const PeakHours = dynamic(() => import('@/components/charts/PeakHours'), { ssr: false });
const WatchDuration = dynamic(() => import('@/components/charts/WatchDuration'), { ssr: false });

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

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
    const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
    const [liveLoading, setLiveLoading] = useState(false);
    const [isLive, setIsLive] = useState(false);

  useEffect(() => {
        const p = getUserProfile();
        if (!p.onboardingComplete) {
                router.push('/onboarding');
                return;
        }
        setProfile(p);
        setLoaded(true);
  }, [router]);

  // Fetch live data from scrape API
  const fetchLiveData = useCallback(async () => {
        if (!profile) return;
        const platform = profile.selectedPlatforms[0];
        const username = profile.platformUsernames[platform];
        if (!username) return;

                                        setLiveLoading(true);
        try {
                const res = await fetch('/api/scrape', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ platform, username }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error);

          const results = (json.results || []).slice(0, 25);
                if (results.length === 0) return;

          const first = results[0];
                const followers = Number(first.followersCount || first.subscribersCount || first.followers || first.userFollowersCount || 0);

          let totalLikes = 0, totalComments = 0, totalShares = 0, totalViews = 0, totalSaves = 0;
                for (const item of results) {
                          totalLikes += Number(item.likesCount || item.likes || item.diggCount || 0);
                          totalComments += Number(item.commentsCount || item.comments || item.commentCount || 0);
                          totalShares += Number(item.sharesCount || item.shares || item.shareCount || 0);
                          totalViews += Number(item.videoViewCount || item.viewCount || item.playCount || item.views || 0);
                          totalSaves += Number(item.savesCount || item.saves || item.collectCount || 0);
                }

          const totalEng = totalLikes + totalComments + totalShares;
                const engagementRate = followers > 0 ? parseFloat(((totalEng / (followers * results.length)) * 100).toFixed(1)) : 0;

          setLiveMetrics({
                    totalLikes,
                    totalComments,
                    totalShares,
                    totalViews,
                    totalSaves,
                    followers,
                    engagementRate,
                    followerGrowth: followers,
                    postCount: results.length,
          });
                setIsLive(true);
        } catch {
                // Silently fall back to mock data
        } finally {
                setLiveLoading(false);
        }
  }, [profile]);

  // Auto-fetch on mount
  useEffect(() => {
        if (loaded && profile) {
                fetchLiveData();
        }
  }, [loaded, profile, fetchLiveData]);

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

  // Helper to get metric value from live data or mock
  function getMetricValue(metric: MetricDefinition): { value: string; trend: number; raw: number } {
        if (!liveMetrics) return getMockValue(metric);

      const formatNum = (n: number) => {
              if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
              if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
              return n.toLocaleString();
      };

      switch (metric.id) {
        case 'engagement_rate':
                  return { value: `${liveMetrics.engagementRate}%`, trend: 3, raw: liveMetrics.engagementRate };
        case 'likes':
                  return { value: formatNum(liveMetrics.totalLikes), trend: -3, raw: liveMetrics.totalLikes };
        case 'follower_growth':
                  return { value: formatNum(liveMetrics.followers), trend: -3, raw: liveMetrics.followers };
        case 'profile_views':
                  return { value: formatNum(liveMetrics.totalViews), trend: -3, raw: liveMetrics.totalViews };
        case 'comments':
                  return { value: formatNum(liveMetrics.totalComments), trend: 2, raw: liveMetrics.totalComments };
        case 'shares':
                  return { value: formatNum(liveMetrics.totalShares), trend: 1, raw: liveMetrics.totalShares };
        case 'saves':
                  return { value: formatNum(liveMetrics.totalSaves), trend: -1, raw: liveMetrics.totalSaves };
        case 'views':
                  return { value: formatNum(liveMetrics.totalViews), trend: 5, raw: liveMetrics.totalViews };
        case 'reach':
                  return { value: formatNum(Math.round(liveMetrics.totalViews * 0.7)), trend: 4, raw: Math.round(liveMetrics.totalViews * 0.7) };
        case 'impressions':
                  return { value: formatNum(Math.round(liveMetrics.totalViews * 1.3)), trend: 3, raw: Math.round(liveMetrics.totalViews * 1.3) };
        default:
                  return getMockValue(metric);
      }
  }

  return (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
              <div className="flex items-start justify-between mb-8">
                      <div>
                                <div className="flex items-center gap-3">
                                            <h1 className="font-display text-3xl text-armadillo-text">Dashboard</h1>
                                  {liveLoading && <Loader2 size={16} className="text-burnt animate-spin" />}
                                  {isLive && !liveLoading && (
                        <span className="flex items-center gap-1.5 text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live
                        </span>
                                            )}
                                </div>
                                <p className="text-sm text-armadillo-muted mt-1">
                                  {userConfig?.label} &middot; {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')}
                                </p>
                      </div>
                      <div className="flex items-center gap-2">
                                <button className="w-9 h-9 rounded-lg bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted hover:text-armadillo-text transition-colors">
                                            <Bell size={16} />
                                </button>
                                <button
                                              onClick={fetchLiveData}
                                              disabled={liveLoading}
                                              className="w-9 h-9 rounded-lg bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted hover:text-armadillo-text transition-colors disabled:opacity-50"
                                            >
                                            <RefreshCw size={16} className={liveLoading ? 'animate-spin' : ''} />
                                </button>
                      </div>
              </div>
        
          {/* Connected Platforms */}
              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase">Connected Platforms</span>
                                <div className="flex items-center gap-1.5 text-xs text-success">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                  {profile.plan === 'pro' ? 'Pro' : profile.plan === 'lite' ? 'Lite' : 'Free'}
                                </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {profile.selectedPlatforms.map((platform) => (
                      <Link
                                      key={platform}
                                      href={`/${platform}`}
                                      className="flex items-center gap-3 bg-armadillo-bg border border-armadillo-border rounded-xl px-4 py-2.5 hover:border-burnt/40 transition-colors"
                                    >
                                    <div
                                                      className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold shrink-0"
                                                      style={{
                                                                          backgroundColor: `var(--color-platform-${platform})`,
                                                                          color: platform === 'tiktok' ? '#000' : '#fff'
                                                      }}
                                                    >
                                      {PLATFORM_NAMES[platform].charAt(0)}
                                    </div>
                                    <div>
                                                    <div className="text-sm font-medium text-armadillo-text">{PLATFORM_NAMES[platform]}</div>
                                                    <div className="text-[10px] text-armadillo-muted">
                                                      {profile.platformUsernames[platform] ? `@${profile.platformUsernames[platform]}` : 'Demo data'}
                                                    </div>
                                    </div>
                      </Link>
                    ))}
                      </div>
              </div>
        
          {/* Hero KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {heroMetrics.map((metric) => {
                    const { value, trend } = getMetricValue(metric);
                    const isExpanded = expandedMetric === metric.id;
                    const aiLine = getAIOneLiner(metric, trend);
                    return (
                                  <button
                                                  key={metric.id}
                                                  onClick={() => toggleExpand(metric.id)}
                                                  className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 text-left transition-all hover:border-burnt/40"
                                                >
                                                <div className="flex items-center gap-1.5 mb-2">
                                                                <span className="text-base">{metric.icon}</span>
                                                                <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium truncate">{metric.label}</span>
                                                </div>
                                                <div className="font-display text-3xl text-armadillo-text mb-1">{value}</div>
                                                <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                                                  {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                  {Math.abs(trend)}% this period
                                                </div>
                                                <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-armadillo-border/50">
                                                                <Sparkles size={10} className="text-burnt shrink-0 mt-0.5" />
                                                                <p className={`text-[11px] leading-relaxed text-armadillo-muted ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                                  {aiLine}
                                                                </p>
                                                </div>
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
        
          {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <EngagementBreakdown />
                      <EngagementTrend />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      <PeakHours />
                {hasVideoMetrics && <WatchDuration />}
              </div>
        
          {/* Remaining Metrics by Category */}
          {Object.entries(grouped).map(([category, metrics]) => {
                  const categoryMetrics = metrics.filter(m => !heroMetrics.includes(m));
                  if (categoryMetrics.length === 0) return null;
                  return (
                              <div key={category} className="mb-6">
                                          <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">
                                            {CATEGORY_LABELS[category as MetricCategory]}
                                          </h3>
                                          <div className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
                                            {categoryMetrics.map((metric, i) => {
                                                const { value, trend } = getMetricValue(metric);
                                                const isExpanded = expandedMetric === metric.id;
                                                const aiLine = getAIOneLiner(metric, trend);
                                                return (
                                                                    <div key={metric.id} className={i < categoryMetrics.length - 1 ? 'border-b border-armadillo-border/50' : ''}>
                                                                                        <button
                                                                                                                onClick={() => toggleExpand(metric.id)}
                                                                                                                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                                                                                                              >
                                                                                                              <span className="text-base shrink-0">{metric.icon}</span>
                                                                                                              <div className="flex-1 min-w-0">
                                                                                                                                      <div className="text-sm font-medium text-armadillo-text">{metric.label}</div>
                                                                                                                                      <div className="flex items-center gap-1 mt-0.5">
                                                                                                                                                                <Sparkles size={8} className="text-burnt shrink-0" />
                                                                                                                                                                <p className="text-[11px] text-armadillo-muted truncate">{aiLine}</p>
                                                                                                                                        </div>
                                                                                                                </div>
                                                                                                              <div className="text-right shrink-0">
                                                                                                                                      <div className="text-base font-display text-armadillo-text">{value}</div>
                                                                                                                                      <div className={`text-[11px] flex items-center justify-end gap-0.5 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                                                                                        {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                                                                                                        {Math.abs(trend)}%
                                                                                                                                        </div>
                                                                                                                </div>
                                                                                          {isExpanded ? (
                                                                                                                                        <ChevronUp size={16} className="text-armadillo-border shrink-0" />
                                                                                                                                      ) : (
                                                                                                                                        <ChevronDown size={16} className="text-armadillo-border shrink-0" />
                                                                                                                                      )}
                                                                                          </button>
                                                                      {isExpanded && (
                                                                                            <div className="px-5 pb-4 -mt-1 space-y-2">
                                                                                                                    <div className="bg-burnt/5 border border-burnt/20 rounded-xl p-3">
                                                                                                                                              <div className="flex items-start gap-2">
                                                                                                                                                                          <Sparkles size={12} className="text-burnt shrink-0 mt-0.5" />
                                                                                                                                                                          <p className="text-xs text-armadillo-text/80 leading-relaxed">{aiLine}</p>
                                                                                                                                                </div>
                                                                                                                      </div>
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
              <div className="mb-6">
                      <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <Link href="/insights" className="bg-burnt/10 border border-burnt/30 rounded-xl p-5 hover:border-burnt/50 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                          <Sparkles size={18} className="text-burnt" />
                                                          <ArrowRight size={14} className="text-burnt opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-sm font-medium text-burnt">AI Insights</div>
                                            <div className="text-[10px] text-armadillo-muted mt-0.5">View your AI analytics writeup</div>
                                </Link>
                                <Link href="/export" className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 hover:border-burnt/40 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                          <span className="text-lg">&#128228;</span>
                                                          <ArrowRight size={14} className="text-armadillo-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-sm font-medium text-armadillo-text">Export Report</div>
                                            <div className="text-[10px] text-armadillo-muted mt-0.5">Share with brands or clients</div>
                                </Link>
                                <Link href="/customize" className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 hover:border-burnt/40 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                          <span className="text-lg">&#9881;&#65039;</span>
                                                          <ArrowRight size={14} className="text-armadillo-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-sm font-medium text-armadillo-text">Customize Metrics</div>
                                            <div className="text-[10px] text-armadillo-muted mt-0.5">Add or remove tracked metrics</div>
                                </Link>
                                <Link href="/settings" className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 hover:border-burnt/40 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                          <span className="text-lg">&#128279;</span>
                                                          <ArrowRight size={14} className="text-armadillo-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-sm font-medium text-armadillo-text">Platform Settings</div>
                                            <div className="text-[10px] text-armadillo-muted mt-0.5">Manage connected accounts</div>
                                </Link>
                      </div>
              </div>
        </div>
      );
}
