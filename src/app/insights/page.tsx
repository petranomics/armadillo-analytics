'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import { PLATFORM_NAMES } from '@/lib/constants';
import { getAIAnalysis } from '@/lib/ai-insights';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, ArrowUpRight, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';

const posts = [
  { id: 1, caption: 'Austin sunrise hits different from Mount Bonnell', likes: 4200, comments: 186, shares: 320, views: 45000, engagement: 10.5, daysAgo: 1 },
  { id: 2, caption: 'Best breakfast tacos ranked (this got spicy in the comments)', likes: 8300, comments: 520, shares: 610, views: 82000, engagement: 11.5, daysAgo: 3 },
  { id: 3, caption: 'POV: First time at Barton Springs Pool', likes: 2100, comments: 98, shares: 280, views: 18900, engagement: 13.1, daysAgo: 5 },
  { id: 4, caption: 'South Congress vintage shopping haul - found some gems', likes: 1840, comments: 72, shares: 210, views: 15600, engagement: 13.6, daysAgo: 7 },
  { id: 5, caption: 'Rating every coffee shop on South Lamar (thread)', likes: 6800, comments: 560, shares: 340, views: 52300, engagement: 14.7, daysAgo: 9 },
  { id: 6, caption: 'Lady Bird Lake kayak day - perfect weather', likes: 1520, comments: 64, shares: 190, views: 13400, engagement: 13.2, daysAgo: 11 },
  { id: 7, caption: 'Franklin BBQ: was the 4 hour wait worth it? Full review', likes: 12100, comments: 780, shares: 540, views: 96700, engagement: 13.9, daysAgo: 14 },
  { id: 8, caption: 'Rainey Street bar guide for 2026 - save this', likes: 3400, comments: 110, shares: 420, views: 28800, engagement: 13.7, daysAgo: 17 },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function InsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'posts' | 'trends' | 'audience'>('posts');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) { router.push('/onboarding'); return; }
    setProfile(p);
    setLoaded(true);
    if (p.plan === 'pro') setActiveTab('ai');
  }, [router]);

  if (!loaded || !profile) return null;

  const isPro = profile.plan === 'pro';
  const aiAnalysis = getAIAnalysis();

  const tabs: { key: typeof activeTab; label: string; locked?: boolean }[] = [
    { key: 'ai', label: 'AI Analysis', locked: !isPro },
    { key: 'posts', label: 'Posts' },
    { key: 'trends', label: 'Trends' },
    { key: 'audience', label: 'Audience', locked: !isPro },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text">Insights</h1>
        <p className="text-sm text-armadillo-muted mt-1">
          {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')} &middot; Last 30 days
        </p>
      </div>

      {/* Tab Bar */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-1 inline-flex mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.locked && setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-burnt text-white'
                : tab.locked
                ? 'text-armadillo-muted/50 cursor-not-allowed'
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-burnt/20 flex items-center justify-center">
                <Sparkles size={20} className="text-burnt" />
              </div>
              <div>
                <h2 className="font-display text-xl text-armadillo-text font-semibold">AI Analytics Writeup</h2>
                <p className="text-xs text-armadillo-muted">
                  Generated {aiAnalysis.generatedAt} based on your last 30 days of data
                </p>
              </div>
            </div>
          </div>

          {aiAnalysis.sections.map((section, i) => (
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

          <button
            onClick={() => setExpandedSection(expandedSection !== null ? null : 0)}
            className="w-full text-center text-xs text-burnt font-medium py-2"
          >
            {expandedSection !== null ? 'Collapse all' : 'Expand all sections'}
          </button>
        </div>
      )}

      {/* AI Upgrade CTA for non-Pro */}
      {activeTab === 'ai' && !isPro && (
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-burnt/15 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-burnt" />
          </div>
          <h2 className="font-display text-2xl text-armadillo-text mb-2">AI Analysis is a Pro Feature</h2>
          <p className="text-armadillo-muted mb-6 max-w-md mx-auto">
            Unlock AI-powered analytics writeups, content recommendations, and growth strategies tailored to your account.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-burnt hover:bg-burnt-light text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {/* Quick Summary */}
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

          {/* Post Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {posts.map((post, i) => (
              <div key={post.id} className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-burnt font-bold text-lg">#{i + 1}</span>
                    <span className="text-xs text-armadillo-muted">{post.daysAgo === 1 ? '1 day ago' : `${post.daysAgo} days ago`}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    post.engagement > 13 ? 'bg-success/15 text-success' :
                    post.engagement > 10 ? 'bg-burnt/15 text-burnt' :
                    'bg-armadillo-muted/15 text-armadillo-muted'
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

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {[
            { label: 'This Week vs Last Week', metrics: [
              { name: 'Engagement Rate', current: '12.4%', prev: '10.8%', change: 14.8 },
              { name: 'Avg Views', current: '42.3K', prev: '38.1K', change: 11.0 },
              { name: 'Followers Gained', current: '+847', prev: '+623', change: 36.0 },
              { name: 'Comments', current: '1.2K', prev: '980', change: 22.4 },
            ]},
            { label: 'This Month vs Last Month', metrics: [
              { name: 'Total Reach', current: '284K', prev: '241K', change: 17.8 },
              { name: 'Profile Visits', current: '8.4K', prev: '6.9K', change: 21.7 },
              { name: 'Website Clicks', current: '342', prev: '298', change: 14.8 },
              { name: 'Saves', current: '3.6K', prev: '2.8K', change: 28.6 },
            ]},
          ].map((section) => (
            <div key={section.label}>
              <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">{section.label}</h3>
              <div className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
                {section.metrics.map((m, i) => (
                  <div key={m.name} className={`flex items-center gap-3 px-5 py-4 ${
                    i < section.metrics.length - 1 ? 'border-b border-armadillo-border/50' : ''
                  }`}>
                    <div className="flex-1">
                      <div className="text-sm text-armadillo-text font-medium">{m.name}</div>
                      <div className="text-xs text-armadillo-muted mt-0.5">prev: {m.prev}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-display text-armadillo-text">{m.current}</div>
                      <div className={`text-xs flex items-center justify-end gap-0.5 ${m.change >= 0 ? 'text-success' : 'text-danger'}`}>
                        {m.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(m.change)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Insights */}
          <div>
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Quick Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { icon: '\uD83D\uDD25', text: 'Your food content gets 2.3x more engagement than lifestyle posts. Consider posting more food reviews.', action: 'View food posts' },
                { icon: '\u23F0', text: 'Your best posting time is Tuesday at 6PM CT. Posts at this time get 40% more reach.', action: 'See timing data' },
                { icon: '\uD83D\uDCC8', text: 'Follower growth is accelerating \u2014 up 36% vs last week. Your Barton Springs content is driving discovery.', action: 'Growth details' },
              ].map((insight, i) => (
                <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
                  <span className="text-2xl mb-3 block">{insight.icon}</span>
                  <p className="text-sm text-armadillo-text leading-relaxed mb-3">{insight.text}</p>
                  <button className="flex items-center gap-1 text-xs text-burnt font-medium">
                    {insight.action} <ArrowUpRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
              <button
                onClick={() => router.push('/settings')}
                className="bg-burnt hover:bg-burnt-light text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gender */}
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

              {/* Age */}
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

              {/* Locations */}
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

              {/* Active Hours */}
              <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
                <h3 className="font-display text-lg text-armadillo-text mb-5">Most Active Hours</h3>
                <div className="flex items-end justify-between gap-1.5 h-36">
                  {[15, 22, 35, 48, 62, 78, 95, 88, 72, 55, 40, 25].map((height, i) => {
                    const isPeak = height > 80;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-full rounded-t-sm ${isPeak ? 'bg-burnt' : 'bg-armadillo-border'}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-armadillo-muted text-[9px] mt-1.5">
                          {6 + i * 1.5 < 12 ? `${Math.floor(6 + i * 1.5)}a` : `${Math.floor(6 + i * 1.5) - 12 || 12}p`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-armadillo-muted text-xs mt-4 text-center">
                  Peak activity: 5 PM - 7 PM CT
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
