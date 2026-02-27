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

  // Stats
  stats: MediaKitStats;

  // Offerings
  offerings: MediaKitOffering[];

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

export interface OneSheetConfig {
  accentColor: string;
  statKeys: { key: keyof MediaKitStats; label: string }[];
  offeringsLabel: string;
  showCollaborations: boolean;
  industryLabel: string;
}

export const ONE_SHEET_CONFIG: Record<UserType, OneSheetConfig> = {
  'influencer': {
    accentColor: '#BF5700',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Likes' },
      { key: 'avgViewsPerPost', label: 'Avg Views/Post' },
    ],
    offeringsLabel: 'Sponsorship Packages',
    showCollaborations: true,
    industryLabel: 'Niche',
  },
  'linkedin-creator': {
    accentColor: '#0A66C2',
    statKeys: [
      { key: 'followers', label: 'Connections' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalLikes', label: 'Total Reactions' },
      { key: 'totalComments', label: 'Total Comments' },
    ],
    offeringsLabel: 'Services & Speaking',
    showCollaborations: false,
    industryLabel: 'Industry',
  },
  'tiktok-shop': {
    accentColor: '#00C9B7',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'avgViewsPerPost', label: 'Avg Views' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalViews', label: 'Total Views' },
    ],
    offeringsLabel: 'Partnership Opportunities',
    showCollaborations: false,
    industryLabel: 'Product Category',
  },
  'youtuber': {
    accentColor: '#FF0000',
    statKeys: [
      { key: 'followers', label: 'Subscribers' },
      { key: 'avgViewsPerPost', label: 'Avg Views' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalPosts', label: 'Videos' },
    ],
    offeringsLabel: 'Sponsorship Packages',
    showCollaborations: true,
    industryLabel: 'Content Type',
  },
  'local-business': {
    accentColor: '#22C55E',
    statKeys: [
      { key: 'followers', label: 'Followers' },
      { key: 'engagementRate', label: 'Eng. Rate' },
      { key: 'totalPosts', label: 'Posts' },
      { key: 'postingFreq', label: 'Post Frequency' },
    ],
    offeringsLabel: 'Partnership Opportunities',
    showCollaborations: false,
    industryLabel: 'Business Type',
  },
  'media-outlet': {
    accentColor: '#A855F7',
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
  stats: {
    followers: 0,
    engagementRate: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    avgViewsPerPost: 0,
    totalPosts: 0,
    postingFreq: '',
  },
  offerings: [],
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
  posts: { thumbnailUrl?: string }[];
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

export function populateFromExportData(
  existing: MediaKitData,
  exportData: ExportDataShape,
  userType: UserType,
): MediaKitData {
  const { profile, computedMetrics } = exportData;

  return {
    ...existing,
    userType,
    username: existing.username || profile.username,
    platform: profile.platform,
    displayName: existing.displayName || profile.displayName,
    bio: existing.bio || profile.bio || '',
    headerPhotoUrl: existing.headerPhotoUrl || profile.avatarUrlHD || '',
    stats: {
      followers: profile.followers,
      engagementRate: computedMetrics.avgEngagementRate,
      totalLikes: computedMetrics.totalLikes,
      totalComments: computedMetrics.totalComments,
      totalViews: computedMetrics.totalViews,
      avgViewsPerPost: computedMetrics.avgViewsPerPost,
      totalPosts: profile.totalPosts,
      postingFreq: computedMetrics.postingFreq,
    },
    offerings: existing.offerings.length > 0 ? existing.offerings : DEFAULT_OFFERINGS[userType],
  };
}

export function formatStatValue(key: keyof MediaKitStats, value: string | number): string {
  if (key === 'engagementRate') return `${value}%`;
  if (key === 'postingFreq') return String(value) || '--';
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
