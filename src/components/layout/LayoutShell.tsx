'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';
  const isMobile = pathname.startsWith('/m');

  // Hide sidebar for onboarding and mobile routes
  if (isOnboarding || isMobile) {
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
