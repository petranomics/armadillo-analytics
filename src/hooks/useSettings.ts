'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, saveUserProfile, type UserProfile } from '@/lib/store';

// Legacy UserSettings interface for backwards compatibility with PlatformPage
export interface UserSettings {
  apifyApiKey: string;
  usernames: Partial<Record<string, string>>;
}

export function useSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());
    setLoaded(true);
  }, []);

  // Return a settings-compatible object for existing components
  const settings: UserSettings = {
    apifyApiKey: profile?.apifyApiKey || '',
    usernames: profile?.platformUsernames || {},
  };

  const updateSettings = (newSettings: UserSettings) => {
    if (!profile) return;
    const updated = {
      ...profile,
      apifyApiKey: newSettings.apifyApiKey,
      platformUsernames: newSettings.usernames as UserProfile['platformUsernames'],
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  return { settings, updateSettings, loaded, profile, setProfile };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());
    setLoaded(true);
  }, []);

  const updateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveUserProfile(updated);
  };

  return { profile, updateProfile, loaded };
}
