'use client';

import { useState, useCallback } from 'react';
import PlatformPage from '@/components/PlatformPage';
import { mockTikTokData } from '@/lib/mock-data';
import { mockTikTokTrends } from '@/lib/trend-data';
import type { TikTokTrend } from '@/lib/types';
import { Flame, RefreshCw, Loader2 } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function TrendingInNiche() {
  const [trends, setTrends] = useState<TikTokTrend[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'tiktokTrends', params: { category: 'General', maxProducts: 8 } }),
      });
      const data = await res.json();
      setTrends(data.tiktokTrends || mockTikTokTrends);
    } catch {
      setTrends(mockTikTokTrends);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  if (!fetched && !loading) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-[#00F2EA]" />
          <h2 className="text-sm font-medium text-armadillo-text">Trending in Your Niche</h2>
        </div>
        <p className="text-xs text-armadillo-muted mb-4">
          Discover trending products and content themes on TikTok. Data is fetched on demand from the TikTok Trend Hunter.
        </p>
        <button
          onClick={fetchTrends}
          className="flex items-center gap-2 bg-burnt hover:bg-burnt-light text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Flame size={14} />
          Load TikTok Trends
        </button>
      </div>
    );
  }

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-[#00F2EA]" />
          <h2 className="text-sm font-medium text-armadillo-text">Trending in Your Niche</h2>
        </div>
        <button
          onClick={fetchTrends}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-burnt font-medium disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {trends && trends.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trends.map((trend, i) => (
            <div key={i} className="bg-armadillo-bg rounded-lg p-3.5">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-sm font-medium text-armadillo-text">{trend.productName}</span>
                {trend.trendScore && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    trend.trendScore >= 85 ? 'bg-success/20 text-success' : trend.trendScore >= 70 ? 'bg-burnt/20 text-burnt' : 'bg-armadillo-border text-armadillo-muted'
                  }`}>
                    Score: {trend.trendScore}
                  </span>
                )}
              </div>
              <span className="text-[10px] bg-[#00F2EA]/10 text-[#00F2EA] px-2 py-0.5 rounded inline-block mb-2">{trend.category}</span>
              {trend.description && (
                <p className="text-xs text-armadillo-muted leading-relaxed">{trend.description}</p>
              )}
              {trend.relatedVideos && (
                <span className="text-[10px] text-armadillo-muted mt-1.5 block">{formatNumber(trend.relatedVideos)} related videos</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TikTokPage() {
  return (
    <div>
      <PlatformPage mockData={mockTikTokData} platform="tiktok" />
      <div className="max-w-7xl mx-auto mt-6">
        <TrendingInNiche />
      </div>
    </div>
  );
}
