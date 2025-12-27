/**
 * Tests for useFlagshipUsage Hook
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlagshipUsage } from './use-flagship-usage';
import * as flagshipApi from '@/lib/api/flagship';
import type { UsageSummary } from '@/types/flagship';

// Mock the API module
vi.mock('@/lib/api/flagship');

describe('useFlagshipUsage', () => {
  const mockUsageSummary: UsageSummary = {
    environmentId: 'env-1',
    environmentName: 'Production',
    metrics: [
      {
        key: 'api_calls',
        name: 'API Calls',
        current: 8500,
        limit: 10000,
        percentage: 85,
        status: 'warning',
      },
      {
        key: 'features',
        name: 'Features',
        current: 5,
        limit: 10,
        percentage: 50,
        status: 'ok',
      },
      {
        key: 'environments',
        name: 'Environments',
        current: 3,
        limit: 3,
        percentage: 100,
        status: 'critical',
      },
    ],
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch usage on mount when autoFetch is true', async () => {
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockResolvedValue(mockUsageSummary);

    const { result } = renderHook(() =>
      useFlagshipUsage({ autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).toEqual(mockUsageSummary);
    expect(flagshipApi.flagshipUsageApi.getCurrent).toHaveBeenCalled();
  });

  it('should not fetch usage on mount when autoFetch is false', () => {
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockResolvedValue(mockUsageSummary);

    renderHook(() => useFlagshipUsage({ autoFetch: false }));

    expect(flagshipApi.flagshipUsageApi.getCurrent).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch usage';
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() =>
      useFlagshipUsage({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.usage).toBeNull();
  });

  it('should fetch usage with environmentId filter', async () => {
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockResolvedValue(mockUsageSummary);

    const { result } = renderHook(() =>
      useFlagshipUsage({ autoFetch: true, environmentId: 'env-1' })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(flagshipApi.flagshipUsageApi.getCurrent).toHaveBeenCalledWith('env-1');
  });

  it('should manually fetch usage', async () => {
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockResolvedValue(mockUsageSummary);

    const { result } = renderHook(() =>
      useFlagshipUsage({ autoFetch: false })
    );

    expect(result.current.usage).toBeNull();

    // Use act to wrap the fetch call that causes state updates
    const { act } = await import('@testing-library/react');
    await act(async () => {
      await result.current.fetchUsage();
    });

    await waitFor(() => {
      expect(result.current.usage).toEqual(mockUsageSummary);
    });
  });

  it('should refresh usage data', async () => {
    vi.mocked(flagshipApi.flagshipUsageApi.getCurrent).mockResolvedValue(mockUsageSummary);

    const { result } = renderHook(() =>
      useFlagshipUsage({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock calls
    vi.clearAllMocks();

    // Refresh
    await result.current.refresh();

    expect(flagshipApi.flagshipUsageApi.getCurrent).toHaveBeenCalled();
  });
});

