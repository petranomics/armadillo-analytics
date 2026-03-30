import type { UserType } from './user-types';
import { USER_TYPES } from './user-types';

// ============ DATA MODEL ============

export interface MediaKitOffering {
  id: string;
  name: string;
  price: string;
  description?: string;
}

export interface MediaKitStats {
  followers: number;
  engagementRate: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  avgViewsPerPost: number;
  totalPosts: number;
  postingFreq: string;
  totalShares: number;
  avgEngPerPost: number;
  likesPerComment: number; // likes-to-comments ratio — shows audience type
  engPer1KFollowers: number;
  viewsToEngPct: number;
  avgCommentsPerPost: number;
  shareRate: number;
}

export interface MediaKitData {
  userType: UserType;

  // Contact
  displayName: string;
  email: string;
  phone: string;
  city: string;
  industryValue: string;

  // Content
  tagline: string;
  bio: string;
  contentTopics: string[];
  brandCollaborations: string[];

  // Photos
  headerPhotoUrl: string;
  galleryPhotoUrls: string[];
  uploadedPhotos: string[]; // data URLs from file uploads

  // Stats
  stats: MediaKitStats;
  selectedStatKeys: (keyof MediaKitStats)[]; // user-chosen metrics for one-sheet

  // Offerings
  offerings: MediaKitOffering[];

  // Social links
  socialLinks: { platform: string; url: string; handle: string }[];

  // Audience demographics
  audienceDemographics: {
    topAge: string;
    topGender: string;
    topLocation: string;
  };

  // Computed insights (auto-derived from post data)
  contentMix?: { type: string; pct: number }[];
  bestPostingDay?: { day: string; avgEngagement: number };
  contentTypePerformance?: { type: string; avgEng: number; postCount: number }[];
  viralityScore?: number;             // avg views / followers — how far content reaches beyond followers
  engagementTrend?: number;           // % change comparing recent half vs older half of posts
  topHashtags?: { tag: string; avgEng: number; count: number }[];
  collabLift?: { withCollabs: number; without: number }; // avg engagement with vs without tagged users

  // Growth callout
  growthCallout: string;

  // Accent color override
  accentColorOverride: string;

  // Layout override
  layoutOverride: OneSheetLayout | '';

  // Cover photo for top of one-sheet
  coverPhotoUrl: string;

  // Call to action
  callToAction: string;

  // Meta
  username: string;
  platform: string;
  lastUpdated: string;
}

// ============ INDUSTRY FIELD MAPPING ============

export const INDUSTRY_FIELD_MAP: Record<UserType, { fieldId: string; label: string }> = {
  'influencer':       { fieldId: 'niche',            label: 'Niche' },
  'linkedin-creator': { fieldId: 'industry',         label: 'Industry' },
  'tiktok-shop':      { fieldId: 'product_category', label: 'Product Category' },
  'youtuber':         { fieldId: 'channel_type',     label: 'Content Type' },
  'local-business':   { fieldId: 'business_type',    label: 'Business Type' },
  'media-outlet':     { fieldId: 'outlet_type',      label: 'Outlet Type' },
};

export function getIndustryOptions(userType: UserType): { value: string; label: string }[] {
  const config = USER_TYPES.find(u => u.id === userType);
  const mapping = INDUSTRY_FIELD_MAP[userType];
  if (!config || !mapping) return [{ value: 'n/a', label: 'N/A' }];
  const field = config.quickFormFields.find(f => f.id === mapping.fieldId);
  const baseOptions = field?.options || [];
  return [{ value: 'n/a', label: "N/A (don't show)" }, ...baseOptions];
}

export function getIndustryLabel(value: string, userType: UserType): string {
  if (!value || value === 'n/a') return '';
  const options = getIndustryOptions(userType);
  const match = options.find(o => o.value === value);
  return match?.label || value;
}

// ============ DEFAULT OFFERINGS ============

