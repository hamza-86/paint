'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getDashboardSummaryApi,
  getTopPaintersApi,
  getSalesTrendApi,
  getRecentSalesApi,
  getRecentRewardsApi,
  getInventorySummaryApi,
  getCompanyRewardsSummaryApi,
  getDashboardActivityApi,
} from '@/lib/api';

/**
 * Hook for high-level dashboard metrics summary
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummaryApi(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Background refresh every 60s
  });
}

/**
 * Hook for top performing painters in active cycle
 */
export function useTopPainters({ limit = 5 } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'top-painters', { limit }],
    queryFn: () => getTopPaintersApi({ limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for sales trend daily aggregation
 */
export function useSalesTrend({ cycleId } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'sales-trend', { cycleId }],
    queryFn: () => getSalesTrendApi({ cycleId }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for recent sales
 */
export function useRecentSales({ limit = 5 } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'recent-sales', { limit }],
    queryFn: () => getRecentSalesApi({ limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for recent physical reward assignments
 */
export function useRecentRewards({ limit = 5 } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'recent-rewards', { limit }],
    queryFn: () => getRecentRewardsApi({ limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for physical reward inventory summary & low-stock alerts
 */
export function useInventorySummary() {
  return useQuery({
    queryKey: ['dashboard', 'inventory-summary'],
    queryFn: () => getInventorySummaryApi(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for company rewards summary & aggregates
 */
export function useCompanyRewardsSummary() {
  return useQuery({
    queryKey: ['dashboard', 'company-rewards-summary'],
    queryFn: () => getCompanyRewardsSummaryApi(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for unified recent activity feed
 */
export function useDashboardActivity({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'activity', { limit }],
    queryFn: () => getDashboardActivityApi({ limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
