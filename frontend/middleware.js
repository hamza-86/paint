/**
 * Next.js Middleware — Single-Shop Authentication Placeholder
 *
 * Route Protection Rules:
 *   - /admin/*   → Admin / Shop Owner access only
 *   - /painter/* → Painter access only
 *   - /login     → Public authentication route
 */

import { NextResponse } from 'next/server';

export function middleware(request) {
  // TODO: Verify JWT token from cookie / auth header
  // TODO: Redirect unauthenticated requests to /login
  // TODO: Enforce role-based access:
  //       - Role 'admin' allowed on /admin/*
  //       - Role 'painter' allowed on /painter/*
  //       - Cross-role access redirected appropriately

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/painter/:path*',
  ],
};
