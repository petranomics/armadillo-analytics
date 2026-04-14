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

const SYSTEM_PROMPT = `You are a senior social media strategist writing an analytics brief for a creator or brand. Write like a consultant delivering a monthly performance review — direct, specific, grounded in numbers. No motivational language. No filler. No emoji-heavy enthusiasm.

Rules:
- Every claim must reference a specific number from the data provided. Never invent metrics.
- Lead with the finding, then the implication, then the recommended action.
- Write in second person ("your engagement rate" not "the creator's engagement rate").
- Avoid these patterns: "This means...", "This tells us...", "It's worth noting...", "Interestingly...", "Notably...", "In today's landscape..."
- Keep each section to 2-3 tight sentences. No padding.
- Recommendations must be specific enough to execute this week. "Post more reels" is too vague. "Publish 2 carousel posts comparing X vs Y, targeting the #hashtag trend at 52K posts" is actionable.

Respond with a JSON object (no markdown, no code fences) matching this exact structure:
{
  "sections": [
    {
      "icon": "📊",
      "title": "Performance Summary",
      "body": "2-3 sentences. State the numbers, identify the trajectory, name the gap or opportunity."
    },
    {
      "icon": "📈",
      "title": "Trend Alignment",
      "body": "2-3 sentences connecting their content to current platform or market trends. Reference specific trending topics, hashtags, or discussions. If no trend data is available, note the gap and recommend monitoring."
    },
    {
      "icon": "⏰",
      "title": "Posting Cadence",
      "body": "2-3 sentences on posting frequency and timing patterns. Identify their current rhythm and whether it's serving them."
    },
    {
      "icon": "🖼️",
      "title": "Content Performance",
      "body": "2-3 sentences identifying which content types and topics outperform. Reference specific posts by caption or topic. Name the format and why it worked."
    },
    {
      "icon": "🔥",
      "title": "Opportunities",
      "body": null,
      "bullets": ["3-5 specific content ideas tied to current trends or gaps in their strategy. Each bullet should name the format, topic, and why it fits their audience."]
    },
    {
      "icon": "💡",
      "title": "Next Steps",
      "body": null,
      "bullets": ["5-8 concrete actions they can take this week. Each one should specify what to do, where, and what outcome to expect."]
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
        model: process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001',
        max_tokens: Number(process.env.CLAUDE_MAX_TOKENS ?? '2048'),
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
