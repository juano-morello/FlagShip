/**
 * FeatureForm Component Tests
 * TDD: Written BEFORE implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureForm } from './feature-form';
import type { FeatureWithRules } from '@/types/flagship';

describe('FeatureForm', () => {
  const mockFeature: FeatureWithRules = {
    id: 'feature-1',
    key: 'billing_v2',
    name: 'Billing V2',
    description: 'New billing system',
    type: 'plan',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    rules: [],
    planEntitlements: ['pro'],
  };

  it('renders form fields with feature data', () => {
    render(<FeatureForm feature={mockFeature} onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/name/i)).toHaveValue('Billing V2');
    expect(screen.getByLabelText(/description/i)).toHaveValue('New billing system');
  });

  it('shows feature key as read-only', () => {
    render(<FeatureForm feature={mockFeature} onSubmit={vi.fn()} />);
    
    // Key should be displayed but not editable
    expect(screen.getByText(/billing_v2/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/key/i)).not.toBeInTheDocument();
  });

  it('validates required name field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeatureForm feature={mockFeature} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);

    // Try to submit the form to trigger validation
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Form should not have been submitted
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with updated data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeatureForm feature={mockFeature} onSubmit={onSubmit} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Updated Name',
        description: 'New billing system',
      });
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<FeatureForm feature={mockFeature} onSubmit={onSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
  });

  it('shows cancel button', () => {
    const onCancel = vi.fn();
    render(<FeatureForm feature={mockFeature} onSubmit={vi.fn()} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<FeatureForm feature={mockFeature} onSubmit={vi.fn()} onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('allows editing description', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FeatureForm feature={mockFeature} onSubmit={onSubmit} />);
    
    const descInput = screen.getByLabelText(/description/i);
    await user.clear(descInput);
    await user.type(descInput, 'Updated description');
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Updated description',
        })
      );
    });
  });

  it('handles feature without description', () => {
    const featureNoDesc: FeatureWithRules = {
      ...mockFeature,
      description: null,
    };
    
    render(<FeatureForm feature={featureNoDesc} onSubmit={vi.fn()} />);
    
    const descInput = screen.getByLabelText(/description/i);
    expect(descInput).toHaveValue('');
  });
});

