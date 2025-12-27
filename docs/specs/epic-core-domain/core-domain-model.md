# Core Domain Model

**Epic:** Core Domain Model  
**Priority:** P0 (Foundation)  
**Depends on:** ForgeStack Base  
**Status:** Draft

---

## Overview

FlagShip's core domain model extends ForgeStack's existing schema to support a control plane for SaaS products. This epic defines the database schema for the fundamental entities that power feature flag evaluation, usage limit enforcement, and permission management.

### Key Components
- **Environment** - Scoped contexts (dev/staging/prod) within projects
- **Feature** - Feature flag definitions with evaluation rules
- **Plan** - Subscription tiers with feature entitlements and limits
- **UsageMetric** - Usage data points for limit enforcement
- **AuditEvent** - Immutable log entries for compliance

### Architecture

```
ForgeStack Base Tables (Inherited):
┌───────────────────────────────────────────────────────────────────┐
│ users │ organizations │ organization_members │ projects │ roles  │
│ permissions │ role_permissions │ member_roles │ api_keys         │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
FlagShip Domain Tables (New):
┌───────────────────────────────────────────────────────────────────┐
│ environments │ features │ feature_rules │ plans │ plan_features  │
│ usage_metrics │ usage_limits │ evaluation_logs │ audit_events    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Database Schema
- [ ] `environments` table with columns: id, project_id, name (dev|staging|prod), settings, created_at, updated_at
- [ ] `features` table with columns: id, organization_id, key, name, description, type (boolean|percentage|plan), default_value, created_at, updated_at
- [ ] `feature_rules` table for environment-specific feature overrides
- [ ] `plans` table extending ForgeStack's existing plans table with feature entitlements
- [ ] `plan_features` junction table linking plans to features with enabled status
- [ ] `usage_metrics` table for tracking usage data points
- [ ] `usage_limits` table defining per-plan limits
- [ ] `evaluation_logs` table for debugging and analytics (optional, could be external)
- [ ] All tables have proper indexes for query performance
- [ ] All tables support RLS policies for multi-tenancy

### Relationships
- [ ] Environments belong to Projects (many-to-one)
- [ ] Features belong to Organizations (many-to-one)
- [ ] Feature rules link Features to Environments (many-to-many)
- [ ] Plans have many Features through plan_features
- [ ] UsageMetrics belong to Organizations and reference specific limits

### Drizzle Schema
- [ ] Schema files created in `packages/db/src/schema/flagship/`
- [ ] Schema exports added to `packages/db/src/schema/index.ts`
- [ ] Migration generated with `drizzle-kit generate`

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Environment Schema
- [ ] Create `packages/db/src/schema/flagship/environments.ts`
- [ ] Define environment type enum (dev, staging, prod)
- [ ] Add foreign key to projects table
- [ ] Add unique constraint on (project_id, name)
- [ ] Add RLS policy for org-scoped access

#### 1.2 Features Schema
- [ ] Create `packages/db/src/schema/flagship/features.ts`
- [ ] Define feature type enum (boolean, percentage, plan)
- [ ] Add indexes on organization_id and key
- [ ] Add unique constraint on (organization_id, key)

#### 1.3 Feature Rules Schema
- [ ] Create `packages/db/src/schema/flagship/feature-rules.ts`
- [ ] Link features to environments with overrides
- [ ] Support percentage rollout configurations

#### 1.4 Plans Extension
- [ ] Extend ForgeStack's `plans` table or create `plan_features` junction
- [ ] Define feature entitlements per plan

#### 1.5 Usage Metrics Schema
- [ ] Create `packages/db/src/schema/flagship/usage-metrics.ts`
- [ ] Support different metric types (api_calls, storage, seats, custom)
- [ ] Add timestamp-based partitioning considerations

#### 1.6 Audit Events Schema
- [ ] Create `packages/db/src/schema/flagship/evaluation-audit.ts`
- [ ] Immutable append-only design
- [ ] Include actor, action, resource, timestamp, metadata

### 2. Migration Tasks

#### 2.1 Generate Migrations
- [ ] Run `drizzle-kit generate --name=flagship_core_domain`
- [ ] Review generated SQL for correctness
- [ ] Test migration on local database

---

## Test Plan

### Unit Tests
- [ ] Schema validation tests for each table
- [ ] Relationship integrity tests
- [ ] Enum validation tests

### Integration Tests
- [ ] Create environment linked to project
- [ ] Create feature with rules
- [ ] Query features by organization
- [ ] RLS policy enforcement tests

---

## API Reference

This epic is data-layer only. API endpoints are defined in subsequent epics (Epic 5: Evaluation API).

---

## ForgeStack Integration

### Leveraged ForgeStack Components
| Component | Usage |
|-----------|-------|
| `packages/db` | Extend existing Drizzle schema and migration infrastructure |
| `users` table | Actor references in audit events |
| `organizations` table | Org-scoped features and usage |
| `projects` table | Parent for environments |
| `plans` table | Extended with feature entitlements |
| RLS infrastructure | Apply `withTenantContext` pattern |

### New vs Extended
| Table | Action |
|-------|--------|
| `environments` | **New** - FlagShip-specific |
| `features` | **New** - FlagShip-specific (different from ForgeStack's feature_flags) |
| `feature_rules` | **New** - FlagShip-specific |
| `plan_features` | **New** - Junction for plan entitlements |
| `usage_metrics` | **New** - Different from ForgeStack's usage_records |
| `plans` | **Extend** - Add FlagShip-specific columns or use existing |

---

## Migration Notes

- This epic creates new tables only; no modifications to existing ForgeStack tables
- FlagShip tables are prefixed/namespaced in `flagship/` schema directory
- Existing ForgeStack `feature_flags` table is for internal use; FlagShip's `features` is for customer-facing control plane

