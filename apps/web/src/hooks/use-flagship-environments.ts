/**
 * useFlagshipEnvironments Hook
 *
 * Hook for managing FlagShip environments with CRUD operations.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { flagshipEnvironmentsApi } from '@/lib/api/flagship';
import type {
  Environment,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
} from '@/types/flagship';

interface UseFlagshipEnvironmentsOptions {
  autoFetch?: boolean;
}

export function useFlagshipEnvironments(options: UseFlagshipEnvironmentsOptions = {}) {
  const { autoFetch = false } = options;

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch environments
  const fetchEnvironments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await flagshipEnvironmentsApi.list();
      setEnvironments(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch environments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create environment
  const createEnvironment = useCallback(
    async (data: CreateEnvironmentDto): Promise<Environment> => {
      setError(null);

      try {
        const environment = await flagshipEnvironmentsApi.create(data);
        // Refresh the list after creation
        await fetchEnvironments();
        return environment;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to create environment';
        setError(message);
        throw err;
      }
    },
    [fetchEnvironments]
  );

  // Update environment
  const updateEnvironment = useCallback(
    async (id: string, data: UpdateEnvironmentDto): Promise<Environment> => {
      setError(null);

      try {
        const environment = await flagshipEnvironmentsApi.update(id, data);
        // Update the environment in the list
        setEnvironments((prev) =>
          prev.map((e) => (e.id === id ? environment : e))
        );
        return environment;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to update environment';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete environment
  const deleteEnvironment = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        await flagshipEnvironmentsApi.delete(id);
        // Remove from the list
        setEnvironments((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to delete environment';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchEnvironments();
    }
  }, [autoFetch, fetchEnvironments]);

  return {
    environments,
    isLoading,
    error,
    fetchEnvironments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    refresh: fetchEnvironments,
  };
}

