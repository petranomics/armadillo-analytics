'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import type { CompoundMetrics } from '@/lib/compound-metrics';

interface Signal {
  label: string;
  value: number | null;
  suffix: string;
  description: string;
  tooltip: string;
}

function InlineTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-armadillo-muted/30 hover:text-armadillo-muted transition-colors"
      >
        <HelpCircle size={10} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full right-0 mb-2 w-56 bg-armadillo-bg border border-armadillo-border rounded-lg shadow-xl p-2.5 pointer-events-none">
          <p className="text-[10px] text-armadillo-text leading-relaxed">{text}</p>
          <div className="absolute top-full right-3 w-2 h-2 bg-armadillo-bg border-r border-b border-armadillo-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function ContentSignalsCard({ metrics }: { metrics: CompoundMetrics }) {
  const signals: Signal[] = [
    { label: 'Hashtag Lift', value: metrics.hashtagLift, suffix: '%', description: 'Eng boost with hashtags', tooltip: 'We compared average engagement on your posts with hashtags versus those without. A positive percentage means hashtags are helping your content get discovered by new people.' },
    { label: 'Collab Multiplier', value: metrics.collabMultiplier, suffix: '%', description: 'Eng boost with tagged creators', tooltip: 'We compared engagement on posts where you tagged other creators versus solo posts. A positive number means collaborating exposes your content to a wider, more engaged audience.' },
    { label: 'Location Boost', value: metrics.locationBoost, suffix: '%', description: 'Eng boost with location tags', tooltip: 'We compared engagement on geo-tagged posts versus untagged ones. Location tags can help your content appear in local explore feeds and searches.' },
    { label: 'Audio Effect', value: metrics.originalAudioEffect, suffix: '%', description: 'Original vs licensed audio', tooltip: 'We compared engagement on posts using your own original audio versus trending or licensed sounds. This shows whether your audience prefers your voice or responds more to popular music and trends.' },
  ].filter(s => s.value !== null);

  const hasCaptionData = metrics.captionLengthImpact !== null;

  if (signals.length === 0 && !hasCaptionData) {
    return (
      <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Content Signals</h3>
        <div className="flex items-center justify-center h-[180px] text-sm text-armadillo-muted text-center px-4">
          Need more posts with varied content styles to detect patterns
        </div>
      </div>
    );
  }

  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
      <h3 className="text-xs font-semibold text-armadillo-text uppercase tracking-wider mb-3">Content Signals</h3>

      <div className="space-y-2.5">
        {signals.map((s) => {
          const val = s.value!;
          const isPositive = val > 5;
          const isNegative = val < -5;
          const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
          const color = isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-armadillo-muted';

          return (
            <div key={s.label} className="flex items-center gap-3 bg-armadillo-bg rounded-lg px-3 py-2">
              <Icon size={14} className={color} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-armadillo-text">{s.label}</div>
                <div className="text-[10px] text-armadillo-muted">{s.description}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-display font-medium ${color}`}>
                  {val > 0 ? '+' : ''}{val}{s.suffix}
                </span>
                <InlineTooltip text={s.tooltip} />
              </div>
            </div>
          );
        })}

        {hasCaptionData && (
          <div className="bg-armadillo-bg rounded-lg px-3 py-2">
            <div className="text-xs font-medium text-armadillo-text mb-1">Caption Length</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-armadillo-muted">Short (&lt;150)</span>
                  <span className="text-[10px] font-medium text-armadillo-text">
                    {metrics.captionLengthImpact!.short.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 bg-armadillo-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-burnt"
                    style={{
                      width: `${Math.min(100, (metrics.captionLengthImpact!.short / Math.max(metrics.captionLengthImpact!.short, metrics.captionLengthImpact!.long)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-armadillo-muted">Long (150+)</span>
                  <span className="text-[10px] font-medium text-armadillo-text">
                    {metrics.captionLengthImpact!.long.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 bg-armadillo-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-burnt"
                    style={{
                      width: `${Math.min(100, (metrics.captionLengthImpact!.long / Math.max(metrics.captionLengthImpact!.short, metrics.captionLengthImpact!.long)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consistency + velocity footer */}
      {(metrics.postingConsistency !== null || metrics.engagementVelocity !== null) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-armadillo-border/50">
          {metrics.postingConsistency !== null && (
            <div className="flex-1 text-center">
              <div className="font-display text-base text-armadillo-text">{metrics.postingConsistency}%</div>
              <div className="text-[9px] text-armadillo-muted uppercase">Consistency</div>
            </div>
          )}
          {metrics.contentTypeWinner && (
            <div className="flex-1 text-center">
              <div className="font-display text-base text-armadillo-text">{metrics.contentTypeWinner.type}</div>
              <div className="text-[9px] text-armadillo-muted uppercase">Top Format</div>
            </div>
          )}
          {metrics.engagementVelocity !== null && (
            <div className="flex-1 text-center">
              <div className="font-display text-base text-armadillo-text">{metrics.engagementVelocity.toLocaleString()}</div>
              <div className="text-[9px] text-armadillo-muted uppercase">Recent Avg Eng</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
