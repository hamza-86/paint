/**
 * BFF Catch-All Route — app/api/backend/[...path]/route.js
 *
 * Browser → http://localhost:3000/api/backend/*
 *         → Next.js BFF (server-side)
 *         → https://paint-shop-backend-xgjz.onrender.com/api/*
 *         → MongoDB Atlas (paintshop_prod)
 *
 * The /api/backend prefix is frontend-only and is stripped before forwarding.
 * Example:
 *   Browser:  POST /api/backend/auth/login
 *   BFF:      POST https://paint-shop-backend-xgjz.onrender.com/api/auth/login
 *
 * Cookie rewriting:
 *   The Render backend runs in production mode and sets:
 *     Set-Cookie: auth_token=...; Secure; SameSite=None
 *   On localhost (HTTP), browsers silently reject cookies with the Secure flag.
 *   The BFF rewrites the cookie attributes for local development so the browser
 *   can store auth_token on http://localhost:3000 (same-origin with the frontend).
 *   In production (Vercel HTTPS), Secure + SameSite=None is kept as-is.
 */

// The backend target is server-only. Browser code must use /api/backend instead.
const BACKEND_API_URL = process.env.BACKEND_API_URL;

// True when the Next.js server itself is running in production (Vercel HTTPS).
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Build the set of headers to forward to the Render backend.
 * Includes Content-Type, forwarded Cookie (for authenticated requests), and
 * Authorization header (for Bearer token clients).
 */
const forwardedRequestHeaders = (request) => {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');

  if (contentType) headers.set('content-type', contentType);
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);

  return headers;
};

/**
 * Rewrite a single Set-Cookie string so the browser accepts it on the
 * frontend origin (http://localhost:3000 in dev, https://... in production).
 *
 * - Always strips Domain= so the cookie belongs to the frontend origin.
 * - In development (HTTP): removes "Secure" and replaces SameSite=None with
 *   SameSite=Lax so the browser stores the cookie over plain HTTP.
 * - In production (HTTPS): keeps Secure and SameSite=None intact.
 */
function rewriteCookieForFrontend(rawCookie) {
  // Always remove Domain — cookie must belong to the frontend origin.
  let rewritten = rawCookie.replace(/\bDomain=[^;]+;?\s*/gi, '');

  if (!IS_PRODUCTION) {
    // Local dev runs on HTTP. Browsers silently reject cookies with Secure on
    // non-HTTPS origins. Remove Secure so auth_token is stored on localhost.
    rewritten = rewritten.replace(/\bSecure\b;?\s*/gi, '');

    // SameSite=None requires Secure by spec; replace with Lax for local dev.
    rewritten = rewritten.replace(/\bSameSite=None\b/gi, 'SameSite=Lax');
  }

  return rewritten.trim().replace(/;$/, '');
}

/**
 * Build response headers to return to the browser.
 * Forwards Content-Type and rewrites all Set-Cookie headers.
 */
const forwardedResponseHeaders = (response) => {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');

  if (contentType) headers.set('content-type', contentType);

  // Collect all Set-Cookie entries (getSetCookie() available in Node 18+).
  const setCookies = response.headers.getSetCookie?.() || [];
  if (setCookies.length === 0) {
    const single = response.headers.get('set-cookie');
    if (single) setCookies.push(single);
  }

  for (const cookie of setCookies) {
    headers.append('set-cookie', rewriteCookieForFrontend(cookie));
  }

  return headers;
};

/**
 * Core proxy handler — forwards any HTTP method to the Render backend.
 *
 * Path construction example:
 *   Browser:  /api/backend/auth/login  → params.path = ['auth', 'login']
 *   Target:   https://paint-shop-backend-xgjz.onrender.com/api/auth/login
 */
async function proxyRequest(request, { params }) {
  if (!BACKEND_API_URL) {
    return Response.json(
      { success: false, message: 'Backend service is not configured.' },
      { status: 500 }
    );
  }

  const { path } = await params;
  const backendUrl = `${BACKEND_API_URL}/${path.join('/')}${
    new URL(request.url).search
  }`;

  const method = request.method.toUpperCase();
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : await request.arrayBuffer();

  // Development-only diagnostic log (never logs passwords, tokens, or cookies).
  if (!IS_PRODUCTION) {
    console.log(
      `[BFF] ${method} /api/backend/${path.join('/')} → ${backendUrl}`
    );
  }

  try {
    const backendResponse = await fetch(backendUrl, {
      method,
      headers: forwardedRequestHeaders(request),
      body,
      cache: 'no-store',
    });

    if (!IS_PRODUCTION) {
      console.log(`[BFF] ← status ${backendResponse.status}`);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: forwardedResponseHeaders(backendResponse),
    });
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.error(`[BFF] Fetch error: ${err.message}`);
    }
    return Response.json(
      { success: false, message: 'Authentication service unavailable.' },
      { status: 502 }
    );
  }
}

export const GET    = proxyRequest;
export const HEAD   = proxyRequest;
export const POST   = proxyRequest;
export const PUT    = proxyRequest;
export const PATCH  = proxyRequest;
export const DELETE = proxyRequest;