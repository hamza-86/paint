'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getCyclesApi,
  getCycleByIdApi,
  createCycleApi,
  activateCycleApi,
  closeCycleApi,
} from '@/lib/api';

/**
 * Hook to fetch paginated list of cycles.
 */
export function useCycles({ page = 1, limit = 10 } = {}) {
  return useQuery({
    queryKey: ['cycles', { page, limit }],
    queryFn: () => getCyclesApi({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single cycle by ID.
 */
export function useCycle(id) {
  return useQuery({
    queryKey: ['cycle', id],
    queryFn: () => getCycleByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

function invalidateCycleRelatedQueries(queryClient, cycleId) {
  queryClient.invalidateQueries({ queryKey: ['cycles'] });
  if (cycleId) {
    queryClient.invalidateQueries({ queryKey: ['cycle', cycleId] });
  }
  queryClient.invalidateQueries({ queryKey: ['active-cycle'] });
  queryClient.invalidateQueries({ queryKey: ['painter-reward-assignments'] });
  queryClient.invalidateQueries({ queryKey: ['painters'] });
  queryClient.invalidateQueries({ queryKey: ['painter-current-tier'] });
  queryClient.invalidateQueries({ queryKey: ['painter-history'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  queryClient.invalidateQueries({ queryKey: ['top-painters'] });
  queryClient.invalidateQueries({ queryKey: ['sales'] });
  queryClient.invalidateQueries({ queryKey: ['sales-trend'] });
  queryClient.invalidateQueries({ queryKey: ['recent-sales'] });
  queryClient.invalidateQueries({ queryKey: ['painter-portal'] });
}

/**
 * Hook to create a new cycle.
 */
export function useCreateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createCycleApi(data),
    onSuccess: (result) => {
      const cycleId = result?.data?.id || result?.data?._id;
      invalidateCycleRelatedQueries(queryClient, cycleId);
    },
  });
}

/**
 * Hook to activate a cycle.
 */
export function useActivateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => activateCycleApi(id),
    onSuccess: (result, id) => {
      invalidateCycleRelatedQueries(queryClient, id);
    },
  });
}

/**
 * Hook to close (deactivate) a cycle.
 */
export function useCloseCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => closeCycleApi(id),
    onSuccess: (result, id) => {
      invalidateCycleRelatedQueries(queryClient, id);
    },
  });
}
