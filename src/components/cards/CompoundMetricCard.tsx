'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface CompoundMetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  icon: React.ReactNode;
  sentiment?: 'positive' | 'negative' | 'neutral';
  comparison?: string;
}

export default function CompoundMetricCard({ label, value, subtitle, tooltip, icon, sentiment = 'neutral', comparison }: CompoundMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const sentimentColor = sentiment === 'positive' ? 'text-success' : sentiment === 'negative' ? 'text-danger' : 'text-armadillo-muted';
  const SentimentIcon = sentiment === 'positive' ? TrendingUp : sentiment === 'negative' ? TrendingDown : Minus;

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-armadillo-muted">{icon}</span>
        <div className="flex items-center gap-1.5">
          {tooltip && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-armadillo-muted/40 hover:text-armadillo-muted transition-colors"
            >
              <HelpCircle size={12} />
            </button>
          )}
          <SentimentIcon size={12} className={sentimentColor} />
        </div>
      </div>
      <div className="font-display text-xl text-armadillo-text">{value}</div>
      <div className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium mt-0.5">{label}</div>
      {subtitle && (
        <p className="text-[10px] text-armadillo-muted/70 mt-1 leading-relaxed">{subtitle}</p>
      )}
      {comparison && (
        <p className={`text-[10px] mt-1 ${sentimentColor}`}>{comparison}</p>
      )}

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-armadillo-bg border border-armadillo-border rounded-lg shadow-xl p-3 pointer-events-none">
          <p className="text-[11px] text-armadillo-text leading-relaxed">{tooltip}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-armadillo-bg border-r border-b border-armadillo-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
