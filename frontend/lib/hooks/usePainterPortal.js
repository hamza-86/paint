/**
 * usePainterPortal.js — Part 13
 * React Query hooks for the read-only Painter Portal.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getPainterPortalMeApi,
  getPainterPortalDashboardApi,
  getPainterPortalSalesApi,
  getPainterPortalRewardsApi,
  getPainterPortalEligibilityApi,
  getPainterPortalCyclesApi,
  getPainterPortalRewardByIdApi,
} from '../api';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const PAINTER_PORTAL_KEYS = {
  all: ['painter-portal'],
  me: () => [...PAINTER_PORTAL_KEYS.all, 'me'],
  dashboard: () => [...PAINTER_PORTAL_KEYS.all, 'dashboard'],
  sales: (filters) => [...PAINTER_PORTAL_KEYS.all, 'sales', filters],
  rewards: (filters) => [...PAINTER_PORTAL_KEYS.all, 'rewards', filters],
  rewardDetail: (id) => [...PAINTER_PORTAL_KEYS.all, 'reward', id],
  eligibility: () => [...PAINTER_PORTAL_KEYS.all, 'eligibility'],
  cycles: () => [...PAINTER_PORTAL_KEYS.all, 'cycles'],
};

// ── Read-Only Query Hooks ─────────────────────────────────────────────────────

/**
 * Fetch authenticated painter profile & current cycle.
 */
export function usePainterPortalMe() {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.me(),
    queryFn: getPainterPortalMeApi,
    staleTime: 60_000,
  });
}

/**
 * Fetch comprehensive dashboard summary for authenticated painter.
 */
export function usePainterPortalDashboard() {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.dashboard(),
    queryFn: getPainterPortalDashboardApi,
    staleTime: 30_000,
  });
}

/**
 * Fetch paginated sales history with optional date & cycle filters.
 */
export function usePainterPortalSales(filters = {}) {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.sales(filters),
    queryFn: () => getPainterPortalSalesApi(filters),
    staleTime: 30_000,
  });
}

/**
 * Fetch physical rewards received by the authenticated painter.
 */
export function usePainterPortalRewards(filters = {}) {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.rewards(filters),
    queryFn: () => getPainterPortalRewardsApi(filters),
    staleTime: 30_000,
  });
}

/**
 * Fetch current cycle point total and qualifying reward tier.
 */
export function usePainterPortalEligibility() {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.eligibility(),
    queryFn: getPainterPortalEligibilityApi,
    staleTime: 30_000,
  });
}

/**
 * Fetch all historical cycles in which the painter participated.
 */
export function usePainterPortalCycles() {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.cycles(),
    queryFn: getPainterPortalCyclesApi,
    staleTime: 60_000,
  });
}

/**
 * Fetch single reward assignment detail.
 */
export function usePainterPortalReward(id) {
  return useQuery({
    queryKey: PAINTER_PORTAL_KEYS.rewardDetail(id),
    queryFn: () => getPainterPortalRewardByIdApi(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
