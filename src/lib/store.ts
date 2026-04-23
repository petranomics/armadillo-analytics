import type { Platform } from './types';
import type { UserType, Plan } from './user-types';

export interface UserProfile {
  userType: UserType;
  quickFormAnswers: Record<string, string | string[]>;
  selectedPlatforms: Platform[];
  selectedMetrics: string[];
  plan: Plan;
  onboardingComplete: boolean;
  platformUsernames: Partial<Record<Platform, string>>;
  /** Multiple accounts per platform — each platform can have up to 3 usernames */
  platformAccounts: Partial<Record<Platform, string[]>>;
  /** Which account is currently active per platform */
  activeAccount: Partial<Record<Platform, string>>;
  competitorAccounts: string[];
  apifyApiKey: string;
  trackedHashtags: string[];
  trackedSubreddits: string[];
  tiktokNiche: string;
  /** IDs of active trend topics (from trend-topics.ts presets + custom) */
  selectedTrendTopics: string[];
  /** Custom trend topics added by the user */
  customTrendTopics: { id: string; label: string; hashtags: string[] }[];
}

// Keep same localStorage key for backwards compatibility with mobile
const PROFILE_KEY = 'armadillo-mobile-profile';

const DEFAULT_PROFILE: UserProfile = {
  userType: 'influencer',
  quickFormAnswers: {},
  selectedPlatforms: ['instagram'],
  selectedMetrics: [],
  plan: 'free',
  onboardingComplete: false,
  platformUsernames: {},
  platformAccounts: {},
  activeAccount: {},
  competitorAccounts: [],
  apifyApiKey: '',
  trackedHashtags: [],
  trackedSubreddits: [],
  tiktokNiche: '',
  selectedTrendTopics: [],
  customTrendTopics: [],
};

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearUserProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * Get the currently active username for a platform.
 * Falls back to legacy platformUsernames for backward compat.
 */
export function getActiveUsername(profile: UserProfile, platform: Platform): string | undefined {
  // Check new multi-account system first
  const active = profile.activeAccount?.[platform];
  if (active) return active;
  // Check if accounts exist, use first one
  const accounts = profile.platformAccounts?.[platform];
  if (accounts && accounts.length > 0) return accounts[0];
  // Fall back to legacy single username
  return profile.platformUsernames?.[platform];
}

/**
 * Get all usernames for a platform.
 */
export function getPlatformAccounts(profile: UserProfile, platform: Platform): string[] {
  const accounts = profile.platformAccounts?.[platform] || [];
  // Migrate legacy username if not already in accounts
  const legacy = profile.platformUsernames?.[platform];
  if (legacy && !accounts.includes(legacy)) {
    return [legacy, ...accounts];
  }
  return accounts.length > 0 ? accounts : legacy ? [legacy] : [];
}

// Re-export old names for backwards compatibility during migration
export type MobileUserProfile = UserProfile;
export const getMobileProfile = getUserProfile;
export const saveMobileProfile = saveUserProfile;
export const clearMobileProfile = clearUserProfile;
