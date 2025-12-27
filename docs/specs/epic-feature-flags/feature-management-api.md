# Feature Management Admin API

**Epic:** Feature Flags  
**Priority:** P0 (Core Product - Admin Interface)  
**Depends on:** Epic 1 (Core Domain), Epic 2 (Multi-Tenant), Epic 3 (Evaluation API)  
**Status:** Draft

---

## Overview

The Feature Management Admin API provides CRUD operations for managing features within FlagShip. These APIs are consumed by the web admin panel to configure features that are then evaluated at runtime via the POST /v1/evaluate endpoint.

Features are project-scoped and can have environment-specific rules (overrides, percentage rollouts, schedule-based activation).

### Key Components
- **Features Controller** - REST API endpoints for feature CRUD
- **Features Service** - Business logic and validation
- **Features Repository** - Database operations with RLS
- **Feature Rules** - Environment-specific behavior configuration

### Architecture

```
Feature Management Flow:
┌────────────────────────────────────────────────────────────────┐
│                     Web Admin Panel                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Features List → Create/Edit Form → Environment Rules     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Admin API (This Spec)                          │
│  • GET /v1/admin/features         - List features              │
│  • GET /v1/admin/features/:id     - Get single feature         │
│  • POST /v1/admin/features        - Create feature             │
│  • PATCH /v1/admin/features/:id   - Update feature             │
│  • DELETE /v1/admin/features/:id  - Delete feature (soft)      │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                          │
│  • flagship_features        - Feature definitions              │
│  • flagship_feature_rules   - Environment-specific rules       │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Authentication & Authorization
- [ ] All endpoints require `ApiKeyGuard` authentication
- [ ] Read endpoints require `features:read` scope
- [ ] Write endpoints require `features:write` scope
- [ ] All endpoints require `EnvironmentGuard` with `X-Environment` header
- [ ] Features are scoped to authenticated project/environment

### List Features (`GET /v1/admin/features`)
- [ ] Return paginated list of features for the environment's project
- [ ] Support optional search by `key` or `name`
- [ ] Support optional filter by `type` (boolean, percentage, plan)
- [ ] Support optional filter by `enabled` status
- [ ] Return total count for pagination
- [ ] Order by `createdAt` descending by default

### Get Single Feature (`GET /v1/admin/features/:id`)
- [ ] Return feature by UUID
- [ ] Include associated feature rules for the current environment
- [ ] Return 404 if feature not found or not accessible

### Create Feature (`POST /v1/admin/features`)
- [ ] Create feature with required: `key`, `name`, `type`
- [ ] Optional: `description`, `defaultValue`, `metadata`
- [ ] Feature `key` must be unique within project
- [ ] Feature `key` must match pattern: `^[a-z][a-z0-9_]*$`
- [ ] Feature `type` must be: `boolean`, `percentage`, or `plan`
- [ ] Return created feature with generated `id`
- [ ] Emit audit event for feature creation

### Update Feature (`PATCH /v1/admin/features/:id`)
- [ ] Update allowed fields: `name`, `description`, `enabled`, `defaultValue`, `metadata`
- [ ] Feature `key` and `type` are immutable after creation
- [ ] Return 404 if feature not found
- [ ] Emit audit event for feature update

### Delete Feature (`DELETE /v1/admin/features/:id`)
- [ ] Soft delete by setting `enabled = false` and `deletedAt` timestamp
- [ ] Return 204 No Content on success
- [ ] Return 404 if feature not found
- [ ] Emit audit event for feature deletion

### Validation
- [ ] Feature `key` pattern: lowercase letters, numbers, underscores
- [ ] Feature `key` max length: 64 characters
- [ ] Feature `name` max length: 128 characters
- [ ] Feature `description` max length: 512 characters
- [ ] `defaultValue` type matches feature `type`

### Response Format
- [ ] Consistent JSON structure matching existing patterns
- [ ] Include `requestId` for tracing in error responses
- [ ] Include timestamps in ISO 8601 format

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Feature DTOs
- [ ] Create `apps/api/src/flagship/features/dto/create-feature.dto.ts`
- [ ] Create `apps/api/src/flagship/features/dto/update-feature.dto.ts`
- [ ] Create `apps/api/src/flagship/features/dto/feature-response.dto.ts`
- [ ] Create `apps/api/src/flagship/features/dto/query-features.dto.ts`
- [ ] Create `apps/api/src/flagship/features/dto/index.ts`

#### 1.2 Features Repository
- [ ] Create `apps/api/src/flagship/features/features.repository.ts`
- [ ] Implement `create(ctx, data)` with project scoping
- [ ] Implement `findAll(ctx, options)` with pagination and filtering
- [ ] Implement `findById(ctx, id)` with environment rules
- [ ] Implement `findByKey(ctx, key)` for uniqueness check
- [ ] Implement `update(ctx, id, data)`
- [ ] Implement `softDelete(ctx, id)`

#### 1.3 Features Service
- [ ] Create `apps/api/src/flagship/features/features.service.ts`
- [ ] Implement business logic for CRUD operations
- [ ] Validate unique key within project
- [ ] Validate key format with regex pattern
- [ ] Trigger audit events via QueueService
- [ ] Map entities to response DTOs

#### 1.4 Features Controller
- [ ] Create `apps/api/src/flagship/features/features.controller.ts`
- [ ] Apply `@UseGuards(ApiKeyGuard, EnvironmentGuard)`
- [ ] Apply `@RequireScopes()` for read/write operations
- [ ] Implement `GET /v1/admin/features` with pagination
- [ ] Implement `GET /v1/admin/features/:id`
- [ ] Implement `POST /v1/admin/features`
- [ ] Implement `PATCH /v1/admin/features/:id`
- [ ] Implement `DELETE /v1/admin/features/:id`
- [ ] Add Swagger decorators for OpenAPI docs

#### 1.5 Features Module
- [ ] Create `apps/api/src/flagship/features/features.module.ts`
- [ ] Register controller, service, repository
- [ ] Export service for use by evaluation module

### 2. Database Tasks

#### 2.1 Schema Updates (if needed)
- [ ] Verify `flagship_features` has `deletedAt` for soft delete
- [ ] Add index on `(projectId, key)` if not exists
- [ ] Verify RLS policies apply to `flagship_features`

### 3. Testing Tasks

#### 3.1 Unit Tests
- [ ] Test `FeaturesRepository` methods
- [ ] Test `FeaturesService` validation logic
- [ ] Test key format validation regex
- [ ] Test unique key constraint handling

#### 3.2 Integration Tests
- [ ] Test full CRUD flow via HTTP
- [ ] Test authentication/authorization guards
- [ ] Test environment scoping

---

## Test Plan

### Unit Tests
- [ ] Repository creates feature with correct project scoping
- [ ] Repository returns paginated results with proper count
- [ ] Service validates key format pattern
- [ ] Service rejects duplicate keys within same project
- [ ] Service maps entity to DTO correctly
- [ ] Controller applies correct guards and decorators

### Integration Tests
- [ ] Create feature → Read feature → Update feature → Delete feature
- [ ] List features returns only features for authenticated project
- [ ] Search filter works on key and name
- [ ] Pagination returns correct page and total
- [ ] Invalid API key returns 401
- [ ] Missing scope returns 403
- [ ] Missing X-Environment header returns 400

### E2E Tests
- [ ] Admin creates feature via web panel
- [ ] Created feature appears in features list
- [ ] Edited feature shows updated values
- [ ] Deleted feature no longer appears in list

---

## API Reference

### Endpoints

| Method | Path | Scope Required | Description |
|--------|------|----------------|-------------|
| GET | `/v1/admin/features` | `features:read` | List features for project |
| GET | `/v1/admin/features/:id` | `features:read` | Get single feature by ID |
| POST | `/v1/admin/features` | `features:write` | Create new feature |
| PATCH | `/v1/admin/features/:id` | `features:write` | Update feature |
| DELETE | `/v1/admin/features/:id` | `features:write` | Soft delete feature |

### Headers (Required for all endpoints)

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Key` | API key with required scopes | `fsk_live_abc123...` |
| `X-Environment` | Environment ID | `env_uuid_here` |

