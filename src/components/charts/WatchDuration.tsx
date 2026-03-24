'use client';

export default function WatchDuration() {
  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Watch Duration</h3>
      <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted text-center px-4">
        Watch duration &amp; retention data requires authenticated platform API access and is not available from public scraping
      </div>
    </div>
  );
}
