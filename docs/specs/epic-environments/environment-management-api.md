# Environment Management Admin API

**Epic:** Environments  
**Priority:** P0 (Core Product - Admin Interface)  
**Depends on:** Epic 1 (Core Domain), Epic 2 (Multi-Tenant)  
**Status:** Draft

---

## Overview

The Environment Management Admin API provides CRUD operations for managing environments within FlagShip. Environments are project-scoped and represent deployment contexts (development, staging, production) where feature flags are evaluated.

Each project can have multiple environments. Environment types are constrained to: `development`, `staging`, `production`. Each environment has an associated API key prefix for generating environment-specific API keys.

### Key Components
- **Environments Controller** - REST API endpoints for environment CRUD
- **Environments Service** - Business logic and validation
- **Environments Repository** - Database operations with RLS
- **Environment Guard** - Validates X-Environment header for project context

### Architecture

```
Environment Management Flow:
┌────────────────────────────────────────────────────────────────┐
│                     Web Admin Panel                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Environments List → Create/Edit Form → API Key Config    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Admin API (This Spec)                          │
│  • GET /v1/admin/environments         - List environments      │
│  • GET /v1/admin/environments/:id     - Get single environment │
│  • POST /v1/admin/environments        - Create environment     │
│  • PATCH /v1/admin/environments/:id   - Update environment     │
│  • DELETE /v1/admin/environments/:id  - Soft delete env        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                          │
│  • environments            - Environment definitions           │
│  • flagship_feature_rules  - Environment-specific rules        │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Authentication & Authorization
- [ ] All endpoints require `ApiKeyGuard` authentication via `X-API-Key` header
- [ ] Read endpoints require `environments:read` scope
- [ ] Write endpoints require `environments:write` scope
- [ ] All endpoints require `EnvironmentGuard` with `X-Environment` header
- [ ] Environments are scoped to authenticated project via FlagshipContext

### List Environments (`GET /v1/admin/environments`)
- [ ] Return paginated list of environments for the current project
- [ ] Support optional search by `name`
- [ ] Support optional filter by `type` (development, staging, production)
- [ ] Support optional filter by `isDefault` status
- [ ] Return total count for pagination
- [ ] Order by `createdAt` descending by default

### Get Single Environment (`GET /v1/admin/environments/:id`)
- [ ] Return environment by UUID
- [ ] Include settings and API key prefix
- [ ] Return 404 if environment not found or not accessible

### Create Environment (`POST /v1/admin/environments`)
- [ ] Create environment with required: `name`, `type`
- [ ] Optional: `apiKeyPrefix`, `settings`, `isDefault`
- [ ] Environment `type` must be unique within project (enforced by DB constraint)
- [ ] Auto-generate `apiKeyPrefix` if not provided (e.g., `fsk_{type}_`)
- [ ] Return created environment with generated `id`
- [ ] Emit audit event for environment creation

### Update Environment (`PATCH /v1/admin/environments/:id`)
- [ ] Update allowed fields: `name`, `settings`, `isDefault`
- [ ] Environment `type` is immutable after creation
- [ ] If setting `isDefault=true`, unset other default environments in project
- [ ] Return 404 if environment not found
- [ ] Emit audit event for environment update

### Delete Environment (`DELETE /v1/admin/environments/:id`)
- [ ] Soft delete (set `deletedAt` timestamp or `enabled=false`)
- [ ] Cannot delete the last environment in a project
- [ ] Cannot delete default environment without reassigning default
- [ ] Return 204 No Content on success
- [ ] Return 404 if environment not found
- [ ] Emit audit event for environment deletion

### Validation
- [ ] Environment `name` max length: 64 characters
- [ ] Environment `name` min length: 1 character
- [ ] Environment `type` must be: `development`, `staging`, or `production`
- [ ] `apiKeyPrefix` pattern: lowercase letters, numbers, underscores (max 32 chars)
- [ ] `settings` must be valid JSON object

### Response Format
- [ ] Consistent JSON structure matching existing patterns
- [ ] Include `requestId` for tracing in error responses
- [ ] Include timestamps in ISO 8601 format

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Environment DTOs
- [ ] Create `apps/api/src/flagship/environments/dto/create-environment.dto.ts`
- [ ] Create `apps/api/src/flagship/environments/dto/update-environment.dto.ts`
- [ ] Create `apps/api/src/flagship/environments/dto/environment-response.dto.ts`
- [ ] Create `apps/api/src/flagship/environments/dto/query-environments.dto.ts`
- [ ] Create `apps/api/src/flagship/environments/dto/index.ts`

#### 1.2 Environments Repository (extend existing)
- [ ] Extend `apps/api/src/flagship/environments/environments.repository.ts`
- [ ] Implement `create(ctx, data)` with project scoping
- [ ] Implement `findAll(ctx, options)` with pagination and filtering
- [ ] Implement `findById(ctx, id)` for single environment
- [ ] Implement `findByType(ctx, type)` for uniqueness check
- [ ] Implement `update(ctx, id, data)`
- [ ] Implement `softDelete(ctx, id)`
- [ ] Implement `countByProject(ctx)` for last-environment validation

#### 1.3 Environments Service
- [ ] Create `apps/api/src/flagship/environments/environments.service.ts`
- [ ] Implement business logic for CRUD operations
- [ ] Validate unique type within project
- [ ] Handle isDefault flag changes (unset others when setting new default)
- [ ] Trigger audit events via QueueService
- [ ] Map entities to response DTOs

#### 1.4 Environments Controller
- [ ] Create `apps/api/src/flagship/environments/environments.controller.ts`
- [ ] Apply `@UseGuards(ApiKeyGuard, EnvironmentGuard)`
- [ ] Apply `@RequireScopes()` for read/write operations
- [ ] Implement `GET /v1/admin/environments` with pagination
- [ ] Implement `GET /v1/admin/environments/:id`
- [ ] Implement `POST /v1/admin/environments`
- [ ] Implement `PATCH /v1/admin/environments/:id`
- [ ] Implement `DELETE /v1/admin/environments/:id`
- [ ] Add Swagger decorators for OpenAPI docs

#### 1.5 Environments Module (update existing)
- [ ] Update `apps/api/src/flagship/environments/environments.module.ts`
- [ ] Register controller, service, repository
- [ ] Export service for use by other modules

### 2. Database Tasks

#### 2.1 Schema Updates
- [ ] Add `deletedAt` column to `environments` table for soft delete
- [ ] Add index on `(projectId, deletedAt)` for efficient queries
- [ ] Verify RLS policies apply to `environments` table

### 3. Testing Tasks

#### 3.1 Unit Tests
- [ ] Test `EnvironmentsRepository` methods
- [ ] Test `EnvironmentsService` validation logic
- [ ] Test type uniqueness constraint handling
- [ ] Test isDefault flag management

#### 3.2 Integration Tests
- [ ] Test full CRUD flow via HTTP
- [ ] Test authentication/authorization guards
- [ ] Test project scoping via EnvironmentGuard

---

## Test Plan

### Unit Tests
- [ ] Repository creates environment with correct project scoping
- [ ] Repository returns paginated results with proper count
- [ ] Service validates type uniqueness within project
- [ ] Service handles isDefault flag correctly
- [ ] Service rejects deletion of last environment
- [ ] Controller applies correct guards and decorators

### Integration Tests
- [ ] Create environment → Read environment → Update environment → Delete environment
- [ ] List environments returns only environments for authenticated project
- [ ] Search filter works on name
- [ ] Type filter returns correct environments
- [ ] Pagination returns correct page and total
- [ ] Invalid API key returns 401
- [ ] Missing scope returns 403
- [ ] Missing X-Environment header returns 400

### E2E Tests
- [ ] Admin creates environment via web panel
- [ ] Created environment appears in environments list
- [ ] Edited environment shows updated values
- [ ] Deleted environment no longer appears in list

---

## API Reference

### Endpoints

| Method | Path | Scope Required | Description |
|--------|------|----------------|-------------|
| GET | `/v1/admin/environments` | `environments:read` | List environments for project |
| GET | `/v1/admin/environments/:id` | `environments:read` | Get single environment by ID |
| POST | `/v1/admin/environments` | `environments:write` | Create new environment |
| PATCH | `/v1/admin/environments/:id` | `environments:write` | Update environment |
| DELETE | `/v1/admin/environments/:id` | `environments:write` | Soft delete environment |

### Headers (Required for all endpoints)

| Header | Description | Example |
|--------|-------------|---------|
| `X-API-Key` | API key with required scopes | `fsk_live_abc123...` |
| `X-Environment` | Environment ID (for project context) | `env_uuid_here` |

### Request/Response Schemas

```typescript
// Environment types
type EnvironmentType = 'development' | 'staging' | 'production';

