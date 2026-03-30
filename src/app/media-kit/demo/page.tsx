'use client';

import { useState } from 'react';
import OneSheet from '@/components/media-kit/OneSheet';
import type { MediaKitData } from '@/lib/media-kit';

// Shared insights data
const INSIGHTS = {
  contentMix: [
    { type: 'Reels / Video', pct: 42 },
    { type: 'Carousels', pct: 28 },
    { type: 'Photos', pct: 30 },
  ],
  bestPostingDay: { day: 'Wed', avgEngagement: 8420 },
  contentTypePerformance: [
    { type: 'Reels / Video', avgEng: 6840, postCount: 52 },
    { type: 'Carousels', avgEng: 4210, postCount: 35 },
    { type: 'Photos', avgEng: 2890, postCount: 38 },
  ],
  viralityScore: 190,
  engagementTrend: 18,
  topHashtags: [
    { tag: '#austinlife', avgEng: 9200, count: 14 },
    { tag: '#wellnesstips', avgEng: 7800, count: 11 },
    { tag: '#homedecor', avgEng: 6400, count: 9 },
    { tag: '#texasfoodie', avgEng: 5900, count: 8 },
    { tag: '#morningroutine', avgEng: 5100, count: 6 },
  ],
  collabLift: { withCollabs: 7200, without: 4100 },
};

const SHARED = {
  email: 'hello@example.com',
  phone: '(512) 555-0147',
  city: 'Austin, TX',
  uploadedPhotos: [] as string[],
  selectedStatKeys: [] as (keyof MediaKitData['stats'])[],
  socialLinks: [
    { platform: 'instagram', url: '#', handle: '@demo' },
    { platform: 'tiktok', url: '#', handle: '@demo' },
    { platform: 'youtube', url: '#', handle: 'Demo' },
    { platform: 'website', url: '#', handle: 'demo.com' },
  ],
  audienceDemographics: { topAge: '', topGender: '', topLocation: '' },
  layoutOverride: '' as const,
  coverPhotoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
  headerPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  galleryPhotoUrls: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  ],
  platform: 'instagram' as const,
  lastUpdated: new Date().toISOString(),
  ...INSIGHTS,
};

