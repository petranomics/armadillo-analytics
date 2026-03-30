import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';

// Requires BLOB_READ_WRITE_TOKEN env var (set via Vercel Blob store connection)

/** Generate a stable hash from a string */
function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/** Convert a data URL to a Buffer */
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

interface UploadItem {
  originalUrl: string;
  dataUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[image-upload] BLOB_READ_WRITE_TOKEN not set');
      // Fall back: return original URLs
      if (body.urls && Array.isArray(body.urls)) {
        if (typeof body.urls[0] === 'string') {
          const results: Record<string, string> = {};
          for (const u of body.urls) results[u] = u;
          return NextResponse.json({ results });
        }
        const results: Record<string, string> = {};
        for (const item of body.urls) results[item.originalUrl] = item.originalUrl;
        return NextResponse.json({ results });
      }
      return NextResponse.json({ error: 'No BLOB_READ_WRITE_TOKEN' }, { status: 500 });
    }

    // New format: array of { originalUrl, dataUrl } objects
    if (body.urls && Array.isArray(body.urls) && body.urls.length > 0 && typeof body.urls[0] === 'object') {
      const items = (body.urls as UploadItem[]).slice(0, 30);
      const results: Record<string, string> = {};

      await Promise.allSettled(
        items.map(async ({ originalUrl, dataUrl }) => {
          // Skip if already on Blob
          if (originalUrl.includes('.vercel-storage.com')) {
            results[originalUrl] = originalUrl;
            return;
          }

          const parsed = dataUrlToBuffer(dataUrl);
          if (!parsed) {
            console.warn(`[image-upload] Failed to parse data URL for ${originalUrl.slice(0, 60)}`);
            results[originalUrl] = originalUrl;
            return;
          }

          try {
            const ext = parsed.contentType.includes('png') ? 'png' : parsed.contentType.includes('webp') ? 'webp' : 'jpg';
            const filename = `media-kit/${hash(originalUrl)}.${ext}`;

            const blob = await put(filename, parsed.buffer, {
              access: 'public',
              contentType: parsed.contentType,
              addRandomSuffix: false,
              allowOverwrite: true,
            });

            console.log(`[image-upload] Uploaded: ${filename} → ${blob.url}`);
            results[originalUrl] = blob.url;
          } catch (err) {
            console.error(`[image-upload] Blob put failed:`, err);
            results[originalUrl] = dataUrl; // fall back to data URL
          }
        })
      );

      return NextResponse.json({ results });
    }

    // Legacy format: array of URL strings (for non-Instagram URLs that can be fetched server-side)
    if (body.urls && Array.isArray(body.urls) && typeof body.urls[0] === 'string') {
      const urls = (body.urls as string[]).slice(0, 30);
      const results: Record<string, string> = {};

      for (const url of urls) {
        if (isPermanent(url)) {
          results[url] = url;
          continue;
        }
        // For non-Instagram URLs, try server-side fetch
        try {
          const res = await fetch(url);
          if (!res.ok) { results[url] = url; continue; }
          const buffer = Buffer.from(await res.arrayBuffer());
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const blob = await put(`media-kit/${hash(url)}.${ext}`, buffer, {
            access: 'public',
            contentType,
            addRandomSuffix: false,
              allowOverwrite: true,
          });
          results[url] = blob.url;
        } catch {
          results[url] = url;
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[image-upload] Route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isPermanent(url: string): boolean {
  return !url || url.startsWith('data:') || url.startsWith('blob:') || url.includes('.vercel-storage.com');
}
