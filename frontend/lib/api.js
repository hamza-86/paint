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

// ── Painter endpoints ─────────────────────────────────────────────────────────

/**
 * GET /api/painters
 * @param {{ page?: number, limit?: number, search?: string, status?: string }} params
 */
export function getPaintersApi({ page = 1, limit = 20, search = '', status = 'all' } = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (search && search.trim()) query.set('search', search.trim());
  if (status && status !== 'all') query.set('status', status);

  const queryString = query.toString();
  return apiFetch(`/painters${queryString ? `?${queryString}` : ''}`);
}

/**
 * GET /api/painters/:id
 * @param {string} id
 */
export function getPainterByIdApi(id) {
  return apiFetch(`/painters/${id}`);
}

/**
 * POST /api/painters
 * @param {{ firstName: string, mobile: string, email: string, password: string, photoUrl?: string }} data
 */
export function createPainterApi(data) {
  return apiFetch('/painters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/painters/:id/deactivate
 * @param {string} id
 */
export function deactivatePainterApi(id) {
  return apiFetch(`/painters/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/painters/:id/activate
 * @param {string} id
 */
export function activatePainterApi(id) {
  return apiFetch(`/painters/${id}/activate`, {
    method: 'PATCH',
  });
}

/**
 * GET /api/items
 * @param {{ page?: number, limit?: number, search?: string, status?: string, category?: string, brand?: string }} params
 */
export function getItemsApi({ page = 1, limit = 20, search = '', status = 'all', category = 'all', brand = 'all' } = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (search && search.trim()) query.set('search', search.trim());
  if (status && status !== 'all') query.set('status', status);
  if (category && category !== 'all') query.set('category', category.trim());
  if (brand && brand !== 'all') query.set('brand', brand.trim());

  const queryString = query.toString();
  return apiFetch(`/items${queryString ? `?${queryString}` : ''}`);
}

/**
 * GET /api/items/:id
 * @param {string} id
 */
export function getItemByIdApi(id) {
  return apiFetch(`/items/${id}`);
}

/**
 * POST /api/items
 * @param {{ name: string, price: number, points: number, brand?: string, category?: string, imageUrl?: string }} data
 */
export function createItemApi(data) {
  return apiFetch('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/items/:id
 * @param {string} id
 * @param {object} data
 */
export function updateItemApi(id, data) {
  return apiFetch(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/items/:id/deactivate
 * @param {string} id
 */
export function deactivateItemApi(id) {
  return apiFetch(`/items/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/items/:id/activate
 * @param {string} id
 */
/**
 * GET /api/items/:id/activate
 * @param {string} id
 */
export function activateItemApi(id) {
  return apiFetch(`/items/${id}/activate`, {
    method: 'PATCH',
  });
}

// ── Cycle API ─────────────────────────────────────────────────────────────────

/**
 * GET /api/cycles
 * @param {{ page?: number, limit?: number }} params
 */
export function getCyclesApi({ page = 1, limit = 10 } = {}) {
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  return apiFetch(`/cycles?${query.toString()}`);
}

/**
 * GET /api/cycles/:id
 * @param {string} id
 */
export function getCycleByIdApi(id) {
  return apiFetch(`/cycles/${id}`);
}

/**
 * POST /api/cycles
 * @param {{ startDate: string, endDate: string, isActive?: boolean }} data
 */
export function createCycleApi(data) {
  return apiFetch('/cycles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/cycles/:id/activate
 * @param {string} id
 */
export function activateCycleApi(id) {
  return apiFetch(`/cycles/${id}/activate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/cycles/:id/close
 * @param {string} id
 */
export function closeCycleApi(id) {
  return apiFetch(`/cycles/${id}/close`, {
    method: 'PATCH',
  });
}

// ── Sales API ─────────────────────────────────────────────────────────────────

/**
 * GET /api/sales
 * @param {{ page?: number, limit?: number, cycleId?: string, painterId?: string, customerId?: string, search?: string }} params
 */
export function getSalesApi({
  page = 1,
  limit = 10,
  cycleId,
  painterId,
  customerId,
  search = '',
} = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (cycleId) query.set('cycleId', cycleId);
  if (painterId) query.set('painterId', painterId);
  if (customerId) query.set('customerId', customerId);
  if (search && search.trim()) query.set('search', search.trim());

  const qs = query.toString();
  return apiFetch(`/sales${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/sales/:id
 * @param {string} id
 */
export function getSaleByIdApi(id) {
  return apiFetch(`/sales/${id}`);
}

/**
 * POST /api/sales
 * @param {{ painterId: string, customer: { name: string, mobile: string }, lineItems: Array<{ itemId: string, quantity: number }>, date?: string, billImageUrl?: string }} data
 */
export function createSaleApi(data) {
  return apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Customers API ─────────────────────────────────────────────────────────────

/**
 * GET /api/customers
 * @param {{ page?: number, limit?: number, search?: string }} params
 */
export function getCustomersApi({ page = 1, limit = 20, search = '' } = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (search && search.trim()) query.set('search', search.trim());

  const qs = query.toString();
  return apiFetch(`/customers${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/customers/:id
 * @param {string} id
 */
export function getCustomerByIdApi(id) {
  return apiFetch(`/customers/${id}`);
}

// ── Painter History API (Part 7) ──────────────────────────────────────────────

/**
 * GET /api/painter-history/:painterId
 * Overall summary & current cycle performance
 * @param {string} painterId
 */
export function getPainterHistoryApi(painterId) {
  return apiFetch(`/painter-history/${painterId}`);
}

/**
 * GET /api/painter-history/:painterId/cycles
 * Cycle-wise history breakdown
 * @param {string} painterId
 */
export function getPainterHistoryCyclesApi(painterId) {
  return apiFetch(`/painter-history/${painterId}/cycles`);
}

/**
 * GET /api/painter-history/:painterId/sales
 * Paginated sales list for this painter
 * @param {string} painterId
 * @param {{ page?: number, limit?: number, cycleId?: string, search?: string }} params
 */
export function getPainterHistorySalesApi(
  painterId,
  { page = 1, limit = 10, cycleId = '', search = '' } = {}
) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (cycleId && cycleId !== 'all') query.set('cycleId', cycleId);
  if (search && search.trim()) query.set('search', search.trim());

  const qs = query.toString();
  return apiFetch(`/painter-history/${painterId}/sales${qs ? `?${qs}` : ''}`);
}

// ── Reward Tiers API (Part 8) ─────────────────────────────────────────────────

/**
 * GET /api/reward-tiers
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export function getRewardTiersApi({ page = 1, limit = 10, status = 'all' } = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (status && status !== 'all') query.set('status', status);

  const qs = query.toString();
  return apiFetch(`/reward-tiers${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/reward-tiers/:id
 * @param {string} id
 */
export function getRewardTierApi(id) {
  return apiFetch(`/reward-tiers/${id}`);
}

/**
 * POST /api/reward-tiers
 * @param {{ minPoints: number, maxPoints: number, suggestedRewardName: string }} data
 */
export function createRewardTierApi(data) {
  return apiFetch('/reward-tiers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/reward-tiers/:id
 * @param {string} id
 * @param {{ minPoints?: number, maxPoints?: number, suggestedRewardName?: string }} data
 */
export function updateRewardTierApi(id, data) {
  return apiFetch(`/reward-tiers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/reward-tiers/:id/deactivate
 * @param {string} id
 */
export function deactivateRewardTierApi(id) {
  return apiFetch(`/reward-tiers/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/reward-tiers/:id/activate
 * @param {string} id
 */
export function activateRewardTierApi(id) {
  return apiFetch(`/reward-tiers/${id}/activate`, {
    method: 'PATCH',
  });
}

/**
 * GET /api/reward-tiers/painter/:painterId
 * Calculates current reward eligibility for painter based on active cycle points
 * @param {string} painterId
 */
export function getPainterCurrentRewardTierApi(painterId) {
  return apiFetch(`/reward-tiers/painter/${painterId}`);
}

