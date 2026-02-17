import type { TrendSource, TrendData, HashtagStats, HashtagPost, RedditTrend, TikTokTrend } from './types';

// Normalize raw Apify responses into typed trend data

export function normalizeTrendResults(source: TrendSource, raw: unknown[]): TrendData {
  const base: TrendData = { source, fetchedAt: new Date().toISOString() };

  switch (source) {
    case 'instagramHashtags':
      base.hashtagStats = raw.map(normalizeHashtagStats);
      break;
    case 'instagramHashtagPosts':
      base.hashtagPosts = raw.map(normalizeHashtagPost);
      break;
    case 'redditTrends':
      base.redditTrends = raw.map(normalizeRedditTrend);
      break;
    case 'tiktokTrends':
      base.tiktokTrends = raw.map(normalizeTikTokTrend);
      break;
  }

  return base;
}

function normalizeHashtagStats(item: unknown): HashtagStats {
  const r = item as Record<string, unknown>;
  const edgeMedia = r.edge_hashtag_to_media as Record<string, unknown> | undefined;
  const postCount = Number(r.postCount || r.mediaCount || r.count || edgeMedia?.count || 0);

  // Determine trend direction from available data
  let trend: HashtagStats['trend'] = 'stable';
  if (r.trend === 'rising' || r.is_trending) trend = 'rising';
  else if (r.trend === 'declining') trend = 'declining';

  return {
    hashtag: String(r.hashtag || r.name || r.tag || ''),
    postCount,
    relatedHashtags: Array.isArray(r.relatedHashtags)
      ? (r.relatedHashtags as string[]).slice(0, 10)
      : Array.isArray(r.related)
        ? (r.related as { name: string }[]).map(h => h.name || String(h)).slice(0, 10)
        : [],
    avgEngagement: Number(r.avgEngagement || r.averageEngagement || 0) || undefined,
    trend,
  };
}

function normalizeHashtagPost(item: unknown): HashtagPost {
  const r = item as Record<string, unknown>;
  return {
    id: String(r.id || r.shortcode || r.pk || ''),
    caption: String(r.caption || r.text || r.alt || '').slice(0, 300),
    likes: Number(r.likesCount || r.likes || (r.edge_liked_by as Record<string, unknown> | undefined)?.count || 0),
    comments: Number(r.commentsCount || r.comments || (r.edge_media_to_comment as Record<string, unknown> | undefined)?.count || 0),
    hashtag: String(r.hashtag || r.tagName || ''),
    url: String(r.url || r.postUrl || r.displayUrl || '#'),
    publishedAt: String(r.timestamp || r.taken_at || r.publishedAt || new Date().toISOString()),
    thumbnailUrl: String(r.thumbnailUrl || r.displayUrl || r.thumbnail_src || '') || undefined,
  };
}

function normalizeRedditTrend(item: unknown): RedditTrend {
  const r = item as Record<string, unknown>;
  return {
    title: String(r.title || r.headline || ''),
    subreddit: String(r.subreddit || r.community || r.subredditName || ''),
    upvotes: Number(r.upvotes || r.score || r.ups || 0),
    comments: Number(r.comments || r.numComments || r.num_comments || 0),
    url: String(r.url || r.permalink || '#'),
    publishedAt: String(r.publishedAt || r.created_utc || r.date || new Date().toISOString()),
    flair: r.flair ? String(r.flair) : r.link_flair_text ? String(r.link_flair_text) : undefined,
  };
}

function normalizeTikTokTrend(item: unknown): TikTokTrend {
  const r = item as Record<string, unknown>;
  return {
    productName: String(r.productName || r.name || r.title || ''),
    category: String(r.category || r.productCategory || ''),
    trendScore: Number(r.trendScore || r.score || 0) || undefined,
    description: r.description ? String(r.description) : r.aiAnalysis ? String(r.aiAnalysis) : undefined,
    relatedVideos: Number(r.relatedVideos || r.videoCount || 0) || undefined,
    url: r.url ? String(r.url) : r.productUrl ? String(r.productUrl) : undefined,
  };
}

// ============ MOCK TREND DATA (fallback when no API key) ============

