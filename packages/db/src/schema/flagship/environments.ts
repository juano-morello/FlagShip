import { pgTable, uuid, text, timestamp, boolean, jsonb, index, unique, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from '../projects';

/**
 * Environment type enum for FlagShip environments
 */
export const environmentTypeEnum = pgEnum('environment_type', ['development', 'staging', 'production']);

/**
 * Environments table - project-scoped environments for feature flag evaluation
 * Each project can have multiple environments (dev, staging, production)
 */
export const environments = pgTable(
  'environments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g., "Production", "Staging", "Development"
    type: environmentTypeEnum('type').notNull(),
    apiKeyPrefix: text('api_key_prefix').notNull(), // e.g., "fsk_prod_", "fsk_staging_"
    isDefault: boolean('is_default').notNull().default(false),
    settings: jsonb('settings'), // Environment-specific configuration
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index('idx_environments_project_id').on(table.projectId),
    projectTypeUnique: unique('uq_environments_project_type').on(table.projectId, table.type),
  })
);

/**
 * Environment relations
 */
export const environmentsRelations = relations(environments, ({ one }) => ({
  project: one(projects, {
    fields: [environments.projectId],
    references: [projects.id],
  }),
}));

// Type exports
export type Environment = typeof environments.$inferSelect;
export type NewEnvironment = typeof environments.$inferInsert;

