# Usage Ingestion API

**Epic:** Usage Ingestion API  
**Priority:** P0 (Core Product - Secondary Endpoint)  
**Depends on:** Epic 1 (Core Domain), Epic 4 (Usage Limits)  
**Status:** Draft

---

## Overview

The Usage Ingestion API allows SaaS backends to report consumption events to FlagShip. After a billable action occurs (API call made, storage used, seat activated), the client reports it to FlagShip for tracking and limit enforcement.

### Key Components
- **POST /v1/usage/ingest** - Record usage events
- **Batch Ingestion** - Multiple events in one request
- **Async Processing** - Queue for high-volume ingestion
- **Idempotency** - Prevent duplicate counting

### Architecture

```
Usage Ingestion Flow:
┌────────────────────────────────────────────────────────────────┐
│              Client Application (After Action)                  │
│                                                                 │
│  // User made API call - report it                             │
│  flagship.ingest('api_calls', 1)                               │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  POST /v1/usage/ingest                          │
│  {                                                              │
│    "events": [                                                  │
│      { "metric": "api_calls", "delta": 1, "idempotencyKey": "req_123" }
│    ]                                                            │
│  }                                                              │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Ingestion Service                              │
│  1. Validate events                                             │
│  2. Check idempotency keys                                      │
│  3. Queue for processing (high volume)                          │
│     OR process immediately (low volume)                         │
└─────────────────────────────┬──────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │ Immediate                               │ Queued
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────────┐
│ Direct DB Update    │               │  Worker Processing      │
│ UPDATE usage_metrics│               │  Batch aggregation      │
│ SET value = value+1 │               │  Write to DB            │
└─────────────────────┘               └─────────────────────────┘
```

---

## Acceptance Criteria

### Event Ingestion
- [ ] Accept single event ingestion
- [ ] Accept batch event ingestion (up to 1000 events)
- [ ] Validate metric key exists for organization
- [ ] Support positive and negative deltas

### Idempotency
- [ ] Idempotency key prevents duplicate processing
- [ ] Key valid for 24 hours
- [ ] Return success if already processed (not error)
- [ ] Store idempotency keys in Redis

### Timestamp Handling
- [ ] Accept optional timestamp per event
- [ ] Default to server time if not provided
- [ ] Reject timestamps > 1 hour in future
- [ ] Allow timestamps up to 7 days in past

### Response Format
- [ ] Return accepted count
- [ ] Return rejected events with reasons
- [ ] Include current usage after ingestion
- [ ] Include remaining capacity

### Performance
- [ ] < 100ms p99 for single event
- [ ] < 500ms p99 for batch (1000 events)
- [ ] Async queue for sustained high volume
- [ ] Atomic counter updates

### Rate Limiting
- [ ] Per-org ingestion rate limits
- [ ] Separate from evaluation rate limits
- [ ] 10,000 events/minute for free tier
- [ ] Unlimited for enterprise

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Ingestion Controller
- [ ] Create `apps/api/src/flagship/usage/ingestion.controller.ts`
- [ ] POST /v1/usage/ingest endpoint
- [ ] Apply ApiKeyGuard and EnvironmentGuard
- [ ] Swagger documentation

#### 1.2 Ingestion DTO
- [ ] Create `apps/api/src/flagship/usage/dto/ingest.dto.ts`
- [ ] Event schema: metric, delta, timestamp, idempotencyKey, metadata
- [ ] Batch wrapper with events array
- [ ] Validation decorators

#### 1.3 Ingestion Service
- [ ] Create `apps/api/src/flagship/usage/ingestion.service.ts`
- [ ] Validate metric keys
- [ ] Check idempotency
- [ ] Route to direct or queued processing

#### 1.4 Idempotency Service
- [ ] Create `apps/api/src/flagship/usage/idempotency.service.ts`
- [ ] Redis-based key storage
- [ ] 24-hour TTL
- [ ] Atomic check-and-set

