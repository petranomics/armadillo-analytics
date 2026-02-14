import type { PlatformData, DashboardOverview, Post } from './types';

// Helper to generate dates going backwards from today
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ============ TIKTOK ============
const tiktokPosts: Post[] = [
  { id: 'tt-1', platform: 'tiktok', url: '#', caption: 'Austin sunrise from Mount Bonnell hits different', publishedAt: daysAgo(2), metrics: { views: 284000, likes: 31200, comments: 1840, shares: 4200, saves: 8900 }, engagementRate: 16.2 },
  { id: 'tt-2', platform: 'tiktok', url: '#', caption: 'Best breakfast tacos in Austin ranked (controversial)', publishedAt: daysAgo(5), metrics: { views: 412000, likes: 48300, comments: 3200, shares: 6100, saves: 12400 }, engagementRate: 17.0 },
  { id: 'tt-3', platform: 'tiktok', url: '#', caption: 'POV: First time at Barton Springs Pool', publishedAt: daysAgo(8), metrics: { views: 189000, likes: 22100, comments: 980, shares: 2800, saves: 5200 }, engagementRate: 16.4 },
  { id: 'tt-4', platform: 'tiktok', url: '#', caption: 'South Congress vintage shopping haul', publishedAt: daysAgo(11), metrics: { views: 156000, likes: 18400, comments: 720, shares: 2100, saves: 4300 }, engagementRate: 16.3 },
  { id: 'tt-5', platform: 'tiktok', url: '#', caption: 'Rating every coffee shop on South Lamar', publishedAt: daysAgo(14), metrics: { views: 223000, likes: 26800, comments: 1560, shares: 3400, saves: 7100 }, engagementRate: 17.4 },
  { id: 'tt-6', platform: 'tiktok', url: '#', caption: 'Lady Bird Lake kayak day with the crew', publishedAt: daysAgo(17), metrics: { views: 134000, likes: 15200, comments: 640, shares: 1900, saves: 3800 }, engagementRate: 16.1 },
  { id: 'tt-7', platform: 'tiktok', url: '#', caption: 'Franklin BBQ line was actually worth it (full review)', publishedAt: daysAgo(20), metrics: { views: 367000, likes: 42100, comments: 2800, shares: 5400, saves: 10800 }, engagementRate: 16.6 },
  { id: 'tt-8', platform: 'tiktok', url: '#', caption: 'Rainey Street bar crawl guide 2026', publishedAt: daysAgo(23), metrics: { views: 198000, likes: 23400, comments: 1100, shares: 3200, saves: 6400 }, engagementRate: 17.2 },
  { id: 'tt-9', platform: 'tiktok', url: '#', caption: 'Zilker Park sunset golden hour GRWM', publishedAt: daysAgo(26), metrics: { views: 145000, likes: 17200, comments: 580, shares: 1800, saves: 3900 }, engagementRate: 16.2 },
  { id: 'tt-10', platform: 'tiktok', url: '#', caption: 'Austin food truck tier list (locals only)', publishedAt: daysAgo(29), metrics: { views: 298000, likes: 35600, comments: 2400, shares: 4800, saves: 9200 }, engagementRate: 17.4 },
  { id: 'tt-11', platform: 'tiktok', url: '#', caption: 'Day in my life: Austin content creator edition', publishedAt: daysAgo(32), metrics: { views: 167000, likes: 19800, comments: 840, shares: 2400, saves: 4800 }, engagementRate: 16.7 },
  { id: 'tt-12', platform: 'tiktok', url: '#', caption: 'Hidden gems in East Austin you need to try', publishedAt: daysAgo(35), metrics: { views: 241000, likes: 28400, comments: 1680, shares: 3600, saves: 7800 }, engagementRate: 17.2 },
];

export const mockTikTokData: PlatformData = {
  profile: {
    platform: 'tiktok',
    username: 'texasarmadillo',
    displayName: 'Texas Armadillo',
    followers: 124800,
    following: 892,
    totalPosts: 347,
    bio: 'Austin TX | Food, lifestyle & all things Texas',
    verified: false,
  },
  posts: tiktokPosts,
  summary: {
    totalEngagement: tiktokPosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0), 0),
    avgEngagementRate: 16.7,
    topPost: tiktokPosts[1],
    totalViews: tiktokPosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
  },
};

