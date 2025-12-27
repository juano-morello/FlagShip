import { pgTable, uuid, boolean, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { plans } from '../plans';
import { flagshipFeatures } from './features';

/**
 * Plan features table - links plans to features
 * Defines which features are available for each plan with optional configuration
 */
export const flagshipPlanFeatures = pgTable(
  'flagship_plan_features',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    featureId: uuid('feature_id')
      .notNull()
      .references(() => flagshipFeatures.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(true),
    config: jsonb('config'), // Optional plan-specific feature configuration
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planIdIdx: index('idx_flagship_plan_features_plan_id').on(table.planId),
    featureIdIdx: index('idx_flagship_plan_features_feature_id').on(table.featureId),
    planFeatureUnique: unique('uq_flagship_plan_features_plan_feature').on(table.planId, table.featureId),
  })
);

/**
 * Plan features relations
 */
export const flagshipPlanFeaturesRelations = relations(flagshipPlanFeatures, ({ one }) => ({
  plan: one(plans, {
    fields: [flagshipPlanFeatures.planId],
    references: [plans.id],
  }),
  feature: one(flagshipFeatures, {
    fields: [flagshipPlanFeatures.featureId],
    references: [flagshipFeatures.id],
  }),
}));

// Type exports
export type FlagshipPlanFeature = typeof flagshipPlanFeatures.$inferSelect;
export type NewFlagshipPlanFeature = typeof flagshipPlanFeatures.$inferInsert;

