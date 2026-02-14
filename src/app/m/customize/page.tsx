'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile, saveMobileProfile, type MobileUserProfile } from '@/lib/mobile-store';
import { USER_TYPES, FREE_METRIC_IDS, getMetricsForUserType, getDefaultSelectedMetrics, isMetricAccessible, CATEGORY_LABELS, type MetricDefinition, type MetricCategory } from '@/lib/user-types';
import BottomNav from '@/components/mobile/BottomNav';
import { Check, Lock, Search, GripVertical } from 'lucide-react';

export default function CustomizePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MobileUserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    const p = getMobileProfile();
    if (!p.onboardingComplete) { router.push('/m/onboarding'); return; }
    setProfile(p);
    setSelectedMetrics(p.selectedMetrics);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const userConfig = USER_TYPES.find(u => u.id === profile.userType);
  const availableMetrics = getMetricsForUserType(profile.userType);

  const filteredMetrics = search
    ? availableMetrics.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : availableMetrics;

  // Group by category
  const grouped: Record<string, MetricDefinition[]> = {};
  for (const m of filteredMetrics) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!profile) return;
    const updated = { ...profile, selectedMetrics };
    saveMobileProfile(updated);
    router.push('/m/dashboard');
  };

  const selectPreset = (preset: 'recommended' | 'all' | 'minimal') => {
    if (!userConfig) return;
    switch (preset) {
      case 'recommended':
        setSelectedMetrics(getDefaultSelectedMetrics(profile.userType, profile.plan));
        break;
      case 'all': {
        const accessible = availableMetrics.filter(m => isMetricAccessible(m.tier, profile.plan)).map(m => m.id);
        setSelectedMetrics(accessible);
        break;
      }
      case 'minimal':
        setSelectedMetrics([...FREE_METRIC_IDS]);
        break;
    }
  };

  const accessibleCount = availableMetrics.filter(m => isMetricAccessible(m.tier, profile.plan)).length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-xl text-armadillo-text">Customize Metrics</h1>
        <p className="text-[11px] text-armadillo-muted mt-0.5">Choose what to track on your dashboard</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-armadillo-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search metrics..."
            className="w-full bg-armadillo-card border border-armadillo-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt"
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="px-5 mb-4 flex gap-2">
        <button
          onClick={() => selectPreset('minimal')}
          className="text-[11px] bg-armadillo-card border border-armadillo-border text-armadillo-muted px-3 py-1.5 rounded-full"
        >
          Minimal ({FREE_METRIC_IDS.length})
        </button>
        <button
          onClick={() => selectPreset('recommended')}
          className="text-[11px] bg-burnt/20 text-burnt px-3 py-1.5 rounded-full font-medium"
        >
          Recommended
        </button>
        {profile.plan !== 'free' && (
          <button
            onClick={() => selectPreset('all')}
            className="text-[11px] bg-armadillo-card border border-armadillo-border text-armadillo-muted px-3 py-1.5 rounded-full"
          >
            All Available ({accessibleCount})
          </button>
        )}
      </div>

      {/* Metric List by Category */}
      <div className="px-5 space-y-5">
        {Object.entries(grouped).map(([category, metrics]) => (
          <div key={category}>
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2">
              {CATEGORY_LABELS[category as MetricCategory]}
            </h3>
            <div className="space-y-1.5">
              {metrics.map((metric) => {
                const isSelected = selectedMetrics.includes(metric.id);
                const isLocked = !isMetricAccessible(metric.tier, profile.plan);
                const tierLabel = isLocked ? (metric.tier === 'pro' ? 'Pro' : 'Lite') : null;
                return (
                  <button
                    key={metric.id}
                    onClick={() => !isLocked && toggleMetric(metric.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-burnt/10 border border-burnt/30'
                        : isLocked
                        ? 'bg-armadillo-card border border-armadillo-border opacity-40'
                        : 'bg-armadillo-card border border-armadillo-border'
                    }`}
                  >
                    <GripVertical size={12} className="text-armadillo-border shrink-0" />
                    <span className="text-base shrink-0">{metric.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-armadillo-text flex items-center gap-1.5">
                        {metric.label}
                        {isLocked && <Lock size={10} className="text-armadillo-muted" />}
                        {tierLabel && <span className="text-[8px] bg-armadillo-border text-armadillo-muted px-1.5 py-0.5 rounded-full uppercase font-bold">{tierLabel}</span>}
                      </div>
                      <div className="text-[10px] text-armadillo-muted truncate">{metric.description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-burnt border-burnt' : 'border-armadillo-border'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA for non-pro users */}
      {profile.plan !== 'pro' && (
        <div className="px-5 mt-5">
          <div className="bg-burnt/10 border border-burnt/30 rounded-2xl p-4 text-center">
            <div className="text-sm font-medium text-armadillo-text mb-1">
              {profile.plan === 'free' ? 'Unlock more metrics' : 'Unlock all metrics'}
            </div>
            <p className="text-[11px] text-armadillo-muted mb-3">
              {profile.plan === 'free'
                ? 'Upgrade to Lite ($4.99/mo) for engagement, visibility, content, and revenue metrics.'
                : 'Upgrade to Pro ($19.99/mo) for audience demographics, competitive intelligence, and AI insights.'}
            </p>
            <button className="bg-burnt hover:bg-burnt-light text-white px-5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">
              {profile.plan === 'free' ? 'Upgrade to Lite' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      )}

      {/* Save Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-5 pb-2 pt-3 bg-gradient-to-t from-armadillo-bg via-armadillo-bg to-transparent">
        <button
          onClick={handleSave}
          className="w-full bg-burnt hover:bg-burnt-light text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wider uppercase transition-colors"
        >
          Save ({selectedMetrics.length} metrics)
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
