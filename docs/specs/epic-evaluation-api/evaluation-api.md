# Evaluation API

**Epic:** Evaluation API  
**Priority:** P0 (Core Product - Primary Endpoint)  
**Depends on:** Epic 1-4 (Core Domain, Multi-Tenant, Feature Flags, Usage Limits)  
**Status:** Draft

---

## Overview

The Evaluation API is **FlagShip's primary product endpoint**. It allows SaaS backends to query access decisions at runtime - determining feature availability, permission checks, and usage limit status in a single, optimized call.

### Key Components
- **POST /v1/evaluate** - Single endpoint for all access decisions
- **Batch Evaluation** - Multiple flags + limits in one request
- **Deterministic Results** - Same inputs always produce same outputs
- **Low Latency** - <50ms p99 target with caching

### Architecture

```
Evaluation Request Flow:
┌────────────────────────────────────────────────────────────────┐
│                 POST /v1/evaluate                               │
│  {                                                              │
│    "features": ["billing_v2", "ai_chat"],                      │
│    "limits": ["api_calls", "storage"],                         │
│    "context": { "userId": "usr_123", "planId": "pro" }         │
│  }                                                              │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   Request Validation                            │
│          Validate schema, authenticate, set context            │
└─────────────────────────────┬──────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────────┐
│  Feature Evaluation │               │   Limit Evaluation      │
│  - Check overrides  │               │   - Query current usage │
│  - Check plan       │               │   - Compare to limit    │
│  - Apply percentage │               │   - Calculate remaining │
└─────────┬───────────┘               └─────────────┬───────────┘
          │                                         │
          └──────────────────┬──────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                       Response                                  │
│  {                                                              │
│    "features": { "billing_v2": true, "ai_chat": false },       │
│    "limits": {                                                  │
│      "api_calls": { "allowed": true, "remaining": 499 },       │
│      "storage": { "allowed": false, "current": 10GB }          │
│    }                                                            │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Request Handling
- [ ] POST /v1/evaluate accepts JSON body
- [ ] Requires valid API key (X-API-Key header)
- [ ] Requires environment (X-Environment header)
- [ ] Validates request schema with class-validator
- [ ] Returns 400 for invalid requests

### Feature Evaluation
- [ ] Evaluates multiple features in single request
- [ ] Returns boolean value per feature
- [ ] Returns evaluation reason (for debugging)
- [ ] Unknown features return default (configurable)

### Limit Evaluation
- [ ] Checks multiple limits in single request
- [ ] Returns: allowed, current, limit, remaining
- [ ] Does NOT increment usage (separate endpoint)
- [ ] Returns overage info if exceeded

### Response Format
- [ ] Consistent JSON structure
- [ ] Includes request_id for tracing
- [ ] Includes evaluation timestamp
- [ ] Optionally includes debug info (reason per flag)

### Performance
- [ ] < 50ms p99 latency target
- [ ] Redis caching for hot paths
- [ ] Batch database queries (avoid N+1)
- [ ] Connection pooling

### Idempotency
- [ ] Same request always returns same result
- [ ] No side effects (read-only operation)
- [ ] Safe to retry on network failure

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Evaluation Controller
- [ ] Create `apps/api/src/flagship/evaluation/evaluation.controller.ts`
- [ ] POST /v1/evaluate endpoint
- [ ] Apply ApiKeyGuard and EnvironmentGuard
- [ ] Swagger documentation

#### 1.2 Evaluation DTO
- [ ] Create `apps/api/src/flagship/evaluation/dto/evaluate.dto.ts`
- [ ] Request DTO with features[], limits[], context
- [ ] Response DTO with structured results
- [ ] Validation decorators

#### 1.3 Evaluation Service
- [ ] Create `apps/api/src/flagship/evaluation/evaluation.service.ts`
- [ ] Orchestrate feature + limit evaluation
- [ ] Parallel evaluation for performance
- [ ] Error handling with partial results

#### 1.4 Feature Evaluator
- [ ] Create `apps/api/src/flagship/evaluation/feature-evaluator.ts`
- [ ] Implement override → plan → percentage → default chain
- [ ] Deterministic percentage hashing
- [ ] Cache feature definitions

#### 1.5 Limit Evaluator
- [ ] Create `apps/api/src/flagship/evaluation/limit-evaluator.ts`
- [ ] Query current usage from metrics table
- [ ] Compare against plan limits
- [ ] Return remaining capacity

#### 1.6 Caching Layer
- [ ] Cache feature definitions in Redis (5 min TTL)
- [ ] Cache plan limits in Redis (5 min TTL)
- [ ] Cache invalidation on updates
- [ ] Fallback to database on cache miss

#### 1.7 Module Setup
- [ ] Create `apps/api/src/flagship/evaluation/evaluation.module.ts`
- [ ] Register in FlagShipModule
- [ ] Configure dependencies

---

## Test Plan

### Unit Tests
- [ ] Controller validates request schema
- [ ] Service orchestrates evaluators correctly
- [ ] Feature evaluator follows priority chain
- [ ] Limit evaluator calculates remaining
- [ ] Unknown feature handling

### Integration Tests
- [ ] Full request → response flow
- [ ] Redis caching behavior
- [ ] Concurrent request handling
- [ ] Partial failure handling

### E2E Tests
- [ ] SDK calls /v1/evaluate
- [ ] Response matches expected format
- [ ] Performance within SLA (< 50ms)

### Load Tests
- [ ] 1000 RPS sustained
- [ ] p99 < 50ms under load
- [ ] No memory leaks

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/evaluate` | Evaluate features and limits |

