import type { Platform } from './types';
import type { UserType, Plan } from './user-types';

export interface MobileUserProfile {
  userType: UserType;
  quickFormAnswers: Record<string, string | string[]>;
  selectedPlatforms: Platform[];
  selectedMetrics: string[];
  plan: Plan;
  onboardingComplete: boolean;
  platformUsernames: Partial<Record<Platform, string>>;
  competitorAccounts: string[];
  apifyApiKey: string;
}

const MOBILE_PROFILE_KEY = 'armadillo-mobile-profile';

const DEFAULT_PROFILE: MobileUserProfile = {
  userType: 'influencer',
  quickFormAnswers: {},
  selectedPlatforms: ['instagram'],
  selectedMetrics: [],
  plan: 'free',
  onboardingComplete: false,
  platformUsernames: {},
  competitorAccounts: [],
  apifyApiKey: '',
};

export function getMobileProfile(): MobileUserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(MOBILE_PROFILE_KEY);
    if (!stored) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveMobileProfile(profile: MobileUserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOBILE_PROFILE_KEY, JSON.stringify(profile));
}

export function clearMobileProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MOBILE_PROFILE_KEY);
}
