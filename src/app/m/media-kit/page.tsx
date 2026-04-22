'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile } from '@/lib/mobile-store';
import {
  getMediaKit,
  saveMediaKit,
  populateFromExportData,
  type MediaKitData,
  DEFAULT_OFFERINGS,
  LAYOUT_OPTIONS,
  getIndustryLabel,
  INDUSTRY_FIELD_MAP,
} from '@/lib/media-kit';
import { USER_TYPES } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import BottomNav from '@/components/mobile/BottomNav';
import OfflineBanner from '@/components/mobile/OfflineBanner';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Download,
  Loader2,
  Edit3,
  Eye,
  Camera,
  Share2,
  Users,
  BarChart3,
  DollarSign,
  Mail,
  MapPin,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function loadAllPlatformData(platforms: string[]) {
  const allPhotos: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestExportData: { data: any; postCount: number } | null = null;

  for (const platform of platforms) {
    for (const key of [`armadillo-export-data-${platform}`, 'armadillo-export-data']) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (data.profile?.avatarUrlHD) allPhotos.push(data.profile.avatarUrlHD);
        for (const post of data.posts || []) {
          if (post.thumbnailUrl) allPhotos.push(post.thumbnailUrl);
        }
        const postCount = data.posts?.length || 0;
        if (!bestExportData || postCount > bestExportData.postCount) {
          bestExportData = { data, postCount };
        }
      } catch { /* ignore */ }
    }
  }

  return { exportData: bestExportData?.data || null, photos: [...new Set(allPhotos)] };
}

