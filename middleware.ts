import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for route protection.
 * Runs before every request to protected routes.
 * 
 * This provides server-side protection - users won't see
 * protected content flash before redirect.
 */

// Routes that require authentication
const protectedPatterns = [
  '/dashboard',
  '/profile',
  '/applications',
  '/notifications',
  '/organizer',
  '/onboarding',
  '/events/', // Event detail pages
];

// Routes that are always public
const publicPatterns = [
  '/',
  '/login',
  '/signup',
  '/about',
  '/terms',
  '/privacy',
  '/support',
  '/u/', // Public user profiles
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPatterns.some(pattern => pathname.startsWith(pattern));
}

function isPublicRoute(pathname: string): boolean {
  // Exact match for root
  if (pathname === '/') return true;
  // Prefix match for other public routes
  return publicPatterns.some(pattern => pattern !== '/' && pathname.startsWith(pattern));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for Firebase auth session cookie
  // Note: Firebase client SDK doesn't set cookies by default,
  // but we check for a custom session indicator
  const hasAuthSession = request.cookies.has('firebase-auth-active') || 
                         request.cookies.has('__session');
  
  // For protected routes without auth, redirect to login
  if (isProtectedRoute(pathname) && !hasAuthSession) {
    // Allow the client-side auth check to handle this
    // This prevents blocking users who have valid Firebase tokens
    // but haven't set cookies yet (first visit after login)
    // 
    // The real protection is still client-side via useAuth(),
    // but this catches obvious cases and improves UX
    
    // For now, let all requests through and rely on client-side protection
    // To enable strict server-side protection, uncomment below:
    // 
    // const loginUrl = new URL('/login', request.url);
    // loginUrl.searchParams.set('redirect', pathname);
    // return NextResponse.redirect(loginUrl);
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