### Request/Response Schemas

```typescript
// Feature types
type FeatureType = 'boolean' | 'percentage' | 'plan';

// Create Feature Request
interface CreateFeatureDto {
  key: string;           // Pattern: ^[a-z][a-z0-9_]*$, max 64 chars
  name: string;          // Max 128 chars
  description?: string;  // Max 512 chars
  type: FeatureType;
  defaultValue?: boolean;
  metadata?: Record<string, unknown>;
}

// Update Feature Request
interface UpdateFeatureDto {
  name?: string;
  description?: string;
  enabled?: boolean;
  defaultValue?: boolean;
  metadata?: Record<string, unknown>;
}

// Feature Response
interface FeatureResponseDto {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  type: FeatureType;
  defaultValue: boolean;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  rules?: FeatureRuleDto[];  // Only on GET by ID
}

// Feature Rule (for environment-specific behavior)
interface FeatureRuleDto {
  id: string;
  ruleType: 'override' | 'percentage' | 'plan_gate';
  value: Record<string, unknown>;
  priority: number;
  enabled: boolean;
}

// Paginated List Response
interface PaginatedFeaturesDto {
  items: FeatureResponseDto[];
  total: number;
  page: number;
  limit: number;
}

// Query Parameters for List
interface QueryFeaturesDto {
  search?: string;      // Search in key and name
  type?: FeatureType;   // Filter by type
  enabled?: boolean;    // Filter by enabled status
  page?: number;        // Default: 1
  limit?: number;       // Default: 10, max: 100
}
```

