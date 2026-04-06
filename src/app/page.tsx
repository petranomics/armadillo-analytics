'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import { USER_TYPES } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { computeCompoundMetrics, computeCrossPlatform, type CompoundMetrics, type PlatformSummary } from '@/lib/compound-metrics';
import { TrendingUp, RefreshCw, Bell, Sparkles, ArrowRight, AlertCircle, MessageCircle, Share2, Eye, Zap, Target, Users, Bookmark } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Post, Platform } from '@/lib/types';

import CompoundMetricCard from '@/components/cards/CompoundMetricCard';
import BrandReadinessCard from '@/components/cards/BrandReadinessCard';
import ContentSignalsCard from '@/components/cards/ContentSignalsCard';

const EngagementBreakdown = dynamic(() => import('@/components/charts/EngagementBreakdown'), { ssr: false });
const EngagementTrend = dynamic(() => import('@/components/charts/EngagementTrend'), { ssr: false });
const PeakHours = dynamic(() => import('@/components/charts/PeakHours'), { ssr: false });
const CrossPlatformComparison = dynamic(() => import('@/components/charts/CrossPlatformComparison'), { ssr: false });

interface ExportData {
    profile: { followers: number; platform?: string; [key: string]: unknown };
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

interface AggregatedData {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    totalSaves: number;
    followers: number;
    engagementRate: number;
    postCount: number;
    allPosts: Post[];
    compoundMetrics: CompoundMetrics;
    crossPlatform: PlatformSummary[];
}

function loadAllPlatformData(platforms: string[]): AggregatedData | null {
    let totalLikes = 0, totalComments = 0, totalShares = 0, totalViews = 0;
    let followers = 0, engagementRateSum = 0, platformCount = 0, postCount = 0;
    const allPosts: Post[] = [];
    const platformEntries: { platform: Platform; followers: number; posts: Post[] }[] = [];

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
            if (data.posts) {
                allPosts.push(...data.posts);
                platformEntries.push({
                    platform: platform as Platform,
                    followers: data.profile.followers || 0,
                    posts: data.posts,
                });
            }
        } catch { /* ignore parse errors */ }
    }

    if (platformCount === 0) {
        // Try generic key as fallback
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
                if (data.posts) {
                    allPosts.push(...data.posts);
                    platformEntries.push({
                        platform: (data.profile.platform || 'instagram') as Platform,
                        followers: data.profile.followers || 0,
                        posts: data.posts,
                    });
                }
            }
        } catch { /* ignore */ }
    }

    if (platformCount === 0) return null;

    const compoundMetrics = computeCompoundMetrics(allPosts, followers);
    const crossPlatform = computeCrossPlatform(platformEntries);

    return {
        totalLikes, totalComments, totalShares, totalViews, totalSaves: 0,
        followers,
        engagementRate: parseFloat((engagementRateSum / platformCount).toFixed(1)),
        postCount,
        allPosts,
        compoundMetrics,
        crossPlatform,
    };
}

