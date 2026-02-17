'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { USER_TYPES, FREE_METRIC_IDS, getMetricsForUserType, getDefaultSelectedMetrics, isMetricAccessible, groupMetricsByCategory, CATEGORY_LABELS, INITIAL_ONBOARDING, type OnboardingState } from '@/lib/user-types';
import { PLATFORM_NAMES, PLATFORMS } from '@/lib/constants';
import { saveUserProfile } from '@/lib/store';
import type { Platform } from '@/lib/types';
import { ChevronRight, ChevronLeft, Check, Lock, ArrowRight, AtSign, Plus, X, Users, Sparkles } from 'lucide-react';
import CityAutocomplete from '@/components/mobile/CityAutocomplete';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING);

  const setStep = (step: number) => setState(s => ({ ...s, step }));
  const selectedUserConfig = USER_TYPES.find(u => u.id === state.userType);

  const handleFinish = () => {
    if (!state.userType || state.selectedPlatforms.length === 0) return;

    const metrics = state.selectedMetrics.length > 0
      ? state.selectedMetrics
      : selectedUserConfig?.defaultMetrics || [];

    saveUserProfile({
      userType: state.userType,
      quickFormAnswers: state.quickFormAnswers,
      selectedPlatforms: state.selectedPlatforms,
      selectedMetrics: metrics,
      plan: state.plan,
      onboardingComplete: true,
      platformUsernames: state.platformUsernames,
      competitorAccounts: state.competitorAccounts,
      apifyApiKey: '',
      trackedHashtags: [],
      trackedSubreddits: [],
      tiktokNiche: '',
    });

    router.push('/');
  };

  const toggleMultiSelect = (fieldId: string, value: string) => {
    setState(s => {
      const current = s.quickFormAnswers[fieldId];
      const currentArr = Array.isArray(current) ? current : current ? [current] : [];
      const newArr = currentArr.includes(value)
        ? currentArr.filter(v => v !== value)
        : [...currentArr, value];
      return { ...s, quickFormAnswers: { ...s.quickFormAnswers, [fieldId]: newArr } };
    });
  };

  const togglePlatform = (platform: Platform) => {
    setState(s => {
      const isSelected = s.selectedPlatforms.includes(platform);
      if (s.plan !== 'pro') {
        return { ...s, selectedPlatforms: isSelected ? [] : [platform] };
      }
      const newPlatforms = isSelected
        ? s.selectedPlatforms.filter(p => p !== platform)
        : [...s.selectedPlatforms, platform];
      return { ...s, selectedPlatforms: newPlatforms };
    });
  };

  return (
    <div className="min-h-screen bg-armadillo-bg flex flex-col items-center">
      {/* Progress Bar */}
      {state.step > 0 && (
        <div className="w-full max-w-3xl px-6 pt-8">
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < state.step ? 'bg-burnt' : i === state.step ? 'bg-burnt/50' : 'bg-armadillo-border'
                }`}
              />
            ))}
          </div>
          <div className="text-center mt-3">
            <span className="text-xs text-armadillo-muted uppercase tracking-widest">
              Step {state.step} of {TOTAL_STEPS}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-3xl px-6 flex flex-col">
        {/* STEP 0: Welcome */}
        {state.step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-24 h-24 rounded-2xl bg-burnt flex items-center justify-center mb-8">
              <svg viewBox="0 0 40 40" width="48" height="48" fill="none">
                <ellipse cx="20" cy="22" rx="12" ry="8" fill="#FFF3E6" />
                <ellipse cx="20" cy="22" rx="10" ry="6" fill="#BF5700" />
                <rect x="8" y="20" width="4" height="6" rx="2" fill="#FFF3E6" />
                <rect x="28" y="20" width="4" height="6" rx="2" fill="#FFF3E6" />
                <rect x="14" y="26" width="3" height="4" rx="1.5" fill="#FFF3E6" />
                <rect x="23" y="26" width="3" height="4" rx="1.5" fill="#FFF3E6" />
                <ellipse cx="30" cy="18" rx="3" ry="2" fill="#FFF3E6" />
                <circle cx="31" cy="17" r="1" fill="#0F1117" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-armadillo-text mb-2">Armadillo Analytics</h1>
            <p className="text-burnt text-sm tracking-widest uppercase mb-10">Texas-Built. Creator-First.</p>
            <p className="text-armadillo-muted text-base leading-relaxed mb-14 max-w-md">
              Your social media analytics command center. Track metrics, prove your value, and grow smarter.
            </p>
            <button
              onClick={() => setStep(1)}
              className="bg-burnt hover:bg-burnt-light text-white px-10 py-4 rounded-2xl text-sm font-semibold tracking-wider uppercase flex items-center gap-2 transition-colors"
            >
              Get Started <ArrowRight size={18} />
            </button>
            <p className="text-xs text-armadillo-muted mt-4">Takes about 60 seconds</p>
          </div>
        )}

        {/* STEP 1: User Type */}
        {state.step === 1 && (
          <div className="flex-1 flex flex-col py-10">
            <button onClick={() => setStep(0)} className="text-armadillo-muted mb-6 self-start">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display text-3xl text-armadillo-text mb-2 text-center">What describes you best?</h2>
            <p className="text-sm text-armadillo-muted mb-8 text-center">This helps us customize your analytics dashboard.</p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {USER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setState(s => ({
                      ...s,
                      userType: type.id,
                      selectedPlatforms: type.primaryPlatforms.slice(0, 1),
                      selectedMetrics: [...FREE_METRIC_IDS],
                    }));
                    setStep(2);
                  }}
                  className={`text-left p-5 rounded-2xl border transition-all hover:border-burnt/50 ${
                    state.userType === type.id
                      ? 'border-burnt bg-burnt/10'
                      : 'border-armadillo-border bg-armadillo-card'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: type.color + '20', color: type.color }}
                    >
                      {type.icon}
                    </div>
                    <div className="text-sm font-medium text-armadillo-text">{type.label}</div>
                  </div>
                  <p className="text-[11px] text-armadillo-muted leading-relaxed">{type.description}</p>
                  {type.primaryPlatforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {type.primaryPlatforms.map(p => (
                        <span key={p} className="inline-block rounded-full bg-armadillo-bg px-2.5 py-0.5 text-[10px] text-armadillo-muted">
                          {PLATFORM_NAMES[p]}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Quick Form */}
        {state.step === 2 && selectedUserConfig && (
          <div className="flex-1 flex flex-col py-10">
            <button onClick={() => setStep(1)} className="text-armadillo-muted mb-6 self-start">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display text-3xl text-armadillo-text mb-2 text-center">Tell us a bit more</h2>
            <p className="text-sm text-armadillo-muted mb-8 text-center">Helps us tailor your metrics and benchmarks.</p>

            <div className="space-y-6 max-w-lg mx-auto w-full">
              {selectedUserConfig.quickFormFields.map((field) => (
                <div key={field.id}>
                  <label className="text-xs font-medium text-armadillo-muted tracking-wider uppercase mb-2 block">
                    {field.label}
                    {field.type === 'multi-select' && (
                      <span className="text-burnt/70 ml-1 normal-case tracking-normal">(select all that apply)</span>
                    )}
                  </label>

                  {field.type === 'select' && field.options ? (
                    <div className="space-y-2">
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setState(s => ({
                            ...s,
                            quickFormAnswers: { ...s.quickFormAnswers, [field.id]: opt.value },
                          }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                            state.quickFormAnswers[field.id] === opt.value
                              ? 'border-burnt bg-burnt/10 text-armadillo-text'
                              : 'border-armadillo-border bg-armadillo-card text-armadillo-muted hover:border-armadillo-muted/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'multi-select' && field.options ? (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((opt) => {
                        const currentArr = Array.isArray(state.quickFormAnswers[field.id])
                          ? (state.quickFormAnswers[field.id] as string[])
                          : [];
                        const isSelected = currentArr.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleMultiSelect(field.id, opt.value)}
                            className={`px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                              isSelected
                                ? 'border-burnt bg-burnt/10 text-armadillo-text'
                                : 'border-armadillo-border bg-armadillo-card text-armadillo-muted hover:border-armadillo-muted/30'
                            }`}
                          >
                            {opt.label}
                            {isSelected && <Check size={14} className="text-burnt" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.id === 'location' ? (
                    <CityAutocomplete
                      value={(state.quickFormAnswers[field.id] as string) || ''}
                      onChange={(val) => setState(s => ({
                        ...s,
                        quickFormAnswers: { ...s.quickFormAnswers, [field.id]: val },
                      }))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder}
                      value={(state.quickFormAnswers[field.id] as string) || ''}
                      onChange={(e) => setState(s => ({
                        ...s,
                        quickFormAnswers: { ...s.quickFormAnswers, [field.id]: e.target.value },
                      }))}
                      className="w-full bg-armadillo-card border border-armadillo-border rounded-xl px-4 py-3 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="max-w-lg mx-auto w-full mt-8">
              <button
                onClick={() => setStep(3)}
                className="w-full bg-burnt hover:bg-burnt-light text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Plan + Platform Selection */}
        {state.step === 3 && (
          <div className="flex-1 flex flex-col py-10">
            <button onClick={() => setStep(2)} className="text-armadillo-muted mb-6 self-start">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display text-3xl text-armadillo-text mb-2 text-center">Choose your plan</h2>
            <p className="text-sm text-armadillo-muted mb-8 text-center">Start free and upgrade anytime.</p>

            {/* Plan Cards */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {/* Free */}
              <button
                onClick={() => setState(s => ({
                  ...s,
                  plan: 'free',
                  selectedPlatforms: s.selectedPlatforms.slice(0, 1),
                  selectedMetrics: [...FREE_METRIC_IDS],
                }))}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  state.plan === 'free' ? 'border-burnt bg-burnt/10' : 'border-armadillo-border bg-armadillo-card'
                }`}
              >
                <div className="text-xs text-armadillo-muted uppercase tracking-wider mb-1">Free</div>
                <div className="font-display text-3xl text-armadillo-text mb-3">$0</div>
                <div className="space-y-1">
                  <span className="block text-[11px] text-armadillo-muted">1 platform</span>
                  <span className="block text-[11px] text-armadillo-muted">Followers & trends</span>
                  <span className="block text-[11px] text-armadillo-muted">Like count & engagement</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-4 ${
                  state.plan === 'free' ? 'bg-burnt border-burnt' : 'border-armadillo-border'
                }`}>
                  {state.plan === 'free' && <Check size={12} className="text-white" />}
                </div>
              </button>

              {/* Lite */}
              <button
                onClick={() => setState(s => ({
                  ...s,
                  plan: 'lite',
                  selectedPlatforms: s.selectedPlatforms.slice(0, 1),
                  selectedMetrics: s.userType ? getDefaultSelectedMetrics(s.userType, 'lite') : [...FREE_METRIC_IDS],
                }))}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  state.plan === 'lite' ? 'border-burnt bg-burnt/10' : 'border-armadillo-border bg-armadillo-card'
                }`}
              >
                <div className="text-xs text-burnt uppercase tracking-wider mb-1 font-medium">Lite</div>
                <div className="font-display text-3xl text-armadillo-text mb-3">$4.99<span className="text-sm text-armadillo-muted">/mo</span></div>
                <div className="space-y-1">
                  <span className="block text-[11px] text-armadillo-muted">1 platform</span>
                  <span className="block text-[11px] text-armadillo-muted">All engagement & visibility</span>
                  <span className="block text-[11px] text-armadillo-muted">Content performance</span>
                  <span className="block text-[11px] text-armadillo-muted">Revenue metrics</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-4 ${
                  state.plan === 'lite' ? 'bg-burnt border-burnt' : 'border-armadillo-border'
                }`}>
                  {state.plan === 'lite' && <Check size={12} className="text-white" />}
                </div>
              </button>

              {/* Pro */}
              <button
                onClick={() => setState(s => ({
                  ...s,
                  plan: 'pro',
                  selectedMetrics: s.userType ? getDefaultSelectedMetrics(s.userType, 'pro') : [...FREE_METRIC_IDS],
                }))}
                className={`p-5 rounded-2xl border text-left transition-all relative ${
                  state.plan === 'pro' ? 'border-burnt bg-burnt/10' : 'border-armadillo-border bg-armadillo-card'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-burnt text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Best Value</div>
                <div className="text-xs text-burnt uppercase tracking-wider mb-1 font-medium">Pro</div>
                <div className="font-display text-3xl text-armadillo-text mb-3">$19.99<span className="text-sm text-armadillo-muted">/mo</span></div>
                <div className="space-y-1">
                  <span className="block text-[11px] text-armadillo-muted">All platforms</span>
                  <span className="block text-[11px] text-armadillo-muted">50+ metrics</span>
                  <span className="block text-[11px] text-armadillo-muted">Audience & competitive intel</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Sparkles size={12} className="text-burnt" />
                  <span className="text-[11px] text-burnt font-medium">AI-powered analytics</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-3 ${
                  state.plan === 'pro' ? 'bg-burnt border-burnt' : 'border-armadillo-border'
                }`}>
                  {state.plan === 'pro' && <Check size={12} className="text-white" />}
                </div>
              </button>
            </div>

            {/* Platform Selection */}
            <h3 className="text-xs font-medium text-armadillo-muted tracking-wider uppercase mb-4">
              {state.plan === 'pro' ? 'Select your platforms' : 'Select your platform'}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {PLATFORMS.map((platform) => {
                const isRecommended = selectedUserConfig?.primaryPlatforms.includes(platform);
                const isSelected = state.selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-burnt bg-burnt/10'
                        : 'border-armadillo-border bg-armadillo-card hover:border-armadillo-muted/30'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: `var(--color-platform-${platform})`, color: platform === 'tiktok' ? '#000' : '#fff' }}
                    >
                      {PLATFORM_NAMES[platform].charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-armadillo-text font-medium">{PLATFORM_NAMES[platform]}</div>
                      {isRecommended && <div className="text-[10px] text-burnt">Recommended for you</div>}
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

            {state.plan !== 'pro' && state.selectedPlatforms.length > 0 && (
              <p className="text-xs text-armadillo-muted text-center mt-3">
                {state.plan === 'free' ? 'Free' : 'Lite'} plan includes 1 platform. Upgrade to Pro for all.
              </p>
            )}

            <button
              onClick={() => setStep(4)}
              disabled={state.selectedPlatforms.length === 0}
              className="w-full max-w-md mx-auto bg-burnt hover:bg-burnt-light disabled:opacity-40 text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors mt-8"
            >
              Connect Accounts <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 4: Username Input + Competitors */}
        {state.step === 4 && (
          <div className="flex-1 flex flex-col py-10">
            <button onClick={() => setStep(3)} className="text-armadillo-muted mb-6 self-start">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display text-3xl text-armadillo-text mb-2 text-center">Connect your accounts</h2>
            <p className="text-sm text-armadillo-muted mb-8 text-center">Enter your username for each platform so we can pull your analytics.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
              {/* Platform Usernames */}
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-armadillo-muted tracking-wider uppercase">Platform Usernames</h3>
                {state.selectedPlatforms.map((platform) => (
                  <div key={platform}>
                    <label className="text-xs font-medium text-armadillo-muted tracking-wider uppercase mb-2 flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: `var(--color-platform-${platform})`, color: platform === 'tiktok' ? '#000' : '#fff' }}
                      >
                        {PLATFORM_NAMES[platform].charAt(0)}
                      </div>
                      {PLATFORM_NAMES[platform]}
                    </label>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-armadillo-muted" />
                      <input
                        type="text"
                        placeholder={`${PLATFORM_NAMES[platform]} username`}
                        value={state.platformUsernames[platform] || ''}
                        onChange={(e) => setState(s => ({
                          ...s,
                          platformUsernames: { ...s.platformUsernames, [platform]: e.target.value },
                        }))}
                        className="w-full bg-armadillo-card border border-armadillo-border rounded-xl pl-10 pr-4 py-3 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Competitor Accounts */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-burnt" />
                  <h3 className="text-xs font-medium text-armadillo-text tracking-wider uppercase">Competitor Accounts</h3>
                  <span className="text-[10px] text-armadillo-muted">(optional)</span>
                  {state.plan !== 'pro' && (
                    <span className="text-[8px] bg-armadillo-border text-armadillo-muted px-1.5 py-0.5 rounded-full uppercase font-bold">Pro</span>
                  )}
                </div>
                <p className="text-[11px] text-armadillo-muted mb-3">
                  {state.plan === 'pro'
                    ? "Add accounts to benchmark against."
                    : "Upgrade to Pro for competitive benchmarking."}
                </p>
                {state.plan === 'pro' && (
                  <div className="space-y-2">
                    {state.competitorAccounts.map((account, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-armadillo-muted" />
                          <input
                            type="text"
                            value={account}
                            onChange={(e) => setState(s => {
                              const updated = [...s.competitorAccounts];
                              updated[i] = e.target.value;
                              return { ...s, competitorAccounts: updated };
                            })}
                            placeholder="competitor username"
                            className="w-full bg-armadillo-card border border-armadillo-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => setState(s => ({
                            ...s,
                            competitorAccounts: s.competitorAccounts.filter((_, idx) => idx !== i),
                          }))}
                          className="w-9 h-9 rounded-lg border border-armadillo-border flex items-center justify-center text-armadillo-muted hover:text-danger hover:border-danger/40 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setState(s => ({ ...s, competitorAccounts: [...s.competitorAccounts, ''] }))}
                      className="flex items-center gap-2 text-xs text-burnt font-medium py-2"
                    >
                      <Plus size={14} /> Add competitor
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-armadillo-muted text-center mb-4 mt-6">
              You can always update these later in Settings.
            </p>

            <button
              onClick={() => setStep(5)}
              className="w-full max-w-md mx-auto bg-burnt hover:bg-burnt-light text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
            >
              Choose Metrics <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 5: Metric Selection */}
        {state.step === 5 && selectedUserConfig && (
          <div className="flex-1 flex flex-col py-10">
            <button onClick={() => setStep(4)} className="text-armadillo-muted mb-6 self-start">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-display text-3xl text-armadillo-text mb-2 text-center">Your metrics</h2>
            <p className="text-sm text-armadillo-muted mb-2 text-center">We&apos;ve selected the best ones for you. Customize anytime.</p>

            {/* Presets */}
            <div className="flex gap-2 mb-6 justify-center">
              <button
                onClick={() => setState(s => ({ ...s, selectedMetrics: s.userType ? getDefaultSelectedMetrics(s.userType, s.plan) : [...FREE_METRIC_IDS] }))}
                className="text-[11px] bg-burnt/20 text-burnt px-4 py-2 rounded-full font-medium"
              >
                Recommended
              </button>
              {state.plan !== 'free' && (
                <button
                  onClick={() => {
                    const allMetrics = getMetricsForUserType(selectedUserConfig.id);
                    const accessible = allMetrics.filter(m => isMetricAccessible(m.tier, state.plan)).map(m => m.id);
                    setState(s => ({ ...s, selectedMetrics: accessible }));
                  }}
                  className="text-[11px] bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-full"
                >
                  All Available
                </button>
              )}
              <button
                onClick={() => setState(s => ({ ...s, selectedMetrics: [...FREE_METRIC_IDS] }))}
                className="text-[11px] bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-full"
              >
                Minimal
              </button>
            </div>

            {/* Metric Grid */}
            <div className="flex-1 overflow-y-auto max-h-[450px] space-y-6 pr-1">
              {(() => {
                const allMetrics = getMetricsForUserType(selectedUserConfig.id);
                const grouped = groupMetricsByCategory(allMetrics);
                return Object.entries(grouped).map(([cat, metrics]) => (
                  <div key={cat}>
                    <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-2">
                      {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {metrics.map((metric) => {
                        const isSelected = state.selectedMetrics.includes(metric.id);
                        const isLocked = !isMetricAccessible(metric.tier, state.plan);
                        const tierLabel = isLocked ? (metric.tier === 'pro' ? 'Pro' : 'Lite') : null;
                        return (
                          <button
                            key={metric.id}
                            onClick={() => {
                              if (isLocked) return;
                              setState(s => ({
                                ...s,
                                selectedMetrics: isSelected
                                  ? s.selectedMetrics.filter(id => id !== metric.id)
                                  : [...s.selectedMetrics, metric.id],
                              }));
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-burnt/10 border border-burnt/30'
                                : isLocked
                                ? 'bg-armadillo-card border border-armadillo-border opacity-50'
                                : 'bg-armadillo-card border border-armadillo-border hover:border-armadillo-muted/30'
                            }`}
                          >
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
                ));
              })()}
            </div>

            <div className="pt-6 space-y-3">
              <div className="text-center text-xs text-armadillo-muted">
                {state.selectedMetrics.length} metrics selected
              </div>
              <button
                onClick={handleFinish}
                className="w-full max-w-md mx-auto bg-burnt hover:bg-burnt-light text-white py-3.5 rounded-2xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
              >
                Launch Dashboard <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
