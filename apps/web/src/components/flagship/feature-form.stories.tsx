/**
 * FeatureForm Storybook Stories
 * TDD: Written BEFORE implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FeatureForm } from './feature-form';
import type { FeatureWithRules } from '@/types/flagship';

const meta: Meta<typeof FeatureForm> = {
  title: 'FlagShip/FeatureForm',
  component: FeatureForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof FeatureForm>;

const mockFeature: FeatureWithRules = {
  id: 'feature-1',
  key: 'billing_v2',
  name: 'Billing V2',
  description: 'New billing system with Stripe',
  type: 'plan',
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [],
  planEntitlements: ['pro', 'enterprise'],
};

export const Default: Story = {
  args: {
    feature: mockFeature,
    onSubmit: async (data) => {
      console.log('Submit:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  },
};

export const WithCancel: Story = {
  args: {
    feature: mockFeature,
    onSubmit: async (data) => {
      console.log('Submit:', data);
    },
    onCancel: () => {
      console.log('Cancel clicked');
    },
  },
};

export const NoDescription: Story = {
  args: {
    feature: {
      ...mockFeature,
      description: null,
    },
    onSubmit: async (data) => {
      console.log('Submit:', data);
    },
  },
};

export const BooleanFeature: Story = {
  args: {
    feature: {
      ...mockFeature,
      type: 'boolean',
      planEntitlements: [],
    },
    onSubmit: async (data) => {
      console.log('Submit:', data);
    },
  },
};

export const PercentageFeature: Story = {
  args: {
    feature: {
      ...mockFeature,
      type: 'percentage',
      planEntitlements: [],
    },
    onSubmit: async (data) => {
      console.log('Submit:', data);
    },
  },
};

