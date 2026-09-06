'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyRewardsApi,
  getCompanyRewardByIdApi,
  createCompanyRewardApi,
  updateCompanyRewardApi,
} from '../api';

// ── Query key factory ─────────────────────────────────────────────────────────

export const companyRewardKeys = {
  all: ['company-rewards'],
  lists: () => [...companyRewardKeys.all, 'list'],
  list: (filters) => [...companyRewardKeys.lists(), filters],
  details: () => [...companyRewardKeys.all, 'detail'],
  detail: (id) => [...companyRewardKeys.details(), id],
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated, filtered company reward entries.
 * @param {{ page?, limit?, companyId?, search?, dateFrom?, dateTo? }} filters
 */
export function useCompanyRewards(filters = {}) {
  return useQuery({
    queryKey: companyRewardKeys.list(filters),
    queryFn: () => getCompanyRewardsApi(filters),
    keepPreviousData: true,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Fetch a single company reward entry by ID.
 * @param {string|null} id
 */
export function useCompanyRewardById(id) {
  return useQuery({
    queryKey: companyRewardKeys.detail(id),
    queryFn: () => getCompanyRewardByIdApi(id),
    enabled: Boolean(id),
  });
}

/**
 * Create a new company reward entry.
 */
export function useCreateCompanyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createCompanyRewardApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyRewardKeys.lists() });
    },
  });
}

/**
 * Update an existing company reward entry.
 */
export function useUpdateCompanyReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCompanyRewardApi(id, data),
    onSuccess: (res, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyRewardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyRewardKeys.detail(id) });
    },
  });
}
