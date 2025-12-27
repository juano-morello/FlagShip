import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, index, unique, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from '../projects';
import { environments } from './environments';

/**
 * Feature type enum for FlagShip features
 */
export const featureTypeEnum = pgEnum('feature_type', ['boolean', 'percentage', 'plan']);

/**
 * FlagShip Features table - project-scoped feature definitions
 * These are distinct from ForgeStack's featureFlags (global platform flags)
 */
export const flagshipFeatures = pgTable(
  'flagship_features',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(), // e.g., "advanced-analytics" (unique within project)
    name: text('name').notNull(), // Display name
    description: text('description'),
    type: featureTypeEnum('type').notNull().default('boolean'),
    defaultValue: boolean('default_value').notNull().default(false), // Used when no rules match
    enabled: boolean('enabled').notNull().default(true), // Master kill switch
    metadata: jsonb('metadata'), // Optional additional data
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index('idx_flagship_features_project_id').on(table.projectId),
    keyIdx: index('idx_flagship_features_key').on(table.key),
    enabledIdx: index('idx_flagship_features_enabled').on(table.enabled),
    projectKeyUnique: unique('uq_flagship_features_project_key').on(table.projectId, table.key),
  })
);

/**
 * FlagShip Feature Rules table - environment-specific rules for features
 * Rules determine feature behavior per environment
 */
export const flagshipFeatureRules = pgTable(
  'flagship_feature_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    featureId: uuid('feature_id')
      .notNull()
      .references(() => flagshipFeatures.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    ruleType: text('rule_type').notNull(), // 'override', 'percentage', 'plan_gate'
    value: jsonb('value').notNull(), // { enabled: true } or { percentage: 50 } or { plans: ['pro', 'enterprise'] }
    priority: integer('priority').notNull().default(0), // Higher = evaluated first
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    featureIdIdx: index('idx_flagship_feature_rules_feature_id').on(table.featureId),
    environmentIdIdx: index('idx_flagship_feature_rules_environment_id').on(table.environmentId),
    priorityIdx: index('idx_flagship_feature_rules_priority').on(table.priority),
    featureEnvRuleUnique: unique('uq_flagship_feature_rules_feature_env_type').on(
      table.featureId,
      table.environmentId,
      table.ruleType
    ),
  })
);

/**
 * FlagShip Features relations
 */
export const flagshipFeaturesRelations = relations(flagshipFeatures, ({ one, many }) => ({
  project: one(projects, {
    fields: [flagshipFeatures.projectId],
    references: [projects.id],
  }),
  rules: many(flagshipFeatureRules),
}));

/**
 * FlagShip Feature Rules relations
 */
export const flagshipFeatureRulesRelations = relations(flagshipFeatureRules, ({ one }) => ({
  feature: one(flagshipFeatures, {
    fields: [flagshipFeatureRules.featureId],
    references: [flagshipFeatures.id],
  }),
  environment: one(environments, {
    fields: [flagshipFeatureRules.environmentId],
    references: [environments.id],
  }),
}));

// Type exports
export type FlagshipFeature = typeof flagshipFeatures.$inferSelect;
export type NewFlagshipFeature = typeof flagshipFeatures.$inferInsert;
export type FlagshipFeatureRule = typeof flagshipFeatureRules.$inferSelect;
export type NewFlagshipFeatureRule = typeof flagshipFeatureRules.$inferInsert;