export const DEFAULT_OFFERINGS: Record<UserType, MediaKitOffering[]> = {
  'influencer': [
    { id: '1', name: 'Sponsored Instagram Post', price: '', description: 'In-feed photo or carousel' },
    { id: '2', name: 'Sponsored Reel', price: '', description: '15-60s video' },
    { id: '3', name: 'Instagram Story Package', price: '', description: '3 slides with link sticker' },
    { id: '4', name: 'UGC Package', price: '', description: 'Content for brand use' },
  ],
  'linkedin-creator': [
    { id: '1', name: 'Sponsored LinkedIn Post', price: '', description: 'Thought leadership feature' },
    { id: '2', name: 'Speaking Engagement', price: '', description: 'Keynote or panel' },
    { id: '3', name: 'Consulting Session (1 hr)', price: '', description: 'Strategy and advisory' },
    { id: '4', name: 'Newsletter Mention', price: '', description: 'Feature in newsletter' },
  ],
  'tiktok-shop': [
    { id: '1', name: 'Product Review Video', price: '', description: 'Dedicated TikTok video' },
    { id: '2', name: 'Affiliate Partnership', price: '', description: 'Commission-based' },
    { id: '3', name: 'Product Showcase Bundle', price: '', description: '3 videos + link' },
    { id: '4', name: 'Live Shopping Feature', price: '', description: 'Product in livestream' },
  ],
  'youtuber': [
    { id: '1', name: 'Dedicated Video', price: '', description: 'Full video about product' },
    { id: '2', name: 'Integrated Sponsorship (60s)', price: '', description: 'Mid-roll or intro' },
    { id: '3', name: 'Shorts Mention', price: '', description: 'YouTube Short feature' },
    { id: '4', name: 'Product Placement', price: '', description: 'Organic integration' },
  ],
  'local-business': [
    { id: '1', name: 'Event Hosting / Venue Rental', price: '' },
    { id: '2', name: 'Catering Package', price: '' },
    { id: '3', name: 'Cross-Promotion Partnership', price: '' },
    { id: '4', name: 'Pop-Up / Collab Event', price: '' },
  ],
  'media-outlet': [
    { id: '1', name: 'Display Ad (Banner)', price: '', description: 'CPM-based' },
    { id: '2', name: 'Sponsored Article', price: '' },
    { id: '3', name: 'Newsletter Sponsorship', price: '' },
    { id: '4', name: 'Podcast Ad Read (60s)', price: '' },
  ],
};

// ============ USER-TYPE ONE-SHEET CONFIG ============

export type OneSheetLayout = 'visual' | 'professional' | 'video' | 'community';

export interface OneSheetConfig {
  accentColor: string;
  layout: OneSheetLayout;
  statKeys: { key: keyof MediaKitStats; label: string }[];
  offeringsLabel: string;
  showCollaborations: boolean;
  industryLabel: string;
}

