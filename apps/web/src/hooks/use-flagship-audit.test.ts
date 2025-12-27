/**
 * Tests for useFlagshipAudit Hook
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFlagshipAudit } from './use-flagship-audit';
import * as flagshipApi from '@/lib/api/flagship';
import type { AuditEvent, PaginatedResponse } from '@/types/flagship';

// Mock the API module
vi.mock('@/lib/api/flagship');

describe('useFlagshipAudit', () => {
  const mockAuditEvents: AuditEvent[] = [
    {
      id: 'audit-1',
      action: 'feature.created',
      actorId: 'user-1',
      actorEmail: 'admin@example.com',
      actorType: 'user',
      resourceType: 'feature',
      resourceId: 'feat-1',
      resourceName: 'Billing V2',
      changes: {
        after: { enabled: true },
      },
      metadata: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'audit-2',
      action: 'feature.toggled',
      actorId: 'user-2',
      actorEmail: 'dev@example.com',
      actorType: 'user',
      resourceType: 'feature',
      resourceId: 'feat-2',
      resourceName: 'AI Chat',
      changes: {
        before: { enabled: false },
        after: { enabled: true },
      },
      metadata: null,
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPaginatedResponse: PaginatedResponse<AuditEvent> = {
    items: mockAuditEvents,
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch audit events on mount when autoFetch is true', async () => {
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipAudit({ autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual(mockAuditEvents);
    expect(result.current.total).toBe(2);
    expect(flagshipApi.flagshipAuditApi.list).toHaveBeenCalled();
  });

  it('should not fetch audit events on mount when autoFetch is false', () => {
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockResolvedValue(mockPaginatedResponse);

    renderHook(() => useFlagshipAudit({ autoFetch: false }));

    expect(flagshipApi.flagshipAuditApi.list).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch audit events';
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() =>
      useFlagshipAudit({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.events).toEqual([]);
  });

  it('should fetch audit events with filters', async () => {
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipAudit({
        autoFetch: true,
        params: { action: 'feature.created', actorEmail: 'admin@example.com' },
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(flagshipApi.flagshipAuditApi.list).toHaveBeenCalledWith({
      action: 'feature.created',
      actorEmail: 'admin@example.com',
    });
  });

  it('should manually fetch audit events', async () => {
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipAudit({ autoFetch: false })
    );

    expect(result.current.events).toEqual([]);

    // Use act to wrap the fetch call that causes state updates
    const { act } = await import('@testing-library/react');
    await act(async () => {
      await result.current.fetchEvents();
    });

    await waitFor(() => {
      expect(result.current.events).toEqual(mockAuditEvents);
    });
  });

  it('should refresh audit events', async () => {
    vi.mocked(flagshipApi.flagshipAuditApi.list).mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() =>
      useFlagshipAudit({ autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock calls
    vi.clearAllMocks();

    // Refresh
    await result.current.refresh();

    expect(flagshipApi.flagshipAuditApi.list).toHaveBeenCalled();
  });
});

