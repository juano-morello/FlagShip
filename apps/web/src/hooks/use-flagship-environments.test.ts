/**
 * Tests for useFlagshipEnvironments Hook
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlagshipEnvironments } from './use-flagship-environments';
import * as flagshipApi from '@/lib/api/flagship';
import type { Environment } from '@/types/flagship';

// Mock the API module
vi.mock('@/lib/api/flagship');

describe('useFlagshipEnvironments', () => {
  const mockEnvironments: Environment[] = [
    {
      id: 'env-1',
      name: 'Development',
      type: 'development',
      apiKeyPrefix: 'dev_',
      featuresEnabled: 5,
      featuresTotal: 10,
      limitsWarning: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'env-2',
      name: 'Production',
      type: 'production',
      apiKeyPrefix: 'prod_',
      featuresEnabled: 8,
      featuresTotal: 10,
      limitsWarning: 2,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch environments on mount when autoFetch is true', async () => {
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockResolvedValue(mockEnvironments);

    const { result } = renderHook(() =>
      useFlagshipEnvironments({ autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.environments).toEqual(mockEnvironments);
    expect(flagshipApi.flagshipEnvironmentsApi.list).toHaveBeenCalled();
  });

  it('should not fetch environments on mount when autoFetch is false', () => {
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockResolvedValue(mockEnvironments);

    renderHook(() => useFlagshipEnvironments({ autoFetch: false }));

    expect(flagshipApi.flagshipEnvironmentsApi.list).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch environments';
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() =>
      useFlagshipEnvironments({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.environments).toEqual([]);
  });

  it('should create a new environment', async () => {
    const newEnvironment: Environment = {
      id: 'env-3',
      name: 'Staging',
      type: 'staging',
      apiKeyPrefix: 'stg_',
      featuresEnabled: 0,
      featuresTotal: 10,
      limitsWarning: 0,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockResolvedValue([]);
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.create).mockResolvedValue(newEnvironment);

    const { result } = renderHook(() =>
      useFlagshipEnvironments({ autoFetch: false })
    );

    const created = await result.current.createEnvironment({
      name: 'Staging',
      type: 'staging',
    });

    expect(created).toEqual(newEnvironment);
    expect(flagshipApi.flagshipEnvironmentsApi.create).toHaveBeenCalledWith({
      name: 'Staging',
      type: 'staging',
    });
  });

  it('should update an existing environment', async () => {
    const updatedEnvironment: Environment = {
      ...mockEnvironments[0],
      name: 'Development Updated',
    };

    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockResolvedValue(mockEnvironments);
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.update).mockResolvedValue(updatedEnvironment);

    const { result } = renderHook(() =>
      useFlagshipEnvironments({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updated = await result.current.updateEnvironment('env-1', {
      name: 'Development Updated',
    });

    expect(updated).toEqual(updatedEnvironment);
  });

  it('should delete an environment', async () => {
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.list).mockResolvedValue(mockEnvironments);
    vi.mocked(flagshipApi.flagshipEnvironmentsApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useFlagshipEnvironments({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteEnvironment('env-1');

    expect(flagshipApi.flagshipEnvironmentsApi.delete).toHaveBeenCalledWith('env-1');
  });
});

