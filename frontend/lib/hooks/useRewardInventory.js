import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRewardInventoryApi,
  getRewardInventoryByIdApi,
  createRewardInventoryApi,
  updateRewardInventoryApi,
  deactivateRewardInventoryApi,
  activateRewardInventoryApi,
} from '../api';

export const rewardInventoryKeys = {
  all: ['reward-inventory'],
  lists: () => [...rewardInventoryKeys.all, 'list'],
  list: (filters) => [...rewardInventoryKeys.lists(), filters],
  details: () => [...rewardInventoryKeys.all, 'detail'],
  detail: (id) => [...rewardInventoryKeys.details(), id],
};

/**
 * Hook to fetch paginated/filtered reward inventory
 */
export function useRewardInventory(filters = {}) {
  return useQuery({
    queryKey: rewardInventoryKeys.list(filters),
    queryFn: () => getRewardInventoryApi(filters),
  });
}

/**
 * Hook to fetch a single inventory item by ID
 */
export function useRewardInventoryItem(id) {
  return useQuery({
    queryKey: rewardInventoryKeys.detail(id),
    queryFn: () => getRewardInventoryByIdApi(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to create a new reward inventory item
 */
export function useCreateRewardInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createRewardInventoryApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.lists() });
    },
  });
}

/**
 * Hook to update a reward inventory item
 */
export function useUpdateRewardInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateRewardInventoryApi(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a reward inventory item
 */
export function useDeactivateRewardInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deactivateRewardInventoryApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.detail(id) });
    },
  });
}

/**
 * Hook to reactivate a reward inventory item
 */
export function useActivateRewardInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateRewardInventoryApi(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rewardInventoryKeys.detail(id) });
    },
  });
}
