'use client';

import { useState } from 'react';
import type { MediaKitData, MediaKitOffering, MediaKitStats } from '@/lib/media-kit';
import { INDUSTRY_FIELD_MAP, getIndustryOptions, ONE_SHEET_CONFIG, ALL_STAT_OPTIONS, SOCIAL_PLATFORM_OPTIONS, LAYOUT_OPTIONS } from '@/lib/media-kit';
import PhotoPicker from './PhotoPicker';
import OfferingsEditor from './OfferingsEditor';
import { X, Plus, Check, Trash2 } from 'lucide-react';

interface MediaKitFormProps {
  mediaKit: MediaKitData;
  onChange: (updates: Partial<MediaKitData>) => void;
  availablePhotos: string[];
}

const INPUT_CLASS = 'w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors';

const ACCENT_PRESETS = [
  '#BF5700', '#0A66C2', '#00C9B7', '#FF0000', '#22C55E', '#A855F7', '#000000', '#6366F1',
];

export default function MediaKitForm({ mediaKit, onChange, availablePhotos }: MediaKitFormProps) {
  const industryMapping = INDUSTRY_FIELD_MAP[mediaKit.userType];
  const industryOptions = getIndustryOptions(mediaKit.userType);
  const config = ONE_SHEET_CONFIG[mediaKit.userType];

  const selected = mediaKit.selectedStatKeys ?? [];
  const activeStatKeys: (keyof MediaKitStats)[] =
    selected.length > 0
      ? selected
      : config.statKeys.map(s => s.key);

  const toggleStatKey = (key: keyof MediaKitStats) => {
    const current = [...activeStatKeys];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    onChange({ selectedStatKeys: current });
  };

  const addTopic = (value: string) => {
    const topic = value.trim();
    if (topic && !mediaKit.contentTopics.includes(topic)) {
      onChange({ contentTopics: [...mediaKit.contentTopics, topic] });
    }
  };

  const removeTopic = (topic: string) => {
    onChange({ contentTopics: mediaKit.contentTopics.filter(t => t !== topic) });
  };

  const addCollab = (value: string) => {
    const brand = value.trim();
    if (brand && !mediaKit.brandCollaborations.includes(brand)) {
      onChange({ brandCollaborations: [...mediaKit.brandCollaborations, brand] });
    }
  };

  const removeCollab = (brand: string) => {
    onChange({ brandCollaborations: mediaKit.brandCollaborations.filter(b => b !== brand) });
  };

  // Social links helpers
  const socialLinks = mediaKit.socialLinks ?? [];

  const addSocialLink = (platform: string, handle: string) => {
    if (!handle.trim() || socialLinks.length >= 6) return;
    const updated = [...socialLinks, { platform, url: '', handle: handle.trim() }];
    onChange({ socialLinks: updated });
  };

  const removeSocialLink = (index: number) => {
    onChange({ socialLinks: socialLinks.filter((_, i) => i !== index) });
  };

  // Demographics helper
  const demographics = mediaKit.audienceDemographics ?? { topAge: '', topGender: '', topLocation: '' };

  const updateDemographic = (field: 'topAge' | 'topGender' | 'topLocation', value: string) => {
    onChange({ audienceDemographics: { ...demographics, [field]: value } });
  };

  return (
    <div className="space-y-6">
      {/* 1. Contact Info */}
      <Section title="Contact Info">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Display Name</label>
            <input
              type="text"
              value={mediaKit.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              placeholder="Your name or brand name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Email</label>
            <input
              type="email"
              value={mediaKit.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Phone</label>
            <input
              type="tel"
              value={mediaKit.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="(555) 123-4567"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">City</label>
            <input
              type="text"
              value={mediaKit.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Austin, TX"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">{industryMapping.label}</label>
            <select
              value={mediaKit.industryValue}
              onChange={(e) => onChange({ industryValue: e.target.value })}
              className={INPUT_CLASS + ' appearance-none'}
            >
              <option value="">Select...</option>
              {industryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-4 pt-4 border-t border-armadillo-border">
          <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-2">Social Links</label>
          {socialLinks.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {socialLinks.map((link, i) => {
                const platformLabel = SOCIAL_PLATFORM_OPTIONS.find(p => p.id === link.platform)?.label || link.platform;
                return (
                  <div key={i} className="flex items-center gap-2 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-1.5">
                    <span className="text-[10px] text-burnt font-medium w-16">{platformLabel}</span>
                    <span className="text-xs text-armadillo-text flex-1 truncate">{link.handle}</span>
                    <button onClick={() => removeSocialLink(i)} className="text-armadillo-muted hover:text-danger transition-colors shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {socialLinks.length < 6 && <SocialLinkAdder onAdd={addSocialLink} />}
        </div>
      </Section>

      {/* 2. About */}
      <Section title="About">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Tagline</label>
            <input
              type="text"
              value={mediaKit.tagline}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="A short headline about you or your brand"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Bio</label>
            <textarea
              value={mediaKit.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              placeholder="Tell brands about yourself..."
              rows={3}
              className={INPUT_CLASS + ' resize-none'}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Call to Action</label>
            <input
              type="text"
              value={mediaKit.callToAction ?? ''}
              onChange={(e) => onChange({ callToAction: e.target.value })}
              placeholder="e.g. Let's collaborate! Email me at..."
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </Section>

      {/* 3. Appearance */}
      <Section title="Appearance">
        <div className="space-y-4">
          {/* Accent Color */}
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-2">Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map(color => {
                const isSelected = (mediaKit.accentColorOverride || config.accentColor) === color;
                return (
                  <button
                    key={color}
                    onClick={() => onChange({ accentColorOverride: color === config.accentColor ? '' : color })}
                    className="relative shrink-0"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: isSelected ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: isSelected ? `0 0 0 2px ${color}` : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </button>
                );
              })}
              <input
                type="text"
                value={mediaKit.accentColorOverride ?? ''}
                onChange={(e) => onChange({ accentColorOverride: e.target.value })}
                placeholder="#hex"
                className="w-20 bg-armadillo-bg border border-armadillo-border rounded-lg px-2 py-1.5 text-xs text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
              />
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-2">Cover Photo</label>
            <p className="text-[10px] text-armadillo-muted mb-2">Select a photo to use as the banner at the top of your one-sheet.</p>
            {mediaKit.coverPhotoUrl && (
              <div className="mb-2 relative">
                <img
                  src={mediaKit.coverPhotoUrl}
                  alt="Cover"
                  className="w-full rounded-lg object-cover"
                  style={{ aspectRatio: '16/9', maxHeight: '120px' }}
                />
                <button
                  onClick={() => onChange({ coverPhotoUrl: '' })}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <CoverPhotoPicker
              photos={[...(mediaKit.uploadedPhotos ?? []), ...availablePhotos]}
              currentCover={mediaKit.coverPhotoUrl ?? ''}
              onSelect={(url) => onChange({ coverPhotoUrl: url })}
            />
          </div>

        </div>
      </Section>

      {/* 4. Metrics to Display */}
      <Section title="Metrics to Display">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Growth Highlight</label>
            <input
              type="text"
              value={mediaKit.growthCallout ?? ''}
              onChange={(e) => onChange({ growthCallout: e.target.value })}
              placeholder="e.g. +12K followers in 30 days"
              className={INPUT_CLASS}
            />
          </div>
          <p className="text-[10px] text-armadillo-muted">Choose which stats appear on your one-sheet</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_STAT_OPTIONS.map(({ key, label }) => {
              const isActive = activeStatKeys.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleStatKey(key)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-left transition-all ${
                    isActive
                      ? 'bg-burnt/10 border border-burnt/30 text-armadillo-text'
                      : 'bg-armadillo-bg border border-armadillo-border text-armadillo-muted hover:border-armadillo-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-burnt' : 'bg-armadillo-bg border border-armadillo-border'
                  }`}>
                    {isActive && <Check size={10} className="text-white" />}
                  </div>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 5. Audience Demographics */}
      <Section title="Audience Demographics">
        <p className="text-[10px] text-armadillo-muted mb-3">
          Help brands understand your audience. Enter approximate values.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Top Age Range</label>
            <input
              type="text"
              value={demographics.topAge}
              onChange={(e) => updateDemographic('topAge', e.target.value)}
              placeholder="e.g. 25-34"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Gender Split</label>
            <input
              type="text"
              value={demographics.topGender}
              onChange={(e) => updateDemographic('topGender', e.target.value)}
              placeholder="e.g. 68% Female"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1">Top Location</label>
            <input
              type="text"
              value={demographics.topLocation}
              onChange={(e) => updateDemographic('topLocation', e.target.value)}
              placeholder="e.g. United States"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </Section>

      {/* 6. Content Topics */}
      <Section title="Content Topics">
        <TagInput
          tags={mediaKit.contentTopics}
          onAdd={addTopic}
          onRemove={removeTopic}
          placeholder="e.g. Food, Lifestyle, Travel"
          accentColor="burnt"
        />
      </Section>

      {/* 7. Past Collaborations */}
      {config.showCollaborations && (
        <Section title="Past Collaborations">
          <TagInput
            tags={mediaKit.brandCollaborations}
            onAdd={addCollab}
            onRemove={removeCollab}
            placeholder="e.g. Nike, Sephora"
            accentColor="armadillo-muted"
          />
        </Section>
      )}

      {/* 8. Photos */}
      <Section title="Photos">
        <PhotoPicker
          availablePhotos={availablePhotos}
          uploadedPhotos={mediaKit.uploadedPhotos ?? []}
          headerPhotoUrl={mediaKit.headerPhotoUrl}
          galleryPhotoUrls={mediaKit.galleryPhotoUrls}
          coverPhotoUrl={mediaKit.coverPhotoUrl ?? ''}
          onSetHeaderPhoto={(url) => onChange({ headerPhotoUrl: url })}
          onToggleGalleryPhoto={(url) => {
            const current = mediaKit.galleryPhotoUrls;
            if (current.includes(url)) {
              onChange({ galleryPhotoUrls: current.filter(u => u !== url) });
            } else if (current.length < 6) {
              onChange({ galleryPhotoUrls: [...current, url] });
            }
          }}
          onSetCoverPhoto={(url) => onChange({ coverPhotoUrl: url })}
          onUploadPhotos={(dataUrls) => {
            const existing = mediaKit.uploadedPhotos ?? [];
            const newPhotos = dataUrls.filter(d => !existing.includes(d));
            onChange({ uploadedPhotos: [...existing, ...newPhotos] });
          }}
          onRemoveUploadedPhoto={(dataUrl) => {
            onChange({
              uploadedPhotos: (mediaKit.uploadedPhotos ?? []).filter(u => u !== dataUrl),
              headerPhotoUrl: mediaKit.headerPhotoUrl === dataUrl ? '' : mediaKit.headerPhotoUrl,
              galleryPhotoUrls: mediaKit.galleryPhotoUrls.filter(u => u !== dataUrl),
              coverPhotoUrl: (mediaKit.coverPhotoUrl ?? '') === dataUrl ? '' : (mediaKit.coverPhotoUrl ?? ''),
            });
          }}
        />
      </Section>

      {/* 9. Offerings */}
      <Section title={config.offeringsLabel}>
        <OfferingsEditor
          offerings={mediaKit.offerings}
          onChange={(offerings: MediaKitOffering[]) => onChange({ offerings })}
          userType={mediaKit.userType}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-armadillo-card border border-armadillo-border rounded-xl p-5">
      <h3 className="text-[10px] font-semibold text-armadillo-muted tracking-widest uppercase mb-3">{title}</h3>
      {children}
    </div>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  accentColor,
}: {
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  accentColor: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      onAdd(input.value);
      input.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
            onAdd(input.value);
            input.value = '';
          }}
          className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className={`flex items-center gap-1 bg-${accentColor}/10 text-${accentColor} text-xs px-2.5 py-1 rounded-full`}>
              {tag}
              <button onClick={() => onRemove(tag)} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialLinkAdder({ onAdd }: { onAdd: (platform: string, handle: string) => void }) {
  const [platform, setPlatform] = useState(SOCIAL_PLATFORM_OPTIONS[0].id as string);
  const [handle, setHandle] = useState('');

  const handleAdd = () => {
    if (handle.trim()) {
      onAdd(platform, handle);
      setHandle('');
    }
  };

  return (
    <div className="flex gap-2">
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="bg-armadillo-bg border border-armadillo-border rounded-lg px-2 py-1.5 text-xs text-armadillo-text focus:outline-none focus:border-burnt transition-colors appearance-none w-28"
      >
        {SOCIAL_PLATFORM_OPTIONS.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        placeholder="@handle or URL"
        className="flex-1 bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-1.5 text-xs text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors"
      />
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 bg-burnt hover:bg-burnt-light text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  );
}

function CoverPhotoPicker({ photos, currentCover, onSelect }: { photos: string[]; currentCover: string; onSelect: (url: string) => void }) {
  if (photos.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.slice(0, 12).map((url, i) => (
        <button
          key={`cover-${i}`}
          onClick={() => onSelect(url)}
          className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
            currentCover === url ? 'border-burnt' : 'border-armadillo-border hover:border-armadillo-muted'
          }`}
          style={{ width: '80px', height: '45px' }}
        >
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
          {currentCover === url && (
            <div className="absolute inset-0 bg-burnt/30 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
