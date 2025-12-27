# Worker Jobs

**Epic:** Worker Jobs  
**Priority:** P1 (Async Processing)  
**Depends on:** Epic 1-7 (All Core Epics)  
**Status:** Draft

---

## Overview

FlagShip's worker system handles asynchronous enforcement, background processing, and scheduled tasks. It ensures durability, retry logic, and proper handling of failed jobs - all signals of senior-level operational discipline.

### Key Components
- **Job Handlers** - Process specific job types
- **Retry Logic** - Exponential backoff with max attempts
- **Dead Letter Queue** - Failed job handling
- **Auto-Actions** - Automated responses to events
- **Scheduled Jobs** - Periodic maintenance tasks

### Architecture

```
Worker Architecture:
┌────────────────────────────────────────────────────────────────┐
│                        API Server                               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Audit Emit  │  │ Usage Ingest│  │ Threshold Notification  │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      Redis (BullMQ)                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ audit-events│  │usage-ingest │  │  notifications          │ │
│  │    queue    │  │   queue     │  │      queue              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      Worker Node                                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │AuditHandler │  │IngestHandler│  │ NotificationHandler     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Scheduled Jobs                        │   │
│  │  - Period rollover (hourly/daily/monthly)               │   │
│  │  - Usage aggregation                                     │   │
│  │  - Dead letter cleanup                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Job Handlers
- [ ] Audit event handler persists events
- [ ] Usage ingestion handler aggregates metrics
- [ ] Notification handler sends alerts
- [ ] Flag disable handler for auto-actions
- [ ] All handlers are idempotent

### Retry Logic
- [ ] Exponential backoff: 1s, 2s, 4s, 8s, 16s
- [ ] Max 5 retry attempts
- [ ] Dead letter after max retries
- [ ] Retry metadata preserved

### Dead Letter Handling
- [ ] Failed jobs moved to DLQ
- [ ] DLQ viewable in admin
- [ ] Manual retry from DLQ
- [ ] Automatic cleanup after 30 days

### Auto-Actions
- [ ] Disable flag when threshold reached
- [ ] Send notification on limit approach
- [ ] Email on limit exceeded
- [ ] Configurable per-organization

### Scheduled Jobs
- [ ] Period rollover at boundaries
- [ ] Usage aggregation daily
- [ ] DLQ cleanup weekly
- [ ] Health check monitoring

### Required Properties (from agents.md)
- [ ] Idempotent handlers
- [ ] Explicit schemas
- [ ] Safe reprocessing

---

## Tasks & Subtasks

### 1. Worker Tasks

#### 1.1 Audit Handler
- [ ] Create `apps/worker/src/handlers/flagship/audit.handler.ts`
- [ ] Validate event schema
- [ ] Persist to database
- [ ] Handle duplicates gracefully

#### 1.2 Usage Ingestion Handler
- [ ] Create `apps/worker/src/handlers/flagship/usage-ingestion.handler.ts`
- [ ] Batch aggregate events
- [ ] Atomic counter updates
- [ ] Emit threshold events

#### 1.3 Notification Handler
- [ ] Create `apps/worker/src/handlers/flagship/notification.handler.ts`
- [ ] Check notification preferences
- [ ] Send email via Resend
- [ ] Send webhook to external systems

#### 1.4 Auto-Action Handler
- [ ] Create `apps/worker/src/handlers/flagship/auto-action.handler.ts`
- [ ] Disable feature flag
- [ ] Block API key
- [ ] Log action for audit

#### 1.5 Period Rollover Job
- [ ] Create `apps/worker/src/handlers/flagship/period-rollover.handler.ts`
- [ ] Archive previous period
- [ ] Initialize new period
- [ ] Scheduled via cron

#### 1.6 DLQ Monitor
- [ ] Create DLQ dashboard endpoint
- [ ] Implement manual retry
- [ ] Implement bulk cleanup

### 2. Infrastructure Tasks

#### 2.1 Queue Configuration
- [ ] Define FlagShip queues in `packages/shared/src/queues.ts`
- [ ] Configure retry policies
- [ ] Set up DLQ queues

#### 2.2 Job Schemas
- [ ] Create job payload schemas
- [ ] Zod validation for each job type
- [ ] TypeScript types exported

---

## Test Plan

### Unit Tests
- [ ] Each handler processes valid input
- [ ] Each handler rejects invalid input
- [ ] Idempotency works for duplicates
- [ ] Retry logic triggers correctly

### Integration Tests
- [ ] Full queue → handler → database flow
- [ ] Retry with backoff
- [ ] DLQ population on failure

### E2E Tests
- [ ] Audit events appear after actions
- [ ] Notifications sent on threshold
- [ ] Period rollover resets counters

---

## API Reference

### Queue Definitions

| Queue | Purpose | Retry Policy |
|-------|---------|--------------|
| `flagship:audit` | Audit event persistence | 5 retries, exponential |
| `flagship:usage` | Usage metric aggregation | 5 retries, exponential |
| `flagship:notifications` | Alert delivery | 3 retries, linear |
| `flagship:auto-actions` | Automated enforcement | 3 retries, exponential |
| `flagship:maintenance` | Scheduled tasks | No retry |

### Job Payload Schemas

```typescript
// Audit Event Job
interface AuditEventJob {
  type: 'audit-event';
  payload: {
    event: AuditEvent;
  };
}

// Usage Ingestion Job
interface UsageIngestionJob {
  type: 'usage-ingestion';
  payload: {
    orgId: string;
    events: UsageEvent[];
    batchId: string;
  };
}

// Notification Job
interface NotificationJob {
  type: 'notification';
  payload: {
    orgId: string;
    type: 'threshold_warning' | 'limit_exceeded' | 'feature_disabled';
    data: Record<string, unknown>;
  };
}

// Auto-Action Job
interface AutoActionJob {
  type: 'auto-action';
  payload: {
    orgId: string;
    action: 'disable_feature' | 'block_api_key' | 'send_notification';
    targetId: string;
    reason: string;
  };
}
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `apps/worker` | Extend with FlagShip handlers |
| BullMQ infrastructure | Reuse queue setup |
| Handler pattern | Follow existing handler structure |
| Email service | Send notifications via Resend |

### New Queues
Add to `packages/shared/src/queues.ts`:
```typescript
export const FLAGSHIP_QUEUES = {
  AUDIT: 'flagship:audit',
  USAGE: 'flagship:usage',
  NOTIFICATIONS: 'flagship:notifications',
  AUTO_ACTIONS: 'flagship:auto-actions',
  MAINTENANCE: 'flagship:maintenance',
};
```

---

## Design Rules (from agents.md)

### Worker Responsibilities
- Process background jobs
- Retry with backoff
- Dead-letter handling
- Auto-actions (flag disable, notifications)
- Batch audit persistence

### Required Properties
- **Idempotent handlers** - Same input = same result
- **Explicit schemas** - Validate all job payloads
- **Safe reprocessing** - Can retry without side effects

---

## Migration Notes

- Adds FlagShip-specific queues to existing worker
- Follows ForgeStack handler patterns
- No modifications to existing ForgeStack handlers
- New scheduled jobs via BullMQ repeat option

