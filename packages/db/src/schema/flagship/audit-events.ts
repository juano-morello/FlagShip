import { pgTable, uuid, text, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../organizations';
import { environments } from './environments';

/**
 * Actor type enum for FlagShip audit events
 */
export const actorTypeEnum = pgEnum('actor_type', ['user', 'api_key', 'system', 'impersonation']);

/**
 * FlagShip Audit Events table - immutable append-only log of FlagShip-specific actions
 * Extends the concept from ForgeStack's audit_logs but tailored for feature flag operations
 * All records are scoped to an organization for RLS enforcement
 */
export const flagshipAuditEvents = pgTable(
  'flagship_audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentId: uuid('environment_id').references(() => environments.id, { onDelete: 'set null' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Actor information (denormalized for historical accuracy)
    actorId: text('actor_id'), // user ID or API key ID
    actorType: actorTypeEnum('actor_type').notNull(),
    actorName: text('actor_name'), // Denormalized
    actorEmail: text('actor_email'), // Denormalized
    impersonatorId: text('impersonator_id'), // If acting on behalf of someone

    // Action information
    action: text('action').notNull(), // e.g., 'feature.created', 'feature.updated', 'limit.exceeded', 'evaluation.denied'
    resourceType: text('resource_type').notNull(), // e.g., 'feature', 'feature_rule', 'usage_limit', 'usage_metric'
    resourceId: text('resource_id'),
    resourceName: text('resource_name'), // Denormalized

    // Change details
    changes: jsonb('changes'), // { before: {...}, after: {...} }
    metadata: jsonb('metadata'), // Additional context like request_id, client_ip

    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'), // Correlation ID

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('idx_flagship_audit_events_org_id').on(table.orgId),
    environmentIdIdx: index('idx_flagship_audit_events_environment_id').on(table.environmentId),
    actorIdIdx: index('idx_flagship_audit_events_actor_id').on(table.actorId),
    actionIdx: index('idx_flagship_audit_events_action').on(table.action),
    resourceTypeIdx: index('idx_flagship_audit_events_resource_type').on(table.resourceType),
    resourceIdIdx: index('idx_flagship_audit_events_resource_id').on(table.resourceId),
    createdAtIdx: index('idx_flagship_audit_events_created_at').on(table.createdAt),
    // Composite index for common queries
    orgCreatedIdx: index('idx_flagship_audit_events_org_created').on(table.orgId, table.createdAt),
  })
);

/**
 * FlagShip Audit Events relations
 */
export const flagshipAuditEventsRelations = relations(flagshipAuditEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [flagshipAuditEvents.orgId],
    references: [organizations.id],
  }),
  environment: one(environments, {
    fields: [flagshipAuditEvents.environmentId],
    references: [environments.id],
  }),
}));

// Type exports
export type FlagshipAuditEvent = typeof flagshipAuditEvents.$inferSelect;
export type NewFlagshipAuditEvent = typeof flagshipAuditEvents.$inferInsert;

