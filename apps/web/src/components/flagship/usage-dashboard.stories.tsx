/**
 * UsageDashboard Storybook Stories
 *
 * TDD: Stories written FIRST before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UsageDashboard } from './usage-dashboard';
import type { UsageSummary } from '@/types/flagship';

const meta = {
  title: 'FlagShip/UsageDashboard',
  component: UsageDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UsageDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Default: Story = {
  args: {
    usage: mockUsageSummary,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    usage: null,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    usage: null,
    isLoading: false,
  },
};

export const AllHealthy: Story = {
  args: {
    usage: {
      environmentId: 'env-1',
      environmentName: 'Development',
      metrics: [
        {
          key: 'api_calls',
          name: 'API Calls',
          current: 2500,
          limit: 10000,
          percentage: 25,
          status: 'ok',
        },
        {
          key: 'features',
          name: 'Features',
          current: 3,
          limit: 10,
          percentage: 30,
          status: 'ok',
        },
      ],
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
  },
};

export const AllCritical: Story = {
  args: {
    usage: {
      environmentId: 'env-1',
      environmentName: 'Production',
      metrics: [
        {
          key: 'api_calls',
          name: 'API Calls',
          current: 10000,
          limit: 10000,
          percentage: 100,
          status: 'critical',
        },
        {
          key: 'features',
          name: 'Features',
          current: 10,
          limit: 10,
          percentage: 100,
          status: 'critical',
        },
      ],
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
  },
};

export const NoLimits: Story = {
  args: {
    usage: {
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
        {
          key: 'features',
          name: 'Features',
          current: 25,
          limit: null,
          percentage: 0,
          status: 'ok',
        },
      ],
      updatedAt: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
  },
};

