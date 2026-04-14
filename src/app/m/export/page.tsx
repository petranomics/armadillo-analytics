'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import BottomNav from '@/components/mobile/BottomNav';
import { FileText, Link2, Mail, Download, Image, QrCode, Copy, Check, Share2, Presentation, Lock, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import type { TrendData, HashtagStats, HashtagPost, RedditTrend, TikTokTrend } from '@/lib/types';

function generateTrendCSV(
  hashtagStats: HashtagStats[],
  hashtagPosts: HashtagPost[],
  redditTrends: RedditTrend[],
  tiktokTrends: TikTokTrend[],
): string | null {
  const hasAnyData = hashtagStats.length > 0 || hashtagPosts.length > 0 || redditTrends.length > 0 || tiktokTrends.length > 0;
  if (!hasAnyData) return null;

  const lines: string[] = [];

  // Hashtag Stats
  if (hashtagStats.length > 0) {
    lines.push('--- HASHTAG TRENDS ---');
    lines.push('Hashtag,Post Count,Avg Engagement %,Trend,Related Hashtags');
    for (const h of hashtagStats) {
      lines.push(`#${h.hashtag},${h.postCount},${h.avgEngagement || ''},${h.trend || ''},"${h.relatedHashtags.join(', ')}"`);
    }
    lines.push('');
  }

  // Trending Hashtag Posts
  if (hashtagPosts.length > 0) {
    lines.push('--- TRENDING HASHTAG POSTS ---');
    lines.push('Hashtag,Caption,Likes,Comments,Published');
    for (const p of hashtagPosts) {
      lines.push(`#${p.hashtag},"${p.caption.replace(/"/g, '""')}",${p.likes},${p.comments},${p.publishedAt}`);
    }
    lines.push('');
  }

  // Reddit Trends
  if (redditTrends.length > 0) {
    lines.push('--- REDDIT TRENDS ---');
    lines.push('Title,Subreddit,Upvotes,Comments,Flair,Published');
    for (const r of redditTrends) {
      lines.push(`"${r.title.replace(/"/g, '""')}",${r.subreddit},${r.upvotes},${r.comments},${r.flair || ''},${r.publishedAt}`);
    }
    lines.push('');
  }

  // TikTok Trends
  if (tiktokTrends.length > 0) {
    lines.push('--- TIKTOK TRENDS ---');
    lines.push('Product,Category,Trend Score,Related Videos,Description');
    for (const t of tiktokTrends) {
      lines.push(`"${t.productName}",${t.category},${t.trendScore || ''},${t.relatedVideos || ''},"${(t.description || '').replace(/"/g, '""')}"`);
    }
  }

  return lines.join('\n');
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  // Trend data state
  const [hashtagStats, setHashtagStats] = useState<HashtagStats[]>([]);
  const [hashtagPosts, setHashtagPosts] = useState<HashtagPost[]>([]);
  const [redditTrends, setRedditTrends] = useState<RedditTrend[]>([]);
  const [tiktokTrends, setTiktokTrends] = useState<TikTokTrend[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendsFetched, setTrendsFetched] = useState(false);

  const hasTrendData = hashtagStats.length > 0 || hashtagPosts.length > 0 || redditTrends.length > 0 || tiktokTrends.length > 0;

  // Fetch a single trend source
  const fetchTrend = useCallback(async (source: string, params: Record<string, unknown>) => {
    const res = await fetch('/api/trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, params }),
    });
    const data: TrendData & { error?: string } = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');

    if (data.hashtagStats) setHashtagStats(prev => [...prev, ...data.hashtagStats!]);
    if (data.hashtagPosts) setHashtagPosts(prev => [...prev, ...data.hashtagPosts!]);
    if (data.redditTrends) setRedditTrends(prev => [...prev, ...data.redditTrends!]);
    if (data.tiktokTrends) setTiktokTrends(prev => [...prev, ...data.tiktokTrends!]);
  }, []);

  // Fetch all trend data on demand
  const fetchAllTrends = useCallback(async () => {
    if (!profile) return;
    setTrendLoading(true);
    setTrendError(null);
    setHashtagStats([]);
    setHashtagPosts([]);
    setRedditTrends([]);
    setTiktokTrends([]);

    try {
      const fetches: Promise<void>[] = [];
      const hasIg = profile.selectedPlatforms.includes('instagram');
      const hasTiktok = profile.selectedPlatforms.includes('tiktok');

      if (hasIg) {
        fetches.push(fetchTrend('instagramHashtags', { keywords: ['fitness', 'food', 'travel'] }));
        fetches.push(fetchTrend('instagramHashtagPosts', { hashtags: ['austinfood', 'atxlife'], limit: 20 }));
      }
      fetches.push(fetchTrend('redditTrends', { subreddits: ['https://old.reddit.com/r/popular/'], maxPosts: 15 }));
      if (hasTiktok) {
        fetches.push(fetchTrend('tiktokTrends', { category: 'General', maxProducts: 8 }));
      }

      await Promise.allSettled(fetches);
      setTrendsFetched(true);
    } catch (err) {
      setTrendError(err instanceof Error ? err.message : 'Failed to fetch trend data');
    } finally {
      setTrendLoading(false);
    }
  }, [profile, fetchTrend]);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) { router.push('/m/onboarding'); return; }
    setProfile(p);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const isInfluencer = profile.userType === 'influencer';
  const isPro = profile.plan === 'pro';
  const isFree = profile.plan === 'free';

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCSVExport = () => {
    const csv = generateTrendCSV(hashtagStats, hashtagPosts, redditTrends, tiktokTrends);
    if (!csv) return;
    downloadCSV(`armadillo-trends-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-display text-xl text-armadillo-text">Export & Share</h1>
        <p className="text-[11px] text-armadillo-muted mt-0.5">
          {isInfluencer ? 'Share your analytics with brands to book gigs' : 'Export reports for your team or clients'}
        </p>
      </div>

      {/* Share Link */}
      <div className="px-5 mt-4 mb-5">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-burnt" />
            <span className="text-sm font-medium text-armadillo-text">Live Analytics Link</span>
          </div>
          <p className="text-[11px] text-armadillo-muted mb-3">
            Share a live link that always shows your latest metrics. Perfect for brand pitches and media kits.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2 text-xs text-armadillo-muted truncate">
              armadilloanalytics.app/p/texasarmadillo
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-burnt hover:bg-burnt-light text-white p-2 rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="px-5 mb-5">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Export Formats</h3>
        <div className="space-y-2">
          {[
            { icon: FileText, label: 'PDF Media Kit', desc: 'Professional branded PDF with metrics, audience data, and trend insights', available: !isFree, action: undefined },
            { icon: Presentation, label: 'Pitch Deck', desc: 'Slide-ready presentation for brand meetings and sponsorship pitches', available: isPro, action: undefined },
            { icon: Image, label: 'Social Cards', desc: 'Instagram-ready graphics showing your analytics for Stories and posts', available: !isFree, action: undefined },
            { icon: Download, label: 'CSV Data Export', desc: 'Raw data download including trend data for spreadsheets and custom analysis', available: isPro, action: isPro && hasTrendData ? handleCSVExport : undefined, needsData: isPro && !hasTrendData },
          ].map((option) => {
            const Icon = option.icon;
            const isDisabledByData = 'needsData' in option && option.needsData;
            return (
              <button
                key={option.label}
                onClick={option.action}
                disabled={isDisabledByData}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                  option.available && !isDisabledByData
                    ? 'bg-armadillo-card border-armadillo-border hover:border-burnt/40'
                    : 'bg-armadillo-card border-armadillo-border opacity-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-burnt/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-burnt" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-armadillo-text flex items-center gap-1.5">
                    {option.label}
                    {!option.available && <Lock size={10} className="text-armadillo-muted" />}
                    {option.label === 'CSV Data Export' && csvDownloaded && (
                      <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check size={8} /> Downloaded
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-armadillo-muted mt-0.5">{option.desc}</div>
                  {isDisabledByData && (
                    <div className="text-[10px] text-burnt mt-1">Fetch your analytics first</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trend Data in Export */}
      {!isFree && (
        <div className="px-5 mb-5">
          <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Trend Data for Export</h3>
          <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-burnt" />
                <span className="text-xs font-medium text-armadillo-text">
                  {hasTrendData ? 'Trend data ready for export' : 'No trend data loaded'}
                </span>
              </div>
              <button
                onClick={fetchAllTrends}
                disabled={trendLoading}
                className="flex items-center gap-1.5 bg-burnt hover:bg-burnt-light disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors shrink-0"
              >
                {trendLoading ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
                {trendLoading ? 'Fetching...' : trendsFetched ? 'Refresh' : 'Fetch Trends'}
              </button>
            </div>
            {trendError && (
              <div className="flex items-center gap-1.5 text-[10px] text-danger mb-2">
                <AlertCircle size={10} /> {trendError}
              </div>
            )}
            <div className="space-y-1.5">
              {[
                { label: 'Instagram hashtag stats & trending posts', available: true, hasData: hashtagStats.length > 0 || hashtagPosts.length > 0 },
                { label: 'Reddit trending topics', available: isPro, hasData: redditTrends.length > 0 },
                { label: 'TikTok product trends & scores', available: isPro, hasData: tiktokTrends.length > 0 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-[11px]">
                  {!item.available ? (
                    <Lock size={10} className="text-armadillo-muted shrink-0" />
                  ) : item.hasData ? (
                    <Check size={10} className="text-success shrink-0" />
                  ) : (
                    <AlertCircle size={10} className="text-armadillo-muted shrink-0" />
                  )}
                  <span className={item.available ? 'text-armadillo-text' : 'text-armadillo-muted'}>{item.label}</span>
                  {!item.available && <span className="text-[8px] bg-armadillo-border text-armadillo-muted px-1.5 py-0.5 rounded-full uppercase font-bold">Pro</span>}
                  {item.available && item.hasData && <span className="text-[8px] bg-success/20 text-success px-1.5 py-0.5 rounded-full">Loaded</span>}
                </div>
              ))}
            </div>
            {!hasTrendData && !trendLoading && (
              <p className="text-[10px] text-armadillo-muted mt-2">
                Tap &ldquo;Fetch Trends&rdquo; to load live data, then export as CSV.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Share */}
      <div className="px-5 mb-5">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Quick Share</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Mail, label: 'Email', color: '#BF5700' },
            { icon: Share2, label: 'Share', color: '#8B8D97' },
            { icon: QrCode, label: 'QR Code', color: '#8B8D97' },
            { icon: Link2, label: 'Copy Link', color: '#8B8D97' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="flex flex-col items-center gap-2 p-3 bg-armadillo-card border border-armadillo-border rounded-2xl">
                <Icon size={20} style={{ color: item.color }} />
                <span className="text-[9px] text-armadillo-muted font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* For Influencers: Brand Pitch Templates */}
      {isInfluencer && (
        <div className="px-5 mb-5">
          <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2.5">Brand Pitch Templates</h3>
          <div className="space-y-2">
            {[
              { name: 'Sponsorship Pitch', desc: 'Professional template for reaching out to brands with your stats', emoji: '🤝' },
              { name: 'Rate Card', desc: 'Pricing sheet based on your engagement metrics', emoji: '💰' },
              { name: 'Campaign Report', desc: 'Post-campaign results summary for brand partners', emoji: '📊' },
            ].map((template) => (
              <button
                key={template.name}
                className="w-full flex items-center gap-3 p-3.5 bg-armadillo-card border border-armadillo-border rounded-2xl text-left hover:border-burnt/40 transition-colors"
              >
                <span className="text-lg shrink-0">{template.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-armadillo-text">{template.name}</div>
                  <div className="text-[10px] text-armadillo-muted">{template.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="px-5 mb-6">
          <div className="bg-burnt/10 border border-burnt/30 rounded-2xl p-5 text-center">
            <div className="text-base mb-2">🔓</div>
            <div className="text-sm font-medium text-armadillo-text mb-1">
              {isFree ? 'Unlock Export Features' : 'Unlock Pro Exports'}
            </div>
            <p className="text-[11px] text-armadillo-muted mb-3">
              {isFree
                ? 'Upgrade to Lite ($4.99/mo) for PDF media kits, social cards, and more.'
                : 'Get pitch decks, CSV exports, and AI-powered insights with Pro ($19.99/mo).'}
            </p>
            <button className="bg-burnt hover:bg-burnt-light text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">
              {isFree ? 'Upgrade to Lite — $4.99/mo' : 'Upgrade to Pro — $19.99/mo'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
