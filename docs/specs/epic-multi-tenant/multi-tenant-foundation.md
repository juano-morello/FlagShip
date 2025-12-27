# Multi-Tenant Foundation

**Epic:** Multi-Tenant Foundation  
**Priority:** P0 (Foundation)  
**Depends on:** Epic 1 (Core Domain Model)  
**Status:** Draft

---

## Overview

FlagShip extends ForgeStack's multi-tenancy model to support environment-aware operations. Every API request must be scoped to an organization AND an environment (dev/staging/prod), enabling customers to manage separate configurations per deployment stage.

### Key Components
- **Environment Context** - Extend tenant context to include environment
- **Environment-aware RLS** - Row-level security scoped to org + environment
- **RBAC Integration** - Permission checks at environment level
- **API Key Scoping** - Environment-specific API keys

### Architecture

```
Request Flow:
┌─────────────────────────────────────────────────────────────────┐
│                        Client Request                            │
│          X-API-Key: fsk_xxx  |  X-Environment: prod             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Key Guard                                │
│            Validate key → Extract org_id + scopes               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Environment Guard                              │
│      Validate X-Environment → Set environment context           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FlagShip Tenant Context                        │
│        { orgId, environmentId, environment: 'prod' }            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              withEnvironmentContext(ctx, query)                  │
│                  RLS filters by org + env                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Environment Context
- [ ] `X-Environment` header required on all control-plane endpoints
- [ ] Environment validated against organization's projects
- [ ] Context includes: orgId, userId, environmentId, environmentName
- [ ] Error returned if environment doesn't exist for org

### Guards & Middleware
- [ ] `EnvironmentGuard` validates environment header
- [ ] `FlagShipContext` decorator provides enriched context
- [ ] Guards chain: Auth → ApiKey → Environment → Permission

### RLS Policies
- [ ] Features filtered by organization_id
- [ ] Feature rules filtered by environment_id
- [ ] Usage metrics filtered by organization_id + environment_id

### API Key Scoping
- [ ] API keys can be scoped to specific environments
- [ ] Production keys cannot access dev/staging data
- [ ] Admin keys can access all environments

### RBAC Integration
- [ ] Leverage ForgeStack's existing permission system
- [ ] Add FlagShip-specific permissions: `features:read`, `features:write`, `limits:read`, `limits:write`
- [ ] Environment-level permission overrides (optional)

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Environment Context Types
- [ ] Create `apps/api/src/flagship/types/context.ts`
- [ ] Define `FlagShipContext` extending ForgeStack's `TenantContext`
- [ ] Include environmentId and environmentName

#### 1.2 Environment Guard
- [ ] Create `apps/api/src/flagship/guards/environment.guard.ts`
- [ ] Validate X-Environment header
- [ ] Query environment by name + org
- [ ] Set environment in request context

#### 1.3 Context Decorator
- [ ] Create `@FlagShipContext()` parameter decorator
- [ ] Extract enriched context from request
- [ ] Follow ForgeStack's `@Ctx()` decorator pattern

#### 1.4 API Key Environment Scoping
- [ ] Extend API key schema with `environments` array field
- [ ] Validate environment access in ApiKeyGuard
- [ ] Return 403 if key not authorized for environment

#### 1.5 RLS Extensions
- [ ] Create environment-aware RLS policies
- [ ] Add `current_setting('flagship.environment_id')` to policies
- [ ] Create `withEnvironmentContext()` wrapper

#### 1.6 Permissions Seed
- [ ] Add FlagShip permissions to seed script
- [ ] Define permission groups: features, limits, evaluation, audit

---

## Test Plan

### Unit Tests
- [ ] EnvironmentGuard validates header presence
- [ ] EnvironmentGuard rejects invalid environment names
- [ ] FlagShipContext decorator extracts correct values
- [ ] API key environment scope validation

### Integration Tests
- [ ] Full request flow with environment context
- [ ] RLS filters data by environment
- [ ] Cross-environment access denied

### E2E Tests
- [ ] API call with X-Environment header succeeds
- [ ] API call without X-Environment returns 400
- [ ] Production API key cannot access dev environment

---

## API Reference

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `X-API-Key` | Yes | Organization API key |
| `X-Environment` | Yes | Target environment (dev/staging/prod) |

### Error Responses
| Status | Code | Description |
|--------|------|-------------|
| 400 | `MISSING_ENVIRONMENT` | X-Environment header required |
| 404 | `ENVIRONMENT_NOT_FOUND` | Environment doesn't exist |
| 403 | `ENVIRONMENT_ACCESS_DENIED` | API key not authorized for environment |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `TenantContextGuard` | Extended pattern for environment guard |
| `@Ctx()` decorator | Pattern for `@FlagShipContext()` |
| `withTenantContext()` | Extended to `withEnvironmentContext()` |
| `ApiKeyGuard` | Extended with environment validation |
| Permissions system | Add FlagShip-specific permissions |

### Patterns to Follow
- Guard chaining pattern from `apps/api/src/core/guards/`
- Context decorator pattern from `apps/api/src/core/decorators/`
- Repository RLS pattern from existing repositories

---

## Migration Notes

- Extends ForgeStack's context model without breaking changes
- API keys gain optional `environments` field (backwards compatible)
- New RLS session variable: `flagship.environment_id`