// ============ INSTAGRAM ============
const instagramPosts: Post[] = [
  { id: 'ig-1', platform: 'instagram', url: '#', caption: 'Golden hour on South Congress never gets old', publishedAt: daysAgo(1), metrics: { views: 45000, likes: 4200, comments: 186, shares: 320, saves: 890 }, engagementRate: 6.5 },
  { id: 'ig-2', platform: 'instagram', url: '#', caption: 'Weekend brunch at Launderette - still my #1', publishedAt: daysAgo(4), metrics: { views: 38000, likes: 3800, comments: 142, shares: 280, saves: 720 }, engagementRate: 5.8 },
  { id: 'ig-3', platform: 'instagram', url: '#', caption: 'Austin skyline from the rooftop. This city', publishedAt: daysAgo(7), metrics: { views: 52000, likes: 5100, comments: 224, shares: 410, saves: 1100 }, engagementRate: 8.0 },
  { id: 'ig-4', platform: 'instagram', url: '#', caption: 'Outfit of the day - keeping it Texas casual', publishedAt: daysAgo(10), metrics: { views: 31000, likes: 2900, comments: 98, shares: 180, saves: 540 }, engagementRate: 4.3 },
  { id: 'ig-5', platform: 'instagram', url: '#', caption: 'Best matcha in Austin? Thread below', publishedAt: daysAgo(13), metrics: { views: 41000, likes: 3600, comments: 312, shares: 480, saves: 960 }, engagementRate: 6.2 },
  { id: 'ig-6', platform: 'instagram', url: '#', caption: 'Barton Creek Greenbelt hike - hidden waterfall spot', publishedAt: daysAgo(16), metrics: { views: 48000, likes: 4800, comments: 198, shares: 520, saves: 1400 }, engagementRate: 8.1 },
  { id: 'ig-7', platform: 'instagram', url: '#', caption: 'New mural on East 6th - Austin street art tour', publishedAt: daysAgo(19), metrics: { views: 36000, likes: 3400, comments: 124, shares: 260, saves: 680 }, engagementRate: 5.2 },
  { id: 'ig-8', platform: 'instagram', url: '#', caption: 'Partnering with @localcoffeeco - honest review', publishedAt: daysAgo(22), metrics: { views: 29000, likes: 2600, comments: 88, shares: 160, saves: 420 }, engagementRate: 3.8 },
  { id: 'ig-9', platform: 'instagram', url: '#', caption: 'Sunset paddleboard on Lady Bird Lake', publishedAt: daysAgo(25), metrics: { views: 44000, likes: 4400, comments: 176, shares: 380, saves: 920 }, engagementRate: 6.9 },
  { id: 'ig-10', platform: 'instagram', url: '#', caption: 'Austin home tour - our renovated bungalow', publishedAt: daysAgo(28), metrics: { views: 56000, likes: 5800, comments: 342, shares: 680, saves: 1800 }, engagementRate: 10.1 },
  { id: 'ig-11', platform: 'instagram', url: '#', caption: 'Taco Tuesday at Veracruz All Natural', publishedAt: daysAgo(31), metrics: { views: 34000, likes: 3200, comments: 108, shares: 220, saves: 580 }, engagementRate: 4.8 },
  { id: 'ig-12', platform: 'instagram', url: '#', caption: 'First look at the new Domain development', publishedAt: daysAgo(34), metrics: { views: 27000, likes: 2400, comments: 76, shares: 140, saves: 380 }, engagementRate: 3.5 },
];

export const mockInstagramData: PlatformData = {
  profile: {
    platform: 'instagram',
    username: 'texasarmadillo',
    displayName: 'Texas Armadillo',
    followers: 86200,
    following: 1247,
    totalPosts: 892,
    bio: 'Austin lifestyle | Food & travel | Collabs: hello@armadilloanalytics.app',
    verified: true,
  },
  posts: instagramPosts,
  summary: {
    totalEngagement: instagramPosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0), 0),
    avgEngagementRate: 6.1,
    topPost: instagramPosts[9],
    totalViews: instagramPosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
  },
};

