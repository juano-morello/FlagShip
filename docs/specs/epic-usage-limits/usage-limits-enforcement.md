# Usage Limits & Enforcement

**Epic:** Usage Limits & Enforcement  
**Priority:** P0 (Core Product)  
**Depends on:** Epic 1 (Core Domain Model), Epic 2 (Multi-Tenant Foundation)  
**Status:** Draft

---

## Overview

FlagShip's usage limit system enables SaaS backends to enforce consumption-based restrictions. Customers can define limits (API calls, storage, seats, custom metrics) per plan and query whether a specific action should be allowed based on current usage.

### Key Components
- **Limit Definitions** - Named limits with thresholds per plan
- **Usage Tracking** - Increment/decrement current usage
- **Limit Enforcement** - Check if action allowed before execution
- **Overage Handling** - Configurable behavior when limits exceeded

### Architecture

```
Usage Limit Flow:
┌────────────────────────────────────────────────────────────────┐
│               Client Application (Customer)                     │
│      Before: Create API call → Check limit allowed?            │
│      After:  API call created → Increment usage                │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  FlagShip Control Plane                         │
│                                                                 │
│  ┌──────────────────┐    ┌───────────────────────────────────┐ │
│  │ Check Limit      │    │ Ingest Usage                      │ │
│  │ GET /v1/limits/  │    │ POST /v1/usage/ingest             │ │
│  │    check         │    │ { metric, delta, timestamp }      │ │
│  └────────┬─────────┘    └────────────────┬──────────────────┘ │
│           │                               │                     │
│           ▼                               ▼                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Usage Metrics Table                   │   │
│  │   org_id | metric | period | current_value | limit      │   │
│  │   org_1  | api_calls | 2024-01 | 9500 | 10000           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Limit Definitions
- [ ] Limits defined per plan (not per org directly)
- [ ] Limit types: count, storage_bytes, seats, custom
- [ ] Period types: minute, hour, day, month, billing_period
- [ ] Soft vs hard limits (warn vs block)

### Usage Tracking
- [ ] Increment usage via API (POST /v1/usage/ingest)
- [ ] Decrement usage for rollbacks
- [ ] Batch ingestion for efficiency
- [ ] Timestamp-based (allows late ingestion)

### Limit Checking
- [ ] Check single limit (GET /v1/limits/check)
- [ ] Return: allowed (boolean), current, limit, remaining
- [ ] Return: overage amount if exceeded
- [ ] Fail-closed: if error, deny action

### Enforcement Behavior
- [ ] Hard limit: request denied, return 429
- [ ] Soft limit: request allowed, warning returned
- [ ] Grace period: allow X% overage
- [ ] Notify on threshold (80%, 90%, 100%)

### Period Rollover
- [ ] Counters reset at period boundary
- [ ] Historical data preserved for analytics
- [ ] Billing period aligned with subscription

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Limit Definitions Schema
- [ ] Create `usage_limits` table in schema
- [ ] Fields: plan_id, metric_key, limit_value, period, limit_type
- [ ] Seed default limits for each plan

#### 1.2 Usage Metrics Schema
- [ ] Create `usage_metrics` table
- [ ] Fields: org_id, metric_key, period_start, current_value
- [ ] Compound index on (org_id, metric_key, period_start)

#### 1.3 Usage Service
- [ ] Create `apps/api/src/flagship/usage/usage.service.ts`
- [ ] Implement `ingest(ctx, metric, delta)`
- [ ] Implement `checkLimit(ctx, metric)`
- [ ] Handle period boundaries

#### 1.4 Usage Repository
- [ ] Create `apps/api/src/flagship/usage/usage.repository.ts`
- [ ] Atomic increment operations
- [ ] Period-aware queries

#### 1.5 Limit Enforcement Logic
- [ ] Hard limit blocks request
- [ ] Soft limit allows with warning
- [ ] Return remaining capacity

#### 1.6 Usage Controller
- [ ] Create `apps/api/src/flagship/usage/usage.controller.ts`
- [ ] POST /v1/usage/ingest
- [ ] GET /v1/limits/check

### 2. Worker Tasks

#### 2.1 Period Rollover Job
- [ ] Create cron job for period transitions
- [ ] Archive previous period data
- [ ] Initialize new period counters

#### 2.2 Threshold Notifications
- [ ] Emit event when threshold crossed
- [ ] Queue notification job

---

## Test Plan

### Unit Tests
- [ ] Usage increment/decrement
- [ ] Limit check logic
- [ ] Period boundary handling
- [ ] Soft vs hard limit behavior

### Integration Tests
- [ ] Full ingestion → check flow
- [ ] Plan change affects limits
- [ ] Period rollover preserves data

### E2E Tests
- [ ] SDK ingests usage, checks limit
- [ ] Hard limit returns 429
- [ ] Admin views usage in dashboard

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/usage/ingest` | Record usage event |
| GET | `/v1/limits/check` | Check if limit allows action |
| GET | `/v1/usage/summary` | Get current usage summary |
| GET | `/v1/usage/history` | Get historical usage data |

### Request/Response Examples

```json
// POST /v1/usage/ingest
{
  "metric": "api_calls",
  "delta": 1,
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": { "endpoint": "/api/users" }
}

// Response
{
  "accepted": true,
  "current": 9501,
  "limit": 10000,
  "remaining": 499
}
```

```json
// GET /v1/limits/check?metric=api_calls
{
  "allowed": true,
  "metric": "api_calls",
  "current": 9501,
  "limit": 10000,
  "remaining": 499,
  "period": "month",
  "periodEnds": "2024-01-31T23:59:59Z",
  "limitType": "hard"
}
```

### Error Responses
| Status | Code | Description |
|--------|------|-------------|
| 429 | `LIMIT_EXCEEDED` | Hard limit reached, action blocked |
| 200 | `LIMIT_WARNING` | Soft limit reached, action allowed |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `usage` module | **Pattern reference** - extend for FlagShip |
| `usage_records` table | Different purpose - internal tracking |
| `usage_limits` table | Can extend or create new |
| Queue infrastructure | For period rollover jobs |
| Billing service | Query org's current plan |

### Differences from ForgeStack usage
| Aspect | ForgeStack | FlagShip |
|--------|------------|----------|
| Purpose | Internal metering | Customer-facing limits |
| Tracking | Automatic interceptor | Explicit SDK calls |
| Enforcement | Rate limiting | Quota management |
| API | Admin only | Public SDK/API |

---

## Migration Notes

- May extend ForgeStack's `usage_limits` or create FlagShip-specific tables
- New `usage_metrics` table for customer usage
- Period-based aggregation different from ForgeStack's daily aggregation
- Limit definitions stored separately from rate limit config

