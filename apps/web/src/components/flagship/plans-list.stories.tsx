/**
 * PlansList Storybook Stories
 *
 * TDD: Stories written FIRST before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PlansList } from './plans-list';
import type { Plan } from '@/types/flagship';

const meta = {
  title: 'FlagShip/PlansList',
  component: PlansList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlansList>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    active: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'plan-3',
    name: 'enterprise',
    displayName: 'Enterprise Plan',
    description: 'For large organizations',
    price: 99,
    currency: 'USD',
    features: ['feat-1', 'feat-2', 'feat-3', 'feat-4'],
    limits: { users: 500, projects: 100 },
    active: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

export const Default: Story = {
  args: {
    plans: mockPlans,
    isLoading: false,
    onEdit: (plan) => console.log('Edit:', plan),
    onDelete: (plan) => console.log('Delete:', plan),
  },
};

export const Loading: Story = {
  args: {
    plans: [],
    isLoading: true,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    plans: [],
    isLoading: false,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const SinglePlan: Story = {
  args: {
    plans: [mockPlans[0]],
    isLoading: false,
    onEdit: (plan) => console.log('Edit:', plan),
    onDelete: (plan) => console.log('Delete:', plan),
  },
};

export const WithInactivePlans: Story = {
  args: {
    plans: mockPlans,
    isLoading: false,
    onEdit: (plan) => console.log('Edit:', plan),
    onDelete: (plan) => console.log('Delete:', plan),
  },
};

