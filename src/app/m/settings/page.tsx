'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, saveUserProfile, clearUserProfile, getPlatformAccounts, type UserProfile } from '@/lib/store';
import { USER_TYPES } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { Save, Trash2, CheckCircle, Crown, Hash, X, Plus, Check } from 'lucide-react';
import type { Platform } from '@/lib/types';
import BottomNav from '@/components/mobile/BottomNav';

const PLATFORM_PLACEHOLDERS: Record<Platform, string> = {
  tiktok: 'username (e.g. texasarmadillo)',
  instagram: 'username (e.g. texasarmadillo)',
  youtube: 'channel URL (e.g. youtube.com/@texasarmadillo)',
  twitter: 'handle without @ (e.g. texasarmadillo)',
  linkedin: 'profile URL (e.g. linkedin.com/in/texasarmadillo)',
};

export default function MobileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accounts, setAccounts] = useState<Partial<Record<Platform, string[]>>>({});
  const [activeAccount, setActiveAccount] = useState<Partial<Record<Platform, string>>>({});
  const [newAccountInput, setNewAccountInput] = useState<Partial<Record<Platform, string>>>({});
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [trackedHashtags, setTrackedHashtags] = useState<string[]>([]);
  const [trackedSubreddits, setTrackedSubreddits] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [subredditInput, setSubredditInput] = useState('');
  const [saved, setSaved] = useState(false);

  const MAX_ACCOUNTS = 3;

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) {
      router.push('/m/onboarding');
      return;
    }
    setProfile(p);

    // Build accounts from both new and legacy fields
    const accts: Partial<Record<Platform, string[]>> = {};
    const active: Partial<Record<Platform, string>> = {};
    for (const platform of p.selectedPlatforms) {
      accts[platform] = getPlatformAccounts(p, platform);
      active[platform] = p.activeAccount?.[platform] || accts[platform]?.[0] || '';
    }
    setAccounts(accts);
    setActiveAccount(active);
    setCompetitors(p.competitorAccounts);
    setTrackedHashtags(p.trackedHashtags || []);
    setTrackedSubreddits(p.trackedSubreddits || []);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const userConfig = USER_TYPES.find(u => u.id === profile.userType);
  const planLabel = profile.plan === 'pro' ? 'Pro' : profile.plan === 'lite' ? 'Lite' : 'Free';

  const handleSave = () => {
    // Build legacy platformUsernames from active accounts for backward compat
    const legacyUsernames: Partial<Record<Platform, string>> = {};
    for (const platform of profile.selectedPlatforms) {
      legacyUsernames[platform] = activeAccount[platform] || accounts[platform]?.[0] || '';
    }

    const updated: UserProfile = {
      ...profile,
      platformUsernames: legacyUsernames,
      platformAccounts: accounts,
      activeAccount,
      competitorAccounts: competitors,
      trackedHashtags,
      trackedSubreddits,
    };
    saveUserProfile(updated);
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Reset all data? This will erase your profile and return to onboarding.')) {
      clearUserProfile();
      router.push('/m/onboarding');
    }
  };

  const addCompetitor = () => {
    const handle = newCompetitor.trim().replace('@', '');
    if (handle && !competitors.includes(handle)) {
      setCompetitors([...competitors, handle]);
      setNewCompetitor('');
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !trackedHashtags.includes(tag)) {
      setTrackedHashtags([...trackedHashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setTrackedHashtags(trackedHashtags.filter(t => t !== tag));
  };

  const addSubreddit = () => {
    const sub = subredditInput.trim().replace(/^r\//, '').toLowerCase();
    if (sub && !trackedSubreddits.includes(sub)) {
      setTrackedSubreddits([...trackedSubreddits, sub]);
    }
    setSubredditInput('');
  };

  const removeSubreddit = (sub: string) => {
    setTrackedSubreddits(trackedSubreddits.filter(s => s !== sub));
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-xl text-armadillo-text">Settings</h1>
        <p className="text-[11px] text-armadillo-muted mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Plan */}
      <div className="px-5 mb-4">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-burnt" />
            <h2 className="text-sm font-medium text-armadillo-text">Plan</h2>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-burnt/20 text-burnt px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                {planLabel}
              </span>
              <span className="text-xs text-armadillo-muted">
                {profile.plan === 'free' && '$0/month'}
                {profile.plan === 'lite' && '$4.99/month'}
                {profile.plan === 'pro' && '$19.99/month'}
              </span>
            </div>
            <span className="text-[10px] text-armadillo-muted">{userConfig?.label}</span>
          </div>
          {profile.plan !== 'pro' && (
            <button className="w-full bg-burnt hover:bg-burnt-light text-white py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors">
              {profile.plan === 'free' ? 'Upgrade to Lite' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>

      {/* Connected Platforms & Accounts */}
      <div className="px-5 mb-4">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-armadillo-text">Connected Accounts</h2>
            <span className="text-[10px] text-armadillo-muted">Up to {MAX_ACCOUNTS} per platform</span>
          </div>
          <div className="space-y-4">
            {profile.selectedPlatforms.map((platform) => {
              const platformAccts = accounts[platform] || [];
              const isActive = (username: string) => activeAccount[platform] === username;
              const canAdd = platformAccts.length < MAX_ACCOUNTS;

              const addAccount = () => {
                const val = (newAccountInput[platform] || '').trim().replace(/^@/, '');
                if (!val || platformAccts.includes(val)) return;
                const updated = { ...accounts, [platform]: [...platformAccts, val] };
                setAccounts(updated);
                // Auto-activate if first account
                if (platformAccts.length === 0) {
                  setActiveAccount({ ...activeAccount, [platform]: val });
                }
                setNewAccountInput({ ...newAccountInput, [platform]: '' });
              };

              const removeAccount = (username: string) => {
                const remaining = platformAccts.filter(u => u !== username);
                setAccounts({ ...accounts, [platform]: remaining });
                // If removed the active one, switch to first remaining
                if (activeAccount[platform] === username) {
                  setActiveAccount({ ...activeAccount, [platform]: remaining[0] || '' });
                }
              };

              const switchAccount = (username: string) => {
                setActiveAccount({ ...activeAccount, [platform]: username });
              };

              return (
                <div key={platform}>
                  <label className="flex items-center gap-2 text-xs font-medium text-armadillo-muted mb-2">
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold"
                      style={{
                        backgroundColor: `var(--color-platform-${platform})`,
                        color: platform === 'tiktok' ? '#000' : '#fff',
                      }}
                    >
                      {platform.charAt(0).toUpperCase()}
                    </span>
                    {PLATFORM_NAMES[platform]}
                  </label>

                  {/* Existing accounts */}
                  {platformAccts.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {platformAccts.map((username) => (
                        <div
                          key={username}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm border transition-colors ${
                            isActive(username)
                              ? 'bg-burnt/10 border-burnt/30 text-armadillo-text'
                              : 'bg-armadillo-bg border-armadillo-border text-armadillo-muted'
                          }`}
                        >
                          <button
                            onClick={() => switchAccount(username)}
                            className="flex items-center gap-2 flex-1 text-left min-h-[28px]"
                          >
                            {isActive(username) ? (
                              <Check size={14} className="text-burnt shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-armadillo-border shrink-0" />
                            )}
                            <span className="truncate">@{username}</span>
                            {isActive(username) && (
                              <span className="text-[9px] bg-burnt/20 text-burnt px-1.5 py-0.5 rounded-full font-medium ml-auto shrink-0">Active</span>
                            )}
                          </button>
                          <button
                            onClick={() => removeAccount(username)}
                            className="text-armadillo-muted hover:text-danger transition-colors p-1 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add account input */}
                  {canAdd && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAccountInput[platform] || ''}
                        onChange={(e) => setNewAccountInput({ ...newAccountInput, [platform]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addAccount()}
                        placeholder={PLATFORM_PLACEHOLDERS[platform]}
                        className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-xl px-3 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
                      />
                      <button
                        onClick={addAccount}
                        className="bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 active:scale-95"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* Competitor Accounts */}
      <div className="px-5 mb-4">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <h2 className="text-sm font-medium text-armadillo-text mb-3">Competitor Accounts</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              placeholder="@competitor_handle"
              className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-xl px-4 py-2.5 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
            />
            <button
              onClick={addCompetitor}
              className="bg-burnt hover:bg-burnt-light text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
          {competitors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {competitors.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-1.5 text-xs text-armadillo-text"
                >
                  @{c}
                  <button
                    onClick={() => setCompetitors(competitors.filter(x => x !== c))}
                    className="text-armadillo-muted hover:text-danger transition-colors"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-armadillo-muted/50">No competitors added yet.</p>
          )}
        </div>
      </div>

      {/* Trend Tracking */}
      <div className="px-5 mb-4">
        <div className="bg-armadillo-card border border-armadillo-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={16} className="text-burnt" />
            <h2 className="text-sm font-medium text-armadillo-text">Trend Tracking</h2>
          </div>

          {/* Tracked Hashtags */}
          <div className="mb-5">
            <label className="text-xs font-medium text-armadillo-muted mb-2 block">Tracked Hashtags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                placeholder="e.g. austinfood"
                className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-xl px-4 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
              />
              <button
                onClick={addHashtag}
                className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {trackedHashtags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {trackedHashtags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-burnt/10 text-burnt text-xs px-2.5 py-1 rounded-full">
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-burnt-light">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-armadillo-muted">No hashtags tracked yet.</p>
            )}
          </div>

          {/* Reddit Subreddits */}
          <div>
            <label className="text-xs font-medium text-armadillo-muted mb-2 block">Reddit Subreddits</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={subredditInput}
                onChange={(e) => setSubredditInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubreddit())}
                placeholder="e.g. Austin"
                className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-xl px-4 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
              />
              <button
                onClick={addSubreddit}
                className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {trackedSubreddits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {trackedSubreddits.map(sub => (
                  <span key={sub} className="flex items-center gap-1 bg-[#FF4500]/10 text-[#FF4500] text-xs px-2.5 py-1 rounded-full">
                    r/{sub}
                    <button onClick={() => removeSubreddit(sub)} className="hover:opacity-70">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-armadillo-muted">No subreddits tracked yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Save & Reset */}
      <div className="px-5 mb-4 space-y-3">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-burnt hover:bg-burnt-light text-white py-3 rounded-2xl text-sm font-semibold tracking-wider uppercase transition-colors"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 bg-armadillo-card border border-armadillo-border hover:border-danger/50 text-armadillo-muted hover:text-danger py-3 rounded-2xl text-sm transition-colors"
        >
          <Trash2 size={16} />
          Reset All Data
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
