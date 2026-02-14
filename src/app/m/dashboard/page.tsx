'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { USER_TYPES, ALL_METRICS, type MetricDefinition, type MetricCategory, CATEGORY_LABELS } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw, Bell, Sparkles, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

const EngagementBreakdown = dynamic(() => import('@/components/mobile/charts/EngagementBreakdown'), { ssr: false });
const EngagementTrend = dynamic(() => import('@/components/mobile/charts/EngagementTrend'), { ssr: false });
const PeakHours = dynamic(() => import('@/components/mobile/charts/PeakHours'), { ssr: false });
const WatchDuration = dynamic(() => import('@/components/mobile/charts/WatchDuration'), { ssr: false });

// Mock metric values for the dashboard
function getMockValue(metric: MetricDefinition): { value: string; trend: number; raw: number } {
  const seed = metric.id.length * 7 + metric.label.length * 3;
  switch (metric.format) {
    case 'percentage':
      return { value: `${(2 + (seed % 15)).toFixed(1)}%`, trend: ((seed % 8) - 3), raw: 2 + (seed % 15) };
    case 'currency':
      return { value: `$${(50 + (seed % 950)).toLocaleString()}`, trend: ((seed % 12) - 4), raw: 50 + (seed % 950) };
    case 'duration':
      return { value: `${1 + (seed % 12)}m ${seed % 60}s`, trend: ((seed % 6) - 2), raw: seed };
    case 'ratio':
      return { value: `${(seed % 5) + 1}:${(seed % 3) + 1}`, trend: ((seed % 7) - 3), raw: seed };
    default: {
      const n = (seed * 137 + 2847) % 50000;
      if (n >= 10000) return { value: `${(n / 1000).toFixed(1)}K`, trend: ((seed % 10) - 3), raw: n };
      if (n >= 1000) return { value: `${(n / 1000).toFixed(1)}K`, trend: ((seed % 10) - 3), raw: n };
      return { value: n.toLocaleString(), trend: ((seed % 10) - 3), raw: n };
    }
  }
}

