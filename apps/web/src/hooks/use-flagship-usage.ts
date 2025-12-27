/**
 * useFlagshipUsage Hook
 *
 * Hook for fetching FlagShip usage metrics.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { flagshipUsageApi } from '@/lib/api/flagship';
import type { UsageSummary } from '@/types/flagship';

interface UseFlagshipUsageOptions {
  autoFetch?: boolean;
  environmentId?: string;
}

export function useFlagshipUsage(options: UseFlagshipUsageOptions = {}) {
  const { autoFetch = false, environmentId } = options;

  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage
  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await flagshipUsageApi.getCurrent(environmentId);
      setUsage(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch usage';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [environmentId]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchUsage();
    }
  }, [autoFetch, fetchUsage]);

  return {
    usage,
    isLoading,
    error,
    fetchUsage,
    refresh: fetchUsage,
  };
}

