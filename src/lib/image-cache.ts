/**
 * Check if a URL is already permanent (data URL, blob URL, or Vercel Blob).
 */
function isPermanent(url: string): boolean {
  return !url || url.startsWith('data:') || url.startsWith('blob:') || url.includes('.vercel-storage.com');
}

/**
 * Convert an image URL to a data URL using canvas (client-side).
 * This works for Instagram CDN URLs because <img> tags can load them
 * even though fetch() is blocked by CORS.
 */
function imgToDataUrl(url: string, maxWidth = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(url); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        // Canvas tainted by CORS — fall back to original
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    // Timeout after 10s
    setTimeout(() => resolve(url), 10000);
    img.src = url;
  });
}

/**
 * Convert images to data URLs client-side, then upload to Vercel Blob.
 * This two-step approach works around Instagram CDN blocking server-side fetch.
 *
 * Step 1: Load images via <img> tag + canvas → data URL (client-side, bypasses CORS)
 * Step 2: Upload data URLs to Vercel Blob → permanent public URLs
 */
export async function persistImagesClientSide(urls: string[]): Promise<Record<string, string>> {
  const toProcess = urls.filter(u => u && !isPermanent(u));
  if (toProcess.length === 0) {
    return Object.fromEntries(urls.map(u => [u, u]));
  }

  // Step 1: Convert to data URLs client-side
  console.log(`[Blob] Step 1: Converting ${toProcess.length} images via canvas...`);
  const dataUrls = await Promise.all(toProcess.map(u => imgToDataUrl(u)));

  // Check how many converted successfully
  const converted = dataUrls.filter(d => d.startsWith('data:')).length;
  console.log(`[Blob] Step 1 done: ${converted}/${toProcess.length} converted to data URLs`);

  if (converted === 0) {
    return Object.fromEntries(urls.map(u => [u, u]));
  }

  // Step 2: Upload data URLs to Vercel Blob
  const dataUrlMap: Record<string, string> = {};
  for (let i = 0; i < toProcess.length; i++) {
    dataUrlMap[toProcess[i]] = dataUrls[i];
  }

  try {
    // Only upload ones that converted successfully
    const toUpload = toProcess.filter((_, i) => dataUrls[i].startsWith('data:'));
    console.log(`[Blob] Step 2: Uploading ${toUpload.length} to Vercel Blob...`);

    const res = await fetch('/api/image-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: toUpload.map(originalUrl => ({
          originalUrl,
          dataUrl: dataUrlMap[originalUrl],
        })),
      }),
    });

    if (!res.ok) {
      console.error(`[Blob] API returned ${res.status}`);
      // Fall back to data URLs (still permanent, just stored in localStorage)
      const merged: Record<string, string> = {};
      for (const u of urls) merged[u] = isPermanent(u) ? u : (dataUrlMap[u] || u);
      return merged;
    }

    const { results } = await res.json();
    const blobCount = Object.values(results as Record<string, string>).filter(v => v.includes('.vercel-storage.com')).length;
    console.log(`[Blob] Step 2 done: ${blobCount} uploaded to Blob`);

    // Merge all results
    const merged: Record<string, string> = {};
    for (const u of urls) {
      if (isPermanent(u)) {
        merged[u] = u;
      } else if (results[u]) {
        merged[u] = results[u];
      } else if (dataUrlMap[u]?.startsWith('data:')) {
        merged[u] = dataUrlMap[u]; // fallback to data URL
      } else {
        merged[u] = u;
      }
    }
    return merged;
  } catch (err) {
    console.error('[Blob] Upload failed, falling back to data URLs:', err);
    // Fall back to data URLs
    const merged: Record<string, string> = {};
    for (const u of urls) merged[u] = isPermanent(u) ? u : (dataUrlMap[u] || u);
    return merged;
  }
}

/**
 * Upload data URLs to Vercel Blob storage.
 * Called from server-side proxy or with pre-converted data URLs.
 */
export async function persistImages(urls: string[]): Promise<Record<string, string>> {
  const toUpload = urls.filter(u => u && !isPermanent(u));
  if (toUpload.length === 0) {
    return Object.fromEntries(urls.map(u => [u, u]));
  }

  try {
    const res = await fetch('/api/image-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: toUpload }),
    });
    if (!res.ok) {
      return Object.fromEntries(urls.map(u => [u, u]));
    }
    const { results } = await res.json();
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
 * Persist a single image. Uses server-side upload for non-Instagram URLs.
 */
export async function toDataUrl(url: string): Promise<string> {
  if (!url || isPermanent(url)) return url;
  const results = await persistImages([url]);
  return results[url] || url;
}

/**
 * Persist multiple images.
 */
export async function toDataUrls(urls: string[]): Promise<string[]> {
  const results = await persistImages(urls);
  return urls.map(u => results[u] || u);
}