// ============ YOUTUBE ============
const youtubePosts: Post[] = [
  { id: 'yt-1', platform: 'youtube', url: '#', caption: 'Ultimate Austin Food Tour - 10 Spots You MUST Try', publishedAt: daysAgo(3), metrics: { views: 42000, likes: 2800, comments: 340, shares: 180 }, engagementRate: 7.9 },
  { id: 'yt-2', platform: 'youtube', url: '#', caption: 'Moving to Austin in 2026? Watch This First', publishedAt: daysAgo(10), metrics: { views: 68000, likes: 4200, comments: 520, shares: 310 }, engagementRate: 7.4 },
  { id: 'yt-3', platform: 'youtube', url: '#', caption: 'Austin vs Dallas - Honest Comparison', publishedAt: daysAgo(18), metrics: { views: 89000, likes: 5600, comments: 780, shares: 420 }, engagementRate: 7.6 },
  { id: 'yt-4', platform: 'youtube', url: '#', caption: 'A Week in My Life as an Austin Content Creator', publishedAt: daysAgo(25), metrics: { views: 31000, likes: 2100, comments: 280, shares: 140 }, engagementRate: 8.1 },
  { id: 'yt-5', platform: 'youtube', url: '#', caption: 'Best Neighborhoods in Austin for Young Professionals', publishedAt: daysAgo(33), metrics: { views: 54000, likes: 3400, comments: 420, shares: 260 }, engagementRate: 7.6 },
  { id: 'yt-6', platform: 'youtube', url: '#', caption: 'Austin BBQ Showdown: Franklin vs la Barbecue', publishedAt: daysAgo(40), metrics: { views: 76000, likes: 4800, comments: 620, shares: 380 }, engagementRate: 7.6 },
  { id: 'yt-7', platform: 'youtube', url: '#', caption: 'How I Make Money as a Creator in Austin', publishedAt: daysAgo(48), metrics: { views: 45000, likes: 3100, comments: 380, shares: 220 }, engagementRate: 8.2 },
  { id: 'yt-8', platform: 'youtube', url: '#', caption: 'Texas Road Trip Vlog: Austin to Big Bend', publishedAt: daysAgo(55), metrics: { views: 38000, likes: 2600, comments: 240, shares: 160 }, engagementRate: 7.9 },
];

export const mockYouTubeData: PlatformData = {
  profile: {
    platform: 'youtube',
    username: 'TexasArmadillo',
    displayName: 'Texas Armadillo',
    followers: 15800,
    totalPosts: 124,
    bio: 'Austin lifestyle, food tours, and Texas travel guides. New videos every week!',
    verified: false,
  },
  posts: youtubePosts,
  summary: {
    totalEngagement: youtubePosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0), 0),
    avgEngagementRate: 7.8,
    topPost: youtubePosts[2],
    totalViews: youtubePosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
  },
};

// ============ TWITTER ============
const twitterPosts: Post[] = [
  { id: 'tw-1', platform: 'twitter', url: '#', caption: 'Hot take: Austin traffic has gotten worse than Houston. I said what I said.', publishedAt: daysAgo(1), metrics: { views: 18400, likes: 342, comments: 89, shares: 42, retweets: 67, quotes: 12 }, engagementRate: 3.0 },
  { id: 'tw-2', platform: 'twitter', url: '#', caption: 'Just tried the new ramen spot on East 7th. Absolute game changer.', publishedAt: daysAgo(3), metrics: { views: 12800, likes: 248, comments: 34, shares: 28, retweets: 31, quotes: 8 }, engagementRate: 2.7 },
  { id: 'tw-3', platform: 'twitter', url: '#', caption: 'Thread: 10 things I wish I knew before moving to Austin (1/10)', publishedAt: daysAgo(6), metrics: { views: 45600, likes: 1240, comments: 186, shares: 320, retweets: 480, quotes: 42 }, engagementRate: 5.0 },
  { id: 'tw-4', platform: 'twitter', url: '#', caption: 'Barton Springs at 6am before the crowds > anything else in this city', publishedAt: daysAgo(9), metrics: { views: 8900, likes: 186, comments: 22, shares: 14, retweets: 24, quotes: 4 }, engagementRate: 2.8 },
  { id: 'tw-5', platform: 'twitter', url: '#', caption: 'Austin creators: whats your go-to editing setup? Mine is getting outdated', publishedAt: daysAgo(12), metrics: { views: 14200, likes: 198, comments: 67, shares: 18, retweets: 22, quotes: 6 }, engagementRate: 2.2 },
  { id: 'tw-6', platform: 'twitter', url: '#', caption: 'New blog post: How Austin became the creator economy capital of Texas', publishedAt: daysAgo(15), metrics: { views: 22400, likes: 420, comments: 56, shares: 84, retweets: 112, quotes: 18 }, engagementRate: 3.1 },
  { id: 'tw-7', platform: 'twitter', url: '#', caption: 'Grateful for this community. Just hit 25K followers. From a small town in Texas to this.', publishedAt: daysAgo(18), metrics: { views: 34000, likes: 1800, comments: 142, shares: 86, retweets: 124, quotes: 28 }, engagementRate: 6.4 },
  { id: 'tw-8', platform: 'twitter', url: '#', caption: 'PSA: Torchys is overrated and I will die on this hill. Real ones know about Cuantos Tacos.', publishedAt: daysAgo(21), metrics: { views: 28600, likes: 920, comments: 234, shares: 148, retweets: 186, quotes: 52 }, engagementRate: 5.4 },
  { id: 'tw-9', platform: 'twitter', url: '#', caption: 'Anyone else feel like 6th street has completely changed in the last 2 years?', publishedAt: daysAgo(24), metrics: { views: 16800, likes: 324, comments: 78, shares: 32, retweets: 48, quotes: 14 }, engagementRate: 3.0 },
  { id: 'tw-10', platform: 'twitter', url: '#', caption: 'Just wrapped up my biggest brand deal yet. Wild that content creation is my actual job now.', publishedAt: daysAgo(27), metrics: { views: 19200, likes: 680, comments: 92, shares: 44, retweets: 56, quotes: 16 }, engagementRate: 4.6 },
];

