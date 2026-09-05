'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getRewardTiersApi,
  getRewardTierApi,
  createRewardTierApi,
  updateRewardTierApi,
  deactivateRewardTierApi,
  activateRewardTierApi,
  getPainterCurrentRewardTierApi,
} from '@/lib/api';

/**
 * Fetch paginated list of reward tiers.
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export function useRewardTiers(params = {}) {
  const { page = 1, limit = 10, status = 'all' } = params;

  return useQuery({
    queryKey: ['reward-tiers', { page, limit, status }],
    queryFn: () => getRewardTiersApi({ page, limit, status }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single reward tier by ID.
 * @param {string} id
 */
export function useRewardTier(id) {
  return useQuery({
    queryKey: ['reward-tier', id],
    queryFn: () => getRewardTierApi(id),
    enabled: Boolean(id),
  });
}

/**
 * Mutation to create a new reward tier.
 */
export function useCreateRewardTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createRewardTierApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['painter-current-reward-tier'] });
    },
  });
}

/**
 * Mutation to update an existing reward tier.
 */
export function useUpdateRewardTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRewardTierApi(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reward-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['reward-tier', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['painter-current-reward-tier'] });
    },
  });
}

/**
 * Mutation to deactivate a reward tier.
 */
export function useDeactivateRewardTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deactivateRewardTierApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['painter-current-reward-tier'] });
    },
  });
}

/**
 * Mutation to activate a reward tier.
 */
export function useActivateRewardTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => activateRewardTierApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['painter-current-reward-tier'] });
    },
  });
}

/**
 * Hook to calculate a painter's current reward eligibility based on active cycle points.
 * @param {string} painterId
 */
export function usePainterCurrentRewardTier(painterId) {
  return useQuery({
    queryKey: ['painter-current-reward-tier', painterId],
    queryFn: () => getPainterCurrentRewardTierApi(painterId),
    enabled: Boolean(painterId),
    staleTime: 30 * 1000,
  });
}
