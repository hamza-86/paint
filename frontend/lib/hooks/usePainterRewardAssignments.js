/**
 * usePainterRewardAssignments.js — Part 12
 * React Query hooks for Painter Reward Assignment operations.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssignmentsApi,
  getAssignmentByIdApi,
  getPainterEligibilityApi,
  createAssignmentApi,
} from '../api';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const ASSIGNMENT_KEYS = {
  all: ['painter-reward-assignments'],
  lists: () => [...ASSIGNMENT_KEYS.all, 'list'],
  list: (filters) => [...ASSIGNMENT_KEYS.lists(), filters],
  details: () => [...ASSIGNMENT_KEYS.all, 'detail'],
  detail: (id) => [...ASSIGNMENT_KEYS.details(), id],
  eligibility: (painterId) => [...ASSIGNMENT_KEYS.all, 'eligibility', painterId],
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Paginated list of all assignments with optional filters.
 */
export function useAssignments(filters = {}) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.list(filters),
    queryFn: () => getAssignmentsApi(filters),
    staleTime: 30_000,
  });
}

/**
 * Single assignment by ID.
 */
export function useAssignment(id) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.detail(id),
    queryFn: () => getAssignmentByIdApi(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

/**
 * Painter eligibility — points, suggested tier, available inventory, history.
 * Refetches whenever painterId changes.
 */
export function usePainterEligibility(painterId) {
  return useQuery({
    queryKey: ASSIGNMENT_KEYS.eligibility(painterId),
    queryFn: () => getPainterEligibilityApi(painterId),
    enabled: Boolean(painterId),
    staleTime: 15_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create a new assignment (atomic: decrements inventory + creates record).
 * Invalidates assignment list and reward-inventory cache on success.
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignmentApi,
    onSuccess: (_, variables) => {
      // Invalidate assignment lists
      queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.lists() });
      // Invalidate this painter's eligibility cache
      if (variables?.painterId) {
        queryClient.invalidateQueries({
          queryKey: ASSIGNMENT_KEYS.eligibility(variables.painterId),
        });
      }
      // Invalidate reward-inventory so remainingQty is refreshed
      queryClient.invalidateQueries({ queryKey: ['reward-inventory'] });
    },
  });
}
