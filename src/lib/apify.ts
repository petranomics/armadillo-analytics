import { APIFY_ACTORS } from './constants';
import type { Platform, TrendSource } from './types';

export async function runActorSync(actorId: string, input: object, token: string): Promise<unknown[]> {
    const encodedActorId = actorId.replace('/', '~');
    const url = `https://api.apify.com/v2/acts/${encodedActorId}/run-sync-get-dataset-items?token=${token}`;

  const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
  });

  if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Apify error (${res.status}): ${errorText}`);
  }

  return res.json();
}

export function getActorInput(platform: Platform, username: string): { actorId: string; input: object } {
    switch (platform) {
      case 'tiktok':
              return {
                        actorId: APIFY_ACTORS.tiktok,
                        input: { profiles: [username], resultsPerPage: 20 },
              };
      case 'instagram':
              return {
                        actorId: APIFY_ACTORS.instagram,
                        input: {
                                    directUrls: [`https://www.instagram.com/${username.replace(/^@/, '')}/`],
                                    resultsLimit: 20,
                                    resultsType: 'details',
                        },
              };
      case 'youtube':
              return {
                        actorId: APIFY_ACTORS.youtube,
                        input: {
                                    channelUrls: [username.startsWith('http') ? username : `https://youtube.com/@${username}`],
                                    maxResults: 20,
                        },
              };
      case 'twitter':
              return {
                        actorId: APIFY_ACTORS.twitter,
                        input: { twitterHandles: [username.replace('@', '')], maxTweets: 20 },
              };
      case 'linkedin':
              return {
                        actorId: APIFY_ACTORS.linkedin,
                        input: {
                                    urls: [username.startsWith('http') ? username : `https://linkedin.com/in/${username}`],
                        },
              };
      default:
              throw new Error(`Unknown platform: ${platform}`);
    }
}

export function getTrendActorInput(
    source: TrendSource,
    params: Record<string, unknown>
  ): { actorId: string; input: object } {
    switch (source) {
      case 'instagramHashtags':
              return {
                        actorId: APIFY_ACTORS.instagramHashtagStats,
                        input: {
                                    hashtags: params.keywords as string[],
                                    includeLatestPosts: true,
                                    includeTopPosts: true,
                        },
              };
      case 'instagramHashtagPosts':
              return {
                        actorId: APIFY_ACTORS.instagramHashtagPosts,
                        input: {
                                    hashtags: params.hashtags as string[],
                                    resultsLimitPerHashtag: params.limit ?? 30,
                                    contentType: 'Posts (Images/Carousels)',
                                    maximumCommentsPerPost: 5,
                        },
              };
      case 'redditTrends':
              return {
                        actorId: APIFY_ACTORS.redditTrends,
                        input: {
                                    startUrls: ((params.subreddits as string[]) ?? ['https://www.reddit.com/r/popular/']).map(
                                                  (url) => ({ url: url.startsWith('http') ? url : `https://www.reddit.com/r/${url}/` })
                                                ),
                                    maxPostsCount: params.maxPosts ?? 20,
                                    searchPosts: true,
                                    searchSort: 'new',
                                    searchTime: 'all',
                                    crawlCommentsPerPost: false,
                                    fastMode: true,
                        },
              };
      case 'tiktokTrends':
              return {
                        actorId: APIFY_ACTORS.tiktokTrends,
                        input: {
                                    adsScrapeHashtags: true,
                                    adsScrapeVideos: false,
                                    adsScrapeSounds: false,
                                    adsScrapeCreators: false,
                                    adsCountryCode: 'US',
                                    adsRankType: 'popular',
                                    resultsPerPage: params.maxProducts ?? 20,
                        },
              };
      default:
              throw new Error(`Unknown trend source: ${source}`);
    }
}