function formatNum(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [data, setData] = useState<AggregatedData | null>(null);

    useEffect(() => {
        const p = getUserProfile();
        if (!p.onboardingComplete) { router.push('/onboarding'); return; }
        setProfile(p);
        setData(loadAllPlatformData(p.selectedPlatforms));
        setLoaded(true);
    }, [router]);

    // Listen for export data updates
    useEffect(() => {
        if (!profile) return;
        const handleStorage = (e: StorageEvent) => {
            if (e.key?.startsWith('armadillo-export-data') && e.newValue) {
                setData(loadAllPlatformData(profile.selectedPlatforms));
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [profile]);

    if (!loaded || !profile) return null;

    const isLive = data !== null;
    const userConfig = USER_TYPES.find(u => u.id === profile.userType);
    const cm = data?.compoundMetrics;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-3xl text-armadillo-text">Dashboard</h1>
                        {isLive && (
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
                    <Link
                        href={`/${profile.selectedPlatforms[0]}`}
                        className="w-9 h-9 rounded-lg bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted hover:text-armadillo-text transition-colors"
                        title="Go to platform dashboard to refresh data"
                    >
                        <RefreshCw size={16} />
                    </Link>
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

            {/* No data banner */}
            {!isLive && (
                <div className="bg-burnt/10 border border-burnt/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} className="text-burnt shrink-0" />
                    <div>
                        <span className="text-sm text-burnt font-medium">No live data yet.</span>
                        <span className="text-sm text-armadillo-muted ml-1">
                            Visit your{' '}
                            <Link href={`/${profile.selectedPlatforms[0]}`} className="text-burnt underline">
                                {PLATFORM_NAMES[profile.selectedPlatforms[0]]} dashboard
                            </Link>{' '}
                            to fetch live data — your metrics will automatically appear here.
                        </span>
                    </div>
                </div>
            )}

            {/* Hero KPIs — Core Counts */}
            {isLive && data && (
                <>
                    <h2 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Users size={14} className="text-armadillo-muted" />
                                <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">Followers</span>
                            </div>
                            <div className="font-display text-3xl text-armadillo-text">{formatNum(data.followers)}</div>
                            <div className="text-[10px] text-armadillo-muted mt-0.5">{data.crossPlatform.length} platform{data.crossPlatform.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <TrendingUp size={14} className="text-armadillo-muted" />
                                <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">Eng. Rate</span>
                            </div>
                            <div className="font-display text-3xl text-armadillo-text">{data.engagementRate}%</div>
                            <div className="text-[10px] text-armadillo-muted mt-0.5">across {data.postCount} posts</div>
                        </div>
                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Eye size={14} className="text-armadillo-muted" />
                                <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">Total Views</span>
                            </div>
                            <div className="font-display text-3xl text-armadillo-text">{data.totalViews > 0 ? formatNum(data.totalViews) : '--'}</div>
                            {cm?.followerToViewRatio !== null && cm?.followerToViewRatio !== undefined && (
                                <div className={`text-[10px] mt-0.5 ${cm.followerToViewRatio >= 1 ? 'text-success' : 'text-armadillo-muted'}`}>
                                    {cm.followerToViewRatio}x follower reach
                                </div>
                            )}
                        </div>
                        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Zap size={14} className="text-armadillo-muted" />
                                <span className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">Total Engagement</span>
                            </div>
                            <div className="font-display text-3xl text-armadillo-text">{formatNum(data.totalLikes + data.totalComments + data.totalShares)}</div>
                            <div className="text-[10px] text-armadillo-muted mt-0.5">likes + comments + shares</div>
                        </div>
                    </div>

                    {/* Compound Metrics — Multi-Variable Ratios */}
                    <h2 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Engagement Quality</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <CompoundMetricCard
                            label="Conversation Rate"
                            value={cm?.conversationRate !== null && cm?.conversationRate !== undefined ? `${cm.conversationRate}%` : '--'}
                            subtitle="Comments per follower"
                            tooltip="Measures how much your content sparks real discussion. We take your total comments and divide by your follower count. A higher number means people aren't just scrolling past — they're stopping to respond. Anything above 1% is strong."
                            icon={<MessageCircle size={14} />}
                            sentiment={cm?.conversationRate && cm.conversationRate > 1 ? 'positive' : 'neutral'}
                        />
                        <CompoundMetricCard
                            label="Amplification Rate"
                            value={cm?.amplificationRate !== null && cm?.amplificationRate !== undefined ? `${cm.amplificationRate}%` : '--'}
                            subtitle="Shares per follower"
                            tooltip="Shows how often your audience shares your content with their own network. We divide your total shares by your follower count. When people share, they're putting their own reputation behind your content — this is the strongest signal of value."
                            icon={<Share2 size={14} />}
                            sentiment={cm?.amplificationRate && cm.amplificationRate > 0.5 ? 'positive' : 'neutral'}
                        />
                        <CompoundMetricCard
                            label="Virality Rate"
                            value={cm?.viralityRate !== null && cm?.viralityRate !== undefined ? `${cm.viralityRate}%` : '--'}
                            subtitle="How far content spreads"
                            tooltip="Of everyone who liked or commented on your posts, what percentage also shared it? This tells you how much your content spreads beyond just getting a reaction. High virality means your content has legs — people feel compelled to pass it along."
                            icon={<Zap size={14} />}
                            sentiment={cm?.viralityRate && cm.viralityRate > 5 ? 'positive' : 'neutral'}
                        />
                        <CompoundMetricCard
                            label="Views → Action"
                            value={cm?.viewsToEngRate !== null && cm?.viewsToEngRate !== undefined ? `${cm.viewsToEngRate}%` : '--'}
                            subtitle="Viewers who engage"
                            tooltip="Out of everyone who viewed your content, what percentage actually liked, commented, or shared? Most people scroll past without engaging — so even a few percent here is meaningful. This tells you how compelling your content is to casual viewers."
                            icon={<Target size={14} />}
                            sentiment={cm?.viewsToEngRate && cm.viewsToEngRate > 3 ? 'positive' : 'neutral'}
                        />
                    </div>

                    {/* Second row of compound metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <CompoundMetricCard
                            label="Comment:Like Ratio"
                            value={cm?.commentToLikeRatio !== null && cm?.commentToLikeRatio !== undefined ? `${cm.commentToLikeRatio}%` : '--'}
                            subtitle={cm?.commentToLikeRatio && cm.commentToLikeRatio > 5 ? 'Deep engagement' : 'Passive scrolling'}
                            tooltip="Compares how many people comment versus just double-tapping a like. A like takes zero effort; a comment means someone cared enough to type something. Higher means your audience is genuinely invested, not just passively scrolling. Over 5% suggests real community engagement."
                            icon={<MessageCircle size={14} />}
                            sentiment={cm?.commentToLikeRatio && cm.commentToLikeRatio > 5 ? 'positive' : 'neutral'}
                        />
                        {cm?.saveRate !== null && cm?.saveRate !== undefined && (
                            <CompoundMetricCard
                                label="Save Rate"
                                value={`${cm.saveRate}%`}
                                subtitle="Bookmark-worthy content"
                                tooltip="Of all engagement on your posts, what percentage were saves/bookmarks? When someone saves your post, they're saying 'I want to come back to this.' It's one of the strongest signals that your content provides lasting value — not just a quick dopamine hit."
                                icon={<Bookmark size={14} />}
                                sentiment={cm.saveRate > 3 ? 'positive' : 'neutral'}
                            />
                        )}
                        {cm?.postingConsistency !== null && cm?.postingConsistency !== undefined && (
                            <CompoundMetricCard
                                label="Consistency"
                                value={`${cm.postingConsistency}%`}
                                subtitle="Engagement predictability"
                                tooltip="How predictable is your engagement from post to post? We measure the variation across all your recent posts. 100% would mean every post performs identically. Higher consistency tells brands they can reliably expect a certain level of engagement when they partner with you."
                                icon={<Target size={14} />}
                                sentiment={cm.postingConsistency > 60 ? 'positive' : cm.postingConsistency < 30 ? 'negative' : 'neutral'}
                            />
                        )}
                    </div>
                </>
            )}

            {/* Charts Row 1: Engagement Breakdown + Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <EngagementBreakdown realData={data ? { likes: data.totalLikes, comments: data.totalComments, shares: data.totalShares, saves: data.totalSaves } : undefined} />
                <EngagementTrend posts={data?.allPosts && data.allPosts.length > 0 ? data.allPosts : undefined} />
            </div>

            {/* Charts Row 2: Peak Hours + Platform Comparison / Brand Readiness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <PeakHours posts={data?.allPosts && data.allPosts.length > 0 ? data.allPosts : undefined} />
                {data && data.crossPlatform.length >= 2 ? (
                    <CrossPlatformComparison data={data.crossPlatform} />
                ) : cm ? (
                    <BrandReadinessCard metrics={cm} />
                ) : (
                    <CrossPlatformComparison data={[]} />
                )}
            </div>

            {/* Content Signals + Brand Readiness */}
            {cm && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <ContentSignalsCard metrics={cm} />
                    {data && data.crossPlatform.length >= 2 && (
                        <BrandReadinessCard metrics={cm} />
                    )}
                </div>
            )}

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
                    <Link href="/media-kit" className="bg-armadillo-card border border-armadillo-border rounded-xl p-5 hover:border-burnt/40 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">&#128196;</span>
                            <ArrowRight size={14} className="text-armadillo-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-sm font-medium text-armadillo-text">Media Kit</div>
                        <div className="text-[10px] text-armadillo-muted mt-0.5">One-sheet for brand deals</div>
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
