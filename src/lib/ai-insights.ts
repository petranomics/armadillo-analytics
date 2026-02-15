import type { MetricDefinition } from './user-types';

export function getMockValue(metric: MetricDefinition): { value: string; trend: number; raw: number } {
  const seed = metric.id.length * 7 + metric.label.length * 3;
  switch (metric.format) {
    case 'percentage':
      return { value: `${(2 + (seed % 15)).toFixed(1)}%`, trend: ((seed % 8) - 3), raw: 2 + (seed % 15) };
    case 'currency':
      return { value: `$${(50 + (seed % 950)).toLocaleString()}`, trend: ((seed % 12) - 4), raw: 50 + (seed % 950) };
    case 'duration':
      return { value: `${1 + (seed % 12)}m ${seed % 60}s`, trend: ((seed % 6) - 2), raw: seed };
    case 'ratio':
      return { value: `${(seed % 5) + 1}:${(seed % 3) + 1}`, trend: ((seed % 7) - 3), raw: seed };
    default: {
      const n = (seed * 137 + 2847) % 50000;
      if (n >= 10000) return { value: `${(n / 1000).toFixed(1)}K`, trend: ((seed % 10) - 3), raw: n };
      if (n >= 1000) return { value: `${(n / 1000).toFixed(1)}K`, trend: ((seed % 10) - 3), raw: n };
      return { value: n.toLocaleString(), trend: ((seed % 10) - 3), raw: n };
    }
  }
}

export function getAIOneLiner(metric: MetricDefinition, trend: number): string {
  const up = trend >= 0;
  const abs = Math.abs(trend);
  const strong = abs >= 5;

  const insights: Record<string, [string, string]> = {
    engagement_rate: [
      strong ? `Strong momentum — your audience is ${abs}% more engaged than last period` : `Steady engagement — your content is resonating consistently`,
      strong ? `Engagement dropped ${abs}% — try experimenting with new content formats` : `Slight dip — normal fluctuation, keep your posting rhythm`,
    ],
    likes: [
      strong ? `Likes are surging — your recent content is hitting with your audience` : `Likes holding steady — your audience is consistently showing love`,
      strong ? `Like count is cooling off — your last few posts may need stronger hooks` : `Small dip in likes — try posting during your peak hours`,
    ],
    follower_growth: [
      strong ? `You're gaining followers faster than usual — something's working` : `Steady growth — you're building a loyal audience`,
      strong ? `Growth slowed — consider collaborations or trending content to re-accelerate` : `Slight slowdown — this is normal after a growth spike`,
    ],
    comments: [
      `Comments are up ${abs}% — your audience wants to talk, keep the conversation going`,
      `Comments dipped — try ending captions with a question to spark discussion`,
    ],
    shares: [
      `Your content is being shared more — this is your strongest growth lever`,
      `Fewer shares this period — create more "save & share" worthy content`,
    ],
    saves: [
      `Saves are climbing — people want to come back to your content, that's high intent`,
      `Saves are down — educational or list-style content tends to boost this metric`,
    ],
    reach: [
      strong ? `Your reach expanded ${abs}% — the algorithm is pushing your content to new audiences` : `Reach is stable — your content is consistently getting in front of people`,
      strong ? `Reach contracted ${abs}% — hashtags and posting times could help here` : `Slight reach dip — try posting more Reels to boost discovery`,
    ],
    impressions: [
      `More eyeballs on your content — your posts are appearing in feeds ${abs}% more often`,
      `Impressions down — your content may be getting less priority in the feed`,
    ],
    views: [
      `Video views are up — your thumbnails and hooks are working`,
      `Views dipped — the first 3 seconds of your video are critical for retention`,
    ],
    profile_views: [
      `More people are checking out your profile — your content is sparking curiosity`,
      `Profile visits slowed — make sure your bio and pinned posts are compelling`,
    ],
    website_taps: [
      `Website traffic from social is up — your CTAs are driving action`,
      `Fewer website taps — try adding clearer calls-to-action in your content`,
    ],
    story_completion: [
      `Viewers are watching your Stories all the way through — great pacing`,
      `Story drop-off increased — keep Stories under 7 frames for better completion`,
    ],
    reel_retention: [
      `Reel retention is strong — your audience is watching longer`,
      `Reel retention dropped — try front-loading your best content in the first 2 seconds`,
    ],
    top_posts: [
      `Your top content is outperforming your average — lean into these formats`,
      `Top post performance dipped — review what worked in your best content last month`,
    ],
    best_posting_times: [
      `Your posting windows are aligned with audience activity — good timing`,
      `You may be missing your audience's peak hours — check your active-hours data`,
    ],
    hashtag_performance: [
      `Your hashtags are driving more discovery than last period`,
      `Hashtag reach is down — rotate in some trending tags relevant to your niche`,
    ],
    subscriber_growth: [
      `Subscriber momentum is strong — your content is converting viewers`,
      `Sub growth slowed — pinned comments and end screens can help convert viewers`,
    ],
    watch_time: [
      `Watch time is climbing — the algorithm rewards this heavily`,
      `Watch time dropped — shorter, punchier intros can help retain viewers`,
    ],
    click_through_rate: [
      `Your thumbnails are earning more clicks — keep testing bold visuals`,
      `CTR dipped — try A/B testing your thumbnail style`,
    ],
    conversion_rate: [
      `Conversions up ${abs}% — your content-to-purchase funnel is working`,
      `Conversion rate dropped — review your product placement and CTAs`,
    ],
    revenue_per_video: [
      `Revenue per video is up — you're earning more from each piece of content`,
      `Revenue per video dipped — focus on products with higher margins`,
    ],
    shop_clicks: [
      `More viewers are tapping through to shop — your product hooks are landing`,
      `Shop clicks down — try showcasing products in the first few seconds`,
    ],
  };

  const pair = insights[metric.id];
  if (pair) return up ? pair[0] : pair[1];

  const categoryFallbacks: Record<string, [string, string]> = {
    engagement: [
      `This engagement metric is trending up ${abs}% — your content strategy is working`,
      `Down ${abs}% — test different content types to re-engage your audience`,
    ],
    reach: [
      `Visibility up ${abs}% — more people are discovering your content`,
      `Reach dipped ${abs}% — experiment with posting times and formats`,
    ],
    audience: [
      `Your audience metrics are improving — you're attracting the right people`,
      `Audience metric declined — review if your content matches your target demographic`,
    ],
    content: [
      `Content performance trending up — double down on what's working`,
      `Content metric dipped — analyze your top posts from last month for patterns`,
    ],
    growth: [
      `Growth is accelerating — your audience is expanding faster`,
      `Growth slowed this period — collaborations can help reignite momentum`,
    ],
    revenue: [
      `Revenue metric up ${abs}% — your monetization strategy is paying off`,
      `Revenue dipped — revisit your pricing or promotional content`,
    ],
    competitive: [
      `You're gaining ground against competitors in your niche`,
      `Competitors may be outpacing you — review their recent content strategy`,
    ],
    sentiment: [
      `Audience sentiment is trending positive — your community loves your content`,
      `Sentiment shifted — check recent comments for feedback to address`,
    ],
  };

  const catPair = categoryFallbacks[metric.category];
  if (catPair) return up ? catPair[0] : catPair[1];

  return up
    ? `Up ${abs}% this period — keep the momentum going`
    : `Down ${abs}% — worth investigating what changed`;
}

export function getAIAnalysis() {
  return {
    generatedAt: 'Feb 12, 2026 at 9:14 AM CT',
    sections: [
      {
        icon: '📊',
        title: 'Performance Summary',
        body: "You're trending higher this week with a 14.8% increase in engagement rate. 68% of your followers are actively interacting with your posts — not just scrolling past. Your total reach hit 284K this month, up 17.8% from January.",
      },
      {
        icon: '⏰',
        title: 'Posting Optimization',
        body: "You typically post around 10 AM CT, but your content performs 40% better when published between 1-2 PM CT. Tuesday and Thursday are your strongest engagement days — your Tuesday posts average 2.1x more saves than other days.",
      },
      {
        icon: '🖼️',
        title: 'Content Insights',
        body: 'Your "Franklin BBQ" review sparked a 96% increase in profile visits compared to your "Lady Bird Lake" post, which had 28% lower engagement. Food reviews consistently outperform lifestyle content by 2.3x. Carousel posts are getting 1.8x more saves than single images.',
      },
      {
        icon: '📅',
        title: 'Coming Up',
        body: "Valentine's Day is 2 days away — your audience engagement typically spikes 35% during holiday-themed content. Consider preparing a themed post. St. Patrick's Day (March 17) is also a strong engagement window for food and nightlife content.",
      },
      {
        icon: '💡',
        title: 'Recommendations',
        body: null,
        bullets: [
          'Shift your posting schedule to 1 PM CT for maximum reach',
          'Double down on food review content — it\'s your top performer by a wide margin',
          'Create a Valentine\'s Day post leveraging your restaurant review format',
          'Try more carousel posts — your audience saves them 1.8x more often',
          'Your Reels under 30 seconds have 22% higher completion rates than longer ones',
        ],
      },
    ],
  };
}
