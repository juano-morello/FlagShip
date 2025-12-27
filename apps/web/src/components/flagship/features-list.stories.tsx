/**
 * FeaturesList Storybook Stories
 *
 * TDD: Stories written FIRST before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FeaturesList } from './features-list';
import type { Feature } from '@/types/flagship';

const meta = {
  title: 'FlagShip/FeaturesList',
  component: FeaturesList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturesList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockFeatures: Feature[] = [
  {
    id: 'feat-1',
    key: 'billing_v2',
    name: 'Billing V2',
    description: 'New billing system with Stripe',
    type: 'plan',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'feat-2',
    key: 'ai_chat',
    name: 'AI Chat',
    description: 'AI-powered chat feature',
    type: 'percentage',
    enabled: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'feat-3',
    key: 'dark_mode',
    name: 'Dark Mode',
    description: 'Dark theme support',
    type: 'boolean',
    enabled: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

export const Default: Story = {
  args: {
    features: mockFeatures,
    isLoading: false,
    onEdit: (feature) => console.log('Edit:', feature),
    onDelete: (feature) => console.log('Delete:', feature),
    onToggle: (feature, enabled) => console.log('Toggle:', feature.key, enabled),
  },
};

export const Loading: Story = {
  args: {
    features: [],
    isLoading: true,
    onEdit: () => {},
    onDelete: () => {},
    onToggle: () => Promise.resolve({} as Feature),
  },
};

export const Empty: Story = {
  args: {
    features: [],
    isLoading: false,
    onEdit: () => {},
    onDelete: () => {},
    onToggle: () => Promise.resolve({} as Feature),
  },
};

export const WithSearch: Story = {
  args: {
    features: mockFeatures,
    isLoading: false,
    onEdit: (feature) => console.log('Edit:', feature),
    onDelete: (feature) => console.log('Delete:', feature),
    onToggle: (feature, enabled) => console.log('Toggle:', feature.key, enabled),
  },
};

export const ManyFeatures: Story = {
  args: {
    features: [
      ...mockFeatures,
      {
        id: 'feat-4',
        key: 'api_v3',
        name: 'API Version 3',
        description: 'New API version',
        type: 'plan',
        enabled: false,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
      },
      {
        id: 'feat-5',
        key: 'webhooks',
        name: 'Webhooks',
        description: 'Webhook support',
        type: 'boolean',
        enabled: true,
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z',
      },
    ],
    isLoading: false,
    onEdit: (feature) => console.log('Edit:', feature),
    onDelete: (feature) => console.log('Delete:', feature),
    onToggle: (feature, enabled) => console.log('Toggle:', feature.key, enabled),
  },
};

