'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMobileProfile } from '@/lib/mobile-store';

export default function MobileRoot() {
  const router = useRouter();

  useEffect(() => {
    const profile = getMobileProfile();
    if (profile.onboardingComplete) {
      router.replace('/m/dashboard');
    } else {
      router.replace('/m/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg bg-burnt animate-pulse" />
    </div>
  );
}
