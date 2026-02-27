'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import type { PlatformProfile, Post } from '@/lib/types';
import { Download, Check, FileSpreadsheet, Users, Heart, MessageCircle, Eye, TrendingUp, BarChart3, ArrowLeft, AlertCircle } from 'lucide-react';

interface ExportData {
  profile: PlatformProfile;
  posts: Post[];
  summary: {
    totalEngagement: number;
    avgEngagementRate: number;
    topPost: Post;
    totalViews?: number;
  };
  computedMetrics: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    avgViewsPerPost: number;
    postingFreq: string;
    avgEngagementRate: number;
  };
  exportedAt: string;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
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

function generatePostsCSV(data: ExportData): string {
  const { profile, posts } = data;
  const lines: string[] = [];

  // Profile header section
  lines.push('PROFILE SUMMARY');
  lines.push(`Account,@${profile.username}`);
  lines.push(`Display Name,${escapeCSV(profile.displayName)}`);
  lines.push(`Platform,${profile.platform}`);
  lines.push(`Followers,${profile.followers}`);
  if (profile.following) lines.push(`Following,${profile.following}`);
  lines.push(`Total Posts,${profile.totalPosts}`);
  if (profile.verified) lines.push(`Verified,Yes`);
  if (profile.isBusinessAccount) lines.push(`Business Account,Yes`);
  if (profile.businessCategory) lines.push(`Business Category,${escapeCSV(profile.businessCategory)}`);
  if (profile.externalUrl) lines.push(`Website,${profile.externalUrl}`);
  if (profile.bio) lines.push(`Bio,${escapeCSV(profile.bio)}`);
  lines.push('');

  // Aggregate metrics
  lines.push('KEY METRICS');
  lines.push(`Engagement Rate,${data.computedMetrics.avgEngagementRate}%`);
  lines.push(`Total Likes,${data.computedMetrics.totalLikes}`);
  lines.push(`Total Comments,${data.computedMetrics.totalComments}`);
  if (data.computedMetrics.totalViews > 0) lines.push(`Total Views,${data.computedMetrics.totalViews}`);
  if (data.computedMetrics.avgViewsPerPost > 0) lines.push(`Avg Views/Post,${data.computedMetrics.avgViewsPerPost}`);
  if (data.computedMetrics.postingFreq) lines.push(`Posting Frequency,${data.computedMetrics.postingFreq}`);
  lines.push('');

  // Post-level data
  lines.push('POST DATA');
  const headers = ['Date', 'Caption', 'Content Type', 'Likes', 'Comments', 'Views', 'Engagement Rate', 'Hashtags', 'Mentions', 'Location', 'Tagged Users', 'Audio', 'URL'];
  lines.push(headers.join(','));

  for (const post of posts) {
    const date = new Date(post.publishedAt).toISOString().slice(0, 10);
    const row = [
      date,
      escapeCSV(post.caption || ''),
      post.contentType || post.productType || '',
      String(post.metrics.likes),
      String(post.metrics.comments),
      String(post.metrics.views || ''),
      `${post.engagementRate}%`,
      escapeCSV((post.hashtags || []).map(h => `#${h}`).join(' ')),
      escapeCSV((post.mentions || []).map(m => `@${m}`).join(' ')),
      escapeCSV(post.locationName || ''),
      escapeCSV((post.taggedUsers || []).map(u => `@${u.username}`).join(' ')),
      escapeCSV(post.musicInfo ? (post.musicInfo.uses_original_audio ? 'Original Audio' : `${post.musicInfo.song_name} - ${post.musicInfo.artist_name}`) : ''),
      post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : post.url,
    ];
    lines.push(row.join(','));
  }

  // Hashtag summary
  const hashtagCounts: Record<string, { count: number; totalEng: number }> = {};
  for (const post of posts) {
    const eng = post.metrics.likes + post.metrics.comments;
    for (const tag of post.hashtags || []) {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      if (!normalized) continue;
      if (!hashtagCounts[normalized]) hashtagCounts[normalized] = { count: 0, totalEng: 0 };
      hashtagCounts[normalized].count += 1;
      hashtagCounts[normalized].totalEng += eng;
    }
  }
  const topHashtags = Object.entries(hashtagCounts)
    .map(([tag, { count, totalEng }]) => ({ tag, count, avgEng: Math.round(totalEng / count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  if (topHashtags.length > 0) {
    lines.push('');
    lines.push('HASHTAG PERFORMANCE');
    lines.push('Hashtag,Post Count,Avg Engagement');
    for (const h of topHashtags) {
      lines.push(`#${h.tag},${h.count},${h.avgEng}`);
    }
  }

  // Collaboration summary
  const collabMap: Record<string, { postCount: number; totalEng: number; verified: boolean }> = {};
  for (const post of posts) {
    if (!post.taggedUsers?.length) continue;
    const eng = post.metrics.likes + post.metrics.comments;
    for (const user of post.taggedUsers) {
      if (!user.username) continue;
      const key = user.username.toLowerCase();
      if (!collabMap[key]) collabMap[key] = { postCount: 0, totalEng: 0, verified: false };
      collabMap[key].postCount += 1;
      collabMap[key].totalEng += eng;
      if (user.is_verified) collabMap[key].verified = true;
    }
  }
  const topCollabs = Object.entries(collabMap)
    .map(([username, data]) => ({ username, ...data, avgEng: Math.round(data.totalEng / data.postCount) }))
    .sort((a, b) => b.totalEng - a.totalEng)
    .slice(0, 15);

  if (topCollabs.length > 0) {
    lines.push('');
    lines.push('COLLABORATIONS');
    lines.push('Username,Verified,Post Count,Avg Engagement');
    for (const c of topCollabs) {
      lines.push(`@${c.username},${c.verified ? 'Yes' : 'No'},${c.postCount},${c.avgEng}`);
    }
  }

  lines.push('');
  lines.push(`Report generated by Armadillo Analytics on ${new Date().toISOString().slice(0, 10)}`);

  return lines.join('\n');
}

export default function ExportPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) { router.push('/onboarding'); return; }
    setUserProfile(p);

    // Load exported analytics data
    try {
      const raw = localStorage.getItem('armadillo-export-data');
      if (raw) setExportData(JSON.parse(raw));
    } catch { /* ignore */ }

    setLoaded(true);
  }, [router]);

  if (!loaded || !userProfile) return null;

  const handleCSVExport = () => {
    if (!exportData) return;
    const csv = generatePostsCSV(exportData);
    const username = exportData.profile.username || 'analytics';
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`armadillo-${username}-${date}.csv`, csv);
    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  };

  // No data state
  if (!exportData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-armadillo-text">Export & Share</h1>
          <p className="text-sm text-armadillo-muted mt-1">Export your analytics for brand pitches and reports</p>
        </div>
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-8 text-center">
          <AlertCircle size={32} className="text-armadillo-muted mx-auto mb-3" />
          <h2 className="text-base font-medium text-armadillo-text mb-2">No Analytics Data to Export</h2>
          <p className="text-sm text-armadillo-muted mb-4 max-w-md mx-auto">
            Visit your Instagram page and fetch live data first. Then use the &ldquo;Export Report&rdquo; button to bring your analytics here.
          </p>
          <button
            onClick={() => router.push('/instagram')}
            className="inline-flex items-center gap-2 bg-burnt hover:bg-burnt-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            Go to Instagram
          </button>
        </div>
      </div>
    );
  }

  const { profile, posts, computedMetrics } = exportData;
  const exportAge = Math.round((Date.now() - new Date(exportData.exportedAt).getTime()) / 60000);
  const ageLabel = exportAge < 1 ? 'Just now' : exportAge < 60 ? `${exportAge}m ago` : `${Math.round(exportAge / 60)}h ago`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-armadillo-text">Export & Share</h1>
          <p className="text-sm text-armadillo-muted mt-1">Download your analytics as a CSV for brand pitches and reports</p>
        </div>
        <button
          onClick={() => router.push('/instagram')}
          className="flex items-center gap-2 text-xs text-armadillo-muted hover:text-armadillo-text transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>

      {/* Data Preview */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile.avatarUrlHD ? (
              <img src={profile.avatarUrlHD} alt="" className="w-10 h-10 rounded-full object-cover border border-armadillo-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-burnt/20 flex items-center justify-center text-sm font-display font-bold text-burnt">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-armadillo-text">{profile.displayName}</span>
                {profile.verified && <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded">Verified</span>}
                {profile.isBusinessAccount && <span className="text-[9px] bg-burnt/10 text-burnt px-1.5 py-0.5 rounded">Business</span>}
              </div>
              <span className="text-xs text-armadillo-muted">@{profile.username}</span>
            </div>
          </div>
          <span className="text-[10px] text-armadillo-muted bg-armadillo-bg px-2.5 py-1 rounded border border-armadillo-border">
            Snapshot: {ageLabel}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-armadillo-bg rounded-lg p-3 text-center">
            <Users size={12} className="text-armadillo-muted mx-auto mb-1" />
            <div className="text-sm font-display text-armadillo-text">{formatNumber(profile.followers)}</div>
            <div className="text-[9px] text-armadillo-muted">Followers</div>
          </div>
          <div className="bg-armadillo-bg rounded-lg p-3 text-center">
            <TrendingUp size={12} className="text-armadillo-muted mx-auto mb-1" />
            <div className="text-sm font-display text-burnt">{computedMetrics.avgEngagementRate}%</div>
            <div className="text-[9px] text-armadillo-muted">Eng. Rate</div>
          </div>
          <div className="bg-armadillo-bg rounded-lg p-3 text-center">
            <Heart size={12} className="text-armadillo-muted mx-auto mb-1" />
            <div className="text-sm font-display text-armadillo-text">{formatNumber(computedMetrics.totalLikes)}</div>
            <div className="text-[9px] text-armadillo-muted">Total Likes</div>
          </div>
          <div className="bg-armadillo-bg rounded-lg p-3 text-center">
            <MessageCircle size={12} className="text-armadillo-muted mx-auto mb-1" />
            <div className="text-sm font-display text-armadillo-text">{formatNumber(computedMetrics.totalComments)}</div>
            <div className="text-[9px] text-armadillo-muted">Total Comments</div>
          </div>
          {computedMetrics.totalViews > 0 && (
            <div className="bg-armadillo-bg rounded-lg p-3 text-center">
              <Eye size={12} className="text-armadillo-muted mx-auto mb-1" />
              <div className="text-sm font-display text-armadillo-text">{formatNumber(computedMetrics.avgViewsPerPost)}</div>
              <div className="text-[9px] text-armadillo-muted">Avg Views/Post</div>
            </div>
          )}
          <div className="bg-armadillo-bg rounded-lg p-3 text-center">
            <BarChart3 size={12} className="text-armadillo-muted mx-auto mb-1" />
            <div className="text-sm font-display text-armadillo-text">{posts.length}</div>
            <div className="text-[9px] text-armadillo-muted">Posts Analyzed</div>
          </div>
        </div>
      </div>

      {/* Export Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleCSVExport}
          className="flex items-center gap-4 p-6 bg-armadillo-card border border-armadillo-border rounded-xl text-left hover:border-burnt/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-burnt/10 flex items-center justify-center shrink-0 group-hover:bg-burnt/20 transition-colors">
            <FileSpreadsheet size={22} className="text-burnt" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-armadillo-text flex items-center gap-2">
              CSV Analytics Export
              {csvDownloaded && (
                <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Check size={8} /> Downloaded
                </span>
              )}
            </div>
            <div className="text-xs text-armadillo-muted mt-0.5">
              Profile summary, all post data, hashtag performance, and collaboration stats
            </div>
          </div>
          <Download size={18} className="text-armadillo-muted group-hover:text-burnt transition-colors shrink-0" />
        </button>

        <button
          onClick={() => {
            // Copy a text summary to clipboard
            const summary = [
              `${profile.displayName} (@${profile.username}) — Instagram Analytics`,
              ``,
              `Followers: ${formatNumber(profile.followers)}`,
              `Engagement Rate: ${computedMetrics.avgEngagementRate}%`,
              `Total Likes: ${formatNumber(computedMetrics.totalLikes)} across ${posts.length} posts`,
              `Total Comments: ${formatNumber(computedMetrics.totalComments)}`,
              computedMetrics.totalViews > 0 ? `Avg Views/Post: ${formatNumber(computedMetrics.avgViewsPerPost)}` : '',
              computedMetrics.postingFreq ? `Posting Frequency: ${computedMetrics.postingFreq}` : '',
              ``,
              `Report by Armadillo Analytics`,
            ].filter(Boolean).join('\n');
            navigator.clipboard.writeText(summary);
          }}
          className="flex items-center gap-4 p-6 bg-armadillo-card border border-armadillo-border rounded-xl text-left hover:border-burnt/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-armadillo-bg flex items-center justify-center shrink-0 group-hover:bg-armadillo-border transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-armadillo-muted"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-armadillo-text">Copy Summary to Clipboard</div>
            <div className="text-xs text-armadillo-muted mt-0.5">
              Quick text summary of key metrics for emails and DMs
            </div>
          </div>
        </button>
      </div>

      {/* CSV Contents Preview */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-4">What&apos;s Included in the Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { section: 'Profile Summary', details: 'Username, display name, followers, following, bio, verified status, business category, website' },
            { section: 'Key Metrics', details: 'Engagement rate, total likes, comments, views, avg views/post, posting frequency' },
            { section: 'Post-Level Data', details: `${posts.length} posts with date, caption, likes, comments, views, engagement rate, hashtags, mentions, location, tagged users, audio info, direct URL` },
            { section: 'Hashtag Performance', details: 'Top hashtags with post count and avg engagement per tag' },
            { section: 'Collaboration Data', details: 'Tagged accounts with verified status, post count, and avg engagement per collaborator' },
          ].map(item => (
            <div key={item.section} className="flex gap-2">
              <Check size={12} className="text-success shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-armadillo-text">{item.section}</div>
                <div className="text-[10px] text-armadillo-muted">{item.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
