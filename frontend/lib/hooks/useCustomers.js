'use client';

import {
  useQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getCustomersApi,
  getCustomerByIdApi,
} from '@/lib/api';

/**
 * Hook to fetch paginated list of customers.
 */
export function useCustomers({ page = 1, limit = 20, search = '' } = {}) {
  return useQuery({
    queryKey: ['customers', { page, limit, search }],
    queryFn: () => getCustomersApi({ page, limit, search }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single customer by ID.
 */
export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}
