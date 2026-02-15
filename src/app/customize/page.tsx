'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, saveUserProfile, type UserProfile } from '@/lib/store';
import { USER_TYPES, FREE_METRIC_IDS, getMetricsForUserType, getDefaultSelectedMetrics, isMetricAccessible, CATEGORY_LABELS, type MetricDefinition, type MetricCategory } from '@/lib/user-types';
import { Check, Lock, Search, GripVertical } from 'lucide-react';

export default function CustomizePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) { router.push('/onboarding'); return; }
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
    saveUserProfile(updated);
    router.push('/');
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
    <div className="max-w-5xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text">Customize Metrics</h1>
        <p className="text-sm text-armadillo-muted mt-1">Choose what to track on your dashboard</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-armadillo-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search metrics..."
          className="w-full bg-armadillo-card border border-armadillo-border rounded-xl pl-11 pr-4 py-3 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
        />
      </div>

      {/* Presets */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => selectPreset('minimal')}
          className="text-xs bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-full hover:border-armadillo-muted/50 transition-colors"
        >
          Minimal ({FREE_METRIC_IDS.length})
        </button>
        <button
          onClick={() => selectPreset('recommended')}
          className="text-xs bg-burnt/20 text-burnt px-4 py-2 rounded-full font-medium"
        >
          Recommended
        </button>
        {profile.plan !== 'free' && (
          <button
            onClick={() => selectPreset('all')}
            className="text-xs bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-full hover:border-armadillo-muted/50 transition-colors"
          >
            All Available ({accessibleCount})
          </button>
        )}
      </div>

      {/* Metric Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(grouped).map(([category, metrics]) => (
          <div key={category}>
            <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">
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
                        : 'bg-armadillo-card border border-armadillo-border hover:border-armadillo-muted/30'
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

      {/* Upgrade CTA */}
      {profile.plan !== 'pro' && (
        <div className="mt-8 bg-burnt/10 border border-burnt/30 rounded-2xl p-6 text-center">
          <div className="text-sm font-medium text-armadillo-text mb-1">
            {profile.plan === 'free' ? 'Unlock more metrics' : 'Unlock all metrics'}
          </div>
          <p className="text-xs text-armadillo-muted mb-3">
            {profile.plan === 'free'
              ? 'Upgrade to Lite ($4.99/mo) for engagement, visibility, content, and revenue metrics.'
              : 'Upgrade to Pro ($19.99/mo) for audience demographics, competitive intelligence, and AI insights.'}
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-burnt hover:bg-burnt-light text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            {profile.plan === 'free' ? 'Upgrade to Lite' : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      {/* Fixed Save Bar */}
      <div className="fixed bottom-0 left-60 right-0 z-40 border-t border-armadillo-border bg-armadillo-bg/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <p className="text-sm text-armadillo-muted">
            {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleSave}
            className="bg-burnt hover:bg-burnt-light text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Save ({selectedMetrics.length} metrics)
          </button>
        </div>
      </div>
    </div>
  );
}
