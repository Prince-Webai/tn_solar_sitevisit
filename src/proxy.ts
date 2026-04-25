import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through all non-protected routes immediately — no Supabase call needed
  const publicRoutes = ['/login', '/api', '/setup-admin', '/_next', '/favicon'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  // For protected routes, check for the presence of a Supabase auth cookie
  // instead of calling supabase.auth.getUser() which can crash in edge runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase/)?.[1];

  // Look for any Supabase session cookie (they are prefixed with sb-<projectRef>)
  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    c => c.name.includes('sb-') && c.name.includes('-auth-token')
  );

  // Redirect root based on session presence
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasSession ? '/dashboard' : '/login', request.url)
    );
  }

  // If no session cookie found, redirect to login
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User has a session cookie — let the request through
  // The client-side AuthProvider will do the real token validation
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
