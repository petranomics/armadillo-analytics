export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin';

export interface Post {
  id: string;
  platform: Platform;
  url: string;
  caption: string;
  thumbnailUrl?: string;
  publishedAt: string;
  metrics: {
    views?: number;
    likes: number;
    comments: number;
    shares?: number;
    saves?: number;
    retweets?: number;
    quotes?: number;
    reactions?: Record<string, number>;
  };
  engagementRate: number;
}

export interface PlatformProfile {
  platform: Platform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  following?: number;
  totalPosts: number;
  bio?: string;
  verified?: boolean;
}

export interface PlatformData {
  profile: PlatformProfile;
  posts: Post[];
  summary: {
    totalEngagement: number;
    avgEngagementRate: number;
    topPost: Post;
    totalViews?: number;
  };
}

export interface DashboardOverview {
  totalFollowers: number;
  totalEngagement: number;
  avgEngagementRate: number;
  platformBreakdown: { platform: Platform; followers: number; engagement: number }[];
  topPosts: Post[];
  recentPosts: Post[];
}

export interface UserSettings {
  apifyApiKey: string;
  usernames: Partial<Record<Platform, string>>;
}
