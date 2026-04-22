'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';

interface SwipeTabsProps {
  tabs: { key: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: ReactNode;
  accentColor?: string;
}

export default function SwipeTabs({ tabs, activeTab, onTabChange, children, accentColor = '#BF5700' }: SwipeTabsProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [swiping, setSwiping] = useState(false);

  const currentIndex = tabs.findIndex(t => t.key === activeTab);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    setSwiping(false);

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (deltaX < 0 && currentIndex < tabs.length - 1) {
      // Swipe left → next tab
      onTabChange(tabs[currentIndex + 1].key);
      if ('vibrate' in navigator) navigator.vibrate(10);
    } else if (deltaX > 0 && currentIndex > 0) {
      // Swipe right → previous tab
      onTabChange(tabs[currentIndex - 1].key);
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, [swiping, currentIndex, tabs, onTabChange]);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              onTabChange(tab.key);
              if ('vibrate' in navigator) navigator.vibrate(10);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 min-h-[40px] ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-armadillo-muted bg-armadillo-card'
            }`}
            style={activeTab === tab.key ? { backgroundColor: accentColor } : undefined}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="min-h-[200px]"
      >
        {children}
      </div>
    </div>
  );
}
