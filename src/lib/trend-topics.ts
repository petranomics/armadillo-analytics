import type { UserType } from './user-types';

export interface TrendTopic {
  id: string;
  label: string;
  hashtags: string[];        // Instagram/TikTok hashtag search terms
  subreddits: string[];      // Reddit subreddits to monitor
  keywords: string[];        // General search keywords for trend APIs
}

/**
 * Preset trend topics based on user niche selections.
 * Each niche maps to curated hashtags, subreddits, and keywords
 * that are actually useful for that creator type.
 */
const NICHE_TOPICS: Record<string, TrendTopic> = {
  // Influencer niches
  beauty: {
    id: 'beauty',
    label: 'Beauty & Skincare',
    hashtags: ['skincare', 'beautytips', 'makeuptutorial', 'skincareroutine', 'cleanbeauty'],
    subreddits: ['SkincareAddiction', 'MakeupAddiction', 'BeautyGuruChatter'],
    keywords: ['skincare routine', 'beauty trends', 'clean beauty'],
  },
  fashion: {
    id: 'fashion',
    label: 'Fashion & Style',
    hashtags: ['ootd', 'fashiontrends', 'streetstyle', 'thrifthaul', 'outfitinspo'],
    subreddits: ['femalefashionadvice', 'malefashionadvice', 'streetwear'],
    keywords: ['fashion trends', 'style inspo', 'outfit ideas'],
  },
  fitness: {
    id: 'fitness',
    label: 'Fitness & Wellness',
    hashtags: ['fitnessmotivation', 'workout', 'gymtok', 'healthylifestyle', 'mealprep'],
    subreddits: ['Fitness', 'bodyweightfitness', 'MealPrepSunday', 'running'],
    keywords: ['workout routine', 'fitness tips', 'healthy eating'],
  },
  food: {
    id: 'food',
    label: 'Food & Cooking',
    hashtags: ['foodtok', 'recipe', 'homecooking', 'foodie', 'easyrecipes'],
    subreddits: ['Cooking', 'food', 'MealPrepSunday', 'EatCheapAndHealthy'],
    keywords: ['recipe trends', 'food trends', 'cooking tips'],
  },
  travel: {
    id: 'travel',
    label: 'Travel & Adventure',
    hashtags: ['traveltok', 'travelgram', 'wanderlust', 'traveltips', 'hiddengemns'],
    subreddits: ['travel', 'solotravel', 'TravelHacks', 'digitalnomad'],
    keywords: ['travel destinations', 'budget travel', 'travel tips'],
  },
  lifestyle: {
    id: 'lifestyle',
    label: 'Lifestyle',
    hashtags: ['dayinmylife', 'aesthetic', 'lifestyleblogger', 'morningroutine', 'productivity'],
    subreddits: ['DecidingToBeBetter', 'minimalism', 'organization'],
    keywords: ['lifestyle trends', 'daily routine', 'life hacks'],
  },
  tech: {
    id: 'tech',
    label: 'Tech & Gaming',
    hashtags: ['techtok', 'techreview', 'gaming', 'setuptour', 'gadgets'],
    subreddits: ['technology', 'gadgets', 'gaming', 'buildapc'],
    keywords: ['tech news', 'gadget reviews', 'gaming trends'],
  },
  finance: {
    id: 'finance',
    label: 'Finance & Business',
    hashtags: ['fintok', 'investing', 'personalfinance', 'budgeting', 'sidehustle'],
    subreddits: ['personalfinance', 'investing', 'financialindependence', 'Entrepreneur'],
    keywords: ['investing tips', 'personal finance', 'side hustle ideas'],
  },
  parenting: {
    id: 'parenting',
    label: 'Parenting & Family',
    hashtags: ['momtok', 'parentingtips', 'toddlermom', 'familylife', 'momlife'],
    subreddits: ['Parenting', 'Mommit', 'daddit', 'BabyBumps'],
    keywords: ['parenting tips', 'family activities', 'mom life'],
  },

  // LinkedIn niches
  marketing: {
    id: 'marketing',
    label: 'Marketing & Advertising',
    hashtags: ['marketingtips', 'digitalmarketing', 'contentmarketing', 'socialmedia'],
    subreddits: ['marketing', 'digital_marketing', 'SEO', 'socialmedia'],
    keywords: ['marketing trends', 'social media strategy', 'content marketing'],
  },
  consulting: {
    id: 'consulting',
    label: 'Consulting',
    hashtags: ['consulting', 'businessstrategy', 'management', 'leadership'],
    subreddits: ['consulting', 'MBA', 'business'],
    keywords: ['consulting trends', 'business strategy', 'leadership'],
  },
  hr: {
    id: 'hr',
    label: 'HR & Recruiting',
    hashtags: ['hr', 'recruiting', 'hiring', 'employeeexperience', 'workculture'],
    subreddits: ['humanresources', 'recruiting', 'careerguidance'],
    keywords: ['hiring trends', 'workplace culture', 'talent acquisition'],
  },
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    hashtags: ['healthcare', 'medtok', 'wellness', 'mentalhealth', 'nursing'],
    subreddits: ['medicine', 'nursing', 'healthcare'],
    keywords: ['healthcare trends', 'wellness', 'mental health'],
  },
  education: {
    id: 'education',
    label: 'Education',
    hashtags: ['teachertok', 'education', 'edtech', 'studytips', 'learning'],
    subreddits: ['Teachers', 'education', 'edtech'],
    keywords: ['education trends', 'edtech', 'teaching tips'],
  },
  startup: {
    id: 'startup',
    label: 'Startups & VC',
    hashtags: ['startup', 'entrepreneur', 'venturecapital', 'saas', 'founders'],
    subreddits: ['startups', 'Entrepreneur', 'SaaS', 'venturecapital'],
    keywords: ['startup trends', 'fundraising', 'SaaS growth'],
  },

  // TikTok Shop categories
  home: {
    id: 'home',
    label: 'Home & Kitchen',
    hashtags: ['homedecor', 'kitchenhacks', 'homefinds', 'amazonfinds', 'organization'],
    subreddits: ['HomeImprovement', 'InteriorDesign', 'Cooking'],
    keywords: ['home decor trends', 'kitchen gadgets', 'home organization'],
  },
  electronics: {
    id: 'electronics',
    label: 'Electronics & Gadgets',
    hashtags: ['techfinds', 'gadgets', 'amazontech', 'unboxing', 'techreview'],
    subreddits: ['gadgets', 'technology', 'BuyItForLife'],
    keywords: ['gadget trends', 'tech accessories', 'product reviews'],
  },
  health: {
    id: 'health',
    label: 'Health & Wellness',
    hashtags: ['wellness', 'supplements', 'healthyliving', 'selfcare', 'mentalhealth'],
    subreddits: ['Supplements', 'Biohackers', 'Meditation', 'yoga'],
    keywords: ['wellness trends', 'supplements', 'self care'],
  },

  // YouTuber niches
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    hashtags: ['youtube', 'commentary', 'storytime', 'reaction', 'viral'],
    subreddits: ['youtube', 'NewTubers', 'letsplay'],
    keywords: ['youtube trends', 'viral content', 'entertainment'],
  },
  vlogs: {
    id: 'vlogs',
    label: 'Vlogs & Daily Life',
    hashtags: ['vlog', 'dayinmylife', 'weeklylog', 'movewithme', 'grwm'],
    subreddits: ['vlog', 'NewTubers'],
    keywords: ['vlog ideas', 'daily vlog trends'],
  },

  // Local business
  restaurant: {
    id: 'restaurant',
    label: 'Restaurant & Food Service',
    hashtags: ['foodie', 'localfood', 'restaurant', 'smallbusiness', 'supportlocal'],
    subreddits: ['KitchenConfidential', 'Restaurant', 'smallbusiness'],
    keywords: ['restaurant trends', 'food service', 'local business marketing'],
  },
  retail: {
    id: 'retail',
    label: 'Retail & Shopping',
    hashtags: ['shopsmall', 'smallbusiness', 'retailtherapy', 'newproduct', 'shoplocal'],
    subreddits: ['smallbusiness', 'Entrepreneur', 'retail'],
    keywords: ['retail trends', 'small business marketing', 'e-commerce'],
  },
};

