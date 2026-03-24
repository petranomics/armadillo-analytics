'use client';

import type { MediaKitData, MediaKitStats } from '@/lib/media-kit';
import { ONE_SHEET_CONFIG, ALL_STAT_OPTIONS, getIndustryLabel, formatStatValue } from '@/lib/media-kit';

interface OneSheetProps {
  mediaKit: MediaKitData;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}
function lighten(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * amt))},${Math.min(255, Math.round(g + (255 - g) * amt))},${Math.min(255, Math.round(b + (255 - b) * amt))})`;
}
function fmtNum(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const SOCIALS: Record<string, string> = { instagram: 'IG', tiktok: 'TT', youtube: 'YT', twitter: 'X', linkedin: 'LI', website: 'WEB' };
const CHART_COLORS = ['#BF5700', '#E8894A', '#F5C38E', '#7EC8A0', '#5BA3CF', '#A78BDB'];

// ============ SHARED BUILDING BLOCKS ============

function SectionLabel({ children, style }: { children: string; style?: React.CSSProperties }) {
  return <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#aaa', marginBottom: '5px', ...style }}>{children}</div>;
}

function EngagementDonut({ rate, accent, size = 80 }: { rate: number; accent: string; size?: number }) {
  const dash = Math.min(rate / 10, 1) * 251.2;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="8"
          strokeDasharray={`${dash} ${251.2 - dash}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: accent, lineHeight: 1 }}>{rate}%</span>
        <span style={{ fontSize: size * 0.09, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Eng. Rate</span>
      </div>
    </div>
  );
}

