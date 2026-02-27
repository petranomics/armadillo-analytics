'use client';

import type { MediaKitData, MediaKitStats } from '@/lib/media-kit';
import { ONE_SHEET_CONFIG, ALL_STAT_OPTIONS, getIndustryLabel, formatStatValue } from '@/lib/media-kit';

interface OneSheetProps {
  mediaKit: MediaKitData;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function OneSheet({ mediaKit }: OneSheetProps) {
  const config = ONE_SHEET_CONFIG[mediaKit.userType];
  const accent = config.accentColor;
  const { r, g, b } = hexToRgb(accent);
  const industryLabel = getIndustryLabel(mediaKit.industryValue, mediaKit.userType);
  const hasIndustry = mediaKit.industryValue && mediaKit.industryValue !== 'n/a' && industryLabel;
  const hasTopics = mediaKit.contentTopics.length > 0;
  const hasCollabs = config.showCollaborations && mediaKit.brandCollaborations.length > 0;
  const hasGallery = mediaKit.galleryPhotoUrls.length > 0;
  const hasOfferings = mediaKit.offerings.some(o => o.name.trim());

  // Use selectedStatKeys if user has chosen, otherwise fall back to config defaults
  const statKeysToShow: (keyof MediaKitStats)[] =
    mediaKit.selectedStatKeys.length > 0
      ? mediaKit.selectedStatKeys
      : config.statKeys.map(s => s.key);

  const hasCustomSelection = mediaKit.selectedStatKeys.length > 0;

  const visibleStats = statKeysToShow
    .map(key => {
      const label = ALL_STAT_OPTIONS.find(o => o.key === key)?.label || key;
      return { key, label };
    })
    .filter(({ key }) => {
      // If user explicitly selected metrics, always show them
      if (hasCustomSelection) return true;
      // Otherwise hide zero-value stats (except engagement rate)
      const val = mediaKit.stats[key];
      if (key === 'engagementRate') return true;
      if (key === 'postingFreq') return !!val;
      return Number(val) > 0;
    });

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{
        fontFamily: "'Lexend', 'Inter', 'Helvetica Neue', sans-serif",
        backgroundColor: '#FAFAFA',
        color: '#1a1a1a',
        fontSize: '10px',
      }}
    >
      {/* Hero header with gradient */}
      <div
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
          padding: '20px 24px 28px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: '30%',
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        <div className="flex items-center gap-4 relative" style={{ zIndex: 1 }}>
          {mediaKit.headerPhotoUrl ? (
            <img
              src={mediaKit.headerPhotoUrl}
              alt=""
              className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0"
              style={{
                border: '3px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            >
              {(mediaKit.displayName || '?').charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1
              className="font-bold leading-tight"
              style={{ color: '#FFFFFF', fontSize: '18px', letterSpacing: '-0.02em' }}
            >
              {mediaKit.displayName || 'Your Name'}
            </h1>
            {mediaKit.tagline && (
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', marginTop: '2px', fontWeight: 500 }}>
                {mediaKit.tagline}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {mediaKit.username && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>@{mediaKit.username}</span>
              )}
              {mediaKit.city && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>{mediaKit.city}</span>
              )}
              {hasIndustry && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>
                  {industryLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar — elevated card overlapping header */}
      {visibleStats.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: '-14px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '10px 8px',
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(visibleStats.length, 4)}, 1fr)`,
              gap: '4px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {visibleStats.slice(0, 4).map(({ key, label }) => (
              <div key={key} style={{ textAlign: 'center', padding: '2px 0' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}>
                  {formatStatValue(key, mediaKit.stats[key])}
                </div>
                <div style={{
                  fontSize: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#999',
                  fontWeight: 600,
                  marginTop: '1px',
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          {/* Additional stats row if more than 4 */}
          {visibleStats.length > 4 && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '8px',
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(visibleStats.length - 4, 4)}, 1fr)`,
                gap: '4px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                marginTop: '4px',
              }}
            >
              {visibleStats.slice(4, 8).map(({ key, label }) => (
                <div key={key} style={{ textAlign: 'center', padding: '2px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
                    {formatStatValue(key, mediaKit.stats[key])}
                  </div>
                  <div style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', fontWeight: 600, marginTop: '1px' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body content */}
      <div className="flex-1 px-5 flex flex-col" style={{ gap: '10px', paddingTop: '12px', paddingBottom: '8px' }}>
        {/* Bio */}
        {mediaKit.bio && (
          <p style={{ color: '#555', fontSize: '10px', lineHeight: 1.6, fontWeight: 400 }}>
            {mediaKit.bio}
          </p>
        )}

        {/* Contact row */}
        {(mediaKit.email || mediaKit.phone) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {mediaKit.email && (
              <span style={{ color: '#777', fontSize: '9px' }}>{mediaKit.email}</span>
            )}
            {mediaKit.phone && (
              <span style={{ color: '#777', fontSize: '9px' }}>{mediaKit.phone}</span>
            )}
          </div>
        )}

        {/* Photo Gallery */}
        {hasGallery && (
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(mediaKit.galleryPhotoUrls.length, 3)}, 1fr)`,
            }}
          >
            {mediaKit.galleryPhotoUrls.slice(0, 6).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
                crossOrigin="anonymous"
              />
            ))}
          </div>
        )}

        {/* Content Topics & Collaborations side by side */}
        {(hasTopics || hasCollabs) && (
          <div className="flex gap-3">
            {hasTopics && (
              <div className="flex-1">
                <div style={{
                  fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontWeight: 700, color: '#aaa', marginBottom: '4px',
                }}>
                  Content Focus
                </div>
                <div className="flex flex-wrap gap-1">
                  {mediaKit.contentTopics.map(topic => (
                    <span
                      key={topic}
                      style={{
                        fontSize: '8px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        backgroundColor: `rgba(${r},${g},${b},0.1)`,
                        color: accent,
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hasCollabs && (
              <div className="flex-1">
                <div style={{
                  fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontWeight: 700, color: '#aaa', marginBottom: '4px',
                }}>
                  Past Collaborations
                </div>
                <div className="flex flex-wrap gap-1">
                  {mediaKit.brandCollaborations.map(brand => (
                    <span
                      key={brand}
                      style={{
                        fontSize: '8px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        backgroundColor: '#f0f0f0',
                        color: '#444',
                      }}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offerings */}
        {hasOfferings && (
          <div>
            <div style={{
              fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.1em',
              fontWeight: 700, color: '#aaa', marginBottom: '6px',
            }}>
              {config.offeringsLabel}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mediaKit.offerings
                .filter(o => o.name.trim())
                .map(offering => (
                  <div
                    key={offering.id}
                    style={{
                      borderRadius: '8px',
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #eee',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#222' }}>
                        {offering.name}
                      </span>
                      {offering.price && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, color: accent,
                          flexShrink: 0,
                        }}>
                          {offering.price}
                        </span>
                      )}
                    </div>
                    {offering.description && (
                      <p style={{ fontSize: '7.5px', color: '#999', marginTop: '2px', lineHeight: 1.4 }}>
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
        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: '6px',
            borderTop: `1px solid rgba(${r},${g},${b},0.15)`,
          }}
        >
          <span style={{ color: '#bbb', fontSize: '7px', fontWeight: 500, letterSpacing: '0.02em' }}>
            Powered by Armadillo Analytics
          </span>
          <span style={{ color: '#bbb', fontSize: '7px', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
