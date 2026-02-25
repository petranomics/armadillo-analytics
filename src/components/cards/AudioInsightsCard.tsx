'use client';

import type { Post } from '@/lib/types';
import { Music } from 'lucide-react';

interface AudioInsightsCardProps {
  posts: Post[];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function AudioInsightsCard({ posts }: AudioInsightsCardProps) {
  const withMusic = posts.filter(p => p.musicInfo);
  const noMusic = posts.filter(p => !p.musicInfo);

  if (withMusic.length === 0) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Music size={14} className="text-burnt" />
          <h3 className="text-sm font-medium text-armadillo-text">Audio Performance</h3>
        </div>
        <p className="text-xs text-armadillo-muted">No audio data available in recent posts</p>
      </div>
    );
  }

  // Split by original vs licensed
  const original = withMusic.filter(p => p.musicInfo!.uses_original_audio);
  const licensed = withMusic.filter(p => !p.musicInfo!.uses_original_audio);

  const avgEng = (arr: Post[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, p) => s + p.metrics.likes + p.metrics.comments, 0) / arr.length) : 0;

  const originalAvg = avgEng(original);
  const licensedAvg = avgEng(licensed);

  // Top tracks (licensed audio only — original audio has no track info)
  const trackMap: Record<string, { song: string; artist: string; count: number; totalEng: number }> = {};
  for (const post of licensed) {
    const mi = post.musicInfo!;
    const key = `${mi.song_name}::${mi.artist_name}`.toLowerCase();
    if (!trackMap[key]) {
      trackMap[key] = { song: mi.song_name, artist: mi.artist_name, count: 0, totalEng: 0 };
    }
    trackMap[key].count += 1;
    trackMap[key].totalEng += post.metrics.likes + post.metrics.comments;
  }

  const topTracks = Object.values(trackMap)
    .map(t => ({ ...t, avgEng: Math.round(t.totalEng / t.count) }))
    .sort((a, b) => b.avgEng - a.avgEng)
    .slice(0, 5);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Music size={14} className="text-burnt" />
        <h3 className="text-sm font-medium text-armadillo-text">Audio Performance</h3>
      </div>

      {/* Original vs Licensed split */}
      {original.length > 0 && licensed.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`rounded-lg p-2.5 ${originalAvg >= licensedAvg ? 'bg-burnt/10 border border-burnt/20' : 'bg-armadillo-bg'}`}>
            <div className="text-[10px] text-armadillo-muted mb-0.5">Original Audio</div>
            <div className="text-sm font-display text-armadillo-text">{formatNumber(originalAvg)} <span className="text-[10px] text-armadillo-muted">avg eng</span></div>
            <div className="text-[9px] text-armadillo-muted">{original.length} posts</div>
          </div>
          <div className={`rounded-lg p-2.5 ${licensedAvg > originalAvg ? 'bg-burnt/10 border border-burnt/20' : 'bg-armadillo-bg'}`}>
            <div className="text-[10px] text-armadillo-muted mb-0.5">Licensed Audio</div>
            <div className="text-sm font-display text-armadillo-text">{formatNumber(licensedAvg)} <span className="text-[10px] text-armadillo-muted">avg eng</span></div>
            <div className="text-[9px] text-armadillo-muted">{licensed.length} posts</div>
          </div>
        </div>
      ) : (
        <div className="bg-armadillo-bg rounded-lg p-2.5 mb-3">
          <div className="text-[10px] text-armadillo-muted mb-0.5">
            {original.length > 0 ? 'All Original Audio' : 'All Licensed Audio'}
          </div>
          <div className="text-sm font-display text-armadillo-text">
            {formatNumber(original.length > 0 ? originalAvg : licensedAvg)} <span className="text-[10px] text-armadillo-muted">avg engagement</span>
          </div>
          <div className="text-[9px] text-armadillo-muted">{withMusic.length} posts</div>
        </div>
      )}

      {/* Top tracks */}
      {topTracks.length > 0 && (
        <div>
          <div className="text-[10px] text-armadillo-muted mb-2 uppercase tracking-wider font-medium">Top Tracks</div>
          <div className="space-y-1.5">
            {topTracks.map((track, i) => (
              <div key={`${track.song}-${track.artist}`} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-armadillo-text truncate">{track.song}</div>
                  <div className="text-[9px] text-armadillo-muted truncate">{track.artist}</div>
                </div>
                <span className="text-[10px] text-burnt font-medium flex-shrink-0">{formatNumber(track.avgEng)} avg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
