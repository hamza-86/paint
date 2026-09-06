'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getItemsApi,
  getItemByIdApi,
  createItemApi,
  updateItemApi,
  deactivateItemApi,
  activateItemApi,
  getItemBrandsApi,
  getItemCategoriesApi,
  getItemSalesHistoryApi,
} from '@/lib/api';

/**
 * Hook to fetch paginated items with search, status, category, and brand filters.
 */
export function useItems({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  category = 'all',
  brand = 'all',
} = {}) {
  return useQuery({
    queryKey: ['items', { page, limit, search, status, category, brand }],
    queryFn: () => getItemsApi({ page, limit, search, status, category, brand }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds fresh
  });
}

/**
 * Hook to fetch a single item by ID.
 */
export function useItem(id) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => getItemByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch distinct item brands from DB.
 */
export function useItemBrands() {
  return useQuery({
    queryKey: ['itemBrands'],
    queryFn: () => getItemBrandsApi(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch distinct item categories from DB.
 */
export function useItemCategories() {
  return useQuery({
    queryKey: ['itemCategories'],
    queryFn: () => getItemCategoriesApi(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch paginated sales history for a specific item.
 */
export function useItemSalesHistory(id, { page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['itemSalesHistory', id, { page, limit }],
    queryFn: () => getItemSalesHistoryApi(id, { page, limit }),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to create a new item.
 */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newItemData) => createItemApi(newItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['itemBrands'] });
      queryClient.invalidateQueries({ queryKey: ['itemCategories'] });
    },
  });
}

/**
 * Hook to update an existing item.
 */
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateItemApi(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['itemBrands'] });
      queryClient.invalidateQueries({ queryKey: ['itemCategories'] });
    },
  });
}

/**
 * Hook to deactivate an item.
 */
export function useDeactivateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deactivateItemApi(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    },
  });
}

/**
 * Hook to reactivate an item.
 */
export function useActivateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => activateItemApi(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
    },
  });
}
