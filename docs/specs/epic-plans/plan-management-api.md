# Plan Management Admin API

**Epic:** Plans  
**Priority:** P1 (Admin Interface for Subscription Plans)  
**Depends on:** Epic 1 (Core Domain), Epic 2 (Multi-Tenant)  
**Status:** Draft

---

## Overview

The Plan Management Admin API provides CRUD operations for managing subscription plans within FlagShip. Plans define subscription tiers with features, limits, and pricing. These APIs enable administrators to configure plans that organizations subscribe to, and manage plan-feature associations via the `flagship_plan_features` table.

Plans are global resources (not org-scoped) but are accessed through org-scoped API keys, requiring appropriate admin scopes.

### Key Components
- **Plans Controller** - REST API endpoints for plan CRUD
- **Plans Service** - Business logic and validation
- **Plans Repository** - Database operations
- **Plan-Feature Associations** - Linking plans to features

### Architecture

```
Plan Management Flow:
┌────────────────────────────────────────────────────────────────┐
│                     Web Admin Panel                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Plans List → Create/Edit Form → Feature Associations     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Admin API (This Spec)                          │
│  • GET /v1/admin/plans         - List plans                    │
│  • GET /v1/admin/plans/:id     - Get single plan with features │
│  • POST /v1/admin/plans        - Create plan                   │
│  • PATCH /v1/admin/plans/:id   - Update plan                   │
│  • DELETE /v1/admin/plans/:id  - Soft delete plan              │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                          │
│  • plans                    - Plan definitions                 │
│  • flagship_plan_features   - Plan-feature associations        │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Authentication & Authorization
- [ ] All endpoints require `ApiKeyGuard` authentication via `X-API-Key` header
- [ ] Read endpoints require `plans:read` scope
- [ ] Write endpoints require `plans:write` scope
- [ ] All endpoints require `EnvironmentGuard` with `X-Environment` header for org context
- [ ] Plans are global but access is controlled via org's API key scopes

### List Plans (`GET /v1/admin/plans`)
- [ ] Return paginated list of active plans
- [ ] Support optional search by `name` or `displayName`
- [ ] Support optional filter by `isActive` status
- [ ] Return total count for pagination
- [ ] Order by `sortOrder` ascending by default

### Get Single Plan (`GET /v1/admin/plans/:id`)
- [ ] Return plan by UUID
- [ ] Include associated features from `flagship_plan_features` join
- [ ] Return 404 if plan not found

### Create Plan (`POST /v1/admin/plans`)
- [ ] Create plan with required: `name`, `displayName`
- [ ] Optional: `description`, `limits`, `features`, `priceMonthly`, `priceYearly`, `stripePriceIdMonthly`, `stripePriceIdYearly`, `stripeMeteredPriceId`, `sortOrder`
- [ ] Plan `name` must be unique (slug format)
- [ ] Plan `name` must match pattern: `^[a-z][a-z0-9_-]*$`
- [ ] Return created plan with generated `id`
- [ ] Emit audit event for plan creation

### Update Plan (`PATCH /v1/admin/plans/:id`)
- [ ] Update allowed fields: `displayName`, `description`, `limits`, `features`, `priceMonthly`, `priceYearly`, `stripePriceIdMonthly`, `stripePriceIdYearly`, `stripeMeteredPriceId`, `isActive`, `sortOrder`
- [ ] Plan `name` is immutable after creation
- [ ] Return 404 if plan not found
- [ ] Emit audit event for plan update

### Delete Plan (`DELETE /v1/admin/plans/:id`)
- [ ] Soft delete by setting `isActive = false`
- [ ] Return 204 No Content on success
- [ ] Return 404 if plan not found
- [ ] Return 409 Conflict if plan has active subscriptions
- [ ] Emit audit event for plan deletion

### Manage Plan Features
- [ ] `POST /v1/admin/plans/:id/features` - Add feature to plan
- [ ] `DELETE /v1/admin/plans/:id/features/:featureId` - Remove feature from plan
- [ ] `PATCH /v1/admin/plans/:id/features/:featureId` - Update feature config for plan

### Validation
- [ ] Plan `name` pattern: lowercase letters, numbers, underscores, hyphens
- [ ] Plan `name` max length: 64 characters
- [ ] Plan `displayName` max length: 128 characters
- [ ] Plan `description` max length: 512 characters
- [ ] `limits` must be valid JSON object
- [ ] `features` must be valid JSON array of strings

### Response Format
- [ ] Consistent JSON structure matching existing patterns
- [ ] Include `requestId` for tracing in error responses
- [ ] Include timestamps in ISO 8601 format

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Plan DTOs
- [ ] Create `apps/api/src/flagship/plans/dto/create-plan.dto.ts`
- [ ] Create `apps/api/src/flagship/plans/dto/update-plan.dto.ts`
- [ ] Create `apps/api/src/flagship/plans/dto/plan-response.dto.ts`
- [ ] Create `apps/api/src/flagship/plans/dto/query-plans.dto.ts`
- [ ] Create `apps/api/src/flagship/plans/dto/plan-feature.dto.ts`
- [ ] Create `apps/api/src/flagship/plans/dto/index.ts`

#### 1.2 Plans Repository
- [ ] Create `apps/api/src/flagship/plans/plans.repository.ts`
- [ ] Implement `create(data)` for new plan
- [ ] Implement `findAll(options)` with pagination and filtering
- [ ] Implement `findById(id)` with feature associations
- [ ] Implement `findByName(name)` for uniqueness check
- [ ] Implement `update(id, data)`
- [ ] Implement `softDelete(id)`
- [ ] Implement `hasActiveSubscriptions(id)` for delete validation

#### 1.3 Plan Features Repository
- [ ] Create `apps/api/src/flagship/plans/plan-features.repository.ts`
- [ ] Implement `addFeatureToPlan(planId, featureId, config)`
- [ ] Implement `removeFeatureFromPlan(planId, featureId)`
- [ ] Implement `updatePlanFeature(planId, featureId, config)`
- [ ] Implement `findFeaturesByPlanId(planId)`

#### 1.4 Plans Service
- [ ] Create `apps/api/src/flagship/plans/plans.service.ts`
- [ ] Implement business logic for CRUD operations
- [ ] Validate unique name
- [ ] Validate name format with regex pattern
- [ ] Check for active subscriptions before delete
- [ ] Trigger audit events via QueueService
- [ ] Map entities to response DTOs

#### 1.5 Plans Controller
- [ ] Create `apps/api/src/flagship/plans/plans.controller.ts`
- [ ] Apply `@UseGuards(ApiKeyGuard, EnvironmentGuard)`
- [ ] Apply `@RequireScopes()` for read/write operations
- [ ] Implement `GET /v1/admin/plans` with pagination
- [ ] Implement `GET /v1/admin/plans/:id`
- [ ] Implement `POST /v1/admin/plans`
- [ ] Implement `PATCH /v1/admin/plans/:id`
- [ ] Implement `DELETE /v1/admin/plans/:id`
- [ ] Implement `POST /v1/admin/plans/:id/features`
- [ ] Implement `DELETE /v1/admin/plans/:id/features/:featureId`
- [ ] Implement `PATCH /v1/admin/plans/:id/features/:featureId`
- [ ] Add Swagger decorators for OpenAPI docs

#### 1.6 Plans Module
- [ ] Create `apps/api/src/flagship/plans/plans.module.ts`
- [ ] Register controller, service, repositories
- [ ] Export service for use by other modules

### 2. Database Tasks

#### 2.1 Schema Verification
- [ ] Verify `plans` table has all required columns
- [ ] Verify `flagship_plan_features` join table exists
- [ ] Add index on `plans.name` if not exists
- [ ] Add index on `plans.isActive` if not exists

### 3. Testing Tasks

#### 3.1 Unit Tests
- [ ] Test `PlansRepository` methods
- [ ] Test `PlanFeaturesRepository` methods
- [ ] Test `PlansService` validation logic
- [ ] Test name format validation regex
- [ ] Test unique name constraint handling

#### 3.2 Integration Tests
- [ ] Test full CRUD flow via HTTP
- [ ] Test authentication/authorization guards
- [ ] Test plan-feature association endpoints
- [ ] Test delete conflict with active subscriptions

---

## Test Plan

### Unit Tests
- [ ] Repository creates plan with correct fields
- [ ] Repository returns paginated results with proper count
- [ ] Service validates name format pattern
- [ ] Service rejects duplicate names
- [ ] Service maps entity to DTO correctly
- [ ] Controller applies correct guards and decorators

### Integration Tests
- [ ] Create plan → Read plan → Update plan → Delete plan
- [ ] List plans returns paginated results
- [ ] Search filter works on name and displayName
- [ ] Pagination returns correct page and total
- [ ] Add feature to plan → Update config → Remove feature
- [ ] Invalid API key returns 401
- [ ] Missing scope returns 403
- [ ] Missing X-Environment header returns 400
- [ ] Delete plan with subscriptions returns 409

### E2E Tests
- [ ] Admin creates plan via web panel
- [ ] Created plan appears in plans list
- [ ] Edited plan shows updated values
- [ ] Deleted plan no longer appears in list
- [ ] Plan features can be managed

---

## API Reference

### Endpoints

| Method | Path | Scope Required | Description |
|--------|------|----------------|-------------|
| GET | `/v1/admin/plans` | `plans:read` | List plans with pagination |
| GET | `/v1/admin/plans/:id` | `plans:read` | Get single plan by ID with features |
| POST | `/v1/admin/plans` | `plans:write` | Create new plan |
| PATCH | `/v1/admin/plans/:id` | `plans:write` | Update plan |
| DELETE | `/v1/admin/plans/:id` | `plans:write` | Soft delete plan |
| POST | `/v1/admin/plans/:id/features` | `plans:write` | Add feature to plan |
| PATCH | `/v1/admin/plans/:id/features/:featureId` | `plans:write` | Update plan feature config |
| DELETE | `/v1/admin/plans/:id/features/:featureId` | `plans:write` | Remove feature from plan |

### Headers (Required for all endpoints)

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Key` | API key with required scopes | `fsk_live_abc123...` |
| `X-Environment` | Environment ID for org context | `env_uuid_here` |