// Create Environment Request
interface CreateEnvironmentDto {
  name: string;             // Max 64 chars, required
  type: EnvironmentType;    // Required, unique within project
  apiKeyPrefix?: string;    // Pattern: ^[a-z][a-z0-9_]*$, max 32 chars
  settings?: Record<string, unknown>;
  isDefault?: boolean;      // Default: false
}

// Update Environment Request
interface UpdateEnvironmentDto {
  name?: string;
  settings?: Record<string, unknown>;
  isDefault?: boolean;
}

// Environment Response
interface EnvironmentResponseDto {
  id: string;
  projectId: string;
  name: string;
  type: EnvironmentType;
  apiKeyPrefix: string;
  isDefault: boolean;
  settings: Record<string, unknown> | null;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

// Paginated List Response
interface PaginatedEnvironmentsDto {
  items: EnvironmentResponseDto[];
  total: number;
  page: number;
  limit: number;
}

// Query Parameters for List
interface QueryEnvironmentsDto {
  search?: string;          // Search in name
  type?: EnvironmentType;   // Filter by type
  isDefault?: boolean;      // Filter by default status
  page?: number;            // Default: 1
  limit?: number;           // Default: 10, max: 100
}
```

### Request/Response Examples

```json
// POST /v1/admin/environments
// Headers: X-API-Key: fsk_live_xxx, X-Environment: env_existing_123
{
  "name": "Staging",
  "type": "staging",
  "apiKeyPrefix": "fsk_staging_",
  "isDefault": false,
  "settings": {
    "debugMode": true,
    "logLevel": "debug"
  }
}

// Response: 201 Created
{
  "id": "env_8f3d4e2c-1234-5678-9abc-def012345678",
  "projectId": "proj_abc123",
  "name": "Staging",
  "type": "staging",
  "apiKeyPrefix": "fsk_staging_",
  "isDefault": false,
  "settings": {
    "debugMode": true,
    "logLevel": "debug"
  },
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:30:00.000Z"
}
```

```json
// GET /v1/admin/environments?page=1&limit=10
// Response: 200 OK
{
  "items": [
    {
      "id": "env_8f3d4e2c-1234-5678-9abc-def012345678",
      "projectId": "proj_abc123",
      "name": "Production",
      "type": "production",
      "apiKeyPrefix": "fsk_prod_",
      "isDefault": true,
      "settings": null,
      "createdAt": "2024-12-26T09:00:00.000Z",
      "updatedAt": "2024-12-26T09:00:00.000Z"
    },
    {
      "id": "env_9a4e5f3d-5678-9012-bcde-f12345678901",
      "projectId": "proj_abc123",
      "name": "Staging",
      "type": "staging",
      "apiKeyPrefix": "fsk_staging_",
      "isDefault": false,
      "settings": { "debugMode": true },
      "createdAt": "2024-12-26T10:30:00.000Z",
      "updatedAt": "2024-12-26T10:30:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

```json
// PATCH /v1/admin/environments/env_8f3d4e2c-1234-5678-9abc-def012345678
{
  "name": "Staging Environment",
  "settings": {
    "debugMode": false,
    "logLevel": "info"
  }
}

// Response: 200 OK
{
  "id": "env_8f3d4e2c-1234-5678-9abc-def012345678",
  "projectId": "proj_abc123",
  "name": "Staging Environment",
  "type": "staging",
  "apiKeyPrefix": "fsk_staging_",
  "isDefault": false,
  "settings": {
    "debugMode": false,
    "logLevel": "info"
  },
  "createdAt": "2024-12-26T10:30:00.000Z",
  "updatedAt": "2024-12-26T10:35:00.000Z"
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `DUPLICATE_TYPE` | Environment type already exists in project |
| 400 | `MISSING_ENVIRONMENT` | X-Environment header required |
| 400 | `CANNOT_DELETE_LAST` | Cannot delete the last environment in project |
| 400 | `CANNOT_DELETE_DEFAULT` | Cannot delete default environment without reassignment |
| 400 | `INVALID_SETTINGS` | Settings must be a valid JSON object |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 403 | `FORBIDDEN` | Missing required scope |
| 404 | `NOT_FOUND` | Environment not found |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `ApiKeyGuard` | Authenticate API requests via X-API-Key header |
| `EnvironmentGuard` | Validate environment access and set FlagshipContext |
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

- [ ] Environments are project-scoped via `projectId` foreign key
- [ ] Projects are org-scoped via `orgId` foreign key
- [ ] Environment ID extracted from `X-Environment` header for context
- [ ] RLS policies on `environments` table
- [ ] Queries use `withTenantContext` for RLS enforcement
- [ ] API key determines org access; EnvironmentGuard validates project access

---

## Audit Events

Environment changes emit the following audit events:

| Event | Payload |
|-------|---------|
| `environment.created` | `{ environmentId, name, type, projectId, createdBy }` |
| `environment.updated` | `{ environmentId, name, changes, updatedBy }` |
| `environment.deleted` | `{ environmentId, name, type, deletedBy }` |

---

## Migration Notes

- Add `deletedAt` column to `environments` table for soft delete support
- Add composite index `idx_environments_project_deleted` on `(projectId, deletedAt)`
- Consider adding `enabled` boolean column as alternative to soft delete
- Ensure uniqueness constraint on `(projectId, type)` accounts for soft-deleted records

