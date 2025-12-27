# Feature Flags

**Epic:** Feature Flags  
**Priority:** P0 (Core Product)  
**Depends on:** Epic 1 (Core Domain Model), Epic 2 (Multi-Tenant Foundation)  
**Status:** Draft

---

## Overview

FlagShip's feature flag system enables SaaS backends to gate features based on plan entitlements, percentage rollouts, and explicit overrides. Unlike ForgeStack's internal feature flags, FlagShip's system is **customer-facing** - it's the product that customers integrate with.

### Key Components
- **Feature Definitions** - Named flags with default values
- **Plan Entitlements** - Features included per subscription tier
- **Percentage Rollouts** - Gradual feature activation
- **Environment Overrides** - Per-environment configurations
- **Evaluation Logic** - Deterministic flag resolution

### Architecture

```
Feature Evaluation Flow:
┌────────────────────────────────────────────────────────────────┐
│                     POST /v1/evaluate                           │
│              { features: ['billing_v2', 'ai_chat'] }           │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    1. Load Features                             │
│         Query features by key for organization                  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│               2. Check Environment Override                     │
│      If feature_rules has override for this env, use it        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│               3. Check Plan Entitlement                         │
│     If feature type is 'plan', check org's subscription        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              4. Apply Percentage Rollout                        │
│    If type is 'percentage', hash(org_id + feature) % 100       │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  5. Return Result                               │
│           { billing_v2: true, ai_chat: false }                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Feature Definitions
- [ ] Features can be created, updated, deleted via API
- [ ] Feature types: `boolean`, `percentage`, `plan`
- [ ] Features have unique keys per organization
- [ ] Features have human-readable names and descriptions

### Plan Entitlements
- [ ] Plans have associated feature lists
- [ ] `plan_features` junction table with enabled status
- [ ] Feature check returns true if plan includes feature
- [ ] Fail-closed: if plan unknown, feature is disabled

### Percentage Rollouts
- [ ] Percentage stored as integer 0-100
- [ ] Deterministic hashing: same org always gets same result
- [ ] Hash function: `murmurhash(org_id + feature_key) % 100`
- [ ] Value updates apply immediately (no caching delay)

### Environment Overrides
- [ ] Override can force-enable or force-disable a feature
- [ ] Override priority: override > plan entitlement > default
- [ ] Overrides are environment-specific

### Evaluation Logic
- [ ] Single feature evaluation
- [ ] Bulk feature evaluation (multiple features in one call)
- [ ] Return both value and reason (for debugging)
- [ ] Fail-open for non-critical flags (configurable)

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Feature CRUD Service
- [ ] Create `apps/api/src/flagship/features/features.service.ts`
- [ ] Implement createFeature, updateFeature, deleteFeature
- [ ] Implement listFeatures with pagination

#### 1.2 Feature Repository
- [ ] Create `apps/api/src/flagship/features/features.repository.ts`
- [ ] Org-scoped queries with RLS
- [ ] Query by key, list by organization

#### 1.3 Evaluation Service
- [ ] Create `apps/api/src/flagship/evaluation/evaluation.service.ts`
- [ ] Implement `evaluate(ctx, featureKeys)`
- [ ] Chain: override → plan → percentage → default

#### 1.4 Plan Entitlement Service
- [ ] Create `apps/api/src/flagship/plans/plan-features.service.ts`
- [ ] Query features by plan
- [ ] Check if plan includes feature

#### 1.5 Percentage Rollout Logic
- [ ] Implement deterministic hash function
- [ ] Use murmurhash3 for consistency
- [ ] Unit test hash distribution

#### 1.6 Feature Controller
- [ ] Create `apps/api/src/flagship/features/features.controller.ts`
- [ ] CRUD endpoints: GET/POST/PATCH/DELETE /v1/features
- [ ] Protected by `@RequirePermission('features:*')`

### 2. Frontend Tasks (Admin Panel)

#### 2.1 Feature List Page
- [ ] Display all features for organization
- [ ] Show type, status, created date
- [ ] Link to detail/edit page

#### 2.2 Feature Create/Edit Form
- [ ] Input: key, name, description, type
- [ ] Type-specific fields (percentage slider, plan selector)
- [ ] Environment override toggles

---

## Test Plan

### Unit Tests
- [ ] Feature CRUD operations
- [ ] Evaluation logic with mocked dependencies
- [ ] Percentage rollout determinism (same input = same output)
- [ ] Plan entitlement checks
- [ ] Override priority ordering

### Integration Tests
- [ ] Create feature → evaluate → delete flow
- [ ] Plan change affects evaluation
- [ ] Environment override takes precedence

### E2E Tests
- [ ] Admin creates feature via UI
- [ ] SDK evaluates feature correctly
- [ ] Override toggle changes evaluation result

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/features` | List features for organization |
| POST | `/v1/features` | Create new feature |
| GET | `/v1/features/:key` | Get feature by key |
| PATCH | `/v1/features/:key` | Update feature |
| DELETE | `/v1/features/:key` | Delete feature |
| POST | `/v1/features/:key/rules` | Add environment rule |

### Request/Response Examples

```json
// POST /v1/features
{
  "key": "billing_v2",
  "name": "Billing V2",
  "description": "New billing system",
  "type": "plan",
  "plans": ["pro", "enterprise"],
  "defaultValue": false
}

// Response
{
  "id": "feat_123",
  "key": "billing_v2",
  "name": "Billing V2",
  "type": "plan",
  "plans": ["pro", "enterprise"],
  "defaultValue": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `feature-flags` module | **Reference only** - different purpose |
| RBAC permissions | Add `features:read`, `features:write` |
| Plans/Subscriptions | Query org's current plan |
| Audit logging | Log feature changes |

### Differences from ForgeStack feature_flags
| Aspect | ForgeStack | FlagShip |
|--------|------------|----------|
| Purpose | Internal gating | Customer-facing product |
| Scope | Platform-wide | Per-organization |
| Evaluation | Simple boolean | Multi-type with rules |
| API | Internal only | Public SDK/API |

---

## Migration Notes

- New `features` table separate from ForgeStack's `feature_flags`
- New `plan_features` junction table
- New `feature_rules` for environment overrides
- All managed via FlagShip's own API, not ForgeStack admin

