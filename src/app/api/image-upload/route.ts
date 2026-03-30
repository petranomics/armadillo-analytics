import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';

// Requires BLOB_READ_WRITE_TOKEN env var (set via Vercel Blob store connection)

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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN not set — returning original URLs');
      const passthrough: Record<string, string> = {};
      for (const u of urls) passthrough[u] = u;
      return NextResponse.json({ results: passthrough });
    }

    const toProcess = urls.slice(0, 30);
    const results: Record<string, string> = {};

    await Promise.allSettled(
      toProcess.map(async (url) => {
        // Skip already-permanent URLs
        if (
          url.startsWith('data:') ||
          url.startsWith('blob:') ||
          url.includes('.public.blob.vercel-storage.com') ||
          url.includes('.vercel-storage.com')
        ) {
          results[url] = url;
          return;
        }

        // Validate domain for security
        const isAllowed = ALLOWED_DOMAINS.some(d => url.includes(d));
        if (!isAllowed) {
          results[url] = url;
          return;
        }

        try {
          // Fetch the image from Instagram CDN server-side
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
          });

          if (!res.ok) {
            console.warn(`Image fetch failed (${res.status}): ${url.slice(0, 80)}...`);
            results[url] = url;
            return;
          }

          // Read full body as ArrayBuffer — more reliable than streaming for Vercel Blob
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          if (buffer.length === 0) {
            results[url] = url;
            return;
          }

          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const hash = hashUrl(url);
          const filename = `media-kit/${hash}.${ext}`;

          const blob = await put(filename, buffer, {
            access: 'public',
            contentType,
            addRandomSuffix: false,
          });

          results[url] = blob.url;
        } catch (err) {
          console.error(`Blob upload failed for ${url.slice(0, 80)}:`, err);
          results[url] = url;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('image-upload route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
