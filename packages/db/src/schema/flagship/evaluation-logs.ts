import { pgTable, uuid, text, boolean, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { environments } from './environments';
import { organizations } from '../organizations';

/**
 * FlagShip Evaluation Logs table - records feature flag evaluations for analytics/debugging
 *
 * NOTE: This table may grow very large in production environments.
 * Consider implementing:
 * - Time-based partitioning (e.g., monthly partitions on createdAt)
 * - Automatic partition management with pg_partman
 * - Retention policies to archive/delete old data
 * - Consider using TimescaleDB for time-series optimizations
 *
 * Example partition setup:
 * CREATE TABLE flagship_evaluation_logs (...) PARTITION BY RANGE (created_at);
 * CREATE TABLE flagship_evaluation_logs_2024_01 PARTITION OF flagship_evaluation_logs
 *   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
 */
export const flagshipEvaluationLogs = pgTable(
  'flagship_evaluation_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(), // The feature being evaluated
    requestId: text('request_id').notNull(), // Correlation ID for the request
    evaluationResult: boolean('evaluation_result').notNull(), // The result returned
    evaluationReason: text('evaluation_reason').notNull(), // 'default', 'override', 'percentage', 'plan_gate', 'disabled', 'error'
    matchedRuleId: uuid('matched_rule_id'), // Nullable - the rule that matched
    context: jsonb('context'), // Evaluation context provided
    latencyMs: integer('latency_ms').notNull(), // Evaluation latency in milliseconds
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Individual column indexes for filtering
    environmentIdIdx: index('idx_flagship_evaluation_logs_environment_id').on(table.environmentId),
    orgIdIdx: index('idx_flagship_evaluation_logs_org_id').on(table.orgId),
    featureKeyIdx: index('idx_flagship_evaluation_logs_feature_key').on(table.featureKey),
    requestIdIdx: index('idx_flagship_evaluation_logs_request_id').on(table.requestId),
    createdAtIdx: index('idx_flagship_evaluation_logs_created_at').on(table.createdAt),
    // Composite index for common analytics queries (e.g., feature usage over time per environment)
    envFeatureCreatedIdx: index('idx_flagship_evaluation_logs_env_feature_created').on(
      table.environmentId,
      table.featureKey,
      table.createdAt
    ),
  })
);

/**
 * Evaluation logs relations
 */
export const flagshipEvaluationLogsRelations = relations(flagshipEvaluationLogs, ({ one }) => ({
  environment: one(environments, {
    fields: [flagshipEvaluationLogs.environmentId],
    references: [environments.id],
  }),
  organization: one(organizations, {
    fields: [flagshipEvaluationLogs.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type FlagshipEvaluationLog = typeof flagshipEvaluationLogs.$inferSelect;
export type NewFlagshipEvaluationLog = typeof flagshipEvaluationLogs.$inferInsert;