export const mockTwitterData: PlatformData = {
  profile: {
    platform: 'twitter',
    username: 'texasarmadillo',
    displayName: 'Texas Armadillo',
    followers: 25400,
    following: 1842,
    totalPosts: 4280,
    bio: 'Austin TX | Creator | Food & lifestyle content | Opinions are my own (and usually about tacos)',
    verified: true,
  },
  posts: twitterPosts,
  summary: {
    totalEngagement: twitterPosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.retweets || 0), 0),
    avgEngagementRate: 3.8,
    topPost: twitterPosts[6],
    totalViews: twitterPosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
  },
};

// ============ LINKEDIN ============
const linkedinPosts: Post[] = [
  { id: 'li-1', platform: 'linkedin', url: '#', caption: 'The creator economy in Austin is booming. Here are 3 trends I\'m seeing firsthand as a full-time creator.', publishedAt: daysAgo(2), metrics: { likes: 284, comments: 42, shares: 18, reactions: { like: 180, celebrate: 52, support: 32, insightful: 20 } }, engagementRate: 6.4 },
  { id: 'li-2', platform: 'linkedin', url: '#', caption: 'I quit my corporate job 2 years ago to become a content creator. Best decision I ever made. Here\'s what I learned.', publishedAt: daysAgo(8), metrics: { likes: 1240, comments: 186, shares: 94, reactions: { like: 680, celebrate: 280, support: 180, insightful: 100 } }, engagementRate: 28.2 },
  { id: 'li-3', platform: 'linkedin', url: '#', caption: 'Why brands are shifting from macro to micro influencers in 2026 - a thread from someone on the ground.', publishedAt: daysAgo(15), metrics: { likes: 520, comments: 78, shares: 46, reactions: { like: 320, celebrate: 80, support: 60, insightful: 60 } }, engagementRate: 11.9 },
  { id: 'li-4', platform: 'linkedin', url: '#', caption: 'Just launched our analytics tool for creators. Building in public and sharing everything along the way.', publishedAt: daysAgo(22), metrics: { likes: 380, comments: 64, shares: 32, reactions: { like: 220, celebrate: 90, support: 40, insightful: 30 } }, engagementRate: 8.8 },
  { id: 'li-5', platform: 'linkedin', url: '#', caption: 'The ROI of authenticity: Why being genuinely yourself outperforms polished corporate content every time.', publishedAt: daysAgo(30), metrics: { likes: 640, comments: 92, shares: 54, reactions: { like: 380, celebrate: 120, support: 80, insightful: 60 } }, engagementRate: 14.6 },
  { id: 'li-6', platform: 'linkedin', url: '#', caption: 'Hiring a video editor changed my content game. Here\'s how to find the right one (and what to pay them).', publishedAt: daysAgo(38), metrics: { likes: 420, comments: 56, shares: 28, reactions: { like: 260, celebrate: 80, support: 48, insightful: 32 } }, engagementRate: 9.3 },
];