### Request Schema

```typescript
interface EvaluateRequest {
  // Feature keys to evaluate
  features?: string[];

  // Limit metrics to check
  limits?: string[];

  // Additional context for evaluation
  context?: {
    userId?: string;
    planId?: string;
    attributes?: Record<string, string | number | boolean>;
  };

  // Include debug info in response
  debug?: boolean;
}
```

### Response Schema

```typescript
interface EvaluateResponse {
  // Request tracking
  requestId: string;
  evaluatedAt: string;
  environment: string;

  // Feature results
  features: Record<string, {
    value: boolean;
    reason?: 'override' | 'plan' | 'percentage' | 'default';
  }>;

  // Limit results
  limits: Record<string, {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    period: string;
    periodEnds?: string;
  }>;

  // Debug info (if requested)
  debug?: {
    evaluationTimeMs: number;
    cacheHits: string[];
    cacheMisses: string[];
  };
}
```

### Request/Response Example

```json
// POST /v1/evaluate
// Headers: X-API-Key: fsk_live_xxx, X-Environment: prod
{
  "features": ["billing_v2", "ai_chat", "advanced_analytics"],
  "limits": ["api_calls", "storage_bytes"],
  "context": {
    "userId": "usr_abc123"
  },
  "debug": true
}

// Response
{
  "requestId": "req_xyz789",
  "evaluatedAt": "2024-01-15T10:30:00.123Z",
  "environment": "prod",
  "features": {
    "billing_v2": { "value": true, "reason": "plan" },
    "ai_chat": { "value": false, "reason": "plan" },
    "advanced_analytics": { "value": true, "reason": "override" }
  },
  "limits": {
    "api_calls": {
      "allowed": true,
      "current": 9501,
      "limit": 10000,
      "remaining": 499,
      "period": "month",
      "periodEnds": "2024-01-31T23:59:59Z"
    },
    "storage_bytes": {
      "allowed": false,
      "current": 10737418240,
      "limit": 10737418240,
      "remaining": 0,
      "period": "billing"
    }
  },
  "debug": {
    "evaluationTimeMs": 12,
    "cacheHits": ["features:org_123", "limits:org_123"],
    "cacheMisses": []
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_REQUEST` | Request schema validation failed |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 403 | `ENVIRONMENT_ACCESS_DENIED` | API key not authorized for environment |
| 500 | `EVALUATION_ERROR` | Internal evaluation error |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `ApiKeyGuard` | Authenticate API requests |
| `RateLimitingGuard` | Protect endpoint from abuse |
| Redis connection | Caching layer |
| Request ID middleware | Trace requests |
| Pino logger | Structured logging |
| OpenTelemetry | Distributed tracing |

### Patterns to Follow
- Controller → Service → Repository pattern
- DTO validation with class-validator
- Swagger documentation
- Exception filters for error handling

---

## Design Rules (from agents.md)

- **Server-side enforcement only** - This is the server responding to checks
- **Fail-closed for limits** - If error, deny the action
- **Fail-open for non-critical flags** - Configurable per feature
- **Idempotent request handling** - No side effects
- **Explicit permission checks** - API key must have evaluation scope

---

## Migration Notes

- New endpoint under FlagShip namespace
- Does not conflict with ForgeStack's existing endpoints
- Requires Feature Flags and Usage Limits epics complete

