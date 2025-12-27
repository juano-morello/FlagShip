# Async Usage Ingestion (BullMQ Queue Integration)

**Epic:** Usage Ingestion
**Priority:** P1
**Depends on:** Usage Ingestion API (Complete), BullMQ Infrastructure (Complete)
**Status:** Draft

---

## Overview

The current `POST /v1/usage/ingest` endpoint processes usage events synchronously, which works for low volume but will bottleneck under high load. This spec adds asynchronous processing via BullMQ to decouple event ingestion from metric aggregation.

### Key Components
- **API Layer**: Validates events immediately, queues for async processing, returns `202 Accepted`
- **Queue**: `flagship:usage-ingest` BullMQ queue with retry policy and DLQ
- **Worker Handler**: Processes queued events idempotently and updates usage metrics

### Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  POST /v1/usage │         │     Redis       │         │  BullMQ Worker  │
│    /ingest      │         │                 │         │                 │
│                 │         │  flagship:      │         │  usage-ingest   │
│  1. Validate    │ ──────▶ │  usage-ingest   │ ◀────── │  .handler.ts    │
│  2. Queue job   │         │                 │         │                 │
│  3. Return 202  │         │  flagship:      │         │  Retries: 3     │
│                 │         │  usage-ingest   │         │  Exp. backoff   │
└─────────────────┘         │  -dlq (failed)  │         └─────────────────┘
                            └─────────────────┘
```

---

## User Stories

### US-1: High-Volume Usage Ingestion
**As a** FlagShip customer  
**I want** the usage ingestion API to handle high volumes without timing out  
**So that** my application doesn't experience latency from usage tracking

### US-2: Reliable Event Processing
**As a** FlagShip customer  
**I want** failed usage events to be retried automatically  
**So that** temporary failures don't result in lost usage data

### US-3: Job Visibility
**As a** FlagShip operator  
**I want** visibility into queued and failed jobs  
**So that** I can monitor system health and debug issues

---

## Acceptance Criteria

### API Behavior
- [ ] `POST /v1/usage/ingest` validates events synchronously (schema, timestamp bounds)
- [ ] Returns `202 Accepted` after successful queue enqueue (not `200 OK`)
- [ ] Response includes `requestId` for tracking and `status: 'queued'`
- [ ] Validation errors return `400 Bad Request` immediately (not queued)

### Queue Configuration
- [ ] Queue named `flagship:usage-ingest` added to `packages/shared/src/queues.ts`
- [ ] Retry policy: 3 attempts with exponential backoff (1s, 2s, 4s)
- [ ] Dead letter queue: `flagship:usage-ingest-dlq` for jobs that exhaust retries
- [ ] Job options: `removeOnComplete: 100`, `removeOnFail: 1000`

### Worker Processing
- [ ] Worker processes events using existing `IdempotencyService`
- [ ] Worker uses `UsageRepository.incrementUsage()` for metric updates
- [ ] Duplicate events are skipped gracefully (idempotency key check)
- [ ] Processing failures trigger retry with backoff

### Observability
- [ ] Structured logs for: job enqueued, processing started, completed, failed
- [ ] Logs include: `requestId`, `environmentId`, `eventCount`, `jobId`
- [ ] OpenTelemetry tracing spans for job execution (via existing `withTracing`)

---

## Tasks & Subtasks

### 1. Queue Configuration

#### 1.1 Add Queue Names
- [ ] Add `FLAGSHIP_USAGE_INGEST` to `packages/shared/src/queues.ts`
- [ ] Add `FLAGSHIP_USAGE_INGEST_DLQ` for dead letter queue
- [ ] Update queue tests in `packages/shared/src/__tests__/queues.test.ts`

### 2. Backend Tasks

#### 2.1 Create Job Schema
- [ ] Create `apps/api/src/flagship/usage/dto/usage-ingest-job.dto.ts`
- [ ] Define `UsageIngestJobData` interface with Zod validation

#### 2.2 Update Ingestion Controller
- [ ] Change return status from `200 OK` to `202 Accepted`
- [ ] Add new `AsyncIngestResponseDto` with `status: 'queued'`
- [ ] Update OpenAPI annotations

#### 2.3 Create Ingestion Queue Service
- [ ] Create `apps/api/src/flagship/usage/ingestion-queue.service.ts`
- [ ] Inject `QueueService` and queue validated events
- [ ] Configure job options (retries, backoff, DLQ)

#### 2.4 Update Ingestion Service
- [ ] Add `validateOnly()` method for synchronous validation
- [ ] Keep `ingest()` method for worker processing

### 3. Worker Tasks

#### 3.1 Create Usage Ingest Handler
- [ ] Create `apps/worker/src/handlers/flagship/usage-ingest.handler.ts`
- [ ] Import and use `IdempotencyService` and `UsageRepository`
- [ ] Process events in batch with proper error handling

#### 3.2 Register Worker
- [ ] Import handler in `apps/worker/src/worker.ts`
- [ ] Register with `createWorker<UsageIngestJobData>()`

### 4. Testing Tasks

#### 4.1 Backend Tests
- [ ] Unit tests for `IngestionQueueService`
- [ ] Update controller tests for 202 response
- [ ] Integration tests for queue → handler flow

#### 4.2 Worker Tests
- [ ] Unit tests for `handleUsageIngest` handler
- [ ] Test idempotency (duplicate events skipped)
- [ ] Test retry behavior on transient failures

---

## Test Plan

### Unit Tests
- [ ] `IngestionQueueService.enqueue()` adds job to queue with correct options
- [ ] `IngestionService.validateOnly()` returns validation errors without processing
- [ ] `handleUsageIngest` processes valid events and updates metrics
- [ ] `handleUsageIngest` skips duplicate events via IdempotencyService
- [ ] `handleUsageIngest` throws on transient errors (triggers retry)

### Integration Tests
- [ ] Full flow: API → Queue → Worker → Database
- [ ] Retry with exponential backoff on failure
- [ ] DLQ population after max retries exhausted

### E2E Tests
- [ ] POST /v1/usage/ingest returns 202 with `status: 'queued'`
- [ ] Usage metrics updated after worker processes job
- [ ] Duplicate idempotency keys result in single metric update

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/usage/ingest` | Queue usage events for async processing |

