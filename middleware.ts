import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // For client-side Firebase auth, we handle protection in the layout component
  // The middleware just ensures the request passes through
  // Protected route handling is done via AuthProvider and useAuth hook
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};