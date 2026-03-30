/**
 * Check if a URL is already permanent (data URL, blob URL, or Vercel Blob).
 */
function isPermanent(url: string): boolean {
  return !url || url.startsWith('data:') || url.startsWith('blob:') || url.includes('.vercel-storage.com');
}

/**
 * Upload images to Vercel Blob storage for permanent hosting.
 * Returns a map of originalUrl -> blobUrl.
 * Falls back to the original URL if upload fails.
 */
export async function persistImages(urls: string[]): Promise<Record<string, string>> {
  const toUpload = urls.filter(u => u && !isPermanent(u));
  if (toUpload.length === 0) {
    // All already permanent
    return Object.fromEntries(urls.map(u => [u, u]));
  }

  try {
    const res = await fetch('/api/image-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: toUpload }),
    });
    if (!res.ok) {
      // Fallback: return originals
      return Object.fromEntries(urls.map(u => [u, u]));
    }
    const { results } = await res.json();
    // Merge: permanent URLs pass through, uploaded ones get blob URLs
    const merged: Record<string, string> = {};
    for (const u of urls) {
      merged[u] = isPermanent(u) ? u : (results[u] || u);
    }
    return merged;
  } catch {
    return Object.fromEntries(urls.map(u => [u, u]));
  }
}

/**
 * Persist a single image to Vercel Blob. Returns the permanent URL.
 */
export async function toDataUrl(url: string): Promise<string> {
  if (!url || isPermanent(url)) return url;
  const results = await persistImages([url]);
  return results[url] || url;
}

/**
 * Persist multiple images to Vercel Blob. Returns permanent URLs in order.
 */
export async function toDataUrls(urls: string[]): Promise<string[]> {
  const results = await persistImages(urls);
  return urls.map(u => results[u] || u);
}
