'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/store';
import {
  getMediaKit,
  saveMediaKit,
  populateFromExportData,
  type MediaKitData,
  DEFAULT_OFFERINGS,
} from '@/lib/media-kit';
import MediaKitForm from '@/components/media-kit/MediaKitForm';
import OneSheet from '@/components/media-kit/OneSheet';
import { Save, CheckCircle, Download, Loader2, Link2 } from 'lucide-react';

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

    // Load export data to auto-populate
    try {
      const raw = localStorage.getItem('armadillo-export-data');
      if (raw) {
        const exportData = JSON.parse(raw);
        kit = populateFromExportData(kit, exportData, profile.userType);

        // Collect available photos
        const photos: string[] = [];
        if (exportData.profile?.avatarUrlHD) photos.push(exportData.profile.avatarUrlHD);
        for (const post of exportData.posts || []) {
          if (post.thumbnailUrl) photos.push(post.thumbnailUrl);
        }
        setAvailablePhotos(photos);
      }
    } catch { /* ignore parse errors */ }

    // Ensure offerings exist
    if (kit.offerings.length === 0) {
      kit.offerings = DEFAULT_OFFERINGS[profile.userType].map((o, i) => ({
        ...o,
        id: Date.now().toString() + i,
      }));
    }

    // Set user type from profile
    kit.userType = profile.userType;

    setMediaKit(kit);
    setLoaded(true);
  }, [router]);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-armadillo-text">Media Kit Builder</h1>
          <p className="text-sm text-armadillo-muted mt-1">
            Create a professional one-sheet to share with brands
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-text px-4 py-2 rounded-lg text-xs font-medium hover:border-burnt/50 transition-colors"
          >
            {saved ? <CheckCircle size={14} className="text-success" /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-burnt hover:bg-burnt-light disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
          <button
            disabled
            className="flex items-center gap-2 bg-armadillo-card border border-armadillo-border text-armadillo-muted px-4 py-2 rounded-lg text-xs opacity-50 cursor-not-allowed"
            title="Coming soon -- share your media kit as a web link"
          >
            <Link2 size={14} />
            Share Link
          </button>
        </div>
      </div>

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

      {/* Split layout */}
      <div className="flex gap-6">
        {/* Form (left) */}
        <div className={`w-full lg:w-[55%] ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
          <MediaKitForm
            mediaKit={mediaKit}
            onChange={handleChange}
            availablePhotos={availablePhotos}
          />
        </div>

        {/* Preview (right) */}
        <div className={`w-full lg:w-[45%] ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="sticky top-6">
            <div className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">
              Live Preview
            </div>
            <div
              ref={previewRef}
              className="rounded-xl shadow-2xl overflow-hidden"
              style={{ aspectRatio: '8.5/11' }}
            >
              <OneSheet mediaKit={mediaKit} />
            </div>
            <p className="text-[9px] text-armadillo-muted mt-2 text-center">
              This is how your media kit will look as a PDF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
