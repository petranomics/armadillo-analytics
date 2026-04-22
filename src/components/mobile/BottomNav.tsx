'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, Share2, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/m/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/m/insights', icon: BarChart3, label: 'Insights' },
  { href: '/m/customize', icon: Sparkles, label: 'Metrics' },
  { href: '/m/export', icon: Share2, label: 'Export' },
  { href: '/m/settings', icon: Settings, label: 'Settings' },
];

function hapticTap() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-armadillo-card/95 backdrop-blur-md border-t border-armadillo-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={hapticTap}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all active:scale-90 min-w-[44px] min-h-[44px] justify-center ${
                isActive
                  ? 'text-burnt'
                  : 'text-armadillo-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] font-medium tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