### Request Schema (unchanged)

```typescript
interface IngestRequest {
  events: UsageEvent[];
}

interface UsageEvent {
  metric: string;        // e.g., 'api_calls', 'storage_bytes'
  delta: number;         // Change amount
  timestamp?: string;    // ISO 8601
  idempotencyKey?: string;
  metadata?: Record<string, string | number>;
}
```

### Response Schema (updated for async)

```typescript
// HTTP 202 Accepted (success)
interface AsyncIngestResponse {
  requestId: string;          // UUID for tracking
  status: 'queued';           // Processing status
  queuedAt: string;           // ISO 8601 timestamp
  eventCount: number;         // Number of events queued
  validationErrors?: Array<{  // Only if some events failed validation
    index: number;
    metric: string;
    reason: string;
  }>;
}

// HTTP 400 Bad Request (all events invalid)
interface ValidationErrorResponse {
  statusCode: 400;
  message: string;
  errors: Array<{
    index: number;
    metric: string;
    reason: string;
  }>;
}
```

### Request/Response Example

```json
// POST /v1/usage/ingest
// Headers: X-API-Key: fsk_live_xxx, X-Environment: env_abc123
{
  "events": [
    { "metric": "api_calls", "delta": 1, "idempotencyKey": "req_abc123" },
    { "metric": "storage_bytes", "delta": 1048576 }
  ]
}

// Response: 202 Accepted
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "queuedAt": "2024-01-15T10:30:00.000Z",
  "eventCount": 2
}
```

---

## Job Schema

### Job Name
`flagship:usage-ingest`

### Job Payload

```typescript
interface UsageIngestJobData {
  // Request tracking
  requestId: string;

  // Context (from API authentication)
  environmentId: string;
  orgId: string;
  projectId: string;

  // Events to process
  events: Array<{
    metric: string;
    delta: number;
    timestamp?: string;
    idempotencyKey?: string;
    metadata?: Record<string, string | number>;
  }>;

  // Metadata
  queuedAt: string;  // ISO 8601
}
```

### Job Options

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,  // 1s, 2s, 4s
  },
  removeOnComplete: 100,  // Keep last 100 completed
  removeOnFail: 1000,     // Keep last 1000 failed
}
```

### Dead Letter Queue
Jobs that exhaust all retries are moved to `flagship:usage-ingest-dlq` for manual inspection.

---

## Queue Configuration

Add to `packages/shared/src/queues.ts`:

```typescript
export const QUEUE_NAMES = {
  // ... existing queues
  FLAGSHIP_USAGE_INGEST: 'flagship:usage-ingest',
  FLAGSHIP_USAGE_INGEST_DLQ: 'flagship:usage-ingest-dlq',
} as const;
```

---

## Observability

### Structured Logs

```typescript
// On enqueue (API)
logger.info({ requestId, environmentId, eventCount }, 'Usage events queued');

// On processing start (Worker)
logger.info({ jobId, requestId, eventCount }, 'Processing usage ingest job');

// On success (Worker)
logger.info({ jobId, requestId, processed, skipped }, 'Usage ingest completed');

// On failure (Worker)
logger.error({ jobId, requestId, error }, 'Usage ingest failed');
```

### OpenTelemetry
Worker uses existing `withTracing()` wrapper for automatic span creation:
- Span name: `flagship:usage-ingest process`
- Attributes: `job.id`, `request_id`, `environment_id`, `event_count`

---

## Migration Notes

### Breaking Change: Response Status Code
- **Before**: `200 OK` with synchronous processing
- **After**: `202 Accepted` with async processing

Clients should handle both status codes during rollout:
```typescript
const response = await fetch('/v1/usage/ingest', { ... });
if (response.status === 200 || response.status === 202) {
  // Success - events accepted
}
```

### Backward Compatibility
Consider feature flag `FLAGSHIP_ASYNC_INGESTION=true` to enable gradual rollout.

