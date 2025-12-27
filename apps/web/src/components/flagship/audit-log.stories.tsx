/**
 * Storybook Stories for AuditLog Component
 *
 * TDD: Stories written FIRST before implementation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AuditLog } from './audit-log';
import type { AuditEvent } from '@/types/flagship';

const meta: Meta<typeof AuditLog> = {
  title: 'FlagShip/AuditLog',
  component: AuditLog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AuditLog>;

const mockAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    action: 'feature.created',
    actorId: 'user-1',
    actorEmail: 'admin@example.com',
    actorType: 'user',
    resourceType: 'feature',
    resourceId: 'feat-1',
    resourceName: 'Billing V2',
    changes: {
      after: { enabled: true },
    },
    metadata: null,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'audit-2',
    action: 'feature.toggled',
    actorId: 'user-2',
    actorEmail: 'dev@example.com',
    actorType: 'user',
    resourceType: 'feature',
    resourceId: 'feat-2',
    resourceName: 'AI Chat',
    changes: {
      before: { enabled: false },
      after: { enabled: true },
    },
    metadata: null,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'audit-3',
    action: 'environment.updated',
    actorId: 'user-1',
    actorEmail: 'admin@example.com',
    actorType: 'user',
    resourceType: 'environment',
    resourceId: 'env-1',
    resourceName: 'Production',
    changes: {
      before: { name: 'Prod' },
      after: { name: 'Production' },
    },
    metadata: null,
    createdAt: '2024-01-03T00:00:00Z',
  },
];

export const Default: Story = {
  args: {
    events: mockAuditEvents,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    events: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    events: [],
    isLoading: false,
  },
};

export const SingleEvent: Story = {
  args: {
    events: [mockAuditEvents[0]],
    isLoading: false,
  },
};

export const ManyEvents: Story = {
  args: {
    events: [
      ...mockAuditEvents,
      {
        id: 'audit-4',
        action: 'feature.deleted',
        actorId: 'user-3',
        actorEmail: 'manager@example.com',
        actorType: 'user',
        resourceType: 'feature',
        resourceId: 'feat-3',
        resourceName: 'Old Feature',
        changes: {
          before: { enabled: false },
        },
        metadata: null,
        createdAt: '2024-01-04T00:00:00Z',
      },
      {
        id: 'audit-5',
        action: 'plan.created',
        actorId: 'user-1',
        actorEmail: 'admin@example.com',
        actorType: 'user',
        resourceType: 'plan',
        resourceId: 'plan-1',
        resourceName: 'Enterprise',
        changes: {
          after: { maxFeatures: 100 },
        },
        metadata: null,
        createdAt: '2024-01-05T00:00:00Z',
      },
    ],
    isLoading: false,
  },
};

