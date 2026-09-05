'use client';

import {
  useQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getPainterHistoryApi,
  getPainterHistoryCyclesApi,
  getPainterHistorySalesApi,
} from '@/lib/api';

/**
 * Hook to fetch painter summary & current cycle performance.
 * @param {string} painterId
 */
export function usePainterHistory(painterId) {
  return useQuery({
    queryKey: ['painter-history', painterId],
    queryFn: () => getPainterHistoryApi(painterId),
    enabled: Boolean(painterId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch cycle-wise sales history breakdown for a painter.
 * @param {string} painterId
 */
export function usePainterHistoryCycles(painterId) {
  return useQuery({
    queryKey: ['painter-history-cycles', painterId],
    queryFn: () => getPainterHistoryCyclesApi(painterId),
    enabled: Boolean(painterId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch paginated sales referrals for a painter with cycle/search filters.
 * @param {string} painterId
 * @param {{ page?: number, limit?: number, cycleId?: string, search?: string }} params
 */
export function usePainterHistorySales(painterId, params = {}) {
  const { page = 1, limit = 10, cycleId = 'all', search = '' } = params;

  return useQuery({
    queryKey: ['painter-history-sales', painterId, { page, limit, cycleId, search }],
    queryFn: () =>
      getPainterHistorySalesApi(painterId, { page, limit, cycleId, search }),
    enabled: Boolean(painterId),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
