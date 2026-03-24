import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is intentionally a passthrough.
// Route protection is handled client-side via AuthProvider in lib/auth-context.tsx.
// This file exists only to satisfy Next.js middleware conventions if needed later.

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // No routes matched — middleware is effectively disabled
  matcher: [],
};