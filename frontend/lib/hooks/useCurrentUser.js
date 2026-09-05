'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';

/**
 * Custom hook to fetch and cache the authenticated user profile using TanStack Query.
 * Avoids custom useEffect logic and integrates seamlessly with server-state caching.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false,             // Do not retry on 401
  });
}
