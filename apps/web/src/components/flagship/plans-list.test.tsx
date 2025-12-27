/**
 * Tests for PlansList Component
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlansList } from './plans-list';
import type { Plan } from '@/types/flagship';

describe('PlansList', () => {
  const mockPlans: Plan[] = [
    {
      id: 'plan-1',
      name: 'free',
      displayName: 'Free Plan',
      description: 'Perfect for getting started',
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
      description: 'For growing teams',
      price: 29,
      currency: 'USD',
      features: ['feat-1', 'feat-2', 'feat-3'],
      limits: { users: 50, projects: 10 },
      active: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders loading state', () => {
    const { container } = render(
      <PlansList
        plans={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check for skeleton elements by class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no plans', () => {
    render(
      <PlansList
        plans={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No plans yet')).toBeInTheDocument();
  });

  it('renders list of plans', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });

  it('displays plan descriptions', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Perfect for getting started')).toBeInTheDocument();
    expect(screen.getByText('For growing teams')).toBeInTheDocument();
  });

  it('displays plan prices', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
  });

  it('displays feature and limit counts', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('2 features')).toBeInTheDocument();
    expect(screen.getByText('3 features')).toBeInTheDocument();

    // Both plans have 2 limits, so use getAllByText
    const limitsElements = screen.getAllByText('2 limits');
    expect(limitsElements.length).toBe(2);
  });

  it('displays active/inactive status badges', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByTitle('Edit plan');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockPlans[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete plan');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockPlans[0]);
  });

  it('should have accessible edit and delete buttons', () => {
    render(
      <PlansList
        plans={mockPlans}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check that edit buttons have aria-label
    const editButtons = screen.getAllByRole('button', { name: /edit plan/i });
    expect(editButtons).toHaveLength(2);

    // Check that delete buttons have aria-label
    const deleteButtons = screen.getAllByRole('button', { name: /delete plan/i });
    expect(deleteButtons).toHaveLength(2);
  });
});

