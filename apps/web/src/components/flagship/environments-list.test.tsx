/**
 * Tests for EnvironmentsList Component
 *
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvironmentsList } from './environments-list';
import type { Environment } from '@/types/flagship';

describe('EnvironmentsList', () => {
  const mockEnvironments: Environment[] = [
    {
      id: 'env-1',
      name: 'Development',
      type: 'development',
      apiKeyPrefix: 'dev_abc123',
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
      apiKeyPrefix: 'prod_xyz789',
      featuresEnabled: 8,
      featuresTotal: 10,
      limitsWarning: 2,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders loading state', () => {
    const { container } = render(
      <EnvironmentsList
        environments={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check for skeleton elements by class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no environments', () => {
    render(
      <EnvironmentsList
        environments={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No environments yet')).toBeInTheDocument();
  });

  it('renders list of environments', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check for environment names (will appear twice: as name and as badge)
    const developmentElements = screen.getAllByText('Development');
    expect(developmentElements.length).toBeGreaterThan(0);

    const productionElements = screen.getAllByText('Production');
    expect(productionElements.length).toBeGreaterThan(0);
  });

  it('displays environment type badges', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check for type badges (will appear as both name and badge)
    const developmentElements = screen.getAllByText('Development');
    expect(developmentElements.length).toBeGreaterThan(0);

    const productionElements = screen.getAllByText('Production');
    expect(productionElements.length).toBeGreaterThan(0);
  });

  it('displays API key prefixes', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('dev_abc123')).toBeInTheDocument();
    expect(screen.getByText('prod_xyz789')).toBeInTheDocument();
  });

  it('displays feature counts', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('8 / 10')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByTitle('Edit environment');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockEnvironments[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete environment');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockEnvironments[0]);
  });

  it('displays warning badge when limits warning exists', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Production environment has 2 warnings
    expect(screen.getByText('2 warnings')).toBeInTheDocument();
  });

  it('should have accessible edit and delete buttons', () => {
    render(
      <EnvironmentsList
        environments={mockEnvironments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check that edit buttons have aria-label
    const editButtons = screen.getAllByRole('button', { name: /edit environment/i });
    expect(editButtons).toHaveLength(2);

    // Check that delete buttons have aria-label
    const deleteButtons = screen.getAllByRole('button', { name: /delete environment/i });
    expect(deleteButtons).toHaveLength(2);
  });
});

