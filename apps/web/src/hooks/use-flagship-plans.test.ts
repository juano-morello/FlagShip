/**
 * Tests for useFlagshipPlans Hook
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlagshipPlans } from './use-flagship-plans';
import * as flagshipApi from '@/lib/api/flagship';
import type { Plan, PaginatedResponse } from '@/types/flagship';

// Mock the API module
vi.mock('@/lib/api/flagship');

describe('useFlagshipPlans', () => {
  const mockPlans: Plan[] = [
    {
      id: 'plan-1',
      name: 'free',
      displayName: 'Free Plan',
      description: 'Basic features',
      price: 0,
      currency: 'USD',
      features: ['feat-1', 'feat-2'],
      limits: { users: 5, projects: 1 },
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'plan-2',
      name: 'pro',
      displayName: 'Pro Plan',
      description: 'Advanced features',
      price: 29,
      currency: 'USD',
      features: ['feat-1', 'feat-2', 'feat-3'],
      limits: { users: 50, projects: 10 },
      active: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPaginatedResponse: PaginatedResponse<Plan> = {
    items: mockPlans,
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch plans on mount when autoFetch is true', async () => {
    vi.mocked(flagshipApi.flagshipPlansApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipPlans({ autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual(mockPlans);
    expect(result.current.total).toBe(2);
    expect(flagshipApi.flagshipPlansApi.list).toHaveBeenCalled();
  });

  it('should not fetch plans on mount when autoFetch is false', () => {
    vi.mocked(flagshipApi.flagshipPlansApi.list).mockResolvedValue(mockPaginatedResponse);

    renderHook(() => useFlagshipPlans({ autoFetch: false }));

    expect(flagshipApi.flagshipPlansApi.list).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch plans';
    vi.mocked(flagshipApi.flagshipPlansApi.list).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() =>
      useFlagshipPlans({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.plans).toEqual([]);
  });

  it('should create a new plan', async () => {
    const newPlan: Plan = {
      id: 'plan-3',
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'All features',
      price: 99,
      currency: 'USD',
      features: ['feat-1', 'feat-2', 'feat-3', 'feat-4'],
      limits: { users: 500, projects: 100 },
      active: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    vi.mocked(flagshipApi.flagshipPlansApi.list).mockResolvedValue({
      ...mockPaginatedResponse,
      items: [],
      total: 0,
    });
    vi.mocked(flagshipApi.flagshipPlansApi.create).mockResolvedValue(newPlan);

    const { result } = renderHook(() =>
      useFlagshipPlans({ autoFetch: false })
    );

    const created = await result.current.createPlan({
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'All features',
      price: 99,
    });

    expect(created).toEqual(newPlan);
    expect(flagshipApi.flagshipPlansApi.create).toHaveBeenCalledWith({
      name: 'enterprise',
      displayName: 'Enterprise Plan',
      description: 'All features',
      price: 99,
    });
  });

  it('should update an existing plan', async () => {
    const updatedPlan: Plan = {
      ...mockPlans[0],
      displayName: 'Free Plan Updated',
    };

    vi.mocked(flagshipApi.flagshipPlansApi.list).mockResolvedValue(mockPaginatedResponse);
    vi.mocked(flagshipApi.flagshipPlansApi.update).mockResolvedValue(updatedPlan);

    const { result } = renderHook(() =>
      useFlagshipPlans({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updated = await result.current.updatePlan('plan-1', {
      displayName: 'Free Plan Updated',
    });

    expect(updated).toEqual(updatedPlan);
  });
});