### Request/Response Schemas

```typescript
// Create Plan Request
interface CreatePlanDto {
  name: string;              // Pattern: ^[a-z][a-z0-9_-]*$, max 64 chars
  displayName: string;       // Max 128 chars
  description?: string;      // Max 512 chars
  limits?: Record<string, number>;  // e.g., { "api_calls_monthly": 10000 }
  features?: string[];       // e.g., ["api-access", "analytics"]
  priceMonthly?: number;     // In cents
  priceYearly?: number;      // In cents
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  stripeMeteredPriceId?: string;
  sortOrder?: number;
}

// Update Plan Request
interface UpdatePlanDto {
  displayName?: string;
  description?: string;
  limits?: Record<string, number>;
  features?: string[];
  priceMonthly?: number;
  priceYearly?: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  stripeMeteredPriceId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Plan Response
interface PlanResponseDto {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  limits: Record<string, number>;
  features: string[];
  priceMonthly: number | null;
  priceYearly: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  stripeMeteredPriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  planFeatures?: PlanFeatureDto[];  // Only on GET by ID
}

// Plan Feature (from flagship_plan_features join)
interface PlanFeatureDto {
  id: string;
  featureId: string;
  featureKey: string;
  featureName: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

// Add Plan Feature Request
interface AddPlanFeatureDto {
  featureId: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
}

// Update Plan Feature Request
interface UpdatePlanFeatureDto {
  enabled?: boolean;
  config?: Record<string, unknown>;
}

// Paginated List Response
interface PaginatedPlansDto {
  items: PlanResponseDto[];
  total: number;
  page: number;
  limit: number;
}

// Query Parameters for List
interface QueryPlansDto {
  search?: string;      // Search in name and displayName
  isActive?: boolean;   // Filter by active status
  page?: number;        // Default: 1
  limit?: number;       // Default: 10, max: 100
}
```

