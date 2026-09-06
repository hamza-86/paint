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

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  } else if (isFormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Send and receive httpOnly cookies
    headers,
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
 * @param {FormData|{ firstName: string, mobile: string, email: string, password: string, photoUrl?: string }} data
 */
export function createPainterApi(data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch('/painters', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

/**
 * PATCH /api/painters/:id/photo
 * @param {string} id
 * @param {FormData|{ photoUrl: string }} data
 */
export function updatePainterPhotoApi(id, data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch(`/painters/${id}/photo`, {
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
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
 * GET /api/items/meta/brands
 */
export function getItemBrandsApi() {
  return apiFetch('/items/meta/brands');
}

/**
 * GET /api/items/meta/categories
 */
export function getItemCategoriesApi() {
  return apiFetch('/items/meta/categories');
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
 * GET /api/items/:id/sales
 * @param {string} id
 * @param {{ page?: number, limit?: number }} params
 */
export function getItemSalesHistoryApi(id, { page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  const queryString = query.toString();
  return apiFetch(`/items/${id}/sales${queryString ? `?${queryString}` : ''}`);
}

/**
 * POST /api/items
 * @param {FormData|{ name: string, price: number, points: number, brand?: string, category?: string, imageUrl?: string }} data
 */
export function createItemApi(data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch('/items', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
}

/**
 * PATCH /api/items/:id
 * @param {string} id
 * @param {FormData|object} data
 */
export function updateItemApi(id, data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch(`/items/${id}`, {
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
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
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return apiFetch('/sales', {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
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

// ══════════════════════════════════════════════════════════════════════════════
// Company Management Endpoints (Part 9)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/companies
 * List companies with pagination, search, status filtering, and sorting
 * @param {{ page?: number, limit?: number, search?: string, status?: string }} params
 */
export function getCompaniesApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'all') query.append('status', params.status);

  const qs = query.toString();
  return apiFetch(`/companies${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/companies/:id
 * Retrieve a single company by ID
 * @param {string} id
 */
export function getCompanyApi(id) {
  return apiFetch(`/companies/${id}`);
}

/**
 * POST /api/companies
 * Create a new company master record
 * @param {{ name: string, details?: string }} data
 */
export function createCompanyApi(data) {
  return apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/companies/:id
 * Update company name and details
 * @param {string} id
 * @param {{ name?: string, details?: string }} data
 */
export function updateCompanyApi(id, data) {
  return apiFetch(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/companies/:id/deactivate
 * Deactivate a company
 * @param {string} id
 */
export function deactivateCompanyApi(id) {
  return apiFetch(`/companies/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/companies/:id/activate
 * Reactivate a deactivated company
 * @param {string} id
 */
export function activateCompanyApi(id) {
  return apiFetch(`/companies/${id}/activate`, {
    method: 'PATCH',
  });
}

// ── Company Reward History endpoints ──────────────────────────────────────────

/**
 * GET /api/company-rewards
 * @param {{ page?, limit?, companyId?, search?, dateFrom?, dateTo? }} params
 */
export function getCompanyRewardsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.companyId) query.set('companyId', params.companyId);
  if (params.search) query.set('search', params.search);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  const qs = query.toString();
  return apiFetch(`/company-rewards${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/company-rewards/:id
 * @param {string} id
 */
export function getCompanyRewardByIdApi(id) {
  return apiFetch(`/company-rewards/${id}`);
}

/**
 * POST /api/company-rewards
 * @param {object} body
 */
export function createCompanyRewardApi(body) {
  return apiFetch('/company-rewards', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /api/company-rewards/:id
 * @param {string} id
 * @param {object} body
 */
export function updateCompanyRewardApi(id, body) {
  return apiFetch(`/company-rewards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ── Reward Inventory endpoints ────────────────────────────────────────────────

/**
 * GET /api/reward-inventory
 * @param {{ page?, limit?, search?, status?, companyId?, availability? }} params
 */
export function getRewardInventoryApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.companyId) query.set('companyId', params.companyId);
  if (params.availability && params.availability !== 'all') query.set('availability', params.availability);
  const qs = query.toString();
  return apiFetch(`/reward-inventory${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/reward-inventory/:id
 * @param {string} id
 */
export function getRewardInventoryByIdApi(id) {
  return apiFetch(`/reward-inventory/${id}`);
}

/**
 * POST /api/reward-inventory
 * @param {object} body
 */
export function createRewardInventoryApi(body) {
  return apiFetch('/reward-inventory', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /api/reward-inventory/:id
 * @param {string} id
 * @param {object} body
 */
export function updateRewardInventoryApi(id, body) {
  return apiFetch(`/reward-inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /api/reward-inventory/:id/deactivate
 * @param {string} id
 */
export function deactivateRewardInventoryApi(id) {
  return apiFetch(`/reward-inventory/${id}/deactivate`, {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/reward-inventory/:id/activate
 * @param {string} id
 */
export function activateRewardInventoryApi(id) {
  return apiFetch(`/reward-inventory/${id}/activate`, {
    method: 'PATCH',
  });
}

// ── Painter Reward Assignments (Part 12) ──────────────────────────────────────

/**
 * GET /api/painter-reward-assignments/eligibility/:painterId
 * Returns painter's current cycle points, matched tier, and available inventory
 * @param {string} painterId
 */
export function getPainterEligibilityApi(painterId) {
  return apiFetch(`/painter-reward-assignments/eligibility/${painterId}`);
}

/**
 * GET /api/painter-reward-assignments
 * @param {{ page?, limit?, painterId?, cycleId?, rewardInventoryItemId?, search? }} params
 */
export function getAssignmentsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.painterId) query.set('painterId', params.painterId);
  if (params.cycleId) query.set('cycleId', params.cycleId);
  if (params.rewardInventoryItemId) query.set('rewardInventoryItemId', params.rewardInventoryItemId);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiFetch(`/painter-reward-assignments${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/painter-reward-assignments/:id
 * @param {string} id
 */
export function getAssignmentByIdApi(id) {
  return apiFetch(`/painter-reward-assignments/${id}`);
}

/**
 * POST /api/painter-reward-assignments
 * @param {{ painterId: string, rewardInventoryItemId: string, cycleId?: string, qty?: number, notes?: string }} body
 */
export function createAssignmentApi(body) {
  return apiFetch('/painter-reward-assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Painter Portal (Part 13 — Read-Only) ──────────────────────────────────────

/**
 * GET /api/painter-portal/me
 * Returns authenticated painter's safe profile and current cycle
 */
export function getPainterPortalMeApi() {
  return apiFetch('/painter-portal/me');
}

/**
 * GET /api/painter-portal/dashboard
 * Returns authenticated painter's dashboard summary
 */
export function getPainterPortalDashboardApi() {
  return apiFetch('/painter-portal/dashboard');
}

/**
 * GET /api/painter-portal/sales
 * Returns authenticated painter's sales history
 * @param {{ page?: number, limit?: number, cycleId?: string, startDate?: string, endDate?: string }} params
 */
export function getPainterPortalSalesApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cycleId) query.set('cycleId', params.cycleId);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  const qs = query.toString();
  return apiFetch(`/painter-portal/sales${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/painter-portal/rewards
 * Returns authenticated painter's assigned physical rewards
 * @param {{ page?: number, limit?: number, cycleId?: string }} params
 */
export function getPainterPortalRewardsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cycleId) query.set('cycleId', params.cycleId);
  const qs = query.toString();
  return apiFetch(`/painter-portal/rewards${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/painter-portal/eligibility
 * Returns authenticated painter's current cycle points and reward tier eligibility
 */
export function getPainterPortalEligibilityApi() {
  return apiFetch('/painter-portal/eligibility');
}

/**
 * GET /api/painter-portal/cycles
 * Returns cycle history for the authenticated painter
 */
export function getPainterPortalCyclesApi() {
  return apiFetch('/painter-portal/cycles');
}

/**
 * GET /api/painter-portal/rewards/:id
 * Returns a single reward assignment belonging to the authenticated painter
 * @param {string} id
 */
export function getPainterPortalRewardByIdApi(id) {
  return apiFetch(`/painter-portal/rewards/${id}`);
}

// ── Dashboard & Reporting endpoints (Part 14) ────────────────────────────────

/**
 * GET /api/dashboard/summary
 * High-level business overview metrics
 */
export function getDashboardSummaryApi() {
  return apiFetch('/dashboard/summary');
}

/**
 * GET /api/dashboard/top-painters
 * @param {{ limit?: number }} params
 */
export function getTopPaintersApi(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/dashboard/top-painters${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/dashboard/sales-trend
 * @param {{ cycleId?: string }} params
 */
export function getSalesTrendApi(params = {}) {
  const query = new URLSearchParams();
  if (params.cycleId) query.set('cycleId', params.cycleId);
  const qs = query.toString();
  return apiFetch(`/dashboard/sales-trend${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/dashboard/recent-sales
 * @param {{ limit?: number }} params
 */
export function getRecentSalesApi(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/dashboard/recent-sales${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/dashboard/recent-rewards
 * @param {{ limit?: number }} params
 */
export function getRecentRewardsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/dashboard/recent-rewards${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/dashboard/inventory-summary
 * Physical reward inventory summary & low stock items
 */
export function getInventorySummaryApi() {
  return apiFetch('/dashboard/inventory-summary');
}

/**
 * GET /api/dashboard/company-rewards-summary
 * Company reward summary & aggregated breakdown
 */
export function getCompanyRewardsSummaryApi() {
  return apiFetch('/dashboard/company-rewards-summary');
}

/**
 * GET /api/dashboard/activity
 * @param {{ limit?: number }} params
 */
export function getDashboardActivityApi(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/dashboard/activity${qs ? `?${qs}` : ''}`);
}