export const mockLinkedInData: PlatformData = {
  profile: {
    platform: 'linkedin',
    username: 'texasarmadillo',
    displayName: 'Texas Armadillo',
    followers: 5400,
    following: 890,
    totalPosts: 186,
    bio: 'Full-time content creator | Austin TX | Building Armadillo Analytics | Creator economy insights',
    verified: false,
  },
  posts: linkedinPosts,
  summary: {
    totalEngagement: linkedinPosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0), 0),
    avgEngagementRate: 13.2,
    topPost: linkedinPosts[1],
  },
};

// ============ ALL PLATFORM DATA ============
export const allPlatformData: Record<string, PlatformData> = {
  tiktok: mockTikTokData,
  instagram: mockInstagramData,
  youtube: mockYouTubeData,
  twitter: mockTwitterData,
  linkedin: mockLinkedInData,
};

// ============ DASHBOARD OVERVIEW ============
const allPosts = [...tiktokPosts, ...instagramPosts, ...youtubePosts, ...twitterPosts, ...linkedinPosts];
const sortedByEngagement = [...allPosts].sort((a, b) => {
  const aTotal = a.metrics.likes + a.metrics.comments + (a.metrics.shares || 0);
  const bTotal = b.metrics.likes + b.metrics.comments + (b.metrics.shares || 0);
  return bTotal - aTotal;
});
const sortedByDate = [...allPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export const mockDashboardOverview: DashboardOverview = {
  totalFollowers: 124800 + 86200 + 15800 + 25400 + 5400,
  totalEngagement: allPosts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + (p.metrics.shares || 0), 0),
  avgEngagementRate: 9.5,
  platformBreakdown: [
    { platform: 'tiktok', followers: 124800, engagement: mockTikTokData.summary.totalEngagement },
    { platform: 'instagram', followers: 86200, engagement: mockInstagramData.summary.totalEngagement },
    { platform: 'twitter', followers: 25400, engagement: mockTwitterData.summary.totalEngagement },
    { platform: 'youtube', followers: 15800, engagement: mockYouTubeData.summary.totalEngagement },
    { platform: 'linkedin', followers: 5400, engagement: mockLinkedInData.summary.totalEngagement },
  ],
  topPosts: sortedByEngagement.slice(0, 8),
  recentPosts: sortedByDate.slice(0, 10),
};

// ============ ENGAGEMENT OVER TIME (mock chart data) ============
export const mockEngagementTimeline = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 2000 + Math.random() * 3000;
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tiktok: Math.round(base * 1.8 + Math.random() * 2000),
    instagram: Math.round(base * 0.8 + Math.random() * 800),
    youtube: Math.round(base * 0.4 + Math.random() * 400),
    twitter: Math.round(base * 0.2 + Math.random() * 300),
    linkedin: Math.round(base * 0.1 + Math.random() * 100),
    total: 0,
  };
}).map(d => ({ ...d, total: d.tiktok + d.instagram + d.youtube + d.twitter + d.linkedin }));

// ============ ENGAGEMENT BREAKDOWN BY TYPE ============
// Aggregated from all posts across platforms
const totalLikes = allPosts.reduce((s, p) => s + p.metrics.likes, 0);
const totalComments = allPosts.reduce((s, p) => s + p.metrics.comments, 0);
const totalShares = allPosts.reduce((s, p) => s + (p.metrics.shares || 0), 0);
const totalSaves = allPosts.reduce((s, p) => s + (p.metrics.saves || 0), 0);
const totalViews = allPosts.reduce((s, p) => s + (p.metrics.views || 0), 0);

export const mockEngagementBreakdown = {
  likes: totalLikes,
  comments: totalComments,
  shares: totalShares,
  saves: totalSaves,
  views: totalViews,
};

// ============ ENGAGEMENT BY TYPE OVER TIME (30 days) ============
// Seeded pseudo-random to avoid hydration mismatches
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export const mockEngagementByType = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const dayOfWeek = d.getDay();
  // Weekends get a boost
  const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
  const base = (1800 + seededRandom(i * 13) * 2200) * weekendBoost;
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    shortDate: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    likes: Math.round(base * (0.55 + seededRandom(i * 7) * 0.15)),
    comments: Math.round(base * (0.12 + seededRandom(i * 11) * 0.06)),
    shares: Math.round(base * (0.15 + seededRandom(i * 17) * 0.08)),
    saves: Math.round(base * (0.10 + seededRandom(i * 23) * 0.05)),
  };
});