const DEMOS: { label: string; data: MediaKitData }[] = [
  {
    label: 'Instagram / Influencer',
    data: {
      ...SHARED,
      userType: 'influencer',
      displayName: 'Jessica Martinez',
      username: 'jessmartinez',
      industryValue: 'lifestyle',
      tagline: 'Lifestyle & wellness content for the modern Texan',
      bio: 'Austin-based lifestyle creator sharing everyday wellness, home design, and local eats. I partner with brands that align with my community of health-conscious millennials.',
      contentTopics: ['Wellness', 'Home Decor', 'Food & Drink', 'Fitness', 'Travel'],
      brandCollaborations: ['Whole Foods', 'Lululemon', 'Anthropologie', 'Daily Harvest', 'Oura Ring'],
      stats: { followers: 127400, engagementRate: 4.8, totalLikes: 1843200, totalComments: 94500, totalViews: 8720000, avgViewsPerPost: 24300, totalPosts: 1247, postingFreq: '5x / week', totalShares: 42100, avgEngPerPost: 1587, likesPerComment: 19.5, engPer1KFollowers: 15538.5, viewsToEngPct: 22.7, avgCommentsPerPost: 76, shareRate: 2.1 },
      offerings: [
        { id: '1', name: 'Sponsored Post', price: '$1,200', description: 'In-feed photo or carousel' },
        { id: '2', name: 'Reel / Video', price: '$2,500', description: '15-60s branded video' },
        { id: '3', name: 'Story Package', price: '$800', description: '3-5 slides with link sticker' },
        { id: '4', name: 'UGC Bundle', price: '$3,000', description: '3 videos + usage rights' },
      ],
      growthCallout: '+12K in 30 days',
      accentColorOverride: '#BF5700',
      callToAction: "Let's create something amazing together! Booking Q2 2026.",
    },
  },
  {
    label: 'LinkedIn / Professional',
    data: {
      ...SHARED,
      userType: 'linkedin-creator',
      displayName: 'David Chen',
      username: 'davidchen',
      industryValue: 'technology',
      tagline: 'VP Engineering | Building high-performance teams at scale',
      bio: '15+ years building engineering orgs from 5 to 500+. I write about technical leadership, team culture, and the human side of scaling startups. Former Head of Eng at two unicorn exits.',
      contentTopics: ['Engineering Leadership', 'Team Building', 'Startup Culture', 'Technical Strategy'],
      brandCollaborations: [],
      stats: { followers: 84200, engagementRate: 6.2, totalLikes: 520000, totalComments: 48300, totalViews: 3200000, avgViewsPerPost: 18500, totalPosts: 342, postingFreq: '3x / week', totalShares: 18200, avgEngPerPost: 1714, likesPerComment: 10.8, engPer1KFollowers: 6966.7, viewsToEngPct: 18.3, avgCommentsPerPost: 141, shareRate: 3.1 },
      offerings: [
        { id: '1', name: 'Sponsored Post', price: '$2,000', description: 'Thought leadership feature' },
        { id: '2', name: 'Keynote Speaking', price: '$8,000', description: 'Conference keynote (45 min)' },
        { id: '3', name: 'Advisory Session', price: '$500/hr', description: 'Engineering leadership consulting' },
        { id: '4', name: 'Newsletter Sponsor', price: '$1,500', description: '28K subscriber newsletter' },
      ],
      growthCallout: '+5K connections in 60 days',
      accentColorOverride: '#0A66C2',
      callToAction: 'Open to advisory roles, speaking engagements, and thought leadership partnerships.',
      headerPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      coverPhotoUrl: '',
      galleryPhotoUrls: [],
      socialLinks: [
        { platform: 'linkedin', url: '#', handle: 'davidchen' },
        { platform: 'twitter', url: '#', handle: '@dchen' },
        { platform: 'website', url: '#', handle: 'davidchen.dev' },
      ],
      contentTypePerformance: [
        { type: 'Articles', avgEng: 8200, postCount: 45 },
        { type: 'Short Posts', avgEng: 4800, postCount: 210 },
        { type: 'Carousels', avgEng: 6100, postCount: 87 },
      ],
      contentMix: [
        { type: 'Short Posts', pct: 61 },
        { type: 'Carousels', pct: 25 },
        { type: 'Articles', pct: 14 },
      ],
      topHashtags: [
        { tag: '#engineeringleadership', avgEng: 11200, count: 18 },
        { tag: '#startuplife', avgEng: 8400, count: 12 },
        { tag: '#techleadership', avgEng: 7100, count: 9 },
        { tag: '#teambuilding', avgEng: 5600, count: 7 },
      ],
      collabLift: undefined,
    },
  },
  {
    label: 'YouTube / Video',
    data: {
      ...SHARED,
      userType: 'youtuber',
      displayName: 'TechReview Pro',
      username: 'techreviewpro',
      industryValue: 'tech_reviews',
      tagline: 'In-depth tech reviews & tutorials — no BS, just data',
      bio: 'I break down the latest tech with real-world benchmarks and honest opinions. 200K+ subscribers trust me for buying decisions on phones, laptops, and smart home gear.',
      contentTopics: ['Tech Reviews', 'Benchmarks', 'Smart Home', 'Laptops', 'Mobile'],
      brandCollaborations: ['Samsung', 'Anker', 'dbrand', 'NordVPN', 'Squarespace'],
      stats: { followers: 218000, engagementRate: 3.4, totalLikes: 4200000, totalComments: 186000, totalViews: 42000000, avgViewsPerPost: 85000, totalPosts: 495, postingFreq: '2x / week', totalShares: 0, avgEngPerPost: 8860, likesPerComment: 22.6, engPer1KFollowers: 20119.3, viewsToEngPct: 10.4, avgCommentsPerPost: 376, shareRate: 0 },
      offerings: [
        { id: '1', name: 'Dedicated Review', price: '$5,000', description: 'Full 10-15 min video' },
        { id: '2', name: 'Integrated Sponsor (60s)', price: '$2,500', description: 'Mid-roll or intro spot' },
        { id: '3', name: 'Shorts Feature', price: '$1,000', description: 'YouTube Short mention' },
        { id: '4', name: 'Product Placement', price: '$1,800', description: 'Organic integration' },
      ],
      growthCallout: '+18K subs this month',
      accentColorOverride: '#FF0000',
      callToAction: 'Currently booking Q2 integrations. Product samples welcome.',
      headerPhotoUrl: 'https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=200&h=200&fit=crop&crop=face',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
      galleryPhotoUrls: [
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
      ],
      socialLinks: [
        { platform: 'youtube', url: '#', handle: 'TechReview Pro' },
        { platform: 'twitter', url: '#', handle: '@techreviewpro' },
        { platform: 'instagram', url: '#', handle: '@techreviewpro' },
        { platform: 'website', url: '#', handle: 'techreviewpro.com' },
      ],
      contentTypePerformance: [
        { type: 'Reviews', avgEng: 12400, postCount: 180 },
        { type: 'Tutorials', avgEng: 8900, postCount: 120 },
        { type: 'Comparisons', avgEng: 15200, postCount: 95 },
        { type: 'Shorts', avgEng: 3800, postCount: 100 },
      ],
      contentMix: [
        { type: 'Reviews', pct: 36 },
        { type: 'Tutorials', pct: 24 },
        { type: 'Comparisons', pct: 19 },
        { type: 'Shorts', pct: 21 },
      ],
      viralityScore: 390,
      topHashtags: [
        { tag: '#techreview', avgEng: 14200, count: 22 },
        { tag: '#smartphone', avgEng: 11800, count: 15 },
        { tag: '#benchmark', avgEng: 9400, count: 11 },
      ],
    },
  },
  {
    label: 'Local Business / Community',
    data: {
      ...SHARED,
      userType: 'local-business',
      displayName: 'South Congress Bakery',
      username: 'socobakerytx',
      industryValue: 'food_beverage',
      tagline: 'Artisan pastries & bread — baked fresh daily on SoCo',
      bio: 'Family-owned bakery on South Congress Ave since 2018. We specialize in sourdough, French pastries, and custom wedding cakes using locally sourced ingredients.',
      contentTopics: ['Artisan Bread', 'Pastries', 'Wedding Cakes', 'Local Ingredients'],
      brandCollaborations: [],
      stats: { followers: 14800, engagementRate: 7.2, totalLikes: 98000, totalComments: 12400, totalViews: 420000, avgViewsPerPost: 2100, totalPosts: 386, postingFreq: '4x / week', totalShares: 3200, avgEngPerPost: 294, likesPerComment: 7.9, engPer1KFollowers: 7675.7, viewsToEngPct: 27.0, avgCommentsPerPost: 32, shareRate: 2.8 },
      offerings: [
        { id: '1', name: 'Event Catering', price: 'From $500', description: 'Pastry platters for 20-100 guests' },
        { id: '2', name: 'Custom Wedding Cake', price: 'From $800', description: 'Tasting + design consultation' },
        { id: '3', name: 'Pop-Up Collab', price: 'Revenue share', description: 'Joint events with local brands' },
        { id: '4', name: 'Wholesale Partnership', price: 'Inquiry', description: 'Supply cafes & restaurants' },
      ],
      growthCallout: '',
      accentColorOverride: '#22C55E',
      callToAction: 'Visit us at 1501 S Congress Ave or DM for custom orders!',
      headerPhotoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=400&fit=crop',
      galleryPhotoUrls: [
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1486427944544-d2c246c4df14?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=300&fit=crop',
      ],
      socialLinks: [
        { platform: 'instagram', url: '#', handle: '@socobakerytx' },
        { platform: 'tiktok', url: '#', handle: '@socobakerytx' },
        { platform: 'website', url: '#', handle: 'socobakerytx.com' },
      ],
      contentTypePerformance: [
        { type: 'Reels / Video', avgEng: 1840, postCount: 65 },
        { type: 'Photos', avgEng: 920, postCount: 280 },
        { type: 'Carousels', avgEng: 1200, postCount: 41 },
      ],
      contentMix: [
        { type: 'Photos', pct: 72 },
        { type: 'Reels / Video', pct: 17 },
        { type: 'Carousels', pct: 11 },
      ],
      viralityScore: 0,
      engagementTrend: 24,
      topHashtags: [
        { tag: '#austinbakery', avgEng: 2100, count: 28 },
        { tag: '#sourdough', avgEng: 1800, count: 22 },
        { tag: '#soco', avgEng: 1500, count: 15 },
      ],
      collabLift: undefined,
    },
  },
];

export default function MediaKitDemoPage() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-armadillo-text">One-Sheet Layouts</h1>
          <p className="text-xs text-armadillo-muted mt-1">
            Each platform type gets a distinct layout — click to preview
          </p>
        </div>
        <a href="/media-kit" className="text-xs text-burnt hover:underline">&larr; Back to editor</a>
      </div>

      {/* Layout tabs */}
      <div className="flex gap-1 bg-armadillo-card border border-armadillo-border rounded-lg p-1 mb-5">
        {DEMOS.map((d, i) => (
          <button
            key={d.label}
            onClick={() => setActiveIdx(i)}
            className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
              activeIdx === i ? 'bg-burnt text-white' : 'text-armadillo-muted hover:text-armadillo-text'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl shadow-2xl overflow-hidden border border-armadillo-border"
        style={{ aspectRatio: '8.5/11' }}
      >
        <OneSheet mediaKit={DEMOS[activeIdx].data} />
      </div>
    </div>
  );
}
