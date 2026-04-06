import type { MetricDefinition } from './user-types';

export function getAIOneLiner(metric: MetricDefinition, trend: number): string {
  const up = trend >= 0;
  const abs = Math.abs(trend);
  const strong = abs >= 5;

  const insights: Record<string, [string, string]> = {
    engagement_rate: [
      strong ? `Up ${abs}% — audience interaction is accelerating` : `Holding steady — consistent engagement across recent posts`,
      strong ? `Down ${abs}% — review recent content mix and posting times` : `Minor dip — within normal range, monitor over the next cycle`,
    ],
    likes: [
      strong ? `Likes up — recent posts are landing with your audience` : `Likes stable — reliable baseline performance`,
      strong ? `Like velocity slowing — test stronger opening hooks` : `Slight pullback — check if posting cadence shifted`,
    ],
    follower_growth: [
      strong ? `Accelerating — current strategy is driving net new followers` : `Steady growth — audience building at a healthy pace`,
      strong ? `Growth stalled — consider collabs or trend-aligned content to restart` : `Marginal slowdown — typical after a growth surge`,
    ],
    comments: [
      `Comments up ${abs}% — audience is actively participating`,
      `Comments dropped — end captions with a direct question to prompt responses`,
    ],
    shares: [
      `Share volume increasing — content is resonating beyond your core audience`,
      `Fewer shares — focus on utility-driven or opinion-based posts that prompt forwarding`,
    ],
    saves: [
      `Saves climbing — audience finds your content reference-worthy`,
      `Saves declining — educational posts, lists, and how-tos tend to recover this metric`,
    ],
    reach: [
      strong ? `Reach expanded ${abs}% — content is surfacing for new audiences` : `Reach steady — maintaining current distribution levels`,
      strong ? `Reach contracted ${abs}% — review hashtag strategy and posting windows` : `Small reach dip — test Reels or short-form to boost discovery`,
    ],
    impressions: [
      `Impressions up — posts appearing in feeds ${abs}% more frequently`,
      `Impressions down — content may be deprioritized in the feed algorithm`,
    ],
    views: [
      `Video views up — thumbnails and hooks are performing well`,
      `Views dropped — the first 3 seconds determine retention, tighten your opening`,
    ],
    profile_views: [
      `Profile visits increasing — content is driving curiosity about your brand`,
      `Profile visits declining — audit your bio and pinned content for conversion`,
    ],
    website_taps: [
      `Website traffic from social up — calls to action are converting`,
      `Website taps down — strengthen CTAs and test link placement in Stories`,
    ],
    story_completion: [
      `Story completion rate strong — pacing and length are well-calibrated`,
      `Story drop-off increasing — cap at 5-7 frames for better completion`,
    ],
    reel_retention: [
      `Reel retention solid — audience watching through`,
      `Retention slipping — front-load the payoff in the first 2 seconds`,
    ],
    top_posts: [
      `Top performers outpacing your average — identify the pattern and replicate`,
      `Top post performance flattening — review last month's best content for format cues`,
    ],
    best_posting_times: [
      `Posting windows aligned with peak audience activity`,
      `May be missing peak hours — cross-reference with your activity heatmap`,
    ],
    hashtag_performance: [
      `Hashtags driving stronger discovery than previous period`,
      `Hashtag reach declining — rotate in trending tags relevant to your niche`,
    ],
    subscriber_growth: [
      `Subscriber momentum strong — content is converting viewers to followers`,
      `Sub growth slowing — pinned comments and end screens can improve conversion`,
    ],
    watch_time: [
      `Watch time increasing — a key ranking signal across platforms`,
      `Watch time declining — shorter intros and tighter editing can help recover`,
    ],
    click_through_rate: [
      `CTR up — thumbnails and titles are earning clicks`,
      `CTR dipped — A/B test thumbnail styles against your top performers`,
    ],
    conversion_rate: [
      `Conversions up ${abs}% — purchase funnel is working`,
      `Conversion rate down — audit product placement and CTA clarity`,
    ],
    revenue_per_video: [
      `Revenue per video increasing — higher yield per piece of content`,
      `Revenue per video declined — prioritize higher-margin products in features`,
    ],
    shop_clicks: [
      `Shop clicks increasing — product hooks are landing`,
      `Shop clicks down — showcase products earlier in the content`,
    ],
  };

  const pair = insights[metric.id];
  if (pair) return up ? pair[0] : pair[1];

  const categoryFallbacks: Record<string, [string, string]> = {
    engagement: [
      `Engagement up ${abs}% — current content strategy is delivering`,
      `Down ${abs}% — test different formats to identify what re-engages your audience`,
    ],
    reach: [
      `Visibility up ${abs}% — content reaching new segments`,
      `Reach dipped ${abs}% — experiment with posting times and content formats`,
    ],
    audience: [
      `Audience metrics improving — attracting aligned followers`,
      `Audience metric declined — verify content aligns with target demographic`,
    ],
    content: [
      `Content performance trending up — double down on the formats that are working`,
      `Content metric dipped — analyze top-performing posts for repeatable patterns`,
    ],
    growth: [
      `Growth accelerating — audience expanding at an above-average rate`,
      `Growth slowed — strategic collaborations can re-ignite momentum`,
    ],
    revenue: [
      `Revenue up ${abs}% — monetization approach is yielding results`,
      `Revenue dipped — revisit pricing strategy or promotional content mix`,
    ],
    competitive: [
      `Gaining ground relative to niche peers`,
      `Competitors may be outpacing — review their recent content approach`,
    ],
    sentiment: [
      `Audience sentiment trending positive — community health is strong`,
      `Sentiment shifted — review recent comments for recurring concerns`,
    ],
  };

  const catPair = categoryFallbacks[metric.category];
  if (catPair) return up ? catPair[0] : catPair[1];

  return up
    ? `Up ${abs}% this period — maintain current approach`
    : `Down ${abs}% — investigate what shifted`;
}
