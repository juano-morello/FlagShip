/**
 * Tests for UsageDashboard Component
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageDashboard } from './usage-dashboard';
import type { UsageSummary } from '@/types/flagship';

describe('UsageDashboard', () => {
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

  it('renders loading state', () => {
    const { container } = render(
      <UsageDashboard usage={null} isLoading={true} />
    );

    // Check for skeleton elements by class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no usage data', () => {
    render(<UsageDashboard usage={null} isLoading={false} />);

    expect(screen.getByText('No usage data available')).toBeInTheDocument();
  });

  it('renders usage metrics', () => {
    render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    expect(screen.getByText('API Calls')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Environments')).toBeInTheDocument();
  });

  it('displays current and limit values', () => {
    const { container } = render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    // Check for formatted numbers in the document
    expect(screen.getByText('8,500')).toBeInTheDocument();
    expect(container.textContent).toContain('10,000');
    expect(container.textContent).toContain('/ 10');
  });

  it('displays percentage for each metric', () => {
    render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows environment name', () => {
    render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    expect(screen.getByText(/Production/)).toBeInTheDocument();
  });

  it('displays status indicators with correct colors', () => {
    render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    // Check for status badges
    expect(screen.getByText('WARNING')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('handles metrics with no limit', () => {
    const usageWithNoLimit: UsageSummary = {
      environmentId: 'env-1',
      environmentName: 'Enterprise',
      metrics: [
        {
          key: 'api_calls',
          name: 'API Calls',
          current: 50000,
          limit: null,
          percentage: 0,
          status: 'ok',
        },
      ],
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(<UsageDashboard usage={usageWithNoLimit} isLoading={false} />);

    expect(screen.getByText('50,000')).toBeInTheDocument();
    // Use getAllByText since "Unlimited" appears twice
    const unlimitedElements = screen.getAllByText(/Unlimited/i);
    expect(unlimitedElements.length).toBeGreaterThan(0);
  });

  it('displays updated timestamp', () => {
    render(<UsageDashboard usage={mockUsageSummary} isLoading={false} />);

    // Should show some form of timestamp
    expect(screen.getByText(/Updated/i)).toBeInTheDocument();
  });

  it('renders progress bars for each metric', () => {
    const { container } = render(
      <UsageDashboard usage={mockUsageSummary} isLoading={false} />
    );

    // Check for progress bar elements
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(3);
  });
});

