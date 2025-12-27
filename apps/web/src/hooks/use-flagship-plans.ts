/**
 * useFlagshipPlans Hook
 *
 * Hook for managing FlagShip plans with CRUD operations.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { flagshipPlansApi } from '@/lib/api/flagship';
import type {
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  PlanQueryParams,
} from '@/types/flagship';

interface UseFlagshipPlansOptions {
  autoFetch?: boolean;
  params?: PlanQueryParams;
}

export function useFlagshipPlans(options: UseFlagshipPlansOptions = {}) {
  const { autoFetch = false, params } = options;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans
  const fetchPlans = useCallback(
    async (queryParams?: PlanQueryParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await flagshipPlansApi.list(queryParams || params);
        setPlans(response.items);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
        setTotalPages(response.totalPages);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to fetch plans';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  // Create plan
  const createPlan = useCallback(
    async (data: CreatePlanDto): Promise<Plan> => {
      setError(null);

      try {
        const plan = await flagshipPlansApi.create(data);
        // Refresh the list after creation
        await fetchPlans();
        return plan;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to create plan';
        setError(message);
        throw err;
      }
    },
    [fetchPlans]
  );

  // Update plan
  const updatePlan = useCallback(
    async (id: string, data: UpdatePlanDto): Promise<Plan> => {
      setError(null);

      try {
        const plan = await flagshipPlansApi.update(id, data);
        // Update the plan in the list
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? plan : p))
        );
        return plan;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update plan';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete plan
  const deletePlan = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        await flagshipPlansApi.delete(id);
        // Remove from the list
        setPlans((prev) => prev.filter((p) => p.id !== id));
        setTotal((prev) => prev - 1);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to delete plan';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchPlans();
    }
  }, [autoFetch, fetchPlans]);

  return {
    plans,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    refresh: fetchPlans,
  };
}

