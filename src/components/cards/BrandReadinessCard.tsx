'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { CompoundMetrics } from '@/lib/compound-metrics';

function formatDollar(n: number): string {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n.toLocaleString();
}

function getReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Brand Ready', color: '#22C55E' };
  if (score >= 60) return { label: 'Growing', color: '#BF5700' };
  if (score >= 40) return { label: 'Building', color: '#E87A2A' };
  return { label: 'Getting Started', color: '#6B82A8' };
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-armadillo-bg border border-armadillo-border rounded-lg shadow-xl p-3 pointer-events-none">
          <p className="text-[11px] text-armadillo-text leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-armadillo-bg border-r border-b border-armadillo-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function BrandReadinessCard({ metrics }: { metrics: CompoundMetrics }) {
  const { brandReadinessScore, estimatedCPM, estimatedPostValue } = metrics;

  if (brandReadinessScore === null) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Brand Readiness</h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted text-center px-4">
          Need 500+ followers to estimate brand readiness
        </div>
      </div>
    );
  }

  const { label, color } = getReadinessLabel(brandReadinessScore);

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider">Brand Readiness</h3>
        <Tooltip text="Composite score (0-100) based on six factors: engagement rate, follower tier, posting consistency, content strategy signals (hashtags, collabs), post volume, and posting frequency. 80+ positions you for paid partnerships. 60-79 means the fundamentals are there — focus on consistency and engagement to close the gap.">
          <HelpCircle size={12} className="text-armadillo-muted/40 hover:text-armadillo-muted transition-colors" />
        </Tooltip>
      </div>

      {/* Score gauge */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-armadillo-border)" strokeWidth="8" opacity="0.3" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(brandReadinessScore / 100) * 314} 314`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl text-armadillo-text">{brandReadinessScore}</span>
            <span className="text-[9px] text-armadillo-muted uppercase tracking-wider">{label}</span>
          </div>
        </div>
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-2 gap-2">
        {estimatedCPM !== null && (
          <Tooltip text="Estimated cost per 1,000 impressions. Industry range is $5-30, scaled by your engagement rate. Higher engagement commands a premium because each impression is more likely to convert. Use this as a floor when negotiating media buys.">
            <div className="bg-armadillo-bg rounded-lg p-2.5 text-center cursor-help w-full">
              <div className="font-display text-lg text-armadillo-text">${estimatedCPM}</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[9px] text-armadillo-muted uppercase tracking-wider">Est. CPM</span>
                <HelpCircle size={8} className="text-armadillo-muted/40" />
              </div>
            </div>
          </Tooltip>
        )}
        {estimatedPostValue !== null && (
          <Tooltip text={`Estimated starting rate for a single sponsored post. Formula: (followers / 1,000) × CPM ($${estimatedCPM}) × engagement multiplier. Your engagement rate pushes this above baseline because an active audience delivers more value per impression. Use this as a negotiation anchor — actual rates should factor in exclusivity, usage rights, and deliverable complexity.`}>
            <div className="bg-armadillo-bg rounded-lg p-2.5 text-center cursor-help w-full">
              <div className="font-display text-lg text-armadillo-text">{formatDollar(estimatedPostValue)}</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[9px] text-armadillo-muted uppercase tracking-wider">Est. Post Value</span>
                <HelpCircle size={8} className="text-armadillo-muted/40" />
              </div>
            </div>
          </Tooltip>
        )}
      </div>

      <p className="text-[9px] text-armadillo-muted/60 text-center mt-2">
        Based on engagement rate, follower tier, and posting consistency
      </p>
    </div>
  );
}
