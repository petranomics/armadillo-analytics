'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/store';
import {
  getMediaKit,
  saveMediaKit,
  populateFromExportData,
  type MediaKitData,
  type OneSheetLayout,
  DEFAULT_OFFERINGS,
  LAYOUT_OPTIONS,
  ONE_SHEET_CONFIG,
} from '@/lib/media-kit';
import { toDataUrl } from '@/lib/image-cache';
import { USER_TYPES } from '@/lib/user-types';
import { PLATFORM_NAMES } from '@/lib/constants';
import MediaKitForm from '@/components/media-kit/MediaKitForm';
import OneSheet from '@/components/media-kit/OneSheet';
import { Save, CheckCircle, Download, Loader2, Link2, AlertCircle, Lightbulb, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const MEDIA_KIT_SUBTITLES: Record<string, string> = {
  'influencer': 'Influencer One-Sheet',
  'linkedin-creator': 'LinkedIn Creator Kit',
  'tiktok-shop': 'TikTok Shop Media Kit',
  'youtuber': 'YouTuber Media Kit',
  'local-business': 'Business Media Kit',
  'media-outlet': 'Media Outlet Kit',
};

/** Load export data from all connected platforms, merging posts & photos */
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

        // Collect photos
        if (data.profile?.avatarUrlHD) allPhotos.push(data.profile.avatarUrlHD);
        for (const post of data.posts || []) {
          if (post.thumbnailUrl) allPhotos.push(post.thumbnailUrl);
        }

        // Keep the export data with the most posts for populating
        const postCount = data.posts?.length || 0;
        if (!bestExportData || postCount > bestExportData.postCount) {
          bestExportData = { data, postCount };
        }
      } catch { /* ignore parse errors */ }
    }
  }

  // Deduplicate photos
  const uniquePhotos = [...new Set(allPhotos)];
  return { exportData: bestExportData?.data || null, photos: uniquePhotos };
}

