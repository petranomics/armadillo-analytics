import type { Post, Platform } from './types';

// ============ Multi-Variable Compound Metrics ============

export interface CompoundMetrics {
  // Tier 1: Ratios
  viralityRate: number | null;      // shares / (likes + comments) — how much content spreads beyond viewers
  conversationRate: number | null;  // comments / followers — how much you spark discussion
  amplificationRate: number | null; // shares / followers — how much your audience amplifies you
  commentToLikeRatio: number | null;// comments / likes — deep vs passive engagement
  viewsToEngRate: number | null;    // (likes + comments) / views — what % of viewers interact
  saveRate: number | null;          // saves / total engagement — bookmark-worthy content
  followerToViewRatio: number | null; // views / followers — >1 means reaching beyond your audience

  // Tier 2: Content intelligence
  hashtagLift: number | null;       // % engagement lift when hashtags are used
  collabMultiplier: number | null;  // % engagement lift when collaborators are tagged
  captionLengthImpact: { short: number; long: number } | null; // avg eng by caption length
  locationBoost: number | null;     // % lift when location is tagged
  originalAudioEffect: number | null; // % lift with original vs licensed audio

  // Tier 3: Cross-post
  contentTypeWinner: { type: string; avgEng: number } | null;
  postingConsistency: number | null; // coefficient of variation (lower = more consistent)
  engagementVelocity: number | null; // avg engagement per post in recent window

