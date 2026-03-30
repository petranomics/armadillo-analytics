import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_DOMAINS = [
  'scontent',
  'instagram',
  'cdninstagram.com',
  'fbcdn.net',
];

/** Generate a stable hash from the URL path (ignoring query params / auth tokens) */
function hashUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Instagram CDN paths are stable; query params are the expiring token
    return crypto.createHash('sha256').update(parsed.pathname).digest('hex').slice(0, 16);
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = (await request.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'Missing urls array' }, { status: 400 });
    }

    // Cap at 30 images per request
    const toProcess = urls.slice(0, 30);
    const results: Record<string, string> = {};

    await Promise.allSettled(
      toProcess.map(async (url) => {
        // Skip already-permanent URLs (data URLs, blob URLs, or already on Vercel Blob)
        if (url.startsWith('data:') || url.startsWith('blob:') || url.includes('.vercel-storage.com')) {
          results[url] = url;
          return;
        }

        // Validate domain
        const isAllowed = ALLOWED_DOMAINS.some(d => url.includes(d));
        if (!isAllowed) {
          results[url] = url; // pass through non-Instagram URLs unchanged
          return;
        }

        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) {
            results[url] = url;
            return;
          }

          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const hash = hashUrl(url);
          const filename = `media-kit/${hash}.${ext}`;

          const blob = await put(filename, res.body!, {
            access: 'public',
            contentType,
            addRandomSuffix: false,
          });

          results[url] = blob.url;
        } catch {
          results[url] = url; // fallback to original on error
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