/**
 * Get preset trend topics for a user based on their niche selections and user type.
 */
export function getPresetTopics(
  userType: UserType,
  quickFormAnswers: Record<string, string | string[]>
): TrendTopic[] {
  const topics: TrendTopic[] = [];
  const seen = new Set<string>();

  // Extract niche values from quick form answers
  const nicheFields = ['niche', 'industry', 'product_category', 'channel_type', 'business_type', 'outlet_type'];
  for (const field of nicheFields) {
    const val = quickFormAnswers[field];
    if (!val) continue;
    const values = Array.isArray(val) ? val : [val];
    for (const v of values) {
      if (NICHE_TOPICS[v] && !seen.has(v)) {
        topics.push(NICHE_TOPICS[v]);
        seen.add(v);
      }
    }
  }

  // If no specific niches found, provide general defaults based on user type
  if (topics.length === 0) {
    const defaults: Record<UserType, string[]> = {
      'influencer': ['lifestyle', 'beauty', 'fitness'],
      'linkedin-creator': ['marketing', 'startup', 'tech'],
      'tiktok-shop': ['beauty', 'fashion', 'home'],
      'youtuber': ['tech', 'entertainment', 'vlogs'],
      'local-business': ['restaurant', 'retail'],
      'media-outlet': ['tech', 'finance', 'marketing'],
    };
    for (const id of defaults[userType] || ['lifestyle']) {
      if (NICHE_TOPICS[id]) topics.push(NICHE_TOPICS[id]);
    }
  }

  return topics;
}

/**
 * Get all available trend topics for browsing/adding custom ones.
 */
export function getAllTopics(): TrendTopic[] {
  return Object.values(NICHE_TOPICS);
}

/**
 * Build a custom topic from user input.
 */
export function createCustomTopic(label: string, hashtags: string[]): TrendTopic {
  const id = `custom-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return {
    id,
    label,
    hashtags: hashtags.map(h => h.replace(/^#/, '')),
    subreddits: [],
    keywords: [label.toLowerCase()],
  };
}
