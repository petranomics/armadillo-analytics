import type { Platform, Post, PlatformProfile } from '../types';

// ============ Database Row Types ============

export interface DbUserAccount {
  id: string;
  display_name: string;
  email: string | null;
  user_type: string;
  plan: 'free' | 'lite' | 'pro';
  clerk_id: string | null;
  beta_status: 'none' | 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
}

export interface DbBetaRequest {
  id: string;
  user_id: string | null;
  clerk_id: string;
  email: string;
  display_name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  max_platforms: number;
  reviewed_at: string | null;
  created_at: string;
}

export interface DbPlatformConnection {
  id: string;
  user_id: string;
  platform: Platform;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number;
  following: number;
  total_posts: number;
  bio: string | null;
  verified: boolean;
  is_active: boolean;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAnalyticsSnapshot {
  id: string;
  connection_id: string;
  snapshot_data: {
    profile: PlatformProfile;
    posts: Post[];
  };
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_views: number;
  avg_engagement: number;
  fetched_at: string;
}

export type InsightType =
  | 'full_analysis'
  | 'engagement_patterns'
  | 'content_trends'
  | 'audience_signals'
  | 'recommendations';

export interface InsightSection {
  icon: string;
  title: string;
  body: string;
  bullets?: string[];
}

export interface DbEnrichedInsight {
  id: string;
  connection_id: string;
  snapshot_id: string | null;
  insight_type: InsightType;
  sections: InsightSection[];
  summary: string | null;
  tokens_used: number;
  model_used: string | null;
  generated_at: string;
  expires_at: string;
}

export interface DbRefreshLog {
  id: string;
  connection_id: string;
  trigger_type: 'scheduled' | 'on_demand';
  status: 'pending' | 'running' | 'success' | 'failed';
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// ============ API Response Shapes ============

export interface EnrichedAccountResponse {
  connection: {
    id: string;
    platform: Platform;
    username: string;
    followers: number;
    last_scraped_at: string | null;
  };
  latest_snapshot: {
    id: string;
    post_count: number;
    total_likes: number;
    total_comments: number;
    total_views: number;
    avg_engagement: number;
    fetched_at: string;
  } | null;
  insights: {
    id: string;
    insight_type: InsightType;
    sections: InsightSection[];
    summary: string | null;
    generated_at: string;
    expires_at: string;
  } | null;
  refresh_status: {
    can_refresh: boolean;
    cooldown_remaining_ms: number;
    last_refresh_at: string | null;
  };
}
