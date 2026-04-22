'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';
  const isMobile = pathname.startsWith('/m');
  const isAdmin = pathname.startsWith('/admin');
  const isBetaGate = pathname === '/beta-gate';

  // Hide sidebar for onboarding, mobile, admin, and beta-gate routes
  if (isOnboarding || isMobile || isAdmin || isBetaGate) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-60 min-h-screen p-6">
        {children}
      </main>
    </>
  );
}
