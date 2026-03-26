/**
 * Convert an external image URL to a data URL by fetching through our proxy.
 * This makes the image permanent — it won't break when CDN tokens expire.
 * Returns the original URL as fallback if conversion fails.
 */
export async function toDataUrl(url: string): Promise<string> {
  // Already a data URL or blob URL — no conversion needed
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;

  try {
    const proxyUrl = `/api/image-fetch?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return url;

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/**
 * Convert multiple URLs to data URLs in parallel.
 */
export async function toDataUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(toDataUrl));
}
