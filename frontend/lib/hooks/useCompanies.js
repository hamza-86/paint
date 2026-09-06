'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getCompaniesApi,
  getCompanyApi,
  createCompanyApi,
  updateCompanyApi,
  deactivateCompanyApi,
  activateCompanyApi,
} from '@/lib/api';

/**
 * Fetch paginated list of companies with search and status filtering.
 * @param {{ page?: number, limit?: number, search?: string, status?: string }} params
 */
export function useCompanies(params = {}) {
  const { page = 1, limit = 10, search = '', status = 'active' } = params;

  return useQuery({
    queryKey: ['companies', { page, limit, search, status }],
    queryFn: () => getCompaniesApi({ page, limit, search, status }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single company by ID.
 * @param {string} id
 */
export function useCompany(id) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompanyApi(id),
    enabled: Boolean(id),
  });
}

/**
 * Mutation to create a new company master record.
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createCompanyApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

/**
 * Mutation to update an existing company.
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCompanyApi(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    },
  });
}

/**
 * Mutation to deactivate a company.
 */
export function useDeactivateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deactivateCompanyApi(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });
}

/**
 * Mutation to activate a company.
 */
export function useActivateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => activateCompanyApi(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });
}