### Request/Response Examples

```json
// POST /v1/admin/plans
// Headers: X-API-Key: fsk_live_xxx, X-Environment: env_prod_123
{
  "name": "pro",
  "displayName": "Pro Plan",
  "description": "Professional tier with advanced features",
  "limits": {
    "api_calls_monthly": 100000,
    "storage_bytes": 10737418240,
    "seats": 10
  },
  "features": ["api-access", "advanced-analytics", "priority-support"],
  "priceMonthly": 4900,
  "priceYearly": 49000,
  "sortOrder": 2
}

// Response: 201 Created
{
  "id": "plan_8f3d4e2c-1234-5678-9abc-def012345678",
  "name": "pro",
  "displayName": "Pro Plan",
  "description": "Professional tier with advanced features",
  "limits": { "api_calls_monthly": 100000, "storage_bytes": 10737418240, "seats": 10 },
  "features": ["api-access", "advanced-analytics", "priority-support"],
  "priceMonthly": 4900,
  "priceYearly": 49000,
  "stripePriceIdMonthly": null,
  "stripePriceIdYearly": null,
  "stripeMeteredPriceId": null,
  "isActive": true,
  "sortOrder": 2,
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:30:00.000Z"
}
```

```json
// GET /v1/admin/plans?page=1&limit=10&isActive=true
// Response: 200 OK
{
  "items": [
    {
      "id": "plan_free_123",
      "name": "free",
      "displayName": "Free Plan",
      "description": "Get started for free",
      "limits": { "api_calls_monthly": 1000, "seats": 1 },
      "features": ["api-access"],
      "priceMonthly": 0,
      "priceYearly": 0,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-01T00:00:00.000Z",
      "updatedAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

```json
// GET /v1/admin/plans/:id (with features)
// Response: 200 OK
{
  "id": "plan_8f3d4e2c-1234-5678-9abc-def012345678",
  "name": "pro",
  "displayName": "Pro Plan",
  "description": "Professional tier with advanced features",
  "limits": { "api_calls_monthly": 100000 },
  "features": ["api-access", "advanced-analytics"],
  "priceMonthly": 4900,
  "priceYearly": 49000,
  "isActive": true,
  "sortOrder": 2,
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:30:00.000Z",
  "planFeatures": [
    {
      "id": "pf_abc123",
      "featureId": "feat_xyz789",
      "featureKey": "advanced-analytics",
      "featureName": "Advanced Analytics",
      "enabled": true,
      "config": { "retention_days": 90 }
    }
  ]
}
```

```json
// POST /v1/admin/plans/:id/features
{
  "featureId": "feat_xyz789",
  "enabled": true,
  "config": { "retention_days": 90 }
}

