import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOBILE_UA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Opera Mini|IEMobile|Mobile Safari|mobile/i;

const MOBILE_ROUTES: Record<string, string> = {
  '/': '/m/dashboard',
  '/insights': '/m/insights',
  '/export': '/m/export',
  '/settings': '/m/settings',
  '/customize': '/m/customize',
  '/onboarding': '/m/onboarding',
};

function mobileRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Escape hatch
  if (searchParams.has('desktop')) return null;

  // Already on mobile routes
  if (pathname.startsWith('/m')) return null;

  // Skip API and static
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return null;

  const ua = request.headers.get('user-agent') || '';
  if (!MOBILE_UA.test(ua)) return null;

  const mobileTarget = MOBILE_ROUTES[pathname];
  if (!mobileTarget) return null;

  const url = request.nextUrl.clone();
  url.pathname = mobileTarget;
  return NextResponse.redirect(url);
}

export default clerkMiddleware(async (_auth, request) => {
  const redirect = mobileRedirect(request);
  if (redirect) return redirect;
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