  // Brand readiness
  estimatedCPM: number | null;       // estimated cost per 1k impressions based on engagement
  estimatedPostValue: number | null; // estimated $ value of a sponsored post
  brandReadinessScore: number | null; // 0-100 composite score
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function pctLift(withVal: number, withoutVal: number): number | null {
  if (withoutVal === 0) return null;
  return Math.round(((withVal - withoutVal) / withoutVal) * 100);
}

export function computeCompoundMetrics(
  posts: Post[],
  followers: number,
): CompoundMetrics {
  if (posts.length === 0) {
    return {
      viralityRate: null, conversationRate: null, amplificationRate: null,
      commentToLikeRatio: null, viewsToEngRate: null, saveRate: null,
      followerToViewRatio: null, hashtagLift: null, collabMultiplier: null,
      captionLengthImpact: null, locationBoost: null, originalAudioEffect: null,
      contentTypeWinner: null, postingConsistency: null, engagementVelocity: null,
      estimatedCPM: null, estimatedPostValue: null, brandReadinessScore: null,
    };
  }

  const totalLikes = posts.reduce((s, p) => s + (p.metrics.likes ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.metrics.comments ?? 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.metrics.shares ?? 0), 0);
  const totalViews = posts.reduce((s, p) => s + (p.metrics.views ?? 0), 0);
  const totalSaves = posts.reduce((s, p) => s + (p.metrics.saves ?? 0), 0);
  const totalEng = totalLikes + totalComments + totalShares;

  // ---- Tier 1: Ratios ----
  // If no shares exist across all posts, the platform likely doesn't expose them — return null
  const hasShares = totalShares > 0;
  const hasSaves = totalSaves > 0;

  const viralityRate = hasShares && (totalLikes + totalComments) > 0
    ? Math.round((totalShares / (totalLikes + totalComments)) * 1000) / 10
    : null;

  const conversationRate = followers > 0
    ? Math.round((totalComments / followers) * 1000) / 10
    : null;

  const amplificationRate = hasShares && followers > 0
    ? Math.round((totalShares / followers) * 1000) / 10
    : null;

  const commentToLikeRatio = totalLikes > 0
    ? Math.round((totalComments / totalLikes) * 1000) / 10
    : null;

  const viewsToEngRate = totalViews > 0
    ? Math.round(((totalLikes + totalComments) / totalViews) * 1000) / 10
    : null;

  const saveRate = hasSaves && totalEng > 0
    ? Math.round((totalSaves / totalEng) * 1000) / 10
    : null;

  const followerToViewRatio = followers > 0 && totalViews > 0
    ? Math.round((totalViews / followers / posts.length) * 100) / 100
    : null;

  // ---- Tier 2: Content intelligence ----
  const getEng = (p: Post) => (p.metrics.likes ?? 0) + (p.metrics.comments ?? 0) + (p.metrics.shares ?? 0);

  // Hashtag lift
  const withHashtags = posts.filter(p => (p.hashtags?.length ?? 0) > 0);
  const withoutHashtags = posts.filter(p => !p.hashtags?.length);
  const hashtagLift = withHashtags.length >= 2 && withoutHashtags.length >= 2
    ? pctLift(avg(withHashtags.map(getEng)), avg(withoutHashtags.map(getEng)))
    : null;

  // Collab multiplier
  const withCollabs = posts.filter(p => (p.taggedUsers?.length ?? 0) > 0);
  const withoutCollabs = posts.filter(p => !p.taggedUsers?.length);
  const collabMultiplier = withCollabs.length >= 2 && withoutCollabs.length >= 2
    ? pctLift(avg(withCollabs.map(getEng)), avg(withoutCollabs.map(getEng)))
    : null;

  // Caption length impact
  const shortCaptions = posts.filter(p => (p.caption?.length ?? 0) < 150);
  const longCaptions = posts.filter(p => (p.caption?.length ?? 0) >= 150);
  const captionLengthImpact = shortCaptions.length >= 2 && longCaptions.length >= 2
    ? { short: Math.round(avg(shortCaptions.map(getEng))), long: Math.round(avg(longCaptions.map(getEng))) }
    : null;

  // Location boost
  const withLocation = posts.filter(p => !!p.locationName);
  const withoutLocation = posts.filter(p => !p.locationName);
  const locationBoost = withLocation.length >= 2 && withoutLocation.length >= 2
    ? pctLift(avg(withLocation.map(getEng)), avg(withoutLocation.map(getEng)))
    : null;

  // Original audio effect
  const withOriginal = posts.filter(p => p.musicInfo?.uses_original_audio === true);
  const withLicensed = posts.filter(p => p.musicInfo && !p.musicInfo.uses_original_audio);
  const originalAudioEffect = withOriginal.length >= 2 && withLicensed.length >= 2
    ? pctLift(avg(withOriginal.map(getEng)), avg(withLicensed.map(getEng)))
    : null;

  // ---- Tier 3: Cross-post ----
  // Content type winner
  const byType: Record<string, number[]> = {};
  for (const p of posts) {
    const raw = (p.contentType ?? 'Post').toLowerCase();
    let type = 'Post';
    if (raw.includes('video') || raw.includes('reel') || raw === 'clip') type = 'Reels / Video';
    else if (raw.includes('carousel') || raw.includes('sidecar')) type = 'Carousel';
    else if (raw.includes('image') || raw.includes('photo')) type = 'Photo';
    if (!byType[type]) byType[type] = [];
    byType[type].push(getEng(p));
  }
  let contentTypeWinner: { type: string; avgEng: number } | null = null;
  let maxAvg = 0;
  for (const [type, engs] of Object.entries(byType)) {
    const a = avg(engs);
    if (a > maxAvg) { maxAvg = a; contentTypeWinner = { type, avgEng: Math.round(a) }; }
  }

  // Posting consistency (coefficient of variation of engagement)
  const engValues = posts.map(getEng);
  const engMean = avg(engValues);
  const engStdDev = Math.sqrt(avg(engValues.map(v => Math.pow(v - engMean, 2))));
  const postingConsistency = engMean > 0
    ? Math.round((1 - Math.min(engStdDev / engMean, 1)) * 100) // 100 = perfectly consistent
    : null;

  // Engagement velocity (recent 5 posts)
  const sorted = [...posts].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const recent5 = sorted.slice(0, 5);
  const engagementVelocity = recent5.length > 0 ? Math.round(avg(recent5.map(getEng))) : null;

  // ---- Brand readiness ----
  const engRate = followers > 0 ? (totalEng / posts.length / followers) * 100 : 0;

  // CPM estimate: higher engagement = higher CPM
  // Industry baseline: $5-25 CPM, scaled by engagement rate
  const estimatedCPM = followers >= 1000
    ? Math.round(Math.min(5 + engRate * 4, 30) * 100) / 100
    : null;

  // Post value estimate: followers / 1000 * CPM * engagement multiplier
  const estimatedPostValue = estimatedCPM && followers >= 1000
    ? Math.round((followers / 1000) * estimatedCPM * Math.min(1 + engRate / 3, 3))
    : null;

  // Brand readiness: composite of engagement, consistency, followers, content quality
  let brandReadinessScore: number | null = null;
  if (followers >= 500) {
    let score = 0;
    // Engagement rate (0-30 pts)
    score += Math.min(engRate * 10, 30);
    // Follower tier (0-20 pts)
    if (followers >= 100000) score += 20;
    else if (followers >= 10000) score += 15;
    else if (followers >= 1000) score += 10;
    else score += 5;
    // Consistency (0-20 pts)
    if (postingConsistency !== null) score += (postingConsistency / 100) * 20;
    // Content signals (0-15 pts)
    if (hashtagLift !== null && hashtagLift > 0) score += 5;
    if (collabMultiplier !== null && collabMultiplier > 0) score += 5;
    if (posts.length >= 12) score += 5;
    // Posting frequency (0-15 pts)
    const dates = posts.map(p => new Date(p.publishedAt).getTime()).filter(t => !isNaN(t)).sort();
    if (dates.length >= 2) {
      const rangeDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
      const perWeek = rangeDays > 0 ? (posts.length / rangeDays) * 7 : 0;
      if (perWeek >= 3) score += 15;
      else if (perWeek >= 1) score += 10;
      else if (perWeek >= 0.5) score += 5;
    }
    brandReadinessScore = Math.min(Math.round(score), 100);
  }

  return {
    viralityRate, conversationRate, amplificationRate, commentToLikeRatio,
    viewsToEngRate, saveRate, followerToViewRatio,
    hashtagLift, collabMultiplier, captionLengthImpact, locationBoost, originalAudioEffect,
    contentTypeWinner, postingConsistency, engagementVelocity,
    estimatedCPM, estimatedPostValue, brandReadinessScore,
  };
}

// ============ Cross-platform aggregation ============

export interface PlatformSummary {
  platform: Platform;
  followers: number;
  engagementRate: number;
  totalEng: number;
  postCount: number;
  topMetric: string; // what this platform does best
}

export function computeCrossPlatform(
  platformData: { platform: Platform; followers: number; posts: Post[] }[],
): PlatformSummary[] {
  return platformData.map(({ platform, followers, posts }) => {
    const totalLikes = posts.reduce((s, p) => s + (p.metrics.likes ?? 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.metrics.comments ?? 0), 0);
    const totalShares = posts.reduce((s, p) => s + (p.metrics.shares ?? 0), 0);
    const totalEng = totalLikes + totalComments + totalShares;
    const engagementRate = followers > 0 && posts.length > 0
      ? Math.round((totalEng / posts.length / followers) * 10000) / 100
      : 0;

    // Determine top metric
    const metrics = [
      { name: 'Engagement', val: engagementRate },
      { name: 'Reach', val: followers },
      { name: 'Activity', val: posts.length },
    ];
    const topMetric = metrics.sort((a, b) => b.val - a.val)[0]?.name ?? 'Engagement';

    return { platform, followers, engagementRate, totalEng, postCount: posts.length, topMetric };
  });
}