// Response: 201 Created
{
  "id": "pf_abc123",
  "featureId": "feat_xyz789",
  "featureKey": "advanced-analytics",
  "featureName": "Advanced Analytics",
  "enabled": true,
  "config": { "retention_days": 90 }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_NAME_FORMAT` | Name does not match required pattern |
| 400 | `DUPLICATE_NAME` | Plan name already exists |
| 400 | `MISSING_ENVIRONMENT` | X-Environment header required |
| 400 | `INVALID_LIMITS` | Limits must be valid JSON object |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 403 | `FORBIDDEN` | Missing required scope |
| 404 | `NOT_FOUND` | Plan not found |
| 404 | `FEATURE_NOT_FOUND` | Feature not found |
| 409 | `PLAN_HAS_SUBSCRIPTIONS` | Cannot delete plan with active subscriptions |
| 409 | `FEATURE_ALREADY_ADDED` | Feature already associated with plan |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `ApiKeyGuard` | Authenticate API requests via X-API-Key header |
| `EnvironmentGuard` | Validate environment access and set context |
| `@RequireScopes` | Check API key has required scopes |
| `QueueService` | Queue audit events for async processing |

### Patterns to Follow
- Controller/Service/Repository layered architecture
- DTO validation with class-validator decorators
- Swagger documentation with @nestjs/swagger
- Consistent error response format

---

## Multi-Tenancy Considerations

- [ ] Plans are global resources (not org-scoped)
- [ ] Access controlled via API key scopes (`plans:read`, `plans:write`)
- [ ] Environment header required for org context/audit trail
- [ ] Plan features (`flagship_plan_features`) link to project-scoped features
- [ ] Only admin-level API keys should have `plans:write` scope

---

## Audit Events

Plan changes emit the following audit events:

| Event | Payload |
|-------|---------|
| `plan.created` | `{ planId, name, createdBy }` |
| `plan.updated` | `{ planId, name, changes, updatedBy }` |
| `plan.deleted` | `{ planId, name, deletedBy }` |
| `plan.feature_added` | `{ planId, featureId, addedBy }` |
| `plan.feature_removed` | `{ planId, featureId, removedBy }` |
| `plan.feature_updated` | `{ planId, featureId, changes, updatedBy }` |

---

## Migration Notes

- Ensure `plans` table has all columns from schema definition
- Verify `flagship_plan_features` table exists with proper indexes
- Add composite index `idx_plans_name_active` on `(name, isActive)` if needed
- Consider adding `deletedAt` column for true soft delete pattern (currently uses `isActive` flag)