export const mockHashtagStats: HashtagStats[] = [
  { hashtag: 'austinfood', postCount: 842000, relatedHashtags: ['atxeats', 'austineats', 'austintx', 'texasfoodie'], avgEngagement: 4.2, trend: 'rising' },
  { hashtag: 'atxlife', postCount: 1240000, relatedHashtags: ['austintexas', 'keepaustinweird', 'atx', 'austinlocal'], avgEngagement: 3.8, trend: 'stable' },
  { hashtag: 'texascreator', postCount: 156000, relatedHashtags: ['texasinfluencer', 'austincreator', 'dfwcreator', 'texasblogger'], avgEngagement: 5.1, trend: 'rising' },
  { hashtag: 'bartonsprings', postCount: 98000, relatedHashtags: ['zilkerpark', 'austinswimming', 'keepitweird', 'ladybirdlake'], avgEngagement: 6.3, trend: 'rising' },
  { hashtag: 'southcongress', postCount: 224000, relatedHashtags: ['socoaustin', 'austinshopping', 'vintage', 'austinstyle'], avgEngagement: 4.7, trend: 'stable' },
];

export const mockHashtagPosts: HashtagPost[] = [
  { id: 'hp-1', caption: 'Best queso in Austin? This place on East 6th just changed the game', likes: 3200, comments: 186, hashtag: 'austinfood', url: '#', publishedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'hp-2', caption: 'Sunset from the Pennybacker Bridge overlook never gets old', likes: 5400, comments: 98, hashtag: 'atxlife', url: '#', publishedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'hp-3', caption: 'How I edit my Austin food content - full workflow breakdown', likes: 1800, comments: 342, hashtag: 'texascreator', url: '#', publishedAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'hp-4', caption: 'Spring vibes at Barton Springs - water is perfect right now', likes: 4100, comments: 76, hashtag: 'bartonsprings', url: '#', publishedAt: new Date(Date.now() - 345600000).toISOString() },
];

export const mockRedditTrends: RedditTrend[] = [
  { title: 'Austin named #1 city for content creators in 2026', subreddit: 'r/Austin', upvotes: 4200, comments: 342, url: '#', publishedAt: new Date(Date.now() - 7200000).toISOString(), flair: 'News' },
  { title: 'Instagram algorithm changes favor shorter Reels in Q1 2026', subreddit: 'r/Instagram', upvotes: 8900, comments: 1240, url: '#', publishedAt: new Date(Date.now() - 14400000).toISOString(), flair: 'Algorithm' },
  { title: 'TikTok Shop sellers seeing 3x revenue after new creator fund launch', subreddit: 'r/TikTok', upvotes: 3600, comments: 567, url: '#', publishedAt: new Date(Date.now() - 28800000).toISOString() },
  { title: 'How food bloggers are pivoting to short-form video in 2026', subreddit: 'r/Blogging', upvotes: 1800, comments: 234, url: '#', publishedAt: new Date(Date.now() - 43200000).toISOString(), flair: 'Discussion' },
  { title: 'Brand deal rates for micro-influencers have increased 40% YoY', subreddit: 'r/influencermarketing', upvotes: 2400, comments: 189, url: '#', publishedAt: new Date(Date.now() - 57600000).toISOString() },
];

export const mockTikTokTrends: TikTokTrend[] = [
  { productName: 'Portable Ring Light Pro', category: 'Creator Tools', trendScore: 92, description: 'Compact LED ring light trending among food and lifestyle creators', relatedVideos: 24000 },
  { productName: 'Matcha Kit Starter Set', category: 'Food & Beverage', trendScore: 88, description: 'DIY matcha kits are surging — Austin cafes are driving this trend', relatedVideos: 18500 },
  { productName: 'Vintage Polaroid Camera', category: 'Photography', trendScore: 85, description: 'Retro aesthetic content is booming on TikTok', relatedVideos: 31000 },
  { productName: 'Wireless Lavalier Mic', category: 'Creator Tools', trendScore: 82, description: 'Budget-friendly mic for street interviews and vlog content', relatedVideos: 12800 },
  { productName: 'Austin Local Hot Sauce', category: 'Food & Beverage', trendScore: 78, description: 'Local hot sauces trending in food review content', relatedVideos: 8400 },
];
