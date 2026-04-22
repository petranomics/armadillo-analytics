'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-burnt/90 backdrop-blur-sm text-white text-xs font-medium py-2 px-4">
      <WifiOff size={14} />
      <span>You&apos;re offline. Showing cached data.</span>
    </div>
  );
}
