/**
 * FeatureDetail Storybook Stories
 * TDD: Written BEFORE implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FeatureDetail } from './feature-detail';
import type { FeatureWithRules } from '@/types/flagship';

const meta: Meta<typeof FeatureDetail> = {
  title: 'FlagShip/FeatureDetail',
  component: FeatureDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FeatureDetail>;

const mockBooleanFeature: FeatureWithRules = {
  id: 'feature-1',
  key: 'dark_mode',
  name: 'Dark Mode',
  description: 'Enable dark mode toggle for users',
  type: 'boolean',
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
      environmentName: 'Staging',
      enabled: true,
      override: 'default',
      percentage: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'rule-3',
      featureId: 'feature-1',
      environmentId: 'env-3',
      environmentName: 'Production',
      enabled: false,
      override: 'default',
      percentage: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  planEntitlements: [],
};

const mockPlanFeature: FeatureWithRules = {
  id: 'feature-2',
  key: 'billing_v2',
  name: 'Billing V2',
  description: 'New billing system with Stripe integration',
  type: 'plan',
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [
    {
      id: 'rule-4',
      featureId: 'feature-2',
      environmentId: 'env-1',
      environmentName: 'Development',
      enabled: true,
      override: 'force_on',
      percentage: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  planEntitlements: ['pro', 'enterprise'],
};

const mockPercentageFeature: FeatureWithRules = {
  id: 'feature-3',
  key: 'ai_chat',
  name: 'AI Chat',
  description: 'AI-powered chat assistant',
  type: 'percentage',
  enabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  rules: [
    {
      id: 'rule-5',
      featureId: 'feature-3',
      environmentId: 'env-3',
      environmentName: 'Production',
      enabled: true,
      override: 'default',
      percentage: 50,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  planEntitlements: [],
};

export const BooleanFeature: Story = {
  args: {
    feature: mockBooleanFeature,
    onUpdate: async (data) => {
      console.log('Update feature:', data);
    },
  },
};

export const PlanFeature: Story = {
  args: {
    feature: mockPlanFeature,
    onUpdate: async (data) => {
      console.log('Update feature:', data);
    },
  },
};

export const PercentageFeature: Story = {
  args: {
    feature: mockPercentageFeature,
    onUpdate: async (data) => {
      console.log('Update feature:', data);
    },
  },
};

export const DisabledFeature: Story = {
  args: {
    feature: {
      ...mockBooleanFeature,
      enabled: false,
    },
    onUpdate: async (data) => {
      console.log('Update feature:', data);
    },
  },
};

export const NoDescription: Story = {
  args: {
    feature: {
      ...mockBooleanFeature,
      description: null,
    },
    onUpdate: async (data) => {
      console.log('Update feature:', data);
    },
  },
};

