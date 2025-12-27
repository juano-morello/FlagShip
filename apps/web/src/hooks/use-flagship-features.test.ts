/**
 * Tests for useFlagshipFeatures Hook
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlagshipFeatures } from './use-flagship-features';
import * as flagshipApi from '@/lib/api/flagship';
import type { Feature, PaginatedResponse } from '@/types/flagship';

// Mock the API module
vi.mock('@/lib/api/flagship');

describe('useFlagshipFeatures', () => {
  const mockFeatures: Feature[] = [
    {
      id: 'feat-1',
      key: 'billing_v2',
      name: 'Billing V2',
      description: 'New billing system',
      type: 'plan',
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'feat-2',
      key: 'ai_chat',
      name: 'AI Chat',
      description: 'AI-powered chat',
      type: 'percentage',
      enabled: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPaginatedResponse: PaginatedResponse<Feature> = {
    items: mockFeatures,
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch features on mount when autoFetch is true', async () => {
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.features).toEqual(mockFeatures);
    expect(result.current.total).toBe(2);
    expect(flagshipApi.flagshipFeaturesApi.list).toHaveBeenCalled();
  });

  it('should not fetch features on mount when autoFetch is false', () => {
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);

    renderHook(() => useFlagshipFeatures({ autoFetch: false }));

    expect(flagshipApi.flagshipFeaturesApi.list).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch features';
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.features).toEqual([]);
  });

  it('should create a new feature', async () => {
    const newFeature: Feature = {
      id: 'feat-3',
      key: 'dark_mode',
      name: 'Dark Mode',
      description: 'Dark theme support',
      type: 'boolean',
      enabled: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue({
      ...mockPaginatedResponse,
      items: [],
      total: 0,
    });
    vi.mocked(flagshipApi.flagshipFeaturesApi.create).mockResolvedValue(newFeature);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: false })
    );

    const created = await result.current.createFeature({
      key: 'dark_mode',
      name: 'Dark Mode',
      description: 'Dark theme support',
      type: 'boolean',
    });

    expect(created).toEqual(newFeature);
    expect(flagshipApi.flagshipFeaturesApi.create).toHaveBeenCalledWith({
      key: 'dark_mode',
      name: 'Dark Mode',
      description: 'Dark theme support',
      type: 'boolean',
    });
  });

  it('should update an existing feature', async () => {
    const updatedFeature: Feature = {
      ...mockFeatures[0],
      name: 'Billing V2 Updated',
    };

    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);
    vi.mocked(flagshipApi.flagshipFeaturesApi.update).mockResolvedValue(updatedFeature);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updated = await result.current.updateFeature('billing_v2', {
      name: 'Billing V2 Updated',
    });

    expect(updated).toEqual(updatedFeature);
  });

  it('should delete a feature', async () => {
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);
    vi.mocked(flagshipApi.flagshipFeaturesApi.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteFeature('billing_v2');

    expect(flagshipApi.flagshipFeaturesApi.delete).toHaveBeenCalledWith('billing_v2');
  });

  it('should toggle a feature', async () => {
    const toggledFeature: Feature = {
      ...mockFeatures[0],
      enabled: false,
    };

    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);
    vi.mocked(flagshipApi.flagshipFeaturesApi.toggle).mockResolvedValue(toggledFeature);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const toggled = await result.current.toggleFeature('billing_v2', false);

    expect(toggled).toEqual(toggledFeature);
    expect(flagshipApi.flagshipFeaturesApi.toggle).toHaveBeenCalledWith('billing_v2', false);
  });

  it('should refresh features list', async () => {
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipFeatures({ autoFetch: false })
    );

    // Trigger refresh (don't await - the hook's refresh doesn't return a promise value we care about)
    result.current.refresh();

    // Wait for the features to be populated
    await waitFor(() => {
      expect(result.current.features).toEqual(mockFeatures);
    });

    expect(result.current.isLoading).toBe(false);
    expect(flagshipApi.flagshipFeaturesApi.list).toHaveBeenCalled();
  });

  it('should fetch features with query params', async () => {
    vi.mocked(flagshipApi.flagshipFeaturesApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipFeatures({
        autoFetch: true,
        params: {
          page: 2,
          limit: 10,
          search: 'billing',
          type: 'plan',
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(flagshipApi.flagshipFeaturesApi.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'billing',
      type: 'plan',
    });
  });
});