// AI-powered one-liner contextual insights based on metric + trend
function getAIOneLiner(metric: MetricDefinition, trend: number): string {
  const up = trend >= 0;
  const abs = Math.abs(trend);
  const strong = abs >= 5;

  // Metric-specific insights
  const insights: Record<string, [string, string]> = {
    engagement_rate: [
      strong ? `Strong momentum — your audience is ${abs}% more engaged than last period` : `Steady engagement — your content is resonating consistently`,
      strong ? `Engagement dropped ${abs}% — try experimenting with new content formats` : `Slight dip — normal fluctuation, keep your posting rhythm`,
    ],
    likes: [
      strong ? `Likes are surging — your recent content is hitting with your audience` : `Likes holding steady — your audience is consistently showing love`,
      strong ? `Like count is cooling off — your last few posts may need stronger hooks` : `Small dip in likes — try posting during your peak hours`,
    ],
    follower_growth: [
      strong ? `You're gaining followers faster than usual — something's working` : `Steady growth — you're building a loyal audience`,
      strong ? `Growth slowed — consider collaborations or trending content to re-accelerate` : `Slight slowdown — this is normal after a growth spike`,
    ],
    comments: [
      `Comments are up ${abs}% — your audience wants to talk, keep the conversation going`,
      `Comments dipped — try ending captions with a question to spark discussion`,
    ],
    shares: [
      `Your content is being shared more — this is your strongest growth lever`,
      `Fewer shares this period — create more "save & share" worthy content`,
    ],
    saves: [
      `Saves are climbing — people want to come back to your content, that's high intent`,
      `Saves are down — educational or list-style content tends to boost this metric`,
    ],
    reach: [
      strong ? `Your reach expanded ${abs}% — the algorithm is pushing your content to new audiences` : `Reach is stable — your content is consistently getting in front of people`,
      strong ? `Reach contracted ${abs}% — hashtags and posting times could help here` : `Slight reach dip — try posting more Reels to boost discovery`,
    ],
    impressions: [
      `More eyeballs on your content — your posts are appearing in feeds ${abs}% more often`,
      `Impressions down — your content may be getting less priority in the feed`,
    ],
    views: [
      `Video views are up — your thumbnails and hooks are working`,
      `Views dipped — the first 3 seconds of your video are critical for retention`,
    ],
    profile_views: [
      `More people are checking out your profile — your content is sparking curiosity`,
      `Profile visits slowed — make sure your bio and pinned posts are compelling`,
    ],
    website_taps: [
      `Website traffic from social is up — your CTAs are driving action`,
      `Fewer website taps — try adding clearer calls-to-action in your content`,
    ],
    story_completion: [
      `Viewers are watching your Stories all the way through — great pacing`,
      `Story drop-off increased — keep Stories under 7 frames for better completion`,
    ],
    reel_retention: [
      `Reel retention is strong — your audience is watching longer`,
      `Reel retention dropped — try front-loading your best content in the first 2 seconds`,
    ],
    top_posts: [
      `Your top content is outperforming your average — lean into these formats`,
      `Top post performance dipped — review what worked in your best content last month`,
    ],
    best_posting_times: [
      `Your posting windows are aligned with audience activity — good timing`,
      `You may be missing your audience's peak hours — check your active-hours data`,
    ],
    hashtag_performance: [
      `Your hashtags are driving more discovery than last period`,
      `Hashtag reach is down — rotate in some trending tags relevant to your niche`,
    ],
    subscriber_growth: [
      `Subscriber momentum is strong — your content is converting viewers`,
      `Sub growth slowed — pinned comments and end screens can help convert viewers`,
    ],
    watch_time: [
      `Watch time is climbing — the algorithm rewards this heavily`,
      `Watch time dropped — shorter, punchier intros can help retain viewers`,
    ],
    click_through_rate: [
      `Your thumbnails are earning more clicks — keep testing bold visuals`,
      `CTR dipped — try A/B testing your thumbnail style`,
    ],
    conversion_rate: [
      `Conversions up ${abs}% — your content-to-purchase funnel is working`,
      `Conversion rate dropped — review your product placement and CTAs`,
    ],
    revenue_per_video: [
      `Revenue per video is up — you're earning more from each piece of content`,
      `Revenue per video dipped — focus on products with higher margins`,
    ],
    shop_clicks: [
      `More viewers are tapping through to shop — your product hooks are landing`,
      `Shop clicks down — try showcasing products in the first few seconds`,
    ],
  };

  const pair = insights[metric.id];
  if (pair) return up ? pair[0] : pair[1];

  // Fallback based on category
  const categoryFallbacks: Record<string, [string, string]> = {
    engagement: [
      `This engagement metric is trending up ${abs}% — your content strategy is working`,
      `Down ${abs}% — test different content types to re-engage your audience`,
    ],
    reach: [
      `Visibility up ${abs}% — more people are discovering your content`,
      `Reach dipped ${abs}% — experiment with posting times and formats`,
    ],
    audience: [
      `Your audience metrics are improving — you're attracting the right people`,
      `Audience metric declined — review if your content matches your target demographic`,
    ],
    content: [
      `Content performance trending up — double down on what's working`,
      `Content metric dipped — analyze your top posts from last month for patterns`,
    ],
    growth: [
      `Growth is accelerating — your audience is expanding faster`,
      `Growth slowed this period — collaborations can help reignite momentum`,
    ],
    revenue: [
      `Revenue metric up ${abs}% — your monetization strategy is paying off`,
      `Revenue dipped — revisit your pricing or promotional content`,
    ],
    competitive: [
      `You're gaining ground against competitors in your niche`,
      `Competitors may be outpacing you — review their recent content strategy`,
    ],
    sentiment: [
      `Audience sentiment is trending positive — your community loves your content`,
      `Sentiment shifted — check recent comments for feedback to address`,
    ],
  };

  const catPair = categoryFallbacks[metric.category];
  if (catPair) return up ? catPair[0] : catPair[1];

  return up
    ? `Up ${abs}% this period — keep the momentum going`
    : `Down ${abs}% — worth investigating what changed`;
}

