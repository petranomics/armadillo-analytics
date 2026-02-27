'use client';

import type { MediaKitData } from '@/lib/media-kit';
import { ONE_SHEET_CONFIG, getIndustryLabel, formatStatValue } from '@/lib/media-kit';

interface OneSheetProps {
  mediaKit: MediaKitData;
}

export default function OneSheet({ mediaKit }: OneSheetProps) {
  const config = ONE_SHEET_CONFIG[mediaKit.userType];
  const accent = config.accentColor;
  const industryLabel = getIndustryLabel(mediaKit.industryValue, mediaKit.userType);
  const hasIndustry = mediaKit.industryValue && mediaKit.industryValue !== 'n/a' && industryLabel;
  const hasTopics = mediaKit.contentTopics.length > 0;
  const hasCollabs = config.showCollaborations && mediaKit.brandCollaborations.length > 0;
  const hasGallery = mediaKit.galleryPhotoUrls.length > 0;
  const hasOfferings = mediaKit.offerings.some(o => o.name.trim());

  // Filter stats — skip zero values (except engagement rate)
  const visibleStats = config.statKeys.filter(({ key }) => {
    const val = mediaKit.stats[key];
    if (key === 'engagementRate') return true;
    if (key === 'postingFreq') return !!val;
    return Number(val) > 0;
  });

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        fontFamily: "'Lexend', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: '#FFFFFF',
        color: '#1a1a1a',
        fontSize: '10px',
      }}
    >
      {/* Accent Header Bar */}
      <div style={{ backgroundColor: accent, height: '6px', flexShrink: 0 }} />

      {/* Content */}
      <div className="flex-1 px-6 py-4 flex flex-col" style={{ gap: '12px' }}>
        {/* Profile Section */}
        <div className="flex items-start gap-4">
          {mediaKit.headerPhotoUrl ? (
            <img
              src={mediaKit.headerPhotoUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover shrink-0"
              style={{ border: `2px solid ${accent}` }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: accent }}
            >
              {(mediaKit.displayName || '?').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight" style={{ color: '#1a1a1a' }}>
              {mediaKit.displayName || 'Your Name'}
            </h1>
            {mediaKit.tagline && (
              <p className="text-xs mt-0.5" style={{ color: accent }}>{mediaKit.tagline}</p>
            )}
            {mediaKit.username && (
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>@{mediaKit.username}</p>
            )}
            {/* Contact row */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {mediaKit.email && (
                <span className="text-[9px]" style={{ color: '#666' }}>{mediaKit.email}</span>
              )}
              {mediaKit.phone && (
                <span className="text-[9px]" style={{ color: '#666' }}>{mediaKit.phone}</span>
              )}
              {mediaKit.city && (
                <span className="text-[9px]" style={{ color: '#666' }}>{mediaKit.city}</span>
              )}
              {hasIndustry && (
                <span className="text-[9px]" style={{ color: '#666' }}>
                  {config.industryLabel}: {industryLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {mediaKit.bio && (
          <p className="text-[10px] leading-relaxed" style={{ color: '#444' }}>
            {mediaKit.bio}
          </p>
        )}

        {/* Stats Grid */}
        {visibleStats.length > 0 && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(visibleStats.length, 4)}, 1fr)` }}>
            {visibleStats.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-lg text-center py-2 px-1"
                style={{ backgroundColor: accent + '12', border: `1px solid ${accent}25` }}
              >
                <div className="font-bold text-sm" style={{ color: accent }}>
                  {formatStatValue(key, mediaKit.stats[key])}
                </div>
                <div className="text-[8px] uppercase tracking-wider font-medium" style={{ color: '#888' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Gallery */}
        {hasGallery && (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(mediaKit.galleryPhotoUrls.length, 6)}, 1fr)` }}>
            {mediaKit.galleryPhotoUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full aspect-square object-cover rounded"
                crossOrigin="anonymous"
              />
            ))}
          </div>
        )}

        {/* Content Topics */}
        {hasTopics && (
          <div>
            <div className="text-[8px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#888' }}>
              Content Focus
            </div>
            <div className="flex flex-wrap gap-1">
              {mediaKit.contentTopics.map(topic => (
                <span
                  key={topic}
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: accent + '15', color: accent }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Past Collaborations */}
        {hasCollabs && (
          <div>
            <div className="text-[8px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#888' }}>
              Past Collaborations
            </div>
            <div className="flex flex-wrap gap-1">
              {mediaKit.brandCollaborations.map(brand => (
                <span
                  key={brand}
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Offerings */}
        {hasOfferings && (
          <div>
            <div className="text-[8px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: '#888' }}>
              {config.offeringsLabel}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mediaKit.offerings
                .filter(o => o.name.trim())
                .map(offering => (
                  <div
                    key={offering.id}
                    className="rounded-lg px-2.5 py-2"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-medium" style={{ color: '#1a1a1a' }}>
                        {offering.name}
                      </span>
                      {offering.price && (
                        <span className="text-[9px] font-bold shrink-0" style={{ color: accent }}>
                          {offering.price}
                        </span>
                      )}
                    </div>
                    {offering.description && (
                      <p className="text-[8px] mt-0.5" style={{ color: '#888' }}>
                        {offering.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
          <span className="text-[8px]" style={{ color: '#aaa' }}>
            Powered by Armadillo Analytics
          </span>
          <span className="text-[8px]" style={{ color: '#aaa' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
