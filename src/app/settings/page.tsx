'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, saveUserProfile, clearUserProfile, type UserProfile } from '@/lib/store';
import { USER_TYPES } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import { Save, Trash2, CheckCircle, ShieldCheck, User, Crown, RefreshCw, Hash, X, Plus } from 'lucide-react';
import type { Platform } from '@/lib/types';

const PLATFORM_PLACEHOLDERS: Record<Platform, string> = {
  tiktok: 'username (e.g. texasarmadillo)',
  instagram: 'username (e.g. texasarmadillo)',
  youtube: 'channel URL (e.g. youtube.com/@texasarmadillo)',
  twitter: 'handle without @ (e.g. texasarmadillo)',
  linkedin: 'profile URL (e.g. linkedin.com/in/texasarmadillo)',
};

const TIKTOK_NICHES = [
  '', 'General', 'Food & Beverage', 'Beauty & Skincare', 'Fashion', 'Fitness & Health',
  'Tech & Gadgets', 'Home & Living', 'Travel', 'Pets', 'Education', 'Entertainment',
  'Finance', 'Parenting', 'DIY & Crafts', 'Automotive', 'Sports', 'Music', 'Art & Design',
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [usernames, setUsernames] = useState<Partial<Record<Platform, string>>>({});
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [trackedHashtags, setTrackedHashtags] = useState<string[]>([]);
  const [trackedSubreddits, setTrackedSubreddits] = useState<string[]>([]);
  const [tiktokNiche, setTiktokNiche] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [subredditInput, setSubredditInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) {
      router.push('/onboarding');
      return;
    }
    setProfile(p);
    setUsernames(p.platformUsernames);
    setCompetitors(p.competitorAccounts);
    setTrackedHashtags(p.trackedHashtags || []);
    setTrackedSubreddits(p.trackedSubreddits || []);
    setTiktokNiche(p.tiktokNiche || '');
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const userConfig = USER_TYPES.find(u => u.id === profile.userType);
  const planLabel = profile.plan === 'pro' ? 'Pro' : profile.plan === 'lite' ? 'Lite' : 'Free';

  const handleSave = () => {
    const updated = {
      ...profile,
      platformUsernames: usernames,
      competitorAccounts: competitors,
      trackedHashtags,
      trackedSubreddits,
      tiktokNiche,
    };
    saveUserProfile(updated);
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearUserProfile();
    router.push('/onboarding');
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text mb-1">Settings</h1>
        <p className="text-sm text-armadillo-muted">Manage your account, platforms, trend tracking, and preferences</p>
      </div>

      {/* Profile & Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-armadillo-muted" />
            <h2 className="text-sm font-medium text-armadillo-text">Profile</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-armadillo-muted">User Type</span>
              <span className="text-xs text-armadillo-text font-medium">{userConfig?.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-armadillo-muted">Platforms</span>
              <span className="text-xs text-armadillo-text">{profile.selectedPlatforms.length} connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-armadillo-muted">Metrics</span>
              <span className="text-xs text-armadillo-text">{profile.selectedMetrics.length} tracked</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-2 text-xs text-burnt mt-4 hover:underline"
          >
            <RefreshCw size={12} />
            Re-run onboarding
          </button>
        </div>

        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-burnt" />
            <h2 className="text-sm font-medium text-armadillo-text">Plan</h2>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-burnt/20 text-burnt px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
              {planLabel}
            </span>
            {profile.plan === 'free' && (
              <span className="text-xs text-armadillo-muted">$0/month</span>
            )}
            {profile.plan === 'lite' && (
              <span className="text-xs text-armadillo-muted">$4.99/month</span>
            )}
            {profile.plan === 'pro' && (
              <span className="text-xs text-armadillo-muted">$19.99/month</span>
            )}
          </div>
          {profile.plan !== 'pro' && (
            <button className="bg-burnt hover:bg-burnt-light text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors">
              {profile.plan === 'free' ? 'Upgrade to Lite' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>

      {/* API Key Notice */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-success" />
          <h2 className="text-sm font-medium text-armadillo-text">API Key (Server-Side)</h2>
        </div>
        <p className="text-xs text-armadillo-muted leading-relaxed">
          Your Apify API key is stored securely as an environment variable on the server (<code className="text-burnt/80 text-[11px]">APIFY_API_KEY</code> in <code className="text-burnt/80 text-[11px]">.env.local</code>).
          It is never exposed to the browser. To update it, edit the <code className="text-burnt/80 text-[11px]">.env.local</code> file or set it in your Vercel project environment variables.
          You can also set platform-specific keys: <code className="text-burnt/80 text-[11px]">APIFY_API_KEY_IG</code>, <code className="text-burnt/80 text-[11px]">APIFY_API_KEY_TIKTOK</code>, <code className="text-burnt/80 text-[11px]">APIFY_API_KEY_LINKEDIN</code>.
        </p>
      </div>

      {/* Platform Usernames */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-armadillo-text mb-4">Platform Usernames</h2>
        <p className="text-xs text-armadillo-muted mb-4">Enter one username per platform to fetch your analytics data.</p>
        <div className="space-y-4">
          {profile.selectedPlatforms.map((platform) => (
            <div key={platform}>
              <label className="flex items-center gap-2 text-xs font-medium text-armadillo-muted mb-1.5">
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
              <input
                type="text"
                value={usernames[platform] || ''}
                onChange={(e) => setUsernames({ ...usernames, [platform]: e.target.value })}
                placeholder={PLATFORM_PLACEHOLDERS[platform]}
                className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-4 py-2.5 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Accounts */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-armadillo-text mb-2">Competitor Accounts</h2>
        <p className="text-xs text-armadillo-muted mb-4">Track competitors to benchmark your performance.</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            placeholder="@competitor_handle"
            className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-4 py-2.5 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
          />
          <button
            onClick={addCompetitor}
            className="bg-burnt hover:bg-burnt-light text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        {competitors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
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
          <p className="text-xs text-armadillo-muted/50">No competitors added yet.</p>
        )}
      </div>

      {/* Trend Tracking */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash size={16} className="text-burnt" />
          <h2 className="text-sm font-medium text-armadillo-text">Trend Tracking</h2>
        </div>
        <p className="text-xs text-armadillo-muted mb-5">
          Configure which hashtags, subreddits, and niches to monitor for trend data. These are used by the Insights page to fetch relevant trends.
        </p>

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
              className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-4 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
            />
            <button
              onClick={addHashtag}
              className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {trackedHashtags.length > 0 && (
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
          )}
          {trackedHashtags.length === 0 && (
            <p className="text-[11px] text-armadillo-muted">No hashtags tracked yet. Add hashtags to monitor their performance and trends.</p>
          )}
        </div>

        {/* Reddit Subreddits */}
        <div className="mb-5">
          <label className="text-xs font-medium text-armadillo-muted mb-2 block">Reddit Subreddits</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={subredditInput}
              onChange={(e) => setSubredditInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubreddit())}
              placeholder="e.g. Austin"
              className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-4 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
            />
            <button
              onClick={addSubreddit}
              className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {trackedSubreddits.length > 0 && (
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
          )}
          {trackedSubreddits.length === 0 && (
            <p className="text-[11px] text-armadillo-muted">No subreddits tracked yet. Add subreddits to monitor trending topics in your niche.</p>
          )}
        </div>

        {/* TikTok Niche */}
        <div>
          <label className="text-xs font-medium text-armadillo-muted mb-2 block">TikTok Niche / Category</label>
          <select
            value={tiktokNiche}
            onChange={(e) => setTiktokNiche(e.target.value)}
            className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-4 py-2.5 text-sm text-armadillo-text focus:outline-none focus:border-burnt transition-colors appearance-none"
          >
            <option value="">Select a niche...</option>
            {TIKTOK_NICHES.filter(Boolean).map(niche => (
              <option key={niche} value={niche}>{niche}</option>
            ))}
          </select>
          <p className="text-[11px] text-armadillo-muted mt-1.5">Used by TikTok Trend Hunter to find trending products and content in your category.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-burnt hover:bg-burnt-light text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border hover:border-danger/50 text-armadillo-muted hover:text-danger px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={16} />
          Reset All Data
        </button>
      </div>
    </div>
  );
}
