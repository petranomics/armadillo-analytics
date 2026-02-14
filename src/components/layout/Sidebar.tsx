'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import { PLATFORM_NAMES, PLATFORMS } from '@/lib/constants';
import type { Platform } from '@/lib/types';

const platformIcons: Record<Platform, string> = {
  tiktok: '♪',
  instagram: '◎',
  youtube: '▶',
  twitter: '𝕏',
  linkedin: 'in',
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-armadillo-card border-r border-armadillo-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-armadillo-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-burnt flex items-center justify-center">
            <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
              <ellipse cx="20" cy="22" rx="12" ry="8" fill="#FFF3E6" />
              <ellipse cx="20" cy="22" rx="10" ry="6" fill="#BF5700" />
              <rect x="8" y="20" width="4" height="6" rx="2" fill="#FFF3E6" />
              <rect x="28" y="20" width="4" height="6" rx="2" fill="#FFF3E6" />
              <rect x="14" y="26" width="3" height="4" rx="1.5" fill="#FFF3E6" />
              <rect x="23" y="26" width="3" height="4" rx="1.5" fill="#FFF3E6" />
              <ellipse cx="30" cy="18" rx="3" ry="2" fill="#FFF3E6" />
              <circle cx="31" cy="17" r="1" fill="#0F1117" />
              <path d="M33 18 Q36 17 38 19" stroke="#FFF3E6" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div>
            <div className="font-display text-sm tracking-widest text-armadillo-text font-semibold">ARMADILLO</div>
            <div className="text-[10px] tracking-[0.25em] text-burnt font-medium">ANALYTICS</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Overview */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
            pathname === '/'
              ? 'text-burnt bg-burnt/10 border-r-2 border-burnt'
              : 'text-armadillo-muted hover:text-armadillo-text hover:bg-armadillo-border/30'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </Link>

        {/* Platforms */}
        <div className="mt-6 mb-2 px-5">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-armadillo-muted">Platforms</span>
        </div>
        {PLATFORMS.map((platform) => (
          <Link
            key={platform}
            href={`/${platform}`}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              pathname === `/${platform}`
                ? 'text-burnt bg-burnt/10 border-r-2 border-burnt'
                : 'text-armadillo-muted hover:text-armadillo-text hover:bg-armadillo-border/30'
            }`}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: `var(--color-platform-${platform})`, color: platform === 'tiktok' ? '#000' : '#fff' }}
            >
              {platformIcons[platform]}
            </span>
            <span>{PLATFORM_NAMES[platform]}</span>
          </Link>
        ))}

        {/* Settings */}
        <div className="mt-6 pt-4 border-t border-armadillo-border">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              pathname === '/settings'
                ? 'text-burnt bg-burnt/10 border-r-2 border-burnt'
                : 'text-armadillo-muted hover:text-armadillo-text hover:bg-armadillo-border/30'
            }`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-armadillo-border">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] text-armadillo-muted">Demo Mode</span>
        </div>
      </div>
    </aside>
  );
}
