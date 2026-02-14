import type { Platform } from '@/lib/types';
import { PLATFORM_NAMES } from '@/lib/constants';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

interface PlatformSummaryCardProps {
  platform: Platform;
  followers: number;
  engagement: number;
}

export default function PlatformSummaryCard({ platform, followers, engagement }: PlatformSummaryCardProps) {
  return (
    <Link
      href={`/${platform}`}
      className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 hover:border-burnt/40 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
          style={{
            backgroundColor: `var(--color-platform-${platform})`,
            color: platform === 'tiktok' ? '#000' : '#fff',
          }}
        >
          {PLATFORM_NAMES[platform]}
        </span>
        <ArrowRight size={14} className="text-armadillo-muted group-hover:text-burnt transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-armadillo-muted uppercase tracking-wider mb-1">Followers</div>
          <div className="font-display text-lg text-armadillo-text">{formatNumber(followers)}</div>
        </div>
        <div>
          <div className="text-[10px] text-armadillo-muted uppercase tracking-wider mb-1">Engagement</div>
          <div className="font-display text-lg text-armadillo-text">{formatNumber(engagement)}</div>
        </div>
      </div>
    </Link>
  );
}
