'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { PLATFORM_NAMES } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import { TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, ArrowUpRight, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';

// Mock posts for the insights feed
function getMockPosts(platform: string) {
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
  return posts;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Mock AI analysis writeup
function getAIAnalysis() {
  return {
    generatedAt: 'Feb 12, 2026 at 9:14 AM CT',
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
        body: "Valentine's Day is 2 days away — your audience engagement typically spikes 35% during holiday-themed content. Consider preparing a themed post. St. Patrick's Day (March 17) is also a strong engagement window for food and nightlife content.",
      },
      {
        icon: '💡',
        title: 'Recommendations',
        body: null,
        bullets: [
          'Shift your posting schedule to 1 PM CT for maximum reach',
          'Double down on food review content — it\'s your top performer by a wide margin',
          'Create a Valentine\'s Day post leveraging your restaurant review format',
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

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) { router.push('/m/onboarding'); return; }
    setProfile(p);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const isPro = profile.plan === 'pro';
  const primaryPlatform = profile.selectedPlatforms[0] || 'instagram';
  const posts = getMockPosts(primaryPlatform);
  const aiAnalysis = getAIAnalysis();

  const tabs = isPro
    ? (['ai', 'posts', 'trends', 'audience'] as const)
    : (['posts', 'trends', 'audience'] as const);

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
          {/* Header */}
          <div className="bg-gradient-to-br from-burnt/20 to-burnt/5 border border-burnt/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-burnt" />
              <span className="text-sm font-medium text-armadillo-text">AI Analytics Writeup</span>
            </div>
            <p className="text-[11px] text-armadillo-muted">
              Generated {aiAnalysis.generatedAt} based on your last 30 days of data across {profile.selectedPlatforms.map(p => PLATFORM_NAMES[p]).join(', ')}.
            </p>
          </div>

          {/* Analysis Sections */}
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

          {/* Expand All / Collapse All */}
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
          {/* Quick Summary */}
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

          {/* Post List */}
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

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="px-5 space-y-4">
          {/* Weekly Trend Cards */}
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
              <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">{section.label}</h3>
              <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
                {section.metrics.map((m, i) => (
                  <div key={m.name} className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < section.metrics.length - 1 ? 'border-b border-armadillo-border/50' : ''
                  }`}>
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
          ))}

          {/* Insight Cards */}
          <div>
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Quick Insights</h3>
            <div className="space-y-2">
              {[
                { icon: '🔥', text: 'Your food content gets 2.3x more engagement than lifestyle posts. Consider posting more food reviews.', action: 'View food posts' },
                { icon: '⏰', text: 'Your best posting time is Tuesday at 6PM CT. Posts at this time get 40% more reach.', action: 'See timing data' },
                { icon: '📈', text: 'Follower growth is accelerating — up 36% vs last week. Your Barton Springs content is driving discovery.', action: 'Growth details' },
              ].map((insight, i) => (
                <div key={i} className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{insight.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-armadillo-text leading-relaxed">{insight.text}</p>
                      <button className="flex items-center gap-1 text-[11px] text-burnt mt-2 font-medium">
                        {insight.action} <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="px-5 space-y-4">
          {/* Pro gate for audience data */}
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
              {/* Demographics */}
              <div>
                <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Demographics</h3>
                <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4 space-y-4">
                  {/* Gender */}
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

                  {/* Age */}
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

              {/* Top Locations */}
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
                    <div key={loc.location} className={`flex items-center gap-3 px-4 py-3 ${
                      i < 4 ? 'border-b border-armadillo-border/50' : ''
                    }`}>
                      <span className="text-sm">{loc.flag}</span>
                      <span className="flex-1 text-xs text-armadillo-text">{loc.location}</span>
                      <span className="text-xs font-medium text-armadillo-text">{loc.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Hours */}
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