export const ONE_SHEET_CONFIG: Record<UserType, OneSheetConfig> = {
  'influencer': {
    accentColor: '#BF5700',
    layout: 'visual',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Likes' },
      { key: 'avgViewsPerPost', label: 'Avg Views/Post' },
      { key: 'totalComments', label: 'Comments' },
      { key: 'avgEngPerPost', label: 'Avg Eng/Post' },
      { key: 'totalPosts', label: 'Total Posts' },
      { key: 'postingFreq', label: 'Posting Freq' },
    ],
    offeringsLabel: 'Sponsorship Packages',
    showCollaborations: true,
    industryLabel: 'Niche',
  },
  'linkedin-creator': {
    accentColor: '#0A66C2',
    layout: 'professional',
    statKeys: [
      { key: 'followers', label: 'Connections' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Reactions' },
      { key: 'totalComments', label: 'Comments' },
      { key: 'avgEngPerPost', label: 'Avg Eng/Post' },
      { key: 'totalPosts', label: 'Posts' },
      { key: 'postingFreq', label: 'Posting Freq' },
      { key: 'likesPerComment', label: 'Like:Comment' },
    ],
    offeringsLabel: 'Services & Speaking',
    showCollaborations: false,
    industryLabel: 'Industry',
  },
  'tiktok-shop': {
    accentColor: '#00C9B7',
    layout: 'visual',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'avgViewsPerPost', label: 'Avg Views' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalViews', label: 'Total Views' },
      { key: 'totalLikes', label: 'Total Likes' },
      { key: 'avgEngPerPost', label: 'Avg Eng/Post' },
      { key: 'totalShares', label: 'Total Shares' },
      { key: 'postingFreq', label: 'Posting Freq' },
    ],
    offeringsLabel: 'Partnership Opportunities',
    showCollaborations: false,
    industryLabel: 'Product Category',
  },
  'youtuber': {
    accentColor: '#FF0000',
    layout: 'video',
    statKeys: [
      { key: 'followers', label: 'Subscribers' },
      { key: 'avgViewsPerPost', label: 'Avg Views' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalViews', label: 'Total Views' },
      { key: 'totalLikes', label: 'Total Likes' },
      { key: 'totalComments', label: 'Comments' },
      { key: 'totalPosts', label: 'Videos' },
      { key: 'avgEngPerPost', label: 'Avg Eng/Video' },
    ],
    offeringsLabel: 'Sponsorship Packages',
    showCollaborations: true,
    industryLabel: 'Content Type',
  },
  'local-business': {
    accentColor: '#22C55E',
    layout: 'community',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Likes' },
      { key: 'avgEngPerPost', label: 'Avg Eng/Post' },
      { key: 'totalPosts', label: 'Posts' },
      { key: 'postingFreq', label: 'Post Frequency' },
    ],
    offeringsLabel: 'Partnership Opportunities',
    showCollaborations: false,
    industryLabel: 'Business Type',
  },
  'media-outlet': {
    accentColor: '#A855F7',
    layout: 'professional',
    statKeys: [
      { key: 'followers', label: 'Total Reach' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Engagement' },
      { key: 'totalPosts', label: 'Published' },
    ],
    offeringsLabel: 'Advertising Rates',
    showCollaborations: false,
    industryLabel: 'Outlet Type',
  },
};

// ============ LOCALSTORAGE ============

const MEDIA_KIT_KEY = 'armadillo-media-kit';

const DEFAULT_MEDIA_KIT: MediaKitData = {
  userType: 'influencer',
  displayName: '',
  email: '',
  phone: '',
  city: '',
  industryValue: '',
  tagline: '',
  bio: '',
  contentTopics: [],
  brandCollaborations: [],
  headerPhotoUrl: '',
  galleryPhotoUrls: [],
  uploadedPhotos: [],
  stats: {
    followers: 0,
    engagementRate: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    avgViewsPerPost: 0,
    totalPosts: 0,
    postingFreq: '',
    totalShares: 0,
    avgEngPerPost: 0,
    likesPerComment: 0,
    engPer1KFollowers: 0,
    viewsToEngPct: 0,
    avgCommentsPerPost: 0,
    shareRate: 0,
  },
  selectedStatKeys: [],
  offerings: [],
  socialLinks: [],
  audienceDemographics: { topAge: '', topGender: '', topLocation: '' },
  growthCallout: '',
  accentColorOverride: '',
  layoutOverride: '',
  coverPhotoUrl: '',
  callToAction: '',
  username: '',
  platform: 'instagram',
  lastUpdated: new Date().toISOString(),
};

