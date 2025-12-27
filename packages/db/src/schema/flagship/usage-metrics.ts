import { pgTable, uuid, text, bigint, integer, timestamp, index, unique, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../organizations';
import { environments } from './environments';
import { plans } from '../plans';

/**
 * Limit type enum for FlagShip usage limits
 */
export const limitTypeEnum = pgEnum('limit_type', ['count', 'storage_bytes', 'seats', 'custom']);

/**
 * Period type enum for FlagShip usage periods
 */
export const periodTypeEnum = pgEnum('period_type', ['minute', 'hour', 'day', 'month', 'billing_period']);

/**
 * Limit enforcement enum for FlagShip usage limits
 */
export const limitEnforcementEnum = pgEnum('limit_enforcement', ['hard', 'soft']);

/**
 * FlagShip Usage Metrics table - tracking current usage per environment
 * Tracks API calls, storage, seats, and custom metrics for billing purposes
 */
export const flagshipUsageMetrics = pgTable(
  'flagship_usage_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    metricKey: text('metric_key').notNull(), // e.g., 'api_calls', 'storage_bytes', 'seats'
    currentValue: bigint('current_value', { mode: 'number' }).notNull().default(0),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    environmentIdIdx: index('idx_flagship_usage_metrics_environment_id').on(table.environmentId),
    orgIdIdx: index('idx_flagship_usage_metrics_org_id').on(table.orgId),
    metricKeyIdx: index('idx_flagship_usage_metrics_metric_key').on(table.metricKey),
    envOrgMetricPeriodUnique: unique('uq_flagship_usage_metrics_env_org_metric_period').on(
      table.environmentId,
      table.orgId,
      table.metricKey,
      table.periodStart
    ),
  })
);

/**
 * FlagShip Usage Limits table - limit definitions per environment
 * Defines limits for metrics with optional plan-based configuration
 */
export const flagshipUsageLimits = pgTable(
  'flagship_usage_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    metricKey: text('metric_key').notNull(), // matches usage metrics
    limitType: limitTypeEnum('limit_type').notNull(),
    limitValue: bigint('limit_value', { mode: 'number' }).notNull(),
    periodType: periodTypeEnum('period_type').notNull(),
    enforcement: limitEnforcementEnum('enforcement').notNull().default('hard'),
    warningThreshold: integer('warning_threshold'), // percentage 0-100 for soft limit warnings
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    environmentIdIdx: index('idx_flagship_usage_limits_environment_id').on(table.environmentId),
    planIdIdx: index('idx_flagship_usage_limits_plan_id').on(table.planId),
    metricKeyIdx: index('idx_flagship_usage_limits_metric_key').on(table.metricKey),
    // Unique constraint: (environmentId, planId, metricKey) - handles both with and without planId
    envPlanMetricUnique: unique('uq_flagship_usage_limits_env_plan_metric').on(
      table.environmentId,
      table.planId,
      table.metricKey
    ),
  })
);

/**
 * FlagShip Usage Metrics relations
 */
export const flagshipUsageMetricsRelations = relations(flagshipUsageMetrics, ({ one }) => ({
  environment: one(environments, {
    fields: [flagshipUsageMetrics.environmentId],
    references: [environments.id],
  }),
  organization: one(organizations, {
    fields: [flagshipUsageMetrics.orgId],
    references: [organizations.id],
  }),
}));

/**
 * FlagShip Usage Limits relations
 */
export const flagshipUsageLimitsRelations = relations(flagshipUsageLimits, ({ one }) => ({
  environment: one(environments, {
    fields: [flagshipUsageLimits.environmentId],
    references: [environments.id],
  }),
  plan: one(plans, {
    fields: [flagshipUsageLimits.planId],
    references: [plans.id],
  }),
}));

// Type exports
export type FlagshipUsageMetric = typeof flagshipUsageMetrics.$inferSelect;
export type NewFlagshipUsageMetric = typeof flagshipUsageMetrics.$inferInsert;
export type FlagshipUsageLimit = typeof flagshipUsageLimits.$inferSelect;
export type NewFlagshipUsageLimit = typeof flagshipUsageLimits.$inferInsert;

// Enum value types
export type LimitType = (typeof limitTypeEnum.enumValues)[number];
export type PeriodType = (typeof periodTypeEnum.enumValues)[number];
export type LimitEnforcement = (typeof limitEnforcementEnum.enumValues)[number];

