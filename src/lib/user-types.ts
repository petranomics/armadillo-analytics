import type { Platform } from './types';

// ============ USER TYPES ============
export type UserType =
  | 'influencer'
  | 'linkedin-creator'
  | 'tiktok-shop'
  | 'youtuber'
  | 'local-business'
  | 'media-outlet';

export type Plan = 'free' | 'lite' | 'pro';

export interface UserTypeConfig {
  id: UserType;
  label: string;
  description: string;
  icon: string;
  color: string;
  primaryPlatforms: Platform[];
  quickFormFields: QuickFormField[];
  defaultMetrics: string[];
  proMetrics: string[];
}

export interface QuickFormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'multi-select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// ============ METRIC DEFINITIONS ============
export interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  category: MetricCategory;
  platforms: Platform[] | 'all';
  tier: Plan;
  format: 'number' | 'percentage' | 'currency' | 'ratio' | 'duration';
  icon: string;
}

export type MetricCategory =
  | 'engagement'
  | 'reach'
  | 'audience'
  | 'content'
  | 'growth'
  | 'revenue'
  | 'sentiment'
  | 'competitive';

// ============ FREE TIER METRICS ============
// Bare-bones metrics for the free plan: followers, follower trends, like count, total engagement.
export const FREE_METRIC_IDS: string[] = [
  'engagement_rate',
  'likes',
  'follower_growth',
];