#### 1.5 Usage Aggregation
- [ ] Atomic counter increment in DB
- [ ] Period-aware aggregation
- [ ] Handle concurrent updates

#### 1.6 Queue Integration
- [ ] Create ingestion queue in BullMQ
- [ ] Batch processor for high volume
- [ ] Dead letter handling

### 2. Worker Tasks

#### 2.1 Ingestion Processor
- [ ] Create `apps/worker/src/handlers/usage-ingestion.handler.ts`
- [ ] Process batched events
- [ ] Aggregate before DB write
- [ ] Retry on failure

---

## Test Plan

### Unit Tests
- [ ] Controller validates event schema
- [ ] Idempotency key prevents duplicates
- [ ] Negative delta handling
- [ ] Timestamp validation

### Integration Tests
- [ ] Full ingestion → counter update flow
- [ ] Batch processing
- [ ] Queue integration
- [ ] Concurrent ingestion

### E2E Tests
- [ ] SDK ingests event
- [ ] Counter reflects change
- [ ] Idempotency works across retries

### Load Tests
- [ ] 10,000 events/second sustained
- [ ] Queue backpressure handling
- [ ] No duplicate counting under load

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/usage/ingest` | Record usage events |

### Request Schema

```typescript
interface IngestRequest {
  // Single event or batch
  events: UsageEvent[];
}

interface UsageEvent {
  // Metric identifier (e.g., 'api_calls', 'storage_bytes')
  metric: string;

  // Change amount (positive or negative)
  delta: number;

  // When the event occurred (ISO 8601)
  timestamp?: string;

  // Idempotency key to prevent duplicates
  idempotencyKey?: string;

  // Additional context
  metadata?: Record<string, string | number>;
}
```

### Response Schema

```typescript
interface IngestResponse {
  // Request tracking
  requestId: string;
  processedAt: string;

  // Processing results
  accepted: number;
  rejected: number;

  // Rejected event details
  errors?: Array<{
    index: number;
    metric: string;
    reason: string;
  }>;

  // Current state after ingestion
  summary?: Record<string, {
    current: number;
    limit: number;
    remaining: number;
  }>;
}
```

### Request/Response Example

```json
// POST /v1/usage/ingest
// Headers: X-API-Key: fsk_live_xxx, X-Environment: prod
{
  "events": [
    {
      "metric": "api_calls",
      "delta": 1,
      "idempotencyKey": "req_abc123",
      "metadata": { "endpoint": "/api/users", "method": "GET" }
    },
    {
      "metric": "storage_bytes",
      "delta": 1048576,
      "idempotencyKey": "upload_xyz789"
    }
  ]
}

// Response
{
  "requestId": "req_ing_456",
  "processedAt": "2024-01-15T10:30:00.123Z",
  "accepted": 2,
  "rejected": 0,
  "summary": {
    "api_calls": {
      "current": 9502,
      "limit": 10000,
      "remaining": 498
    },
    "storage_bytes": {
      "current": 5368709120,
      "limit": 10737418240,
      "remaining": 5368709120
    }
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_EVENT` | Event schema validation failed |
| 400 | `UNKNOWN_METRIC` | Metric key not defined |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 429 | `RATE_LIMITED` | Ingestion rate limit exceeded |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `ApiKeyGuard` | Authenticate API requests |
| Redis | Idempotency key storage |
| BullMQ | Queue for batch processing |
| `usage` module | Pattern reference for counters |

### Patterns to Follow
- Worker handler pattern from `apps/worker/src/handlers/`
- Queue service pattern from `apps/api/src/queue/`
- Redis operations from rate limiting module

---

## Design Rules (from agents.md)

- **Idempotent request handling** - Same key = same result
- **Explicit schemas** - Validate all input
- **Safe reprocessing** - Queue items can be retried
- **Fail-closed for limits** - If ingestion fails, action should be blocked

---

## Migration Notes

- New endpoint under FlagShip namespace
- New BullMQ queue for ingestion processing
- Idempotency keys stored in Redis with 24h TTL
- Consider partitioning usage_metrics table for high volume