// ============ PEAK ENGAGEMENT HOURS ============
// Realistic creator engagement by hour (0-23) — peaks at lunch and evening
export const mockPeakHours = Array.from({ length: 24 }, (_, hour) => {
  // Engagement curve: low overnight, spike at 8am, lunch, 6-9pm peak
  const curves: Record<number, number> = {
    0: 0.08, 1: 0.05, 2: 0.03, 3: 0.02, 4: 0.03, 5: 0.06,
    6: 0.12, 7: 0.22, 8: 0.38, 9: 0.48, 10: 0.52, 11: 0.58,
    12: 0.72, 13: 0.65, 14: 0.55, 15: 0.50, 16: 0.55, 17: 0.68,
    18: 0.85, 19: 0.95, 20: 1.00, 21: 0.88, 22: 0.62, 23: 0.30,
  };
  const base = curves[hour] || 0.1;
  const noise = seededRandom(hour * 31) * 0.08;
  return {
    hour,
    label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
    engagement: Math.round((base + noise) * 8400),
    intensity: base + noise, // 0-1 for heatmap coloring
  };
});

// ============ PEAK ENGAGEMENT BY DAY OF WEEK ============
export const mockPeakDays = [
  { day: 'Mon', short: 'M', engagement: 6200, index: 0 },
  { day: 'Tue', short: 'T', engagement: 7100, index: 1 },
  { day: 'Wed', short: 'W', engagement: 7800, index: 2 },
  { day: 'Thu', short: 'T', engagement: 8400, index: 3 },
  { day: 'Fri', short: 'F', engagement: 7600, index: 4 },
  { day: 'Sat', short: 'S', engagement: 9200, index: 5 },
  { day: 'Sun', short: 'S', engagement: 8800, index: 6 },
];

// ============ WATCH DURATION / RETENTION DATA ============
// Average % of viewers still watching at each point in the video
export const mockRetentionCurve = Array.from({ length: 21 }, (_, i) => {
  const pct = i * 5; // 0%, 5%, 10% ... 100%
  // Realistic retention curve: steep initial drop, gradual decline, slight bump at end
  let retention: number;
  if (pct === 0) retention = 100;
  else if (pct <= 10) retention = 100 - pct * 2.8; // steep initial drop
  else if (pct <= 50) retention = 72 - (pct - 10) * 0.65;
  else if (pct <= 90) retention = 46 - (pct - 50) * 0.35;
  else retention = 32 + (pct - 90) * 0.3; // slight bump at end (people wait for CTA)
  return {
    position: `${pct}%`,
    pctThrough: pct,
    retention: Math.round(Math.max(retention + seededRandom(i * 41) * 4 - 2, 5)),
  };
});

// Average watch durations by content type
export const mockWatchDurations = [
  { type: 'Reels / Shorts', avgDuration: '0:18', avgSeconds: 18, totalAvg: 32, retentionPct: 56 },
  { type: 'Stories', avgDuration: '0:04', avgSeconds: 4, totalAvg: 7, retentionPct: 57 },
  { type: 'Feed Videos', avgDuration: '0:42', avgSeconds: 42, totalAvg: 68, retentionPct: 62 },
  { type: 'Long-form', avgDuration: '4:12', avgSeconds: 252, totalAvg: 480, retentionPct: 52 },
  { type: 'Live', avgDuration: '8:34', avgSeconds: 514, totalAvg: 1800, retentionPct: 29 },
];

// ============ ENGAGEMENT BY HOUR × DAY HEATMAP ============
// 7 days × 24 hours grid with engagement intensity
export const mockHourlyHeatmap = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data: { day: string; dayIndex: number; hour: number; value: number }[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const hourBase = mockPeakHours[h].intensity;
      const dayMultiplier = [0.85, 0.92, 1.0, 1.05, 0.98, 1.18, 1.12][d];
      const val = hourBase * dayMultiplier + seededRandom(d * 100 + h * 7) * 0.08;
      data.push({ day: days[d], dayIndex: d, hour: h, value: Math.min(val, 1) });
    }
  }
  return data;
})();
