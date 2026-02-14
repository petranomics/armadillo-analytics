import { APIFY_ACTORS } from './constants';
import type { Platform } from './types';

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
        input: { usernames: [username], resultsLimit: 20 },
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
