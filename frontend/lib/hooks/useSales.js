'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getSalesApi,
  getSaleByIdApi,
  createSaleApi,
} from '@/lib/api';

/**
 * Hook to fetch paginated list of sales with filters and aggregated summary.
 */
export function useSales({
  page = 1,
  limit = 10,
  cycleId,
  painterId,
  customerId,
  search = '',
} = {}) {
  return useQuery({
    queryKey: ['sales', { page, limit, cycleId, painterId, customerId, search }],
    queryFn: () =>
      getSalesApi({ page, limit, cycleId, painterId, customerId, search }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single sale detail by ID.
 */
export function useSale(id) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to record a new sale.
 * Invalidates 'sales', 'customers', and 'cycles' caches.
 */
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createSaleApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['painters'] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
  });
}