export default function MobileDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) {
      router.push('/m/onboarding');
      return;
    }
    setProfile(p);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const userConfig = USER_TYPES.find(u => u.id === profile.userType);
  const selectedMetricDefs = profile.selectedMetrics
    .map(id => ALL_METRICS.find(m => m.id === id))
    .filter(Boolean) as MetricDefinition[];

  // Group metrics by category for display
  const grouped: Record<string, MetricDefinition[]> = {};
  for (const m of selectedMetricDefs) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  // Top 4 KPIs for the hero section
  const heroMetrics = selectedMetricDefs.slice(0, 4);

  // Show watch duration chart if user has video-centric platforms
  const videoPlatforms = ['tiktok', 'youtube', 'instagram'] as const;
  const hasVideoMetrics = profile.selectedPlatforms.some(p => videoPlatforms.includes(p as typeof videoPlatforms[number]));

  const toggleExpand = (id: string) => {
    setExpandedMetric(prev => prev === id ? null : id);
  };

  return (
    <div className="pb-20">
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
          </div>
          <p className="text-[11px] text-armadillo-muted mt-1 ml-10">
            {userConfig?.label} &middot; {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted">
            <Bell size={16} />
          </button>
          <button className="w-9 h-9 rounded-full bg-armadillo-card border border-armadillo-border flex items-center justify-center text-armadillo-muted">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Platform Badges */}
      <div className="px-5 mb-4">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase">Connected Platforms</span>
            <div className="flex items-center gap-1 text-xs text-success">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              {profile.plan === 'pro' ? 'Pro' : profile.plan === 'lite' ? 'Lite' : 'Free'}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {profile.selectedPlatforms.map((platform) => (
              <div
                key={platform}
                className="flex items-center gap-2 bg-armadillo-bg border border-armadillo-border rounded-xl px-3 py-2"
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
                    {profile.platformUsernames[platform] ? `@${profile.platformUsernames[platform]}` : 'Demo data'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero KPIs - Top 4 in a 2x2 grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {heroMetrics.map((metric) => {
            const { value, trend } = getMockValue(metric);
            const isExpanded = expandedMetric === metric.id;
            const aiLine = getAIOneLiner(metric, trend);
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
                <div className={`flex items-center gap-1 text-[11px] ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                  {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(trend)}% this period
                </div>
                {/* AI one-liner */}
                <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-armadillo-border/50">
                  <Sparkles size={10} className="text-burnt shrink-0 mt-0.5" />
                  <p className={`text-[10px] leading-relaxed text-armadillo-muted ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {aiLine}
                  </p>
                </div>
                {/* Explainer on expand */}
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

      {/* Interactive Charts Section */}
      <div className="px-5 mb-5 space-y-3">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-0.5">Analytics Overview</h3>
        <EngagementBreakdown />
        <EngagementTrend />
        <PeakHours />
        {hasVideoMetrics && <WatchDuration />}
      </div>

      {/* Remaining Metrics by Category */}
      {Object.entries(grouped).map(([category, metrics]) => {
        const categoryMetrics = metrics.filter(m => !heroMetrics.includes(m));
        if (categoryMetrics.length === 0) return null;

        return (
          <div key={category} className="px-5 mb-5">
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">
              {CATEGORY_LABELS[category as MetricCategory]}
            </h3>
            <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
              {categoryMetrics.map((metric, i) => {
                const { value, trend } = getMockValue(metric);
                const isExpanded = expandedMetric === metric.id;
                const aiLine = getAIOneLiner(metric, trend);
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
                        {/* AI one-liner always visible */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Sparkles size={8} className="text-burnt shrink-0" />
                          <p className="text-[10px] text-armadillo-muted truncate">{aiLine}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-display text-armadillo-text">{value}</div>
                        <div className={`text-[10px] flex items-center justify-end gap-0.5 ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                          {trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {Math.abs(trend)}%
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-armadillo-border shrink-0" />
                      ) : (
                        <ChevronDown size={14} className="text-armadillo-border shrink-0" />
                      )}
                    </button>
                    {/* Expanded: full AI insight + explainer */}
                    {isExpanded && (
                      <div className="px-4 pb-3.5 -mt-1 space-y-2">
                        <div className="bg-burnt/5 border border-burnt/20 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <Sparkles size={12} className="text-burnt shrink-0 mt-0.5" />
                            <p className="text-[11px] text-armadillo-text/80 leading-relaxed">{aiLine}</p>
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
    </div>
  );
}