export default function MobileMediaKit() {
  const router = useRouter();
  const [mediaKit, setMediaKit] = useState<MediaKitData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profile = getMobileProfile();
    if (!profile.onboardingComplete) {
      router.push('/m/onboarding');
      return;
    }

    let kit = getMediaKit();
    const { exportData } = loadAllPlatformData(profile.selectedPlatforms);
    if (exportData) {
      kit = populateFromExportData(kit, exportData, profile.userType);
    }

    if (kit.offerings.length === 0) {
      kit.offerings = DEFAULT_OFFERINGS[profile.userType].map((o, i) => ({
        ...o,
        id: Date.now().toString() + i,
      }));
    }
    kit.userType = profile.userType;
    setMediaKit(kit);
    setLoaded(true);
  }, [router]);

  const handleSave = () => {
    if (!mediaKit) return;
    mediaKit.lastUpdated = new Date().toISOString();
    saveMediaKit(mediaKit);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: '#0F1117' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${mediaKit?.displayName || 'armadillo'}-media-kit.pdf`);
    } catch {
      // PDF export failed silently
    } finally {
      setExporting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-burnt" size={32} />
      </div>
    );
  }

  if (!mediaKit) return null;

  const profile = getMobileProfile();
  const userTypeConfig = USER_TYPES.find(u => u.id === mediaKit.userType);
  const industryLabel = mediaKit.industryValue && mediaKit.industryValue !== 'n/a'
    ? getIndustryLabel(mediaKit.industryValue, mediaKit.userType)
    : '';
  const industryField = INDUSTRY_FIELD_MAP[mediaKit.userType];

  return (
    <div className="min-h-screen bg-armadillo-bg pb-24">
      <OfflineBanner />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-armadillo-bg/95 backdrop-blur-sm border-b border-armadillo-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/m/dashboard" className="flex items-center gap-2 text-armadillo-muted active:scale-95 transition-transform min-h-[44px]">
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="font-display text-lg text-armadillo-text">Media Kit</h1>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-burnt active:scale-95 transition-transform min-h-[44px] min-w-[44px] justify-center"
          >
            {saved ? <CheckCircle size={20} /> : <Save size={20} />}
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex mt-2 bg-armadillo-card rounded-lg p-1">
          {(['preview', 'edit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all min-h-[44px] ${
                activeTab === tab
                  ? 'bg-burnt text-white'
                  : 'text-armadillo-muted'
              }`}
            >
              {tab === 'preview' ? <Eye size={16} /> : <Edit3 size={16} />}
              {tab === 'preview' ? 'Preview' : 'Edit'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div ref={exportRef} className="px-4 pt-4 space-y-4">
          {/* Hero card */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-2xl overflow-hidden">
            {/* Header photo */}
            {mediaKit.headerPhotoUrl && (
              <div className="h-32 bg-armadillo-border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaKit.headerPhotoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 -mt-8 relative">
              {mediaKit.coverPhotoUrl && (
                <div className="w-16 h-16 rounded-full border-4 border-armadillo-card overflow-hidden mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaKit.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h2 className="font-display text-xl text-armadillo-text">{mediaKit.displayName || 'Your Name'}</h2>
              {mediaKit.tagline && (
                <p className="text-burnt text-sm font-medium mt-0.5">{mediaKit.tagline}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-armadillo-muted">
                {mediaKit.city && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{mediaKit.city}</span>
                )}
                {industryLabel && (
                  <span className="flex items-center gap-1"><Briefcase size={12} />{industryLabel}</span>
                )}
                {mediaKit.email && (
                  <span className="flex items-center gap-1"><Mail size={12} />{mediaKit.email}</span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {mediaKit.bio && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
              <p className="text-sm text-armadillo-text leading-relaxed">{mediaKit.bio}</p>
            </div>
          )}

          {/* Stats grid */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} /> Analytics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {mediaKit.stats.followers > 0 && (
                <div className="bg-armadillo-bg/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-armadillo-text">{formatNumber(mediaKit.stats.followers)}</div>
                  <div className="text-xs text-armadillo-muted">Followers</div>
                </div>
              )}
              {mediaKit.stats.engagementRate > 0 && (
                <div className="bg-armadillo-bg/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-armadillo-text">{mediaKit.stats.engagementRate.toFixed(1)}%</div>
                  <div className="text-xs text-armadillo-muted">Engagement</div>
                </div>
              )}
              {mediaKit.stats.totalViews > 0 && (
                <div className="bg-armadillo-bg/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-armadillo-text">{formatNumber(mediaKit.stats.totalViews)}</div>
                  <div className="text-xs text-armadillo-muted">Total Views</div>
                </div>
              )}
              {mediaKit.stats.totalPosts > 0 && (
                <div className="bg-armadillo-bg/50 rounded-lg p-3">
                  <div className="text-lg font-bold text-armadillo-text">{formatNumber(mediaKit.stats.totalPosts)}</div>
                  <div className="text-xs text-armadillo-muted">Posts</div>
                </div>
              )}
              {mediaKit.stats.brandReadinessScore > 0 && (
                <div className="bg-armadillo-bg/50 rounded-lg p-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-burnt">{mediaKit.stats.brandReadinessScore}/100</div>
                      <div className="text-xs text-armadillo-muted">Brand Readiness</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-burnt/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-burnt">{mediaKit.stats.brandReadinessScore >= 70 ? 'A' : mediaKit.stats.brandReadinessScore >= 50 ? 'B' : 'C'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Offerings */}
          {mediaKit.offerings.length > 0 && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <DollarSign size={14} /> Offerings
              </h3>
              <div className="space-y-2">
                {mediaKit.offerings.map((offering) => (
                  <div key={offering.id} className="flex items-center justify-between py-2 border-b border-armadillo-border/50 last:border-0">
                    <div>
                      <div className="text-sm text-armadillo-text font-medium">{offering.name}</div>
                      {offering.description && (
                        <div className="text-xs text-armadillo-muted">{offering.description}</div>
                      )}
                    </div>
                    {offering.price && (
                      <div className="text-sm font-semibold text-burnt ml-3 shrink-0">{offering.price}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {mediaKit.galleryPhotoUrls.filter(Boolean).length > 0 && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Camera size={14} /> Content
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {mediaKit.galleryPhotoUrls.filter(Boolean).slice(0, 6).map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-armadillo-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {mediaKit.socialLinks.filter(l => l.handle).length > 0 && (
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={14} /> Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {mediaKit.socialLinks.filter(l => l.handle).map((link) => (
                  <span key={link.platform} className="inline-flex items-center gap-1.5 bg-armadillo-bg/50 rounded-full px-3 py-1.5 text-xs text-armadillo-text">
                    {PLATFORM_NAMES[link.platform as keyof typeof PLATFORM_NAMES] || link.platform}
                    <span className="text-armadillo-muted">@{link.handle}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {mediaKit.callToAction && (
            <div className="bg-burnt/10 border border-burnt/20 rounded-xl p-4 text-center">
              <p className="text-burnt font-medium text-sm">{mediaKit.callToAction}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Tab */}
      {activeTab === 'edit' && (
        <div className="px-4 pt-4 space-y-4">
          {/* Basic info */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Contact</h3>
            <input
              type="text"
              placeholder="Display Name"
              value={mediaKit.displayName}
              onChange={(e) => setMediaKit({ ...mediaKit, displayName: e.target.value })}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
            />
            <input
              type="text"
              placeholder="Tagline"
              value={mediaKit.tagline}
              onChange={(e) => setMediaKit({ ...mediaKit, tagline: e.target.value })}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
            />
            <input
              type="email"
              placeholder="Email"
              value={mediaKit.email}
              onChange={(e) => setMediaKit({ ...mediaKit, email: e.target.value })}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
            />
            <input
              type="text"
              placeholder="City"
              value={mediaKit.city}
              onChange={(e) => setMediaKit({ ...mediaKit, city: e.target.value })}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
            />
          </div>

          {/* Bio */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Bio</h3>
            <textarea
              placeholder="Tell brands about you..."
              value={mediaKit.bio}
              onChange={(e) => setMediaKit({ ...mediaKit, bio: e.target.value })}
              rows={4}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 resize-none"
            />
          </div>

          {/* Offerings */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Offerings & Pricing</h3>
            {mediaKit.offerings.map((offering, i) => (
              <div key={offering.id} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Service name"
                  value={offering.name}
                  onChange={(e) => {
                    const updated = [...mediaKit.offerings];
                    updated[i] = { ...offering, name: e.target.value };
                    setMediaKit({ ...mediaKit, offerings: updated });
                  }}
                  className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
                />
                <input
                  type="text"
                  placeholder="$"
                  value={offering.price}
                  onChange={(e) => {
                    const updated = [...mediaKit.offerings];
                    updated[i] = { ...offering, price: e.target.value };
                    setMediaKit({ ...mediaKit, offerings: updated });
                  }}
                  className="w-20 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
                />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Call to Action</h3>
            <input
              type="text"
              placeholder="e.g. Let's collaborate! DM me or email..."
              value={mediaKit.callToAction}
              onChange={(e) => setMediaKit({ ...mediaKit, callToAction: e.target.value })}
              className="w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2.5 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 min-h-[44px]"
            />
          </div>

          {/* Save + Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-burnt text-white py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform min-h-[44px]"
            >
              {saved ? <CheckCircle size={18} /> : <Save size={18} />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-text py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform min-h-[44px] disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