// ============ USER TYPE CONFIGS ============
export const USER_TYPES: UserTypeConfig[] = [
  {
    id: 'influencer',
    label: 'Influencer / Creator',
    description: 'Book brand deals, grow your audience, and prove your value with professional analytics',
    icon: '✦',
    color: '#BF5700',
    primaryPlatforms: ['instagram', 'tiktok', 'youtube'],
    quickFormFields: [
      { id: 'niche', label: 'Your niches', type: 'multi-select', options: [
        { value: 'beauty', label: 'Beauty & Skincare' },
        { value: 'fashion', label: 'Fashion & Style' },
        { value: 'fitness', label: 'Fitness & Wellness' },
        { value: 'food', label: 'Food & Cooking' },
        { value: 'travel', label: 'Travel & Adventure' },
        { value: 'lifestyle', label: 'Lifestyle' },
        { value: 'tech', label: 'Tech & Gaming' },
        { value: 'finance', label: 'Finance & Business' },
        { value: 'parenting', label: 'Parenting & Family' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'follower_range', label: 'Total following', type: 'select', options: [
        { value: 'nano', label: '1K - 10K (Nano)' },
        { value: 'micro', label: '10K - 50K (Micro)' },
        { value: 'mid', label: '50K - 500K (Mid-tier)' },
        { value: 'macro', label: '500K - 1M (Macro)' },
        { value: 'mega', label: '1M+ (Mega)' },
      ]},
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'brand-deals', label: 'Land brand deals' },
        { value: 'grow', label: 'Grow my audience' },
        { value: 'monetize', label: 'Monetize my content' },
        { value: 'portfolio', label: 'Build a media kit / portfolio' },
      ]},
    ],
    defaultMetrics: ['saves', 'profile_views', 'website_taps', 'media_kit_score', 'hashtag_performance', 'competitor_benchmark', 'story_completion', 'reel_retention'],
    proMetrics: ['audience_authenticity', 'brand_affinity', 'rate_recommendation', 'sentiment_analysis', 'sponsorship_roi', 'audience_overlap'],
  },
  {
    id: 'linkedin-creator',
    label: 'LinkedIn Creator',
    description: 'Grow your professional brand, track thought leadership, and measure content impact',
    icon: '◆',
    color: '#0A66C2',
    primaryPlatforms: ['linkedin'],
    quickFormFields: [
      { id: 'industry', label: 'Your industry', type: 'select', options: [
        { value: 'tech', label: 'Technology' },
        { value: 'finance', label: 'Finance & Banking' },
        { value: 'marketing', label: 'Marketing & Advertising' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'hr', label: 'HR & Recruiting' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'startup', label: 'Startups & VC' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'content_type', label: 'Content style', type: 'multi-select', options: [
        { value: 'thought-leadership', label: 'Thought leadership posts' },
        { value: 'storytelling', label: 'Personal stories & lessons' },
        { value: 'educational', label: 'Educational / How-to' },
        { value: 'news-commentary', label: 'News & industry commentary' },
      ]},
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'personal-brand', label: 'Build personal brand' },
        { value: 'lead-gen', label: 'Generate leads / clients' },
        { value: 'job-search', label: 'Job search & visibility' },
        { value: 'network', label: 'Expand professional network' },
      ]},
    ],
    defaultMetrics: ['reactions_breakdown', 'reposts', 'profile_views', 'link_clicks', 'content_topic_analysis'],
    proMetrics: ['audience_seniority', 'audience_industries', 'audience_company_size', 'viral_coefficient', 'connection_growth_quality', 'dwell_time', 'cta_click_rate'],
  },
  {
    id: 'tiktok-shop',
    label: 'TikTok Shop Seller',
    description: 'Track product performance, optimize content for conversions, and scale your shop revenue',
    icon: '◉',
    color: '#00F2EA',
    primaryPlatforms: ['tiktok'],
    quickFormFields: [
      { id: 'product_category', label: 'Product category', type: 'select', options: [
        { value: 'beauty', label: 'Beauty & Personal Care' },
        { value: 'fashion', label: 'Fashion & Accessories' },
        { value: 'home', label: 'Home & Kitchen' },
        { value: 'electronics', label: 'Electronics & Gadgets' },
        { value: 'food', label: 'Food & Beverage' },
        { value: 'health', label: 'Health & Wellness' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'monthly_revenue', label: 'Monthly shop revenue', type: 'select', options: [
        { value: 'pre-launch', label: 'Pre-launch / Just starting' },
        { value: 'under-1k', label: 'Under $1K/mo' },
        { value: '1k-10k', label: '$1K - $10K/mo' },
        { value: '10k-50k', label: '$10K - $50K/mo' },
        { value: '50k-plus', label: '$50K+/mo' },
      ]},
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'increase-sales', label: 'Increase sales volume' },
        { value: 'optimize-content', label: 'Optimize content for conversions' },
        { value: 'find-affiliates', label: 'Find & manage affiliates' },
        { value: 'scale', label: 'Scale to new products' },
      ]},
    ],
    defaultMetrics: ['video_views', 'shop_clicks', 'conversion_rate', 'revenue_per_video', 'add_to_cart_rate', 'top_products', 'saves'],
    proMetrics: ['customer_acquisition_cost', 'lifetime_value', 'affiliate_performance', 'product_trending_score', 'competitor_pricing', 'return_rate_by_content', 'audience_purchase_intent', 'content_roi'],
  },
  {
    id: 'youtuber',
    label: 'YouTuber',
    description: 'Optimize watch time, grow subscribers, and maximize ad revenue with deep video analytics',
    icon: '▶',
    color: '#FF0000',
    primaryPlatforms: ['youtube'],
    quickFormFields: [
      { id: 'channel_type', label: 'Content types', type: 'multi-select', options: [
        { value: 'vlog', label: 'Vlogs & Daily Life' },
        { value: 'educational', label: 'Educational / Tutorial' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'review', label: 'Reviews & Unboxing' },
        { value: 'entertainment', label: 'Entertainment & Comedy' },
        { value: 'music', label: 'Music' },
        { value: 'news', label: 'News & Commentary' },
        { value: 'how-to', label: 'How-to & DIY' },
      ]},
      { id: 'subscriber_range', label: 'Subscriber count', type: 'select', options: [
        { value: 'under-1k', label: 'Under 1K' },
        { value: '1k-10k', label: '1K - 10K' },
        { value: '10k-100k', label: '10K - 100K' },
        { value: '100k-1m', label: '100K - 1M' },
        { value: '1m-plus', label: '1M+' },
      ]},
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'watch-time', label: 'Increase watch time' },
        { value: 'subscribers', label: 'Grow subscribers' },
        { value: 'ad-revenue', label: 'Maximize ad revenue' },
        { value: 'sponsorships', label: 'Land sponsorships' },
      ]},
    ],
    defaultMetrics: ['views', 'watch_time', 'subscriber_growth', 'avg_view_duration', 'click_through_rate', 'top_videos', 'traffic_sources'],
    proMetrics: ['revenue_per_mille', 'audience_retention_curve', 'end_screen_ctr', 'card_click_rate', 'returning_viewers', 'unique_viewers', 'shorts_vs_long_performance', 'optimal_video_length', 'keyword_ranking', 'suggested_video_rate'],
  },
  {
    id: 'local-business',
    label: 'Local Business',
    description: 'Drive foot traffic, track local engagement, and measure social media ROI for your business',
    icon: '⬡',
    color: '#22C55E',
    primaryPlatforms: ['instagram', 'tiktok'],
    quickFormFields: [
      { id: 'business_type', label: 'Business type', type: 'select', options: [
        { value: 'restaurant', label: 'Restaurant / Cafe / Bar' },
        { value: 'retail', label: 'Retail / Boutique' },
        { value: 'salon', label: 'Salon / Spa / Beauty' },
        { value: 'fitness', label: 'Gym / Fitness Studio' },
        { value: 'services', label: 'Professional Services' },
        { value: 'real-estate', label: 'Real Estate' },
        { value: 'auto', label: 'Automotive' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'location', label: 'City / Area', type: 'text', placeholder: 'e.g. Austin, TX' },
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'foot-traffic', label: 'Drive foot traffic' },
        { value: 'awareness', label: 'Brand awareness' },
        { value: 'bookings', label: 'Increase bookings / reservations' },
        { value: 'community', label: 'Build local community' },
      ]},
    ],
    defaultMetrics: ['profile_views', 'website_taps', 'directions_taps', 'call_taps', 'local_audience_percentage', 'competitor_local_benchmark', 'seasonal_trends', 'saves'],
    proMetrics: ['content_to_visit_correlation', 'review_sentiment', 'ugc_tracking', 'promo_code_performance', 'event_engagement'],
  },
  {
    id: 'media-outlet',
    label: 'Media Outlet / Publisher',
    description: 'Track article distribution, audience engagement, and social reach across your channels',
    icon: '◈',
    color: '#A855F7',
    primaryPlatforms: ['twitter', 'instagram', 'linkedin'],
    quickFormFields: [
      { id: 'outlet_type', label: 'Outlet type', type: 'select', options: [
        { value: 'news', label: 'News Organization' },
        { value: 'magazine', label: 'Magazine / Publication' },
        { value: 'blog', label: 'Blog / Digital Media' },
        { value: 'podcast', label: 'Podcast' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'broadcast', label: 'Broadcast / TV / Radio' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'audience_size', label: 'Combined social following', type: 'select', options: [
        { value: 'under-10k', label: 'Under 10K' },
        { value: '10k-100k', label: '10K - 100K' },
        { value: '100k-1m', label: '100K - 1M' },
        { value: '1m-plus', label: '1M+' },
      ]},
      { id: 'goal', label: 'Your goals', type: 'multi-select', options: [
        { value: 'distribution', label: 'Maximize content distribution' },
        { value: 'engagement', label: 'Increase audience engagement' },
        { value: 'subscribers', label: 'Grow subscribers / readers' },
        { value: 'ad-revenue', label: 'Drive ad revenue' },
      ]},
    ],
    defaultMetrics: ['link_clicks', 'reposts', 'content_velocity', 'cross_platform_reach', 'article_amplification_rate'],
    proMetrics: ['audience_overlap', 'breaking_news_performance', 'content_lifecycle', 'journalist_attribution', 'topic_trending', 'newsletter_conversion'],
  },
];

// ============ ALL METRICS ============
// Tier rules:
//   free  = bare bones (followers, follower trends, like count, total engagement)
//   lite  = all engagement, all visibility, content (minus seasonal), all revenue/monetization, growth
//   pro   = audience demographics, competitive intelligence, sentiment, seasonal trends
export const ALL_METRICS: MetricDefinition[] = [
  // ENGAGEMENT
  { id: 'engagement_rate', label: 'Engagement Rate', description: 'Interactions as a percentage of reach or followers', category: 'engagement', platforms: 'all', tier: 'free', format: 'percentage', icon: '⚡' },
  { id: 'likes', label: 'Likes', description: 'Total likes across your posts', category: 'engagement', platforms: 'all', tier: 'free', format: 'number', icon: '♥' },
  { id: 'comments', label: 'Comments', description: 'Total comments received', category: 'engagement', platforms: 'all', tier: 'lite', format: 'number', icon: '💬' },
  { id: 'shares', label: 'Shares', description: 'Times your content was shared or forwarded', category: 'engagement', platforms: 'all', tier: 'lite', format: 'number', icon: '↗' },
  { id: 'saves', label: 'Saves / Bookmarks', description: 'How often people save your content to revisit later', category: 'engagement', platforms: ['instagram', 'tiktok'], tier: 'lite', format: 'number', icon: '🔖' },
  { id: 'reactions_breakdown', label: 'Reactions Breakdown', description: 'Split of reactions by type — like, celebrate, support, insightful, etc.', category: 'engagement', platforms: ['linkedin'], tier: 'lite', format: 'number', icon: '👏' },
  { id: 'reposts', label: 'Reposts / Retweets', description: 'How often your content is reshared to other feeds', category: 'engagement', platforms: ['twitter', 'linkedin'], tier: 'lite', format: 'number', icon: '🔁' },
  { id: 'sentiment_analysis', label: 'Sentiment Analysis', description: 'AI breakdown of whether your comments skew positive, neutral, or negative', category: 'sentiment', platforms: 'all', tier: 'pro', format: 'ratio', icon: '🎭' },

  // REACH & VISIBILITY
  { id: 'reach', label: 'Reach', description: 'Unique people who saw your content', category: 'reach', platforms: 'all', tier: 'lite', format: 'number', icon: '👁' },
  { id: 'impressions', label: 'Impressions', description: 'Total times your content appeared on someone\'s screen', category: 'reach', platforms: 'all', tier: 'lite', format: 'number', icon: '📊' },
  { id: 'views', label: 'Video Views', description: 'Total plays on your videos and Reels', category: 'reach', platforms: ['tiktok', 'youtube', 'instagram'], tier: 'lite', format: 'number', icon: '▶' },
  { id: 'video_views', label: 'Video Views', description: 'Total plays on your product videos', category: 'reach', platforms: ['tiktok'], tier: 'lite', format: 'number', icon: '▶' },
  { id: 'profile_views', label: 'Profile Views', description: 'How many people tapped into your profile page', category: 'reach', platforms: ['instagram', 'linkedin', 'tiktok'], tier: 'lite', format: 'number', icon: '👤' },
  { id: 'website_taps', label: 'Website Taps', description: 'Taps on the website link in your bio or profile', category: 'reach', platforms: ['instagram', 'linkedin'], tier: 'lite', format: 'number', icon: '🔗' },
  { id: 'directions_taps', label: 'Get Directions Taps', description: 'People who tapped to get driving directions to your business', category: 'reach', platforms: ['instagram'], tier: 'lite', format: 'number', icon: '📍' },
  { id: 'call_taps', label: 'Call Taps', description: 'People who tapped your phone number to call your business', category: 'reach', platforms: ['instagram'], tier: 'lite', format: 'number', icon: '📞' },
  { id: 'link_clicks', label: 'Link Clicks', description: 'Clicks on links you shared in posts or bio', category: 'reach', platforms: ['twitter', 'linkedin'], tier: 'lite', format: 'number', icon: '🔗' },

  // AUDIENCE (all pro — no audience demographics on free or lite)
  { id: 'audience_demographics', label: 'Audience Demographics', description: 'Who follows you — age, gender, and location breakdown', category: 'audience', platforms: 'all', tier: 'pro', format: 'ratio', icon: '👥' },
  { id: 'follower_growth', label: 'Follower Growth', description: 'How fast your audience is growing over time', category: 'growth', platforms: 'all', tier: 'free', format: 'number', icon: '📈' },
  { id: 'subscriber_growth', label: 'Subscriber Growth', description: 'New YouTube subscribers gained over time', category: 'growth', platforms: ['youtube'], tier: 'lite', format: 'number', icon: '📈' },
  { id: 'audience_authenticity', label: 'Audience Authenticity', description: 'What percentage of your followers are real people vs bots', category: 'audience', platforms: ['instagram', 'tiktok', 'twitter'], tier: 'pro', format: 'percentage', icon: '🛡' },
  { id: 'audience_seniority', label: 'Audience Seniority', description: 'Job level breakdown — C-suite, VP, Manager, Individual Contributor', category: 'audience', platforms: ['linkedin'], tier: 'pro', format: 'ratio', icon: '🏢' },
  { id: 'audience_industries', label: 'Audience Industries', description: 'Which industries your followers work in', category: 'audience', platforms: ['linkedin'], tier: 'pro', format: 'ratio', icon: '🏭' },
  { id: 'audience_company_size', label: 'Audience Company Size', description: 'Startup vs enterprise — company size of your followers', category: 'audience', platforms: ['linkedin'], tier: 'pro', format: 'ratio', icon: '🏗' },
  { id: 'audience_overlap', label: 'Audience Overlap', description: 'How much of your audience also follows your competitors', category: 'audience', platforms: 'all', tier: 'pro', format: 'percentage', icon: '⊕' },
  { id: 'local_audience_percentage', label: 'Local Audience %', description: 'What share of your followers are in your city or area', category: 'audience', platforms: ['instagram', 'tiktok'], tier: 'pro', format: 'percentage', icon: '📍' },

  // CONTENT (seasonal_trends is pro; everything else is lite)
  { id: 'top_posts', label: 'Top Performing Posts', description: 'Your highest-engagement content ranked', category: 'content', platforms: 'all', tier: 'lite', format: 'number', icon: '🏆' },
  { id: 'top_videos', label: 'Top Videos', description: 'Your most-watched and highest-engagement videos', category: 'content', platforms: ['youtube'], tier: 'lite', format: 'number', icon: '🏆' },
  { id: 'top_products', label: 'Top Products', description: 'Your best-selling products driven by content', category: 'content', platforms: ['tiktok'], tier: 'lite', format: 'number', icon: '🛍' },
  { id: 'best_posting_times', label: 'Best Posting Times', description: 'When your audience is most active and engaged', category: 'content', platforms: 'all', tier: 'lite', format: 'duration', icon: '🕐' },
  { id: 'content_velocity', label: 'Content Velocity', description: 'How quickly your posts pick up traction after publishing', category: 'content', platforms: 'all', tier: 'lite', format: 'duration', icon: '⚡' },
  { id: 'hashtag_performance', label: 'Hashtag Performance', description: 'Which hashtags drive the most reach for your content', category: 'content', platforms: ['instagram', 'tiktok', 'twitter'], tier: 'lite', format: 'ratio', icon: '#' },
  { id: 'content_topic_analysis', label: 'Content Topic Analysis', description: 'Which topics and themes perform best for you', category: 'content', platforms: 'all', tier: 'lite', format: 'ratio', icon: '📝' },
  { id: 'optimal_video_length', label: 'Optimal Video Length', description: 'Which video durations get the best engagement', category: 'content', platforms: ['youtube', 'tiktok'], tier: 'lite', format: 'duration', icon: '⏱' },
  { id: 'seasonal_trends', label: 'Seasonal Trends', description: 'How your performance changes by season, holiday, or time of year', category: 'content', platforms: 'all', tier: 'pro', format: 'ratio', icon: '📅' },

  // YOUTUBE SPECIFIC
  { id: 'watch_time', label: 'Watch Time', description: 'Total hours people spent watching your content', category: 'engagement', platforms: ['youtube'], tier: 'lite', format: 'duration', icon: '⏰' },
  { id: 'avg_view_duration', label: 'Avg View Duration', description: 'How long the average viewer watches before leaving', category: 'engagement', platforms: ['youtube'], tier: 'lite', format: 'duration', icon: '⏳' },
  { id: 'click_through_rate', label: 'Click-Through Rate', description: 'How often people click your thumbnail when they see it', category: 'content', platforms: ['youtube'], tier: 'lite', format: 'percentage', icon: '🖱' },
  { id: 'traffic_sources', label: 'Traffic Sources', description: 'Where your views come from — search, suggested, browse, external', category: 'reach', platforms: ['youtube'], tier: 'lite', format: 'ratio', icon: '🔄' },
  { id: 'revenue_per_mille', label: 'RPM (Revenue per 1K)', description: 'How much you earn per 1,000 views', category: 'revenue', platforms: ['youtube'], tier: 'lite', format: 'currency', icon: '💰' },
  { id: 'audience_retention_curve', label: 'Audience Retention', description: 'Exactly where viewers drop off in your videos', category: 'engagement', platforms: ['youtube'], tier: 'lite', format: 'ratio', icon: '📉' },
  { id: 'returning_viewers', label: 'Returning Viewers', description: 'How many of your viewers keep coming back', category: 'audience', platforms: ['youtube'], tier: 'pro', format: 'percentage', icon: '🔄' },
  { id: 'shorts_vs_long_performance', label: 'Shorts vs Long-form', description: 'How your Shorts perform compared to full-length videos', category: 'content', platforms: ['youtube'], tier: 'lite', format: 'ratio', icon: '📏' },

  // TIKTOK SHOP SPECIFIC
  { id: 'shop_clicks', label: 'Shop Clicks', description: 'How many viewers tapped through to your TikTok Shop', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'number', icon: '🛒' },
  { id: 'conversion_rate', label: 'Conversion Rate', description: 'Percentage of viewers who actually make a purchase', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'percentage', icon: '💳' },
  { id: 'revenue_per_video', label: 'Revenue per Video', description: 'Average dollars earned per video you post', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'currency', icon: '💵' },
  { id: 'add_to_cart_rate', label: 'Add to Cart Rate', description: 'How often viewers add a product to their cart from your content', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'percentage', icon: '🛍' },
  { id: 'customer_acquisition_cost', label: 'Customer Acquisition Cost', description: 'How much it costs you (in content effort) to gain each customer', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'currency', icon: '📊' },
  { id: 'affiliate_performance', label: 'Affiliate Performance', description: 'Sales and commissions driven by your affiliates', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'currency', icon: '🤝' },
  { id: 'product_trending_score', label: 'Product Trending Score', description: 'How much momentum your products have on TikTok right now', category: 'competitive', platforms: ['tiktok'], tier: 'pro', format: 'ratio', icon: '🔥' },
  { id: 'content_roi', label: 'Content ROI', description: 'Revenue earned vs effort invested per piece of content', category: 'revenue', platforms: ['tiktok'], tier: 'lite', format: 'currency', icon: '📈' },

  // INFLUENCER / BRAND DEAL SPECIFIC
  { id: 'media_kit_score', label: 'Media Kit Score', description: 'How attractive your profile looks to potential brand partners', category: 'competitive', platforms: 'all', tier: 'pro', format: 'number', icon: '⭐' },
  { id: 'brand_affinity', label: 'Brand Affinity Map', description: 'Which brands your audience already follows and loves', category: 'audience', platforms: ['instagram', 'tiktok'], tier: 'pro', format: 'ratio', icon: '🏷' },
  { id: 'rate_recommendation', label: 'Rate Recommendation', description: 'What you should charge per post based on your metrics', category: 'revenue', platforms: 'all', tier: 'lite', format: 'currency', icon: '💎' },
  { id: 'competitor_benchmark', label: 'Competitor Benchmark', description: 'How your metrics stack up against similar creators in your niche', category: 'competitive', platforms: 'all', tier: 'pro', format: 'ratio', icon: '📊' },
  { id: 'sponsorship_roi', label: 'Sponsorship ROI', description: 'The actual value you deliver per sponsored post', category: 'revenue', platforms: ['instagram', 'tiktok', 'youtube'], tier: 'lite', format: 'currency', icon: '💰' },
  { id: 'story_completion', label: 'Story Completion Rate', description: 'How many viewers watch your Story all the way through', category: 'engagement', platforms: ['instagram'], tier: 'lite', format: 'percentage', icon: '📱' },
  { id: 'reel_retention', label: 'Reel Retention Rate', description: 'Average percentage of your Reel that viewers actually watch', category: 'engagement', platforms: ['instagram'], tier: 'lite', format: 'percentage', icon: '🎬' },

  // LOCAL BUSINESS SPECIFIC
  { id: 'competitor_local_benchmark', label: 'Local Competitor Benchmark', description: 'How your social presence compares to nearby businesses like yours', category: 'competitive', platforms: ['instagram', 'tiktok'], tier: 'pro', format: 'ratio', icon: '📊' },
  { id: 'ugc_tracking', label: 'UGC Tracking', description: 'Posts from customers that mention or tag your business', category: 'engagement', platforms: ['instagram', 'tiktok'], tier: 'lite', format: 'number', icon: '📸' },
  { id: 'promo_code_performance', label: 'Promo Code Performance', description: 'How often your social-exclusive promo codes get redeemed', category: 'revenue', platforms: 'all', tier: 'lite', format: 'number', icon: '🏷' },

  // MEDIA OUTLET SPECIFIC
  { id: 'article_amplification_rate', label: 'Article Amplification', description: 'How far your articles spread beyond your own followers', category: 'reach', platforms: ['twitter', 'linkedin'], tier: 'lite', format: 'ratio', icon: '📡' },
  { id: 'cross_platform_reach', label: 'Cross-Platform Reach', description: 'Total unique people you reached across all your channels combined', category: 'reach', platforms: 'all', tier: 'lite', format: 'number', icon: '🌐' },
  { id: 'content_lifecycle', label: 'Content Lifecycle', description: 'How many days your content keeps getting engagement after publishing', category: 'content', platforms: 'all', tier: 'lite', format: 'duration', icon: '⏱' },
];

// ============ ONBOARDING STATE ============
export interface OnboardingState {
  step: number;
  userType: UserType | null;
  quickFormAnswers: Record<string, string | string[]>;
  selectedPlatforms: Platform[];
  selectedMetrics: string[];
  plan: Plan;
  platformUsernames: Partial<Record<Platform, string>>;
  competitorAccounts: string[];
}

export const INITIAL_ONBOARDING: OnboardingState = {
  step: 0,
  userType: null,
  quickFormAnswers: {},
  selectedPlatforms: [],
  selectedMetrics: [],
  plan: 'free',
  platformUsernames: {},
  competitorAccounts: [],
};

// Helper to get metric by ID
export function getMetricById(id: string): MetricDefinition | undefined {
  return ALL_METRICS.find(m => m.id === id);
}

// Check if a metric is accessible for a given plan
export function isMetricAccessible(metricTier: Plan, plan: Plan): boolean {
  if (plan === 'pro') return true;
  if (plan === 'lite') return metricTier !== 'pro';
  return metricTier === 'free';
}

// Get all relevant metrics for a user type (for display — caller handles locking)
export function getMetricsForUserType(userType: UserType): MetricDefinition[] {
  const config = USER_TYPES.find(u => u.id === userType);
  if (!config) return [];
  const metricIds = [...new Set([
    ...FREE_METRIC_IDS,
    ...config.defaultMetrics,
    ...config.proMetrics,
  ])];
  return metricIds.map(id => ALL_METRICS.find(m => m.id === id)).filter(Boolean) as MetricDefinition[];
}

// Get the default selected metrics for a plan during onboarding
export function getDefaultSelectedMetrics(userType: UserType, plan: Plan): string[] {
  if (plan === 'free') return [...FREE_METRIC_IDS];
  const config = USER_TYPES.find(u => u.id === userType);
  if (!config) return [...FREE_METRIC_IDS];

  const ids = [...new Set([
    ...FREE_METRIC_IDS,
    ...config.defaultMetrics,
    ...(plan === 'pro' ? config.proMetrics : []),
  ])];

  // Filter to accessible tiers
  return ids.filter(id => {
    const m = ALL_METRICS.find(metric => metric.id === id);
    return m && isMetricAccessible(m.tier, plan);
  });
}

// Group metrics by category
export function groupMetricsByCategory(metrics: MetricDefinition[]): Record<MetricCategory, MetricDefinition[]> {
  const groups: Record<string, MetricDefinition[]> = {};
  for (const m of metrics) {
    if (!groups[m.category]) groups[m.category] = [];
    groups[m.category].push(m);
  }
  return groups as Record<MetricCategory, MetricDefinition[]>;
}

export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  engagement: 'Engagement',
  reach: 'Reach & Visibility',
  audience: 'Audience',
  content: 'Content Performance',
  growth: 'Growth',
  revenue: 'Revenue & Monetization',
  sentiment: 'Sentiment',
  competitive: 'Competitive Intelligence',
};
