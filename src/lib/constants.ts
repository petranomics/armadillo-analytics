import type { Platform } from './types';

export const APIFY_ACTORS: Record<string, string> = {
  // Platform scrapers
  tiktok: 'clockworks/free-tiktok-scraper',
  instagram: 'apify/instagram-scraper',
  instagramComments: 'apify/instagram-comment-scraper',
  youtube: 'streamers/youtube-scraper',
  twitter: 'apidojo/twitter-scraper-lite',
  linkedin: 'curious_coder/linkedin-post-search-scraper',
  // Trend scrapers
  instagramHashtagStats: 'scrapier/instagram-related-hashtag-stats-scraper',
  instagramHashtagPosts: 'muhammad_noman_riaz/instagram-hashtag-super-scraper',
  redditTrends: 'scraper-engine/reddit-trends-scraper',
  tiktokTrends: 'frayess_mosbehi/tiktok-trend-hunter',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  tiktok: '#00F2EA',
  instagram: '#E1306C',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
};

export const PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'];
