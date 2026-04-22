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
  '/media-kit': '/m/media-kit',
};

const PLATFORM_ROUTES = ['/instagram', '/tiktok', '/youtube', '/twitter', '/linkedin'];

function mobileRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Escape hatches
  if (searchParams.get('force') === 'desktop' || searchParams.has('desktop')) return null;
  if (searchParams.get('force') === 'mobile' && !pathname.startsWith('/m')) {
    const url = request.nextUrl.clone();
    url.pathname = '/m/dashboard';
    return NextResponse.redirect(url);
  }

  // Skip API and static
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return null;

  const ua = request.headers.get('user-agent') || '';
  const isMobile = MOBILE_UA.test(ua);

  // Mobile user on desktop route → redirect to /m/ equivalent
  if (isMobile && !pathname.startsWith('/m')) {
    // Check platform routes (e.g. /instagram → /m/instagram)
    if (PLATFORM_ROUTES.some(r => pathname === r)) {
      const url = request.nextUrl.clone();
      url.pathname = `/m${pathname}`;
      return NextResponse.redirect(url);
    }

    const mobileTarget = MOBILE_ROUTES[pathname];
    if (mobileTarget) {
      const url = request.nextUrl.clone();
      url.pathname = mobileTarget;
      return NextResponse.redirect(url);
    }
  }

  // Desktop user on mobile route → redirect to desktop equivalent
  if (!isMobile && pathname.startsWith('/m/')) {
    const mobilePath = pathname.replace(/^\/m/, '');
    const url = request.nextUrl.clone();

    if (mobilePath === '/dashboard' || mobilePath === '') {
      url.pathname = '/';
    } else if (PLATFORM_ROUTES.some(r => r === mobilePath)) {
      url.pathname = mobilePath;
    } else {
      url.pathname = mobilePath || '/';
    }
    return NextResponse.redirect(url);
  }

  return null;
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
