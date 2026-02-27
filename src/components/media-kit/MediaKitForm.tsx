'use client';

import type { MediaKitData, MediaKitOffering, MediaKitStats } from '@/lib/media-kit';
import { INDUSTRY_FIELD_MAP, getIndustryOptions, ONE_SHEET_CONFIG, ALL_STAT_OPTIONS } from '@/lib/media-kit';
import PhotoPicker from './PhotoPicker';
import OfferingsEditor from './OfferingsEditor';
import { X, Plus, Check } from 'lucide-react';

interface MediaKitFormProps {
  mediaKit: MediaKitData;
  onChange: (updates: Partial<MediaKitData>) => void;
  availablePhotos: string[];
}

const INPUT_CLASS = 'w-full bg-armadillo-bg border border-armadillo-border rounded-lg px-3 py-2 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt transition-colors';

export default function MediaKitForm({ mediaKit, onChange, availablePhotos }: MediaKitFormProps) {
  const industryMapping = INDUSTRY_FIELD_MAP[mediaKit.userType];
  const industryOptions = getIndustryOptions(mediaKit.userType);
  const config = ONE_SHEET_CONFIG[mediaKit.userType];

  // Determine active stat keys — use user selection if set, else config defaults
  const activeStatKeys: (keyof MediaKitStats)[] =
    mediaKit.selectedStatKeys.length > 0
      ? mediaKit.selectedStatKeys
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

  return (
    <div className="space-y-6">
      {/* Contact Info */}
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
      </Section>

      {/* Bio & Tagline */}
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
        </div>
      </Section>

      {/* Metrics Checklist */}
      <Section title="Metrics to Display">
        <p className="text-[10px] text-armadillo-muted mb-3">Choose which stats appear on your one-sheet</p>
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
      </Section>

      {/* Content Topics */}
      <Section title="Content Topics">
        <TagInput
          tags={mediaKit.contentTopics}
          onAdd={addTopic}
          onRemove={removeTopic}
          placeholder="e.g. Food, Lifestyle, Travel"
          accentColor="burnt"
        />
      </Section>

      {/* Past Collaborations (influencer/youtuber) */}
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

      {/* Photos */}
      <Section title="Photos">
        <PhotoPicker
          availablePhotos={availablePhotos}
          uploadedPhotos={mediaKit.uploadedPhotos}
          headerPhotoUrl={mediaKit.headerPhotoUrl}
          galleryPhotoUrls={mediaKit.galleryPhotoUrls}
          onSetHeaderPhoto={(url) => onChange({ headerPhotoUrl: url })}
          onToggleGalleryPhoto={(url) => {
            const current = mediaKit.galleryPhotoUrls;
            if (current.includes(url)) {
              onChange({ galleryPhotoUrls: current.filter(u => u !== url) });
            } else if (current.length < 6) {
              onChange({ galleryPhotoUrls: [...current, url] });
            }
          }}
          onUploadPhotos={(dataUrls) => {
            const existing = mediaKit.uploadedPhotos;
            const newPhotos = dataUrls.filter(d => !existing.includes(d));
            onChange({ uploadedPhotos: [...existing, ...newPhotos] });
          }}
          onRemoveUploadedPhoto={(dataUrl) => {
            onChange({
              uploadedPhotos: mediaKit.uploadedPhotos.filter(u => u !== dataUrl),
              headerPhotoUrl: mediaKit.headerPhotoUrl === dataUrl ? '' : mediaKit.headerPhotoUrl,
              galleryPhotoUrls: mediaKit.galleryPhotoUrls.filter(u => u !== dataUrl),
            });
          }}
        />
      </Section>

      {/* Offerings */}
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
