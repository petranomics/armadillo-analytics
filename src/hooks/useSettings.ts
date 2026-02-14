'use client';

import { useState, useEffect } from 'react';
import type { UserSettings } from '@/lib/types';
import { getSettings, saveSettings as persistSettings } from '@/lib/settings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>({ apifyApiKey: '', usernames: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setLoaded(true);
  }, []);

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    persistSettings(newSettings);
  };

  return { settings, updateSettings, loaded };
}
