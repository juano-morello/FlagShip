/**
 * EnvironmentsList Storybook Stories
 *
 * TDD: Stories written FIRST before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { EnvironmentsList } from './environments-list';
import type { Environment } from '@/types/flagship';

const meta = {
  title: 'FlagShip/EnvironmentsList',
  component: EnvironmentsList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EnvironmentsList>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    name: 'Staging',
    type: 'staging',
    apiKeyPrefix: 'stg_xyz789',
    featuresEnabled: 8,
    featuresTotal: 10,
    limitsWarning: 1,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'env-3',
    name: 'Production',
    type: 'production',
    apiKeyPrefix: 'prod_def456',
    featuresEnabled: 10,
    featuresTotal: 10,
    limitsWarning: 3,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

export const Default: Story = {
  args: {
    environments: mockEnvironments,
    isLoading: false,
    onEdit: (env) => console.log('Edit:', env),
    onDelete: (env) => console.log('Delete:', env),
  },
};

export const Loading: Story = {
  args: {
    environments: [],
    isLoading: true,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    environments: [],
    isLoading: false,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const SingleEnvironment: Story = {
  args: {
    environments: [mockEnvironments[0]],
    isLoading: false,
    onEdit: (env) => console.log('Edit:', env),
    onDelete: (env) => console.log('Delete:', env),
  },
};

export const WithWarnings: Story = {
  args: {
    environments: mockEnvironments.filter(env => env.limitsWarning > 0),
    isLoading: false,
    onEdit: (env) => console.log('Edit:', env),
    onDelete: (env) => console.log('Delete:', env),
  },
};

