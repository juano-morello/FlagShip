/**
 * FeatureDetail Component Tests
 * TDD: Written BEFORE implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureDetail } from './feature-detail';
import type { FeatureWithRules } from '@/types/flagship';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('FeatureDetail', () => {
  const mockFeature: FeatureWithRules = {
    id: 'feature-1',
    key: 'billing_v2',
    name: 'Billing V2',
    description: 'New billing system with Stripe',
    type: 'plan',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    rules: [
      {
        id: 'rule-1',
        featureId: 'feature-1',
        environmentId: 'env-1',
        environmentName: 'Development',
        enabled: true,
        override: 'force_on',
        percentage: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'rule-2',
        featureId: 'feature-1',
        environmentId: 'env-2',
        environmentName: 'Production',
        enabled: false,
        override: 'default',
        percentage: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    planEntitlements: ['pro', 'enterprise'],
  };

  it('renders feature name and key', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('Billing V2')).toBeInTheDocument();
    expect(screen.getByText(/billing_v2/i)).toBeInTheDocument();
  });

  it('renders feature description', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('New billing system with Stripe')).toBeInTheDocument();
  });

  it('displays feature type badge', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('Plan')).toBeInTheDocument();
  });

  it('shows enabled status', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    // Should show enabled switch or indicator
    const enabledElement = screen.getByRole('switch', { name: /enabled/i });
    expect(enabledElement).toBeChecked();
  });

  it('displays environment rules table', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('shows plan entitlements for plan type features', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);

    // Use getAllByText to handle multiple matches and check for the badge specifically
    const proBadges = screen.getAllByText(/^pro$/i);
    expect(proBadges.length).toBeGreaterThan(0);

    expect(screen.getByText(/^enterprise$/i)).toBeInTheDocument();
  });

  it('does not show plan entitlements for non-plan features', () => {
    const booleanFeature: FeatureWithRules = {
      ...mockFeature,
      type: 'boolean',
      planEntitlements: [],
    };
    
    render(<FeatureDetail feature={booleanFeature} onUpdate={vi.fn()} />);
    
    // Plan entitlements section should not be visible
    expect(screen.queryByText(/plan entitlements/i)).not.toBeInTheDocument();
  });

  it('has back to features button', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} />);
    
    const backButton = screen.getByRole('link', { name: /back to features/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/flagship/features');
  });

  it('displays edit form when in edit mode', () => {
    render(<FeatureDetail feature={mockFeature} onUpdate={vi.fn()} isEditing />);
    
    // Should show form inputs
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });
});

