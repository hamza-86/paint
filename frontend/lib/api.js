/**
 * API utilities — lib/api.js
 *
 * Central wrapper for all fetch calls to the Express backend.
 * All requests include credentials (cookies) by default.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Core fetch wrapper.
 * Throws an Error whose message is the JSON error from the backend.
 *
 * @param {string} endpoint  - Path relative to API_BASE_URL, e.g. '/auth/login'
 * @param {RequestInit} options - fetch options
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Send and receive httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.message || 'An unexpected error occurred.');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth endpoints ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * @param {{ email: string, password: string }} credentials
 */
export function loginApi(credentials) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * GET /api/auth/me — returns the currently authenticated user
 */
export function getMeApi() {
  return apiFetch('/auth/me');
}

/**
 * POST /api/auth/logout
 */
export function logoutApi() {
  return apiFetch('/auth/logout', { method: 'POST' });
}
