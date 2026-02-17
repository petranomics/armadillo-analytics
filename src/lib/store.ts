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
  competitorAccounts: string[];
  apifyApiKey: string;
  trackedHashtags: string[];
  trackedSubreddits: string[];
  tiktokNiche: string;
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
  competitorAccounts: [],
  apifyApiKey: '',
  trackedHashtags: [],
  trackedSubreddits: [],
  tiktokNiche: '',
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

// Re-export old names for backwards compatibility during migration
export type MobileUserProfile = UserProfile;
export const getMobileProfile = getUserProfile;
export const saveMobileProfile = saveUserProfile;
export const clearMobileProfile = clearUserProfile;
