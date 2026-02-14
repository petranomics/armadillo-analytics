'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { PLATFORM_NAMES, PLATFORMS } from '@/lib/constants';
import { Save, Trash2, CheckCircle, ShieldCheck } from 'lucide-react';
import type { Platform } from '@/lib/types';
import { clearSettings } from '@/lib/settings';

const PLATFORM_PLACEHOLDERS: Record<Platform, string> = {
  tiktok: 'username (e.g. texasarmadillo)',
  instagram: 'username (e.g. texasarmadillo)',
  youtube: 'channel URL (e.g. youtube.com/@texasarmadillo)',
  twitter: 'handle without @ (e.g. texasarmadillo)',
  linkedin: 'profile URL (e.g. linkedin.com/in/texasarmadillo)',
};

export default function SettingsPage() {
  const { settings, updateSettings, loaded } = useSettings();
  const [usernames, setUsernames] = useState<Partial<Record<Platform, string>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) {
      setUsernames(settings.usernames);
    }
  }, [loaded, settings]);

  const handleSave = () => {
    updateSettings({ ...settings, usernames });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearSettings();
    setUsernames({});
  };

  if (!loaded) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text mb-1">Settings</h1>
        <p className="text-sm text-armadillo-muted">Configure your social media accounts and API access</p>
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
        </p>
      </div>

      {/* Platform Usernames */}
      <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-medium text-armadillo-text mb-4">Platform Usernames</h2>
        <p className="text-xs text-armadillo-muted mb-4">Enter one username per platform to fetch your analytics data.</p>
        <div className="space-y-4">
          {PLATFORMS.map((platform) => (
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
          Clear All Data
        </button>
      </div>
    </div>
  );
}
