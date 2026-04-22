'use client';

import { useEffect } from 'react';
import BottomNav from '@/components/mobile/BottomNav';

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Insights page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-armadillo-bg pb-24 px-5 pt-12">
      <h1 className="font-display text-xl text-armadillo-text mb-4">Something went wrong</h1>
      <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 mb-4">
        <p className="text-sm text-danger font-mono break-all">{error.message}</p>
        {error.stack && (
          <pre className="text-[10px] text-armadillo-muted mt-3 overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
            {error.stack}
          </pre>
        )}
      </div>
      <button
        onClick={reset}
        className="bg-burnt text-white px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
      >
        Try again
      </button>
      <BottomNav />
    </div>
  );
}