function InsightBadge({ value, label, color, large }: { value: string; label: string; color: string; large?: boolean }) {
  const { r, g, b } = hexToRgb(color);
  return (
    <div style={{ background: `rgba(${r},${g},${b},0.06)`, borderRadius: '8px', padding: large ? '8px 10px' : '5px 8px', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: large ? '16px' : '13px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: large ? '7px' : '6px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>{label}</div>
    </div>
  );
}

function ContentTypeBars({ data, accent, large }: { data: { type: string; avgEng: number }[]; accent: string; large?: boolean }) {
  const max = Math.max(...data.map(t => t.avgEng), 1);
  return (
    <div>
      <div style={{ fontSize: large ? '7.5px' : '7px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', fontWeight: 600 }}>
        Avg Engagement by Content Type
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: large ? '5px' : '4px' }}>
        {data.map((t, i) => (
          <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: large ? '8px' : '7px', color: '#666', width: '56px', textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>{t.type}</span>
            <div style={{ flex: 1, height: large ? '14px' : '11px', background: '#f5f5f5', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{ width: `${(t.avgEng / max) * 100}%`, height: '100%', borderRadius: '7px', background: i === 0 ? accent : lighten(accent, 0.3 + i * 0.12) }} />
            </div>
            <span style={{ fontSize: large ? '8px' : '7px', fontWeight: 700, color: '#444', width: '32px', flexShrink: 0 }}>{fmtNum(t.avgEng)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentMixBar({ data, large }: { data: { type: string; pct: number }[]; large?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: large ? '7.5px' : '7px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>Content Mix</div>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: large ? '16px' : '13px', marginBottom: '4px' }}>
        {data.map((seg, i) => (
          <div key={seg.type} style={{ width: `${seg.pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {seg.pct >= 14 && <span style={{ fontSize: large ? '7px' : '6px', fontWeight: 700, color: '#fff' }}>{seg.pct}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {data.map((seg, i) => (
          <div key={seg.type} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span style={{ fontSize: large ? '7.5px' : '7px', color: '#555' }}>{seg.type} <strong>{seg.pct}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HashtagPills({ data, accent, large }: { data: { tag: string; avgEng: number }[]; accent: string; large?: boolean }) {
  const { r, g, b } = hexToRgb(accent);
  return (
    <div>
      <div style={{ fontSize: large ? '7.5px' : '7px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>Top Performing Hashtags</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {data.map((h, i) => (
          <span key={h.tag} style={{
            fontSize: large ? '8.5px' : '8px', padding: large ? '3px 9px' : '3px 7px', borderRadius: '12px', fontWeight: 600,
            background: i === 0 ? accent : `rgba(${r},${g},${b},${0.12 - i * 0.02})`,
            color: i === 0 ? '#fff' : accent,
          }}>{h.tag}</span>
        ))}
      </div>
    </div>
  );
}

function CollabLiftBar({ data, accent, large }: { data: { withCollabs: number; without: number }; accent: string; large?: boolean }) {
  const lift = Math.round(((data.withCollabs - data.without) / data.without) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: large ? '8px' : '6px', borderTop: '1px solid #f0f0f0', marginTop: '4px' }}>
      <div style={{ fontSize: large ? '7.5px' : '7px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0, width: '42px' }}>Collab Lift</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '7px', color: '#999' }}>With collabs</span>
            <span style={{ fontSize: '7.5px', fontWeight: 700, color: accent }}>{fmtNum(data.withCollabs)}</span>
          </div>
          <div style={{ height: large ? '8px' : '6px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: accent, borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '7px', color: '#999' }}>Without</span>
            <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#999' }}>{fmtNum(data.without)}</span>
          </div>
          <div style={{ height: large ? '8px' : '6px', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(data.without / data.withCollabs) * 100}%`, height: '100%', background: lighten(accent, 0.5), borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ fontSize: large ? '11px' : '9px', fontWeight: 800, color: '#22C55E', flexShrink: 0 }}>+{lift}%</div>
      </div>
    </div>
  );
}

function StatsGrid({ stats, visibleStats, accent, dark }: { stats: MediaKitStats; visibleStats: { key: keyof MediaKitStats; label: string }[]; accent: string; dark?: boolean }) {
  const topRow = visibleStats.slice(0, 4);
  const bottomRow = visibleStats.slice(4, 8);
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topRow.length, 4)}, 1fr)`, gap: '4px' }}>
        {topRow.map(({ key, label }) => (
          <div key={key} style={{ textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: accent, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {formatStatValue(key, stats[key])}
            </div>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? 'rgba(255,255,255,0.4)' : '#999', fontWeight: 600, marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
      {bottomRow.length > 0 && (
        <>
          <div style={{ height: '1px', background: dark ? '#333' : '#f0f0f0', margin: '4px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(bottomRow.length, 4)}, 1fr)`, gap: '4px' }}>
            {bottomRow.map(({ key, label }) => (
              <div key={key} style={{ textAlign: 'center', padding: '3px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: accent, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {formatStatValue(key, stats[key])}
                </div>
                <div style={{ fontSize: '6.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? 'rgba(255,255,255,0.4)' : '#999', fontWeight: 600, marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function OfferingsGrid({ offerings, accent, label, dark }: { offerings: MediaKitData['offerings']; accent: string; label: string; dark?: boolean }) {
  const filtered = offerings.filter(o => o.name.trim());
  if (!filtered.length) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
        {filtered.map(o => (
          <div key={o.id} style={{ borderRadius: '10px', padding: '7px 9px', backgroundColor: dark ? '#1A1A1A' : '#FFF', border: `1px solid ${dark ? '#282828' : '#eee'}`, borderLeft: `3px solid ${accent}`, boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: dark ? '#fff' : '#222' }}>{o.name}</span>
              {o.price && <span style={{ fontSize: '9px', fontWeight: 800, color: accent, flexShrink: 0 }}>{o.price}</span>}
            </div>
            {o.description && (
              <>
                <div style={{ height: '1px', background: dark ? '#333' : '#f5f5f5', margin: '4px 0' }} />
                <p style={{ fontSize: '7.5px', color: dark ? 'rgba(255,255,255,0.4)' : '#999', lineHeight: 1.4, margin: 0 }}>{o.description}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialRow({ links, accent }: { links: MediaKitData['socialLinks']; accent: string }) {
  if (!links?.length) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '4px 0' }}>
      {links.map((link, i) => (
        <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 800 }}>
          {SOCIALS[link.platform] || link.platform.slice(0, 2).toUpperCase()}
        </div>
      ))}
    </div>
  );
}

function FooterBar({ accent, email, callToAction }: { accent: string; email?: string; callToAction?: string }) {
  const { r, g, b } = hexToRgb(accent);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: `1px solid rgba(${r},${g},${b},0.15)` }}>
      <span style={{ color: '#bbb', fontSize: '7px', fontWeight: 500 }}>Powered by Armadillo Analytics</span>
      <span style={{ color: '#bbb', fontSize: '7px', fontWeight: 500 }}>
        {!callToAction && email ? email : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>
    </div>
  );
}

// ============ MAIN ============

export default function OneSheet({ mediaKit }: OneSheetProps) {
  const config = ONE_SHEET_CONFIG[mediaKit.userType];
  const layout = config.layout;
  const accent = mediaKit.accentColorOverride || config.accentColor;
  const { r, g, b } = hexToRgb(accent);
  const industryLabel = getIndustryLabel(mediaKit.industryValue, mediaKit.userType);
  const hasIndustry = mediaKit.industryValue && mediaKit.industryValue !== 'n/a' && industryLabel;
  const hasTopics = mediaKit.contentTopics.length > 0;
  const hasCollabs = config.showCollaborations && mediaKit.brandCollaborations.length > 0;
  const hasGallery = mediaKit.galleryPhotoUrls.length > 0;
  const hasOfferings = mediaKit.offerings.some(o => o.name.trim());
  const hasCover = !!mediaKit.coverPhotoUrl;
  const hasSocialLinks = (mediaKit.socialLinks?.length ?? 0) > 0;

  const hasContentMix = (mediaKit.contentMix?.length ?? 0) > 0;
  const hasTypePerf = (mediaKit.contentTypePerformance?.length ?? 0) > 0;
  const hasTopHashtags = (mediaKit.topHashtags?.length ?? 0) > 0;
  const hasCollabLift = !!mediaKit.collabLift;
  const hasViralityScore = mediaKit.viralityScore != null && mediaKit.viralityScore > 0;
  const hasEngTrend = mediaKit.engagementTrend != null;
  const hasBestDay = !!mediaKit.bestPostingDay;
  const hasAnyInsights = hasContentMix || hasTypePerf || hasTopHashtags || hasCollabLift || hasViralityScore || hasEngTrend || hasBestDay;

  const selected = mediaKit.selectedStatKeys ?? [];
  const statKeysToShow: (keyof MediaKitStats)[] = selected.length > 0 ? selected : config.statKeys.map(s => s.key);
  const hasCustomSelection = selected.length > 0;
  const visibleStats = statKeysToShow
    .map(key => ({ key, label: ALL_STAT_OPTIONS.find(o => o.key === key)?.label || key }))
    .filter(({ key }) => {
      if (hasCustomSelection) return true;
      const val = mediaKit.stats[key];
      if (key === 'engagementRate') return true;
      if (key === 'postingFreq') return !!val;
      return Number(val) > 0;
    });

  // ========================
  // PROFESSIONAL LAYOUT (LinkedIn, Media Outlet)
  // ========================
  if (layout === 'professional') {
    return (
      <div style={{ fontFamily: "'Lexend', 'Inter', 'Helvetica Neue', sans-serif", backgroundColor: '#FFFFFF', color: '#1a1a1a', fontSize: '10px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Dark header */}
        <div style={{ background: '#1B1F23', padding: '24px 28px 20px', flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: accent }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {mediaKit.headerPhotoUrl ? (
              <img src={mediaKit.headerPhotoUrl} alt="" crossOrigin="anonymous"
                style={{ width: '76px', height: '76px', borderRadius: '10px', objectFit: 'cover', border: `2px solid ${accent}` }} />
            ) : (
              <div style={{ width: '76px', height: '76px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, background: accent, color: '#fff' }}>
                {(mediaKit.displayName || '?').charAt(0)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.15 }}>
                {mediaKit.displayName || 'Your Name'}
              </h1>
              {mediaKit.tagline && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: '3px 0 0', fontWeight: 400 }}>{mediaKit.tagline}</p>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {hasIndustry && <span style={{ fontSize: '8px', padding: '3px 10px', borderRadius: '4px', background: accent, color: '#fff', fontWeight: 600 }}>{industryLabel}</span>}
                {mediaKit.city && <span style={{ fontSize: '8px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{mediaKit.city}</span>}
                {mediaKit.username && <span style={{ fontSize: '8px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>@{mediaKit.username}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats — full-width */}
        {visibleStats.length > 0 && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
            <StatsGrid stats={mediaKit.stats} visibleStats={visibleStats} accent={accent} />
          </div>
        )}

        {/* Two-column body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left — text */}
          <div style={{ flex: '1 1 52%', padding: '16px 20px 10px', display: 'flex', flexDirection: 'column', gap: '10px', borderRight: '1px solid #f0f0f0' }}>
            {mediaKit.bio && <p style={{ color: '#444', fontSize: '10px', lineHeight: 1.65, margin: 0 }}>{mediaKit.bio}</p>}
            {(mediaKit.email || mediaKit.phone) && (
              <div style={{ display: 'flex', gap: '14px' }}>
                {mediaKit.email && <span style={{ color: '#666', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>✉</span> {mediaKit.email}</span>}
                {mediaKit.phone && <span style={{ color: '#666', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>☎</span> {mediaKit.phone}</span>}
              </div>
            )}
            {mediaKit.callToAction && (
              <div style={{ background: `rgba(${r},${g},${b},0.04)`, borderLeft: `3px solid ${accent}`, padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
                <p style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{mediaKit.callToAction}</p>
              </div>
            )}
            {hasTopics && (
              <div>
                <SectionLabel>Expertise</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {mediaKit.contentTopics.map(t => <span key={t} style={{ fontSize: '8.5px', padding: '3px 10px', borderRadius: '4px', fontWeight: 600, background: `rgba(${r},${g},${b},0.08)`, color: accent }}>{t}</span>)}
                </div>
              </div>
            )}
            <OfferingsGrid offerings={mediaKit.offerings} accent={accent} label={config.offeringsLabel} />
            <div style={{ flex: 1 }} />
            <SocialRow links={mediaKit.socialLinks} accent={accent} />
            <FooterBar accent={accent} email={mediaKit.email} callToAction={mediaKit.callToAction} />
          </div>

          {/* Right — analytics */}
          <div style={{ flex: '1 1 48%', padding: '16px 18px 10px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FAFAFA' }}>
            <SectionLabel>Performance Insights</SectionLabel>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <EngagementDonut rate={mediaKit.stats.engagementRate} accent={accent} size={80} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {hasViralityScore && <InsightBadge large value={mediaKit.viralityScore! >= 100 ? (mediaKit.viralityScore! / 100).toFixed(1) + 'x' : mediaKit.viralityScore + '%'} label="Virality Score" color={accent} />}
                {hasEngTrend && <InsightBadge large value={`${mediaKit.engagementTrend! >= 0 ? '↑' : '↓'} ${Math.abs(mediaKit.engagementTrend!)}%`} label="Engagement Trend" color={mediaKit.engagementTrend! >= 0 ? '#22C55E' : '#EF4444'} />}
                {hasBestDay && <InsightBadge large value={mediaKit.bestPostingDay!.day} label="Best Posting Day" color={accent} />}
              </div>
            </div>
            {hasTypePerf && <ContentTypeBars data={mediaKit.contentTypePerformance!} accent={accent} large />}
            {hasContentMix && <ContentMixBar data={mediaKit.contentMix!} large />}
            {hasTopHashtags && <HashtagPills data={mediaKit.topHashtags!} accent={accent} large />}
            {hasCollabLift && <CollabLiftBar data={mediaKit.collabLift!} accent={accent} large />}
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // VIDEO LAYOUT (YouTube)
  // ========================
  if (layout === 'video') {
    return (
      <div style={{ fontFamily: "'Lexend', 'Inter', 'Helvetica Neue', sans-serif", backgroundColor: '#0F0F0F', color: '#fff', fontSize: '10px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Cover */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {hasCover ? (
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <img src={mediaKit.coverPhotoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0F0F0F 0%, transparent 60%)' }} />
            </div>
          ) : (
            <div style={{ height: '80px', background: `linear-gradient(135deg, ${accent}33, transparent)` }} />
          )}
          {mediaKit.growthCallout && (
            <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 3, background: accent, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px' }}>↑</span>{mediaKit.growthCallout}
            </div>
          )}
          <div style={{ padding: '0 24px', marginTop: hasCover ? '-36px' : '0', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '14px' }}>
            {mediaKit.headerPhotoUrl ? (
              <img src={mediaKit.headerPhotoUrl} alt="" crossOrigin="anonymous"
                style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${accent}` }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 700, color: accent }}>
                {(mediaKit.displayName || '?').charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{mediaKit.displayName || 'Your Name'}</h1>
              {mediaKit.tagline && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', margin: '3px 0 0' }}>{mediaKit.tagline}</p>}
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                {mediaKit.username && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>@{mediaKit.username}</span>}
                {hasIndustry && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: `${accent}33`, color: accent, fontWeight: 600 }}>{industryLabel}</span>}
                {mediaKit.city && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{mediaKit.city}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {visibleStats.length > 0 && (
          <div style={{ padding: '12px 20px', flexShrink: 0 }}>
            <div style={{ background: '#1A1A1A', borderRadius: '14px', padding: '12px 10px', border: `1px solid ${accent}33` }}>
              <StatsGrid stats={mediaKit.stats} visibleStats={visibleStats} accent={accent} dark />
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, padding: '0 22px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mediaKit.bio && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '9.5px', lineHeight: 1.6, margin: 0 }}>{mediaKit.bio}</p>}

          {/* Insights */}
          {hasAnyInsights && (
            <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '12px 14px', border: '1px solid #282828' }}>
              <SectionLabel style={{ color: 'rgba(255,255,255,0.3)' }}>Performance Insights</SectionLabel>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <EngagementDonut rate={mediaKit.stats.engagementRate} accent={accent} size={72} />
                  <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                    {hasViralityScore && <InsightBadge value={mediaKit.viralityScore! >= 100 ? (mediaKit.viralityScore! / 100).toFixed(1) + 'x' : mediaKit.viralityScore + '%'} label="Virality" color={accent} />}
                    {hasEngTrend && <InsightBadge value={`${mediaKit.engagementTrend! >= 0 ? '↑' : '↓'} ${Math.abs(mediaKit.engagementTrend!)}%`} label="Trend" color={mediaKit.engagementTrend! >= 0 ? '#22C55E' : '#EF4444'} />}
                  </div>
                  {hasBestDay && <InsightBadge value={mediaKit.bestPostingDay!.day} label="Best Day" color={accent} />}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hasTypePerf && <ContentTypeBars data={mediaKit.contentTypePerformance!} accent={accent} large />}
                  {hasContentMix && <ContentMixBar data={mediaKit.contentMix!} large />}
                  {hasTopHashtags && <HashtagPills data={mediaKit.topHashtags!} accent={accent} large />}
                </div>
              </div>
              {hasCollabLift && <CollabLiftBar data={mediaKit.collabLift!} accent={accent} large />}
            </div>
          )}

          {/* Video thumbnails — larger */}
          {hasGallery && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {mediaKit.galleryPhotoUrls.slice(0, 4).map((url, i) => (
                <div key={i} style={{ flex: 1, position: 'relative' }}>
                  <img src={url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '65px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderLeft: '6px solid #fff', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', marginLeft: '2px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topics & Collabs */}
          {(hasTopics || hasCollabs) && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {hasTopics && (
                <div style={{ flex: 1 }}>
                  <SectionLabel style={{ color: 'rgba(255,255,255,0.3)' }}>Content Focus</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {mediaKit.contentTopics.map(t => <span key={t} style={{ fontSize: '8px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, background: `${accent}22`, color: accent }}>{t}</span>)}
                  </div>
                </div>
              )}
              {hasCollabs && (
                <div style={{ flex: 1 }}>
                  <SectionLabel style={{ color: 'rgba(255,255,255,0.3)' }}>Past Collaborations</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {mediaKit.brandCollaborations.map(b => <span key={b} style={{ fontSize: '8px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, background: '#282828', color: 'rgba(255,255,255,0.7)' }}>{b}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <OfferingsGrid offerings={mediaKit.offerings} accent={accent} label={config.offeringsLabel} dark />

          {mediaKit.callToAction && (
            <div style={{ background: `${accent}11`, borderLeft: `3px solid ${accent}`, padding: '7px 12px', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{mediaKit.callToAction}</p>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <SocialRow links={mediaKit.socialLinks} accent={accent} />
          <FooterBar accent={accent} email={mediaKit.email} callToAction={mediaKit.callToAction} />
        </div>
      </div>
    );
  }

  // ========================
  // COMMUNITY LAYOUT (Local Business)
  // ========================
  if (layout === 'community') {
    return (
      <div style={{ fontFamily: "'Lexend', 'Inter', 'Helvetica Neue', sans-serif", backgroundColor: '#FAFAFA', color: '#1a1a1a', fontSize: '10px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ position: 'relative', flexShrink: 0, minHeight: hasCover ? '24%' : '18%', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 0 24px 0' }}>
          {hasCover ? (
            <>
              <img src={mediaKit.coverPhotoUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}, ${lighten(accent, 0.3)})` }} />
          )}
          {mediaKit.growthCallout && (
            <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 3, background: accent, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px' }}>↑</span>{mediaKit.growthCallout}
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {mediaKit.headerPhotoUrl ? (
              <img src={mediaKit.headerPhotoUrl} alt="" crossOrigin="anonymous"
                style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#fff', border: '3px solid rgba(255,255,255,0.5)' }}>
                {(mediaKit.displayName || '?').charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{mediaKit.displayName || 'Your Name'}</h1>
              {mediaKit.tagline && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: '3px 0 0' }}>{mediaKit.tagline}</p>}
              <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                {mediaKit.city && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500 }}>{mediaKit.city}</span>}
                {hasIndustry && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500 }}>{industryLabel}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {visibleStats.length > 0 && (
          <div style={{ padding: '0 16px', marginTop: '-12px', position: 'relative', zIndex: 4 }}>
            <div style={{ background: '#FFF', borderRadius: '14px', padding: '10px 8px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <StatsGrid stats={mediaKit.stats} visibleStats={visibleStats} accent={accent} />
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mediaKit.bio && <p style={{ color: '#555', fontSize: '10px', lineHeight: 1.6, margin: 0 }}>{mediaKit.bio}</p>}
          {(mediaKit.email || mediaKit.phone) && (
            <div style={{ display: 'flex', gap: '14px' }}>
              {mediaKit.email && <span style={{ color: '#777', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>✉</span> {mediaKit.email}</span>}
              {mediaKit.phone && <span style={{ color: '#777', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>☎</span> {mediaKit.phone}</span>}
            </div>
          )}

          {/* Offerings FIRST */}
          <OfferingsGrid offerings={mediaKit.offerings} accent={accent} label={config.offeringsLabel} />

          {/* Gallery — larger for community */}
          {hasGallery && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {mediaKit.galleryPhotoUrls.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" crossOrigin="anonymous" style={{ flex: 1, height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #eee' }} />
              ))}
            </div>
          )}

          {/* Insights */}
          {hasAnyInsights && (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
              <SectionLabel>Social Performance</SectionLabel>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <EngagementDonut rate={mediaKit.stats.engagementRate} accent={accent} size={72} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {hasBestDay && <InsightBadge large value={mediaKit.bestPostingDay!.day} label="Best Day" color={accent} />}
                    {hasEngTrend && <InsightBadge large value={`${mediaKit.engagementTrend! >= 0 ? '↑' : '↓'} ${Math.abs(mediaKit.engagementTrend!)}%`} label="Eng. Trend" color={mediaKit.engagementTrend! >= 0 ? '#22C55E' : '#EF4444'} />}
                  </div>
                  {hasTypePerf && <ContentTypeBars data={mediaKit.contentTypePerformance!} accent={accent} large />}
                </div>
              </div>
            </div>
          )}

          {mediaKit.callToAction && (
            <div style={{ background: `rgba(${r},${g},${b},0.05)`, borderLeft: `3px solid ${accent}`, padding: '7px 12px', borderRadius: '0 10px 10px 0' }}>
              <p style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{mediaKit.callToAction}</p>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <SocialRow links={mediaKit.socialLinks} accent={accent} />
          <FooterBar accent={accent} email={mediaKit.email} callToAction={mediaKit.callToAction} />
        </div>
      </div>
    );
  }

  // ========================
  // VISUAL LAYOUT (Instagram, TikTok) — default
  // ========================
  return (
    <div style={{ fontFamily: "'Lexend', 'Inter', 'Helvetica Neue', sans-serif", backgroundColor: '#FAFAFA', color: '#1a1a1a', fontSize: '10px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Hero — taller */}
      <div style={{ position: 'relative', flexShrink: 0, minHeight: hasCover ? '24%' : '18%', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 0 36px 0' }}>
        {hasCover ? (
          <>
            <img src={mediaKit.coverPhotoUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }} />
            <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '60%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
          </>
        )}
        {mediaKit.growthCallout && (
          <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 3, background: accent, color: '#fff', fontSize: '8px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '10px' }}>↑</span>{mediaKit.growthCallout}
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 24px', display: 'flex', alignItems: 'flex-end', gap: '14px', width: '100%' }}>
          <div style={{ marginBottom: '-30px', flexShrink: 0 }}>
            {mediaKit.headerPhotoUrl ? (
              <img src={mediaKit.headerPhotoUrl} alt="" crossOrigin="anonymous" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '3px solid rgba(255,255,255,0.5)' }}>
                {(mediaKit.displayName || '?').charAt(0)}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
            <h1 style={{ color: '#FFF', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>{mediaKit.displayName || 'Your Name'}</h1>
            {mediaKit.tagline && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', marginTop: '3px', fontWeight: 400, lineHeight: 1.3 }}>{mediaKit.tagline}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
              {mediaKit.city && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500 }}>{mediaKit.city}</span>}
              {hasIndustry && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500 }}>{industryLabel}</span>}
              {mediaKit.username && <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>@{mediaKit.username}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats — 2 rows */}
      {visibleStats.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: '-14px', position: 'relative', zIndex: 4 }}>
          <div style={{ background: '#FFF', borderRadius: '14px', padding: '10px 8px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderLeft: `4px solid ${accent}` }}>
            <StatsGrid stats={mediaKit.stats} visibleStats={visibleStats} accent={accent} />
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(mediaKit.bio || mediaKit.email || mediaKit.phone) && (
          <div>
            {mediaKit.bio && <p style={{ color: '#555', fontSize: '10px', lineHeight: 1.6, margin: 0 }}>{mediaKit.bio}</p>}
            {(mediaKit.email || mediaKit.phone) && (
              <div style={{ display: 'flex', gap: '14px', marginTop: mediaKit.bio ? '4px' : 0 }}>
                {mediaKit.email && <span style={{ color: '#777', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>✉</span> {mediaKit.email}</span>}
                {mediaKit.phone && <span style={{ color: '#777', fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ fontSize: '10px' }}>☎</span> {mediaKit.phone}</span>}
              </div>
            )}
          </div>
        )}

        {/* Insights — expanded */}
        {hasAnyInsights && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
            <SectionLabel>Performance Insights</SectionLabel>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <EngagementDonut rate={mediaKit.stats.engagementRate} accent={accent} size={76} />
                {hasViralityScore && <InsightBadge large value={mediaKit.viralityScore! >= 100 ? (mediaKit.viralityScore! / 100).toFixed(1) + 'x' : mediaKit.viralityScore + '%'} label="Virality Score" color={accent} />}
                {hasEngTrend && <InsightBadge large value={`${mediaKit.engagementTrend! >= 0 ? '↑' : '↓'} ${Math.abs(mediaKit.engagementTrend!)}%`} label="Eng. Trend" color={mediaKit.engagementTrend! >= 0 ? '#22C55E' : '#EF4444'} />}
                {hasBestDay && <InsightBadge large value={mediaKit.bestPostingDay!.day} label="Best Day" color={accent} />}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hasTypePerf && <ContentTypeBars data={mediaKit.contentTypePerformance!} accent={accent} large />}
                {hasContentMix && <ContentMixBar data={mediaKit.contentMix!} large />}
                {hasTopHashtags && <HashtagPills data={mediaKit.topHashtags!} accent={accent} large />}
              </div>
            </div>
            {hasCollabLift && <CollabLiftBar data={mediaKit.collabLift!} accent={accent} large />}
          </div>
        )}

        {/* Gallery — larger photos */}
        {hasGallery && (
          <div style={{ display: 'flex', gap: '5px' }}>
            {mediaKit.galleryPhotoUrls.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" crossOrigin="anonymous" style={{ flex: 1, height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
            ))}
          </div>
        )}

        {mediaKit.callToAction && (
          <div style={{ background: `rgba(${r},${g},${b},0.05)`, borderLeft: `3px solid ${accent}`, padding: '7px 12px', borderRadius: '0 10px 10px 0' }}>
            <p style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{mediaKit.callToAction}</p>
          </div>
        )}

        {(hasTopics || hasCollabs) && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {hasTopics && (
              <div style={{ flex: 1 }}>
                <SectionLabel>Content Focus</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {mediaKit.contentTopics.map(t => <span key={t} style={{ fontSize: '8px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, backgroundColor: `rgba(${r},${g},${b},0.08)`, color: accent }}>{t}</span>)}
                </div>
              </div>
            )}
            {hasCollabs && (
              <div style={{ flex: 1 }}>
                <SectionLabel>Past Collaborations</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {mediaKit.brandCollaborations.map(b => <span key={b} style={{ fontSize: '8px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, backgroundColor: '#f0f0f0', color: '#444' }}>{b}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        <OfferingsGrid offerings={mediaKit.offerings} accent={accent} label={config.offeringsLabel} />

        <div style={{ flex: 1 }} />
        <SocialRow links={mediaKit.socialLinks} accent={accent} />
        <FooterBar accent={accent} email={mediaKit.email} callToAction={mediaKit.callToAction} />
      </div>
    </div>
  );
}
