/**
 * useFlagshipAudit Hook
 *
 * Hook for fetching FlagShip audit events.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { flagshipAuditApi } from '@/lib/api/flagship';
import type { AuditEvent, AuditQueryParams } from '@/types/flagship';

interface UseFlagshipAuditOptions {
  autoFetch?: boolean;
  params?: AuditQueryParams;
}

export function useFlagshipAudit(options: UseFlagshipAuditOptions = {}) {
  const { autoFetch = false, params } = options;

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit events
  const fetchEvents = useCallback(
    async (queryParams?: AuditQueryParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await flagshipAuditApi.list(queryParams || params);
        setEvents(response.items);
        setTotal(response.total);
        setPage(response.page);
        setLimit(response.limit);
        setTotalPages(response.totalPages);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to fetch audit events';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  return {
    events,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    error,
    fetchEvents,
    refresh: fetchEvents,
  };
}