export function getMediaKit(): MediaKitData {
  if (typeof window === 'undefined') return DEFAULT_MEDIA_KIT;
  try {
    const stored = localStorage.getItem(MEDIA_KIT_KEY);
    if (!stored) return DEFAULT_MEDIA_KIT;
    return { ...DEFAULT_MEDIA_KIT, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_MEDIA_KIT;
  }
}

export function saveMediaKit(data: MediaKitData): void {
  if (typeof window === 'undefined') return;
  data.lastUpdated = new Date().toISOString();
  localStorage.setItem(MEDIA_KIT_KEY, JSON.stringify(data));
}

// ============ POPULATE FROM EXPORT DATA ============

interface ExportPostShape {
  thumbnailUrl?: string;
  type?: string;
  contentType?: string;
  productType?: string;
  publishedAt?: string;
  engagementRate?: number;
  hashtags?: string[];
  mentions?: string[];
  taggedUsers?: { username: string }[];
  metrics?: {
    likes?: number;
    comments?: number;
    views?: number;
    shares?: number;
    saves?: number;
  };
  // Flat field alternatives from scrapers
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
}

interface ExportDataShape {
  profile: {
    username: string;
    displayName: string;
    platform: string;
    followers: number;
    totalPosts: number;
    bio?: string;
    avatarUrlHD?: string;
    verified?: boolean;
    isBusinessAccount?: boolean;
    businessCategory?: string;
    externalUrl?: string;
  };
  posts: ExportPostShape[];
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

// ============ INSIGHT COMPUTATION HELPERS ============

function getLikes(p: ExportPostShape): number {
  return p.metrics?.likes ?? p.likesCount ?? 0;
}
function getComments(p: ExportPostShape): number {
  return p.metrics?.comments ?? p.commentsCount ?? 0;
}
function getViews(p: ExportPostShape): number {
  return p.metrics?.views ?? p.videoViewCount ?? 0;
}
function getEng(p: ExportPostShape): number {
  return getLikes(p) + getComments(p) + (p.metrics?.shares ?? 0);
}
function normalizeType(p: ExportPostShape): string {
  const raw = (p.type || p.contentType || p.productType || 'Post').toLowerCase();
  if (raw.includes('video') || raw.includes('reel') || raw === 'clip') return 'Reels / Video';
  if (raw.includes('carousel') || raw.includes('sidecar')) return 'Carousels';
  if (raw.includes('image') || raw.includes('photo')) return 'Photos';
  return 'Posts';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function computeContentMix(posts: ExportPostShape[]): { type: string; pct: number }[] {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const label = normalizeType(p);
    counts[label] = (counts[label] || 0) + 1;
  }
  const total = posts.length || 1;
  return Object.entries(counts)
    .map(([type, count]) => ({ type, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

function computeBestPostingDay(posts: ExportPostShape[]): { day: string; avgEngagement: number } | undefined {
  const byDay: Record<number, { total: number; count: number }> = {};
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const dow = new Date(p.publishedAt).getDay();
    if (!byDay[dow]) byDay[dow] = { total: 0, count: 0 };
    byDay[dow].total += getEng(p);
    byDay[dow].count += 1;
  }
  let best: { day: string; avgEngagement: number } | undefined;
  for (const [dow, { total, count }] of Object.entries(byDay)) {
    const avg = Math.round(total / count);
    if (!best || avg > best.avgEngagement) {
      best = { day: DAY_NAMES[Number(dow)], avgEngagement: avg };
    }
  }
  return best;
}

function computeContentTypePerformance(posts: ExportPostShape[]): { type: string; avgEng: number; postCount: number }[] {
  const byType: Record<string, { total: number; count: number }> = {};
  for (const p of posts) {
    const t = normalizeType(p);
    if (!byType[t]) byType[t] = { total: 0, count: 0 };
    byType[t].total += getEng(p);
    byType[t].count += 1;
  }
  return Object.entries(byType)
    .map(([type, { total, count }]) => ({ type, avgEng: Math.round(total / count), postCount: count }))
    .sort((a, b) => b.avgEng - a.avgEng);
}

function computeViralityScore(posts: ExportPostShape[], followers: number): number | undefined {
  if (!followers) return undefined;
  const totalViews = posts.reduce((s, p) => s + getViews(p), 0);
  if (totalViews === 0) return undefined;
  const avgViews = totalViews / posts.length;
  return Math.round((avgViews / followers) * 1000) / 10; // e.g. 1.5x = 150%
}

function computeEngagementTrend(posts: ExportPostShape[]): number | undefined {
  if (posts.length < 4) return undefined;
  // Sort by date ascending
  const sorted = [...posts]
    .filter(p => p.publishedAt)
    .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime());
  if (sorted.length < 4) return undefined;
  const mid = Math.floor(sorted.length / 2);
  const olderAvg = sorted.slice(0, mid).reduce((s, p) => s + getEng(p), 0) / mid;
  const newerAvg = sorted.slice(mid).reduce((s, p) => s + getEng(p), 0) / (sorted.length - mid);
  if (olderAvg === 0) return undefined;
  return Math.round(((newerAvg - olderAvg) / olderAvg) * 100);
}

function computeTopHashtags(posts: ExportPostShape[]): { tag: string; avgEng: number; count: number }[] {
  const map: Record<string, { total: number; count: number }> = {};
  for (const p of posts) {
    const eng = getEng(p);
    for (const raw of p.hashtags ?? []) {
      const tag = raw.toLowerCase().replace(/^#/, '');
      if (!tag) continue;
      if (!map[tag]) map[tag] = { total: 0, count: 0 };
      map[tag].total += eng;
      map[tag].count += 1;
    }
  }
  return Object.entries(map)
    .filter(([, v]) => v.count >= 2) // at least 2 uses
    .map(([tag, { total, count }]) => ({ tag: `#${tag}`, avgEng: Math.round(total / count), count }))
    .sort((a, b) => b.avgEng - a.avgEng)
    .slice(0, 5);
}

function pickBestGalleryPhotos(posts: ExportPostShape[], maxCount: number): string[] {
  const seen = new Set<string>();
  return [...posts]
    .filter(p => !!p.thumbnailUrl)
    .sort((a, b) => getEng(b) - getEng(a))
    .reduce<string[]>((acc, p) => {
      if (acc.length >= maxCount) return acc;
      const url = p.thumbnailUrl!;
      if (!seen.has(url)) {
        seen.add(url);
        acc.push(url);
      }
      return acc;
    }, []);
}

function computeCollabLift(posts: ExportPostShape[]): { withCollabs: number; without: number } | undefined {
  const with_: number[] = [];
  const without_: number[] = [];
  for (const p of posts) {
    const hasCollabs = (p.taggedUsers?.length ?? 0) > 0 || (p.mentions?.length ?? 0) > 0;
    (hasCollabs ? with_ : without_).push(getEng(p));
  }
  if (with_.length < 2 || without_.length < 2) return undefined;
  return {
    withCollabs: Math.round(with_.reduce((a, b) => a + b, 0) / with_.length),
    without: Math.round(without_.reduce((a, b) => a + b, 0) / without_.length),
  };
}

export function populateFromExportData(
  existing: MediaKitData,
  exportData: ExportDataShape,
  userType: UserType,
): MediaKitData {
  const { profile, computedMetrics, posts } = exportData;

  // Auto-derive tagline from bio if bio is short enough and tagline is empty
  const scrapedBio = profile.bio || '';
  let autoTagline = existing.tagline;
  let autoBio = existing.bio;
  if (!existing.tagline && !existing.bio && scrapedBio) {
    if (scrapedBio.length <= 80) {
      // Short bio works as a tagline
      autoTagline = scrapedBio;
    } else {
      // Longer bio goes in the bio field
      autoBio = scrapedBio;
    }
  } else if (!existing.bio && scrapedBio) {
    autoBio = scrapedBio;
  }

  const totalEng = computedMetrics.totalLikes + computedMetrics.totalComments + computedMetrics.totalShares;

  return {
    ...existing,
    userType,
    username: existing.username || profile.username,
    platform: profile.platform,
    displayName: existing.displayName || profile.displayName,
    tagline: autoTagline,
    bio: autoBio,
    headerPhotoUrl: existing.headerPhotoUrl || profile.avatarUrlHD || '',
    galleryPhotoUrls: existing.galleryPhotoUrls.length > 0
      ? existing.galleryPhotoUrls
      : pickBestGalleryPhotos(posts, 3),
    stats: {
      followers: profile.followers,
      engagementRate: computedMetrics.avgEngagementRate,
      totalLikes: computedMetrics.totalLikes,
      totalComments: computedMetrics.totalComments,
      totalViews: computedMetrics.totalViews,
      avgViewsPerPost: computedMetrics.avgViewsPerPost,
      totalPosts: profile.totalPosts,
      postingFreq: computedMetrics.postingFreq,
      totalShares: computedMetrics.totalShares,
      avgEngPerPost: posts.length > 0
        ? Math.round(totalEng / posts.length)
        : 0,
      likesPerComment: computedMetrics.totalComments > 0
        ? Math.round((computedMetrics.totalLikes / computedMetrics.totalComments) * 10) / 10
        : 0,
      engPer1KFollowers: profile.followers > 0
        ? Math.round((totalEng / profile.followers) * 1000 * 10) / 10
        : 0,
      viewsToEngPct: computedMetrics.totalViews > 0
        ? Math.round((totalEng / computedMetrics.totalViews) * 100 * 10) / 10
        : 0,
      avgCommentsPerPost: posts.length > 0
        ? Math.round(computedMetrics.totalComments / posts.length)
        : 0,
      shareRate: totalEng > 0
        ? Math.round((computedMetrics.totalShares / totalEng) * 100 * 10) / 10
        : 0,
    },
    // Auto-computed insights from post data
    contentMix: existing.contentMix?.length ? existing.contentMix : computeContentMix(posts),
    bestPostingDay: computeBestPostingDay(posts),
    contentTypePerformance: computeContentTypePerformance(posts),
    viralityScore: computeViralityScore(posts, profile.followers),
    engagementTrend: computeEngagementTrend(posts),
    topHashtags: computeTopHashtags(posts),
    collabLift: computeCollabLift(posts),
    // Auto-fill content topics from top hashtags if none set
    contentTopics: existing.contentTopics.length > 0
      ? existing.contentTopics
      : computeTopHashtags(posts).slice(0, 5).map(h => h.tag),
    offerings: existing.offerings.length > 0 ? existing.offerings : DEFAULT_OFFERINGS[userType],
  };
}

// All possible stats a user can toggle on/off for their one-sheet
export const ALL_STAT_OPTIONS: { key: keyof MediaKitStats; label: string }[] = [
  { key: 'followers', label: 'Followers' },
  { key: 'engagementRate', label: 'Engagement Rate' },
  { key: 'totalLikes', label: 'Total Likes' },
  { key: 'totalComments', label: 'Total Comments' },
  { key: 'totalViews', label: 'Total Views' },
  { key: 'avgViewsPerPost', label: 'Avg Views / Post' },
  { key: 'totalPosts', label: 'Total Posts' },
  { key: 'postingFreq', label: 'Posting Frequency' },
  { key: 'totalShares', label: 'Total Shares' },
  { key: 'avgEngPerPost', label: 'Avg Eng / Post' },
  { key: 'likesPerComment', label: 'Like:Comment Ratio' },
  { key: 'engPer1KFollowers', label: 'Eng / 1K Followers' },
  { key: 'viewsToEngPct', label: 'View\u2192Eng Rate' },
  { key: 'avgCommentsPerPost', label: 'Avg Comments / Post' },
  { key: 'shareRate', label: 'Share Rate' },
];

export const SOCIAL_PLATFORM_OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { id: 'tiktok', label: 'TikTok', icon: 'Music2' },
  { id: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { id: 'twitter', label: 'X / Twitter', icon: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { id: 'website', label: 'Website', icon: 'Globe' },
] as const;

export const LAYOUT_OPTIONS: { value: OneSheetLayout; label: string; description: string }[] = [
  { value: 'visual', label: 'Visual', description: 'Photo-forward \u2014 Instagram & TikTok' },
  { value: 'professional', label: 'Professional', description: 'Clean two-column \u2014 LinkedIn & media' },
  { value: 'video', label: 'Video', description: 'Dark theme \u2014 YouTube' },
  { value: 'community', label: 'Community', description: 'Warm local feel \u2014 businesses' },
];

export function formatStatValue(key: keyof MediaKitStats, value: string | number): string {
  if (key === 'engagementRate') return `${value}%`;
  if (key === 'viewsToEngPct') return `${value}%`;
  if (key === 'shareRate') return `${value}%`;
  if (key === 'postingFreq') return String(value) || '--';
  if (key === 'likesPerComment') return `${value}:1`;
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
