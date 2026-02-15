'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/store';
import { USER_TYPES } from '@/lib/user-types';
import { FileText, Link2, Mail, Download, Image, QrCode, Copy, Check, Share2, Presentation, Lock } from 'lucide-react';

export default function ExportPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    if (!p.onboardingComplete) { router.push('/onboarding'); return; }
    setProfile(p);
    setLoaded(true);
  }, [router]);

  if (!loaded || !profile) return null;

  const isInfluencer = profile.userType === 'influencer';
  const isPro = profile.plan === 'pro';
  const isFree = profile.plan === 'free';

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-armadillo-text">Export & Share</h1>
        <p className="text-sm text-armadillo-muted mt-1">
          {isInfluencer ? 'Share your analytics with brands to book gigs' : 'Export reports for your team or clients'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Share Link */}
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-burnt" />
            <span className="text-sm font-medium text-armadillo-text">Live Analytics Link</span>
          </div>
          <p className="text-xs text-armadillo-muted mb-4">
            Share a live link that always shows your latest metrics. Perfect for brand pitches and media kits.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-xs text-armadillo-muted truncate">
              armadilloanalytics.app/p/texasarmadillo
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-burnt hover:bg-burnt-light text-white p-2.5 rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Quick Share */}
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-armadillo-text mb-4">Quick Share</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Mail, label: 'Email', color: '#BF5700' },
              { icon: Share2, label: 'Share', color: '#8B8D97' },
              { icon: QrCode, label: 'QR Code', color: '#8B8D97' },
              { icon: Link2, label: 'Copy Link', color: '#8B8D97' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className="flex flex-col items-center gap-2 p-4 bg-armadillo-bg border border-armadillo-border rounded-xl hover:border-armadillo-muted/50 transition-colors">
                  <Icon size={20} style={{ color: item.color }} />
                  <span className="text-[10px] text-armadillo-muted font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Formats */}
      <div className="mt-6">
        <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Export Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: FileText, label: 'PDF Media Kit', desc: 'Professional branded PDF with your top metrics, audience data, and best content', available: !isFree },
            { icon: Presentation, label: 'Pitch Deck', desc: 'Slide-ready presentation for brand meetings and sponsorship pitches', available: isPro },
            { icon: Image, label: 'Social Cards', desc: 'Instagram-ready graphics showing your analytics for Stories and posts', available: !isFree },
            { icon: Download, label: 'CSV Data Export', desc: 'Raw data download for spreadsheets and custom analysis', available: isPro },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border text-left transition-all ${
                  option.available
                    ? 'bg-armadillo-card border-armadillo-border hover:border-burnt/40'
                    : 'bg-armadillo-card border-armadillo-border opacity-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-burnt/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-burnt" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-armadillo-text flex items-center gap-1.5">
                    {option.label}
                    {!option.available && <Lock size={10} className="text-armadillo-muted" />}
                  </div>
                  <div className="text-xs text-armadillo-muted mt-0.5">{option.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Pitch Templates (Influencer only) */}
      {isInfluencer && (
        <div className="mt-6">
          <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">Brand Pitch Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Sponsorship Pitch', desc: 'Professional template for reaching out to brands with your stats', emoji: '\uD83E\uDD1D' },
              { name: 'Rate Card', desc: 'Pricing sheet based on your engagement metrics', emoji: '\uD83D\uDCB0' },
              { name: 'Campaign Report', desc: 'Post-campaign results summary for brand partners', emoji: '\uD83D\uDCCA' },
            ].map((template) => (
              <button
                key={template.name}
                className="flex items-center gap-3 p-5 bg-armadillo-card border border-armadillo-border rounded-xl text-left hover:border-burnt/40 transition-colors"
              >
                <span className="text-2xl shrink-0">{template.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-armadillo-text">{template.name}</div>
                  <div className="text-xs text-armadillo-muted mt-0.5">{template.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="mt-8 bg-burnt/10 border border-burnt/30 rounded-2xl p-8 text-center">
          <div className="text-2xl mb-3">{'\uD83D\uDD13'}</div>
          <div className="text-base font-medium text-armadillo-text mb-2">
            {isFree ? 'Unlock Export Features' : 'Unlock Pro Exports'}
          </div>
          <p className="text-sm text-armadillo-muted mb-4 max-w-md mx-auto">
            {isFree
              ? 'Upgrade to Lite ($4.99/mo) for PDF media kits, social cards, and more.'
              : 'Get pitch decks, CSV exports, and AI-powered insights with Pro ($19.99/mo).'}
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="bg-burnt hover:bg-burnt-light text-white px-6 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-colors"
          >
            {isFree ? 'Upgrade to Lite \u2014 $4.99/mo' : 'Upgrade to Pro \u2014 $19.99/mo'}
          </button>
        </div>
      )}
    </div>
  );
}
