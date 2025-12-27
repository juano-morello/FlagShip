/**
 * Tests for AuditLog Component
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLog } from './audit-log';
import type { AuditEvent } from '@/types/flagship';

describe('AuditLog', () => {
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

  it('renders loading state', () => {
    render(<AuditLog events={[]} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<AuditLog events={[]} isLoading={false} />);

    expect(screen.getByText(/no audit events/i)).toBeInTheDocument();
  });

  it('renders audit events in a table', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    // Check for table headers
    expect(screen.getByText(/action/i)).toBeInTheDocument();
    expect(screen.getByText(/resource/i)).toBeInTheDocument();
    expect(screen.getByText(/actor/i)).toBeInTheDocument();
    expect(screen.getByText(/timestamp/i)).toBeInTheDocument();
  });

  it('displays action types', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    expect(screen.getByText('feature.created')).toBeInTheDocument();
    expect(screen.getByText('feature.toggled')).toBeInTheDocument();
  });

  it('displays resource names', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    expect(screen.getByText('Billing V2')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  it('displays actor emails', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
  });

  it('displays formatted timestamps', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    // Check that timestamps are rendered (exact format may vary)
    const timestamps = screen.getAllByText(/2024/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('displays resource type', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    const featureElements = screen.getAllByText(/feature/i);
    expect(featureElements.length).toBeGreaterThan(0);
  });

  it('renders all events', () => {
    render(<AuditLog events={mockAuditEvents} isLoading={false} />);

    // Should render 2 events
    expect(screen.getByText('Billing V2')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });
});

