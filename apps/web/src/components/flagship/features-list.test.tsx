/**
 * Tests for FeaturesList Component
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeaturesList } from './features-list';
import type { Feature } from '@/types/flagship';

describe('FeaturesList', () => {
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
      enabled: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggle = vi.fn().mockResolvedValue({});

  it('renders loading state', () => {
    const { container } = render(
      <FeaturesList
        features={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    // Check for skeleton elements by class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no features', () => {
    render(
      <FeaturesList
        features={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('No features yet')).toBeInTheDocument();
  });

  it('renders list of features', () => {
    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Billing V2')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
    expect(screen.getByText('billing_v2')).toBeInTheDocument();
    expect(screen.getByText('ai_chat')).toBeInTheDocument();
  });

  it('displays feature descriptions', () => {
    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('New billing system')).toBeInTheDocument();
    expect(screen.getByText('AI-powered chat')).toBeInTheDocument();
  });

  it('displays feature type badges', () => {
    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Percentage')).toBeInTheDocument();
  });

  it('displays enabled/disabled status', () => {
    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    // Check for switches (enabled/disabled state)
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const editButtons = screen.getAllByTitle('Edit feature');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockFeatures[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete feature');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockFeatures[0]);
  });

  it('calls onToggle when switch is toggled', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);

    expect(mockOnToggle).toHaveBeenCalledWith(mockFeatures[0], false);
  });

  it('filters features by search query', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search features...');
    await user.type(searchInput, 'billing');

    expect(screen.getByText('Billing V2')).toBeInTheDocument();
    expect(screen.queryByText('AI Chat')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no results', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search features...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No features found matching your search')).toBeInTheDocument();
  });

  it('searches by feature key', async () => {
    const user = userEvent.setup();

    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search features...');
    await user.type(searchInput, 'ai_chat');

    expect(screen.getByText('AI Chat')).toBeInTheDocument();
    expect(screen.queryByText('Billing V2')).not.toBeInTheDocument();
  });

  it('should have accessible edit and delete buttons', () => {
    render(
      <FeaturesList
        features={mockFeatures}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
      />
    );

    // Check that edit buttons have aria-label
    const editButtons = screen.getAllByRole('button', { name: /edit feature/i });
    expect(editButtons).toHaveLength(2);

    // Check that delete buttons have aria-label
    const deleteButtons = screen.getAllByRole('button', { name: /delete feature/i });
    expect(deleteButtons).toHaveLength(2);
  });
});

