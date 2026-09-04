/**
 * Next.js Proxy (formerly Middleware) — proxy.js
 *
 * Replaces the deprecated middleware.js.
 * The exported function MUST be named 'proxy' (not 'middleware').
 *
 * Route Protection Rules:
 *   - /admin/*    → Admin only — redirects to /login if unauthenticated or not admin
 *   - /painter/*  → Painter only — redirects to /login if unauthenticated or not painter
 *   - /login      → Public — redirects to role dashboard if already authenticated
 *
 * Session detection:
 *   Reads the auth_token cookie set by the Express backend on login.
 *   JWT is decoded without a full verification here (lightweight optimistic check).
 *   Real authorization happens inside backend API endpoints (protect/authorize middleware).
 */

import { NextResponse } from 'next/server';

/**
 * Lightweight JWT payload decoder — no npm dependencies, runs in the Edge runtime.
 * This does NOT cryptographically verify the signature.
 * Signature verification is the backend's responsibility.
 */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    // Base64url → base64 → JSON
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Decode without verifying — just enough to read the role for redirects.
  // The backend will reject any tampered tokens anyway.
  const session = token ? decodeJwt(token) : null;

  // Check whether the session is actually expired (exp is in seconds)
  const isAuthenticated =
    session && session.exp && session.exp * 1000 > Date.now();

  const isAdminRoute = pathname.startsWith('/admin');
  const isPainterRoute = pathname.startsWith('/painter');
  const isLoginPage = pathname === '/login';

  // ── Redirect authenticated users away from /login ─────────────────────────
  if (isLoginPage && isAuthenticated) {
    const redirectPath =
      session.role === 'admin' ? '/admin' : '/painter';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // ── Protect /admin/* ──────────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'admin') {
      // Painter trying to access admin — redirect to their own portal
      return NextResponse.redirect(
        new URL('/painter', request.url)
      );
    }
  }

  // ── Protect /painter/* ────────────────────────────────────────────────────
  if (isPainterRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'painter') {
      // Admin trying to access painter — redirect to admin portal
      return NextResponse.redirect(
        new URL('/admin', request.url)
      );
    }
  }

  return NextResponse.next();
}

// Run proxy on auth-relevant routes only (excludes static files and images)
export const config = {
  matcher: [
    '/admin/:path*',
    '/painter/:path*',
    '/login',
  ],
};