export default function MediaKitPage() {
  const router = useRouter();
  const [mediaKit, setMediaKit] = useState<MediaKitData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [availablePhotos, setAvailablePhotos] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profile = getUserProfile();
    if (!profile.onboardingComplete) {
      router.push('/onboarding');
      return;
    }

    let kit = getMediaKit();

    // Auto-populate from all connected platform data
    const { exportData, photos } = loadAllPlatformData(profile.selectedPlatforms);
    if (exportData) {
      kit = populateFromExportData(kit, exportData, profile.userType);
    }
    setAvailablePhotos(photos);

    // Ensure offerings exist
    if (kit.offerings.length === 0) {
      kit.offerings = DEFAULT_OFFERINGS[profile.userType].map((o, i) => ({
        ...o,
        id: Date.now().toString() + i,
      }));
    }

    // Set user type from profile
    kit.userType = profile.userType;

    const isPermanent = (u: string) => !u || u.startsWith('data:') || u.startsWith('blob:') || u.includes('.vercel-storage.com');

    // Cache the auto-populated header photo to Blob
    if (kit.headerPhotoUrl && !isPermanent(kit.headerPhotoUrl)) {
      toDataUrl(kit.headerPhotoUrl).then(cached => {
        if (cached !== kit.headerPhotoUrl) {
          setMediaKit(prev => prev ? { ...prev, headerPhotoUrl: cached } : prev);
        }
      });
    }

    // Cache auto-populated gallery photos to Blob
    if (kit.galleryPhotoUrls.some(u => !isPermanent(u))) {
      Promise.all(kit.galleryPhotoUrls.map(u => toDataUrl(u))).then(cached => {
        setMediaKit(prev => prev ? { ...prev, galleryPhotoUrls: cached } : prev);
      });
    }

    // Cache all available photos in background
    if (photos.some(u => !isPermanent(u))) {
      Promise.all(photos.map(u => toDataUrl(u))).then(cached => {
        setAvailablePhotos(cached.filter(u => !!u));
      });
    }

    setMediaKit(kit);
    setLoaded(true);
  }, [router]);

  // Listen for export data updates from any platform (same or other tabs)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('armadillo-export-data') && e.newValue) {
        try {
          const profile = getUserProfile();
          const { exportData, photos } = loadAllPlatformData(profile.selectedPlatforms);
          if (exportData) {
            setMediaKit(prev => {
              if (!prev) return prev;
              return populateFromExportData(prev, exportData, profile.userType);
            });
            setAvailablePhotos(photos);
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleChange = useCallback((updates: Partial<MediaKitData>) => {
    setMediaKit(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      return updated;
    });
  }, []);

  const handleSave = () => {
    if (!mediaKit) return;
    saveMediaKit(mediaKit);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!previewRef.current || !mediaKit) return;
    setExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);

      const username = mediaKit.username || 'creator';
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`media-kit-${username}-${date}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!loaded || !mediaKit) return null;

  const profile = getUserProfile();
  const primaryPlatform = profile.selectedPlatforms[0] || 'instagram';
  const subtitle = MEDIA_KIT_SUBTITLES[mediaKit.userType] || 'Media Kit';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-armadillo-muted hover:text-burnt transition-colors mb-2">
            <ArrowLeft size={12} />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl text-armadillo-text">Media Kit Builder</h1>
          <p className="text-sm text-armadillo-muted mt-1">
            {subtitle} &mdash; create a professional one-sheet to share with brands
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-text px-5 py-2.5 rounded-lg text-xs font-medium hover:border-burnt/50 hover:shadow-md transition-all"
          >
            {saved ? <CheckCircle size={14} className="text-success" /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-burnt hover:bg-burnt-light disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-medium hover:shadow-md transition-all"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
          <button
            disabled
            className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-muted px-5 py-2.5 rounded-lg text-xs opacity-50 cursor-not-allowed"
            title="Coming soon -- share your media kit as a web link"
          >
            <Link2 size={14} />
            Share Link
          </button>
        </div>
      </div>

      {/* No data banner */}
      {loaded && mediaKit && mediaKit.stats.followers === 0 && (
        <div className="bg-burnt/10 border border-burnt/30 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-burnt shrink-0" />
          <div>
            <span className="text-sm text-burnt font-medium">No analytics data yet.</span>
            <span className="text-sm text-armadillo-muted ml-1">
              Visit your <a href={`/${primaryPlatform}`} className="text-burnt underline">{PLATFORM_NAMES[primaryPlatform] || 'platform'} dashboard</a> to fetch live data — your metrics will automatically appear here.
            </span>
          </div>
        </div>
      )}

      {/* Mobile tab toggle */}
      <div className="flex lg:hidden gap-1 mb-4 bg-armadillo-card border border-armadillo-border rounded-lg p-1">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
            activeTab === 'edit' ? 'bg-burnt text-white' : 'text-armadillo-muted hover:text-armadillo-text'
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
            activeTab === 'preview' ? 'bg-burnt text-white' : 'text-armadillo-muted hover:text-armadillo-text'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Layout selector */}
      <div className="flex gap-1 bg-armadillo-card border border-armadillo-border rounded-lg p-1 mb-4">
        {LAYOUT_OPTIONS.map((opt) => {
          const currentLayout = mediaKit.layoutOverride || ONE_SHEET_CONFIG[mediaKit.userType].layout;
          const isActive = currentLayout === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleChange({ layoutOverride: opt.value === ONE_SHEET_CONFIG[mediaKit.userType].layout ? '' : opt.value })}
              className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
                isActive ? 'bg-burnt text-white' : 'text-armadillo-muted hover:text-armadillo-text'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Split layout */}
      <div className="flex gap-6">
        {/* Form (left) */}
        <div className={`w-full lg:w-[52%] ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
          <MediaKitForm
            mediaKit={mediaKit}
            onChange={handleChange}
            availablePhotos={availablePhotos}
          />
        </div>

        {/* Preview (right) */}
        <div className={`w-full lg:w-[48%] ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="sticky top-6">
            <div className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">
              Live Preview
            </div>
            <div
              ref={previewRef}
              className="rounded-xl shadow-2xl overflow-hidden border border-armadillo-border"
              style={{ aspectRatio: '8.5/11' }}
            >
              <OneSheet mediaKit={mediaKit} />
            </div>
            <p className="text-[9px] text-armadillo-muted mt-2 text-center">
              Your media kit preview &mdash; updates in real time as you edit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