### Request/Response Examples

```json
// POST /v1/admin/features
// Headers: X-API-Key: fsk_live_xxx, X-Environment: env_prod_123
{
  "key": "enable_dark_mode",
  "name": "Dark Mode",
  "description": "Enable dark mode toggle for users",
  "type": "boolean",
  "defaultValue": false
}

// Response: 201 Created
{
  "id": "feat_8f3d4e2c-1234-5678-9abc-def012345678",
  "projectId": "proj_abc123",
  "key": "enable_dark_mode",
  "name": "Dark Mode",
  "description": "Enable dark mode toggle for users",
  "type": "boolean",
  "defaultValue": false,
  "enabled": true,
  "metadata": null,
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:30:00.000Z"
}
```

```json
// GET /v1/admin/features?page=1&limit=10&type=boolean
// Response: 200 OK
{
  "items": [
    {
      "id": "feat_8f3d4e2c-1234-5678-9abc-def012345678",
      "projectId": "proj_abc123",
      "key": "enable_dark_mode",
      "name": "Dark Mode",
      "description": "Enable dark mode toggle for users",
      "type": "boolean",
      "defaultValue": false,
      "enabled": true,
      "metadata": null,
      "createdAt": "2024-12-26T10:30:00.000Z",
      "updatedAt": "2024-12-26T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

```json
// PATCH /v1/admin/features/feat_8f3d4e2c-1234-5678-9abc-def012345678
{
  "name": "Dark Mode Toggle",
  "enabled": false
}

// Response: 200 OK
{
  "id": "feat_8f3d4e2c-1234-5678-9abc-def012345678",
  "projectId": "proj_abc123",
  "key": "enable_dark_mode",
  "name": "Dark Mode Toggle",
  "description": "Enable dark mode toggle for users",
  "type": "boolean",
  "defaultValue": false,
  "enabled": false,
  "metadata": null,
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:35:00.000Z"
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_KEY_FORMAT` | Key does not match required pattern |
| 400 | `DUPLICATE_KEY` | Key already exists in project |
| 400 | `MISSING_ENVIRONMENT` | X-Environment header required |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 403 | `FORBIDDEN` | Missing required scope |
| 404 | `NOT_FOUND` | Feature not found |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `ApiKeyGuard` | Authenticate API requests via X-API-Key header |
| `EnvironmentGuard` | Validate environment access and set context |
| `@RequireScopes` | Check API key has required scopes |
| `@CurrentEnvironment` | Inject FlagshipContext with environment/project info |
| `withTenantContext` | RLS-aware database queries |
| `QueueService` | Queue audit events for async processing |

### Patterns to Follow
- Controller/Service/Repository layered architecture
- DTO validation with class-validator decorators
- Swagger documentation with @nestjs/swagger
- Consistent error response format

---

## Multi-Tenancy Considerations

- [ ] Features are project-scoped via `projectId` foreign key
- [ ] Environment ID extracted from `X-Environment` header
- [ ] RLS policies on `flagship_features` table
- [ ] Queries use `withTenantContext` for RLS enforcement
- [ ] API key determines org access

---

## Audit Events

Feature changes emit the following audit events:

| Event | Payload |
|-------|---------|
| `feature.created` | `{ featureId, key, type, createdBy }` |
| `feature.updated` | `{ featureId, key, changes, updatedBy }` |
| `feature.deleted` | `{ featureId, key, deletedBy }` |

---

## Migration Notes

- Ensure `flagship_features.deletedAt` column exists for soft delete
- Add composite index `idx_flagship_features_project_key_deleted` on `(projectId, key, deletedAt)`
- Verify uniqueness constraint accounts for soft-deleted records

