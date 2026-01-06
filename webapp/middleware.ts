import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // For now, let client-side handle authentication
  // Dashboard page will check session and redirect if needed
  
  // Only handle login redirect if user is already logged in
  const authRoutes = ['/login'];
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Check all cookies for Supabase session
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  );

  // Redirect away from login if already logged in
  if (isAuthRoute && hasSupabaseCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

