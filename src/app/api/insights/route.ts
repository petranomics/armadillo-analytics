import { NextRequest, NextResponse } from 'next/server';

interface PostData {
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement: number;
  daysAgo: number;
}

interface TrendContext {
  hashtagStats?: { hashtag: string; postCount: number; trend: string; avgEngagement?: number; relatedHashtags: string[] }[];
  redditTrends?: { title: string; subreddit: string; upvotes: number; comments: number; flair?: string }[];
  tiktokTrends?: { productName: string; category: string; trendScore?: number; description?: string }[];
}

interface InsightsRequest {
  posts: PostData[];
  platform: string;
  username: string;
  followers?: number;
  trends?: TrendContext;
  userType?: string;
  niche?: string;
}

const SYSTEM_PROMPT = `You are an expert social media analyst for Armadillo Analytics, a creator analytics platform based in Austin, TX. You provide sharp, specific, data-driven insights — not generic advice.

You will receive:
1. The user's recent post performance data (likes, comments, shares, views, engagement rates)
2. Current platform trends (trending hashtags, Reddit discussions, TikTok product trends)
3. The user's platform, niche, and follower count

Your job is to synthesize ALL of this into a personalized analytics report. You must:
- Reference specific numbers from their data (not made-up numbers)
- Connect their content performance to current market trends
- Identify patterns in what's working vs what isn't
- Give recommendations that are specific to THEIR data and current trends
- Be direct and actionable — no fluff

Respond with a JSON object (no markdown, no code fences) matching this exact structure:
{
  "sections": [
    {
      "icon": "📊",
      "title": "Performance Summary",
      "body": "2-3 sentences analyzing their overall performance with specific numbers from their data"
    },
    {
      "icon": "📈",
      "title": "Trend Alignment",
      "body": "2-3 sentences connecting their content to current internet/platform trends. Reference specific trending topics, hashtags, or Reddit discussions that are relevant to their niche"
    },
    {
      "icon": "⏰",
      "title": "Posting Optimization",
      "body": "2-3 sentences about their posting patterns, timing, and frequency based on their data"
    },
    {
      "icon": "🖼️",
      "title": "Content Insights",
      "body": "2-3 sentences identifying which content types/topics perform best based on their actual posts. Compare specific posts"
    },
    {
      "icon": "🔥",
      "title": "Trending Opportunities",
      "body": null,
      "bullets": ["3-5 specific content ideas based on current trends that would work for their niche and audience. Each bullet should reference a specific trend and explain how to leverage it"]
    },
    {
      "icon": "💡",
      "title": "Recommendations",
      "body": null,
      "bullets": ["5-8 specific, actionable recommendations based on their data AND current trends. Each should be concrete enough to act on immediately"]
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InsightsRequest;
    const { posts, platform, username, followers, trends, userType, niche } = body;

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: 'No post data provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Anthropic API key configured' },
        { status: 500 }
      );
    }

    // Build the user message with all available context
    const postsSummary = posts.map((p, i) => ({
      rank: i + 1,
      caption: p.caption,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      views: p.views,
      engagementRate: p.engagement + '%',
      daysAgo: p.daysAgo,
    }));

    const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalViews = posts.reduce((s, p) => s + p.views, 0);
    const avgEngagement = (posts.reduce((s, p) => s + p.engagement, 0) / posts.length).toFixed(1);
    const topPost = [...posts].sort((a, b) => b.engagement - a.engagement)[0];
    const worstPost = [...posts].sort((a, b) => a.engagement - b.engagement)[0];

    const userMessage = `Analyze this creator's social media performance:

**Account:** @${username} on ${platform}
**User type:** ${userType || 'influencer'}
**Niche:** ${niche || 'general'}
**Followers:** ${followers || 'unknown'}
**Posts analyzed:** ${posts.length}

**Aggregate Metrics:**
- Total likes: ${totalLikes.toLocaleString()}
- Total comments: ${totalComments.toLocaleString()}
- Total views: ${totalViews.toLocaleString()}
- Average engagement rate: ${avgEngagement}%
- Top performing post: "${topPost.caption}" (${topPost.engagement}% engagement, ${topPost.likes.toLocaleString()} likes)
- Lowest performing post: "${worstPost.caption}" (${worstPost.engagement}% engagement)

**Individual Post Data:**
${JSON.stringify(postsSummary, null, 2)}

${trends ? `**Current Market Trends:**

${trends.hashtagStats ? `Trending Hashtags in their niche:
${trends.hashtagStats.map(h => `- #${h.hashtag}: ${h.postCount.toLocaleString()} posts, trend: ${h.trend}${h.avgEngagement ? `, ${h.avgEngagement}% avg engagement` : ''}${h.relatedHashtags.length ? ` (related: ${h.relatedHashtags.slice(0, 3).join(', ')})` : ''}`).join('\n')}` : ''}

${trends.redditTrends ? `What people are discussing online:
${trends.redditTrends.map(r => `- "${r.title}" (${r.subreddit}, ${r.upvotes.toLocaleString()} upvotes, ${r.comments} comments${r.flair ? `, flair: ${r.flair}` : ''})`).join('\n')}` : ''}

${trends.tiktokTrends ? `TikTok trending products/topics:
${trends.tiktokTrends.map(t => `- ${t.productName} (${t.category}${t.trendScore ? `, trend score: ${t.trendScore}/100` : ''}${t.description ? ` — ${t.description}` : ''})`).join('\n')}` : ''}` : 'No trend data available — focus analysis on the post performance data.'}

Now generate the analytics report. Respond ONLY with the JSON object, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const textBlock = result.content?.find((b: { type: string }) => b.type === 'text');
    if (!textBlock?.text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response from Claude
    const jsonText = textBlock.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const analysis = JSON.parse(jsonText);

    return NextResponse.json({
      generatedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
      sections: analysis.sections,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
