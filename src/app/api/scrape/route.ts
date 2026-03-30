import { NextRequest, NextResponse } from 'next/server';
import { runActorSync, getActorInput } from '@/lib/apify';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import type { Platform } from '@/lib/types';

function hashPath(url: string): string {
  try {
    return crypto.createHash('sha256').update(new URL(url).pathname).digest('hex').slice(0, 16);
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  }
}

/** Fetch an image and upload to Vercel Blob. Returns blob URL or original on failure. */
async function persistImage(url: string): Promise<string> {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return url;
  if (url.includes('.vercel-storage.com') || url.startsWith('data:')) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) return url;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return url;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `media-kit/${hashPath(url)}.${ext}`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  } catch {
    return url;
  }
}

/** Persist multiple images in parallel, returning a url→blobUrl mapping */
async function persistImages(urls: string[]): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      mapping[url] = await persistImage(url);
    })
  );
  // Log any failures
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.warn(`[scrape] Failed to persist image ${i}:`, r.reason);
    }
  });
  return mapping;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, username } = body as {
      platform: Platform;
      username: string;
    };

    if (!platform || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, username' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.APIFY_API_KEY ||
      process.env.APIFY_API_KEY_IG ||
      process.env.APIFY_API_KEY_TIKTOK ||
      process.env.APIFY_API_KEY_LINKEDIN;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Apify API key configured. Add APIFY_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { actorId, input } = getActorInput(platform, username);
    const rawResults = await runActorSync(actorId, input, apiKey);

    // Instagram "details" response: first item is the profile with latestPosts inside
    if (platform === 'instagram' && rawResults.length > 0) {
      const profile = rawResults[0] as Record<string, unknown>;
      const posts = (profile.latestPosts || []) as Record<string, unknown>[];

      // Collect all image URLs to persist
      const imageUrls: string[] = [];
      if (profile.profilePicUrlHD) imageUrls.push(String(profile.profilePicUrlHD));
      for (const post of posts) {
        if (post.displayUrl) imageUrls.push(String(post.displayUrl));
      }

      // Upload to Vercel Blob while CDN URLs are still fresh
      const urlMapping = imageUrls.length > 0 ? await persistImages(imageUrls) : {};
      const persisted = Object.values(urlMapping).filter(v => v.includes('.vercel-storage.com')).length;
      if (persisted > 0) {
        console.log(`[scrape] Persisted ${persisted}/${imageUrls.length} images to Blob`);
      }

      // Replace CDN URLs with Blob URLs in the response
      const persistedAvatar = profile.profilePicUrlHD
        ? urlMapping[String(profile.profilePicUrlHD)] || profile.profilePicUrlHD
        : profile.profilePicUrlHD;

      const enrichedPosts = posts.map(post => ({
        ...post,
        displayUrl: post.displayUrl ? (urlMapping[String(post.displayUrl)] || post.displayUrl) : post.displayUrl,
        followersCount: profile.followersCount,
        followingCount: profile.followsCount,
        ownerFullName: profile.fullName,
        biography: profile.biography,
        isVerified: profile.verified,
        profilePostsCount: profile.postsCount,
        profilePicUrlHD: persistedAvatar,
        externalUrl: profile.externalUrl,
        isBusinessAccount: profile.isBusinessAccount,
        businessCategoryName: profile.businessCategoryName,
        highlightReelCount: profile.highlightReelCount,
      }));
      return NextResponse.json({ results: enrichedPosts });
    }

    return NextResponse.json({ results: rawResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
