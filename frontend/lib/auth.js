/**
 * Auth utilities — lib/auth.js
 *
 * Clean reusable functions for authentication-related operations.
 * - All tokens live in secure httpOnly cookies managed by the backend.
 * - No JWTs in localStorage.
 * - Ready for React Query in future phases (no useEffect auth fetching).
 */

import { loginApi, logoutApi, getMeApi } from './api';

/**
 * Determine the landing URL for a given user role.
 * @param {'admin'|'painter'|string} role
 * @returns {string}
 */
export function getRedirectPathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'painter') return '/painter';
  return '/login';
}

/**
 * Perform login and handle role-based redirection.
 *
 * @param {{ email: string, password: string }} credentials
 * @param {import('next/navigation').AppRouterInstance} router
 * @param {string|null} [callbackUrl]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser(credentials, router, callbackUrl = null) {
  const data = await loginApi(credentials);
  const role = data.user?.role;

  const targetPath = callbackUrl || getRedirectPathForRole(role);
  if (router) {
    router.push(targetPath);
  }

  return data;
}

/**
 * Perform logout, invalidate cookie session on backend, and redirect to /login.
 *
 * @param {import('next/navigation').AppRouterInstance} [router]
 * @returns {Promise<void>}
 */
export async function logoutUser(router) {
  try {
    await logoutApi();
  } catch (err) {
    // Continue with redirection even if network fails
    console.error('Logout error:', err);
  } finally {
    if (router) {
      router.push('/login');
    }
  }
}

/**
 * Fetch the currently authenticated user's profile.
 * Designed to be directly used by React Query query functions or server/client components.
 *
 * @returns {Promise<object>} Current user object
 */
export async function getCurrentUser() {
  const data = await getMeApi();
  return data.user;
}
