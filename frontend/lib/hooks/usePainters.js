'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getPaintersApi,
  getPainterByIdApi,
  createPainterApi,
  deactivatePainterApi,
  activatePainterApi,
} from '@/lib/api';

/**
 * Hook to fetch paginated painters with search and status filtering.
 */
export function usePainters({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
} = {}) {
  return useQuery({
    queryKey: ['painters', { page, limit, search, status }],
    queryFn: () => getPaintersApi({ page, limit, search, status }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds fresh
  });
}

/**
 * Hook to fetch a single painter by ID.
 */
export function usePainter(id) {
  return useQuery({
    queryKey: ['painter', id],
    queryFn: () => getPainterByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to create a new painter.
 */
export function useCreatePainter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPainterData) => createPainterApi(newPainterData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['painters'] });
    },
  });
}

/**
 * Hook to deactivate a painter.
 */
export function useDeactivatePainter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deactivatePainterApi(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ['painters'] });
      queryClient.invalidateQueries({ queryKey: ['painter', id] });
    },
  });
}

/**
 * Hook to reactivate a painter.
 */
export function useActivatePainter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => activatePainterApi(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ['painters'] });
      queryClient.invalidateQueries({ queryKey: ['painter', id] });
    },
  });
}
