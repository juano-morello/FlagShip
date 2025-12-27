# Audit Events

**Epic:** Audit Events  
**Priority:** P0 (Compliance Requirement)  
**Depends on:** Epic 1 (Core Domain), Epic 2 (Multi-Tenant)  
**Status:** Draft

---

## Overview

FlagShip's audit system provides immutable logging of all critical actions for compliance, debugging, and accountability. Every configuration change, evaluation decision, and limit enforcement is recorded with full context to enable reconstruction of system behavior.

### Key Components
- **Audit Event Emission** - Automatic logging of critical actions
- **Immutable Storage** - Append-only audit log
- **Query Interface** - Search and filter audit events
- **Export Capability** - Compliance report generation

### Architecture

```
Audit Event Flow:
┌────────────────────────────────────────────────────────────────┐
│                      Action Occurs                              │
│  Feature created | Limit changed | Evaluation performed        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   AuditService.emit()                           │
│  {                                                              │
│    action: 'feature.created',                                   │
│    actor: { id, type, ip },                                    │
│    resource: { type, id },                                     │
│    changes: { before, after },                                 │
│    context: { requestId, environment }                         │
│  }                                                              │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Queue (async)                               │
│              audit-events queue in BullMQ                       │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Audit Worker Handler                           │
│  1. Validate event schema                                       │
│  2. Enrich with metadata                                        │
│  3. Write to audit_events table                                │
│  4. (Optional) Forward to external system                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Event Emission
- [ ] All configuration changes emit audit events
- [ ] All evaluation requests optionally emit events
- [ ] Events include actor, action, resource, timestamp
- [ ] Events include before/after state for changes

### Actor Types
- [ ] User - human via web panel
- [ ] ApiKey - system via API
- [ ] System - automated processes
- [ ] Impersonation - admin acting as user

### Event Actions
- [ ] feature.created, feature.updated, feature.deleted
- [ ] limit.created, limit.updated, limit.deleted
- [ ] rule.created, rule.updated, rule.deleted
- [ ] evaluation.performed (optional, high-volume)
- [ ] limit.enforced (when action blocked)

### Immutability
- [ ] Audit table has no UPDATE or DELETE permissions
- [ ] Events cannot be modified after creation
- [ ] Soft-delete not supported for audit logs

### Query Interface
- [ ] Filter by action type
- [ ] Filter by actor
- [ ] Filter by resource
- [ ] Filter by date range
- [ ] Pagination with cursor

### Export
- [ ] Export to JSON format
- [ ] Export to CSV format
- [ ] Date range selection
- [ ] Include all event fields

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Audit Schema
- [ ] Create `packages/db/src/schema/flagship/audit-events.ts`
- [ ] Fields: id, org_id, action, actor, resource, changes, metadata, created_at
- [ ] Indexes on org_id, action, created_at
- [ ] RLS policy for org-scoped access

#### 1.2 Audit Service
- [ ] Create `apps/api/src/flagship/audit/audit.service.ts`
- [ ] emit() method queues event
- [ ] Sync mode for critical events
- [ ] Include request context automatically

#### 1.3 Audit Types
- [ ] Create `apps/api/src/flagship/audit/types.ts`
- [ ] AuditEvent interface
- [ ] AuditAction enum
- [ ] ActorType enum

#### 1.4 Audit Repository
- [ ] Create `apps/api/src/flagship/audit/audit.repository.ts`
- [ ] Insert-only operations
- [ ] Query with filters
- [ ] Cursor-based pagination

#### 1.5 Audit Controller
- [ ] Create `apps/api/src/flagship/audit/audit.controller.ts`
- [ ] GET /v1/audit-events (list)
- [ ] GET /v1/audit-events/export (download)
- [ ] Require audit:read permission

#### 1.6 Audit Decorator
- [ ] Create `@Audited(action)` decorator
- [ ] Auto-emit events for decorated methods
- [ ] Capture before/after state

### 2. Worker Tasks

#### 2.1 Audit Handler
- [ ] Create `apps/worker/src/handlers/flagship-audit.handler.ts`
- [ ] Process audit event queue
- [ ] Validate and persist events
- [ ] Handle failures gracefully

---

## Test Plan

### Unit Tests
- [ ] Audit service emits events correctly
- [ ] Event validation rejects invalid schemas
- [ ] Actor enrichment works
- [ ] Repository queries work

### Integration Tests
- [ ] Full emit → queue → persist flow
- [ ] Query filters work
- [ ] Export generates valid files

### E2E Tests
- [ ] Create feature → audit event appears
- [ ] Admin can view audit log
- [ ] Export downloads correctly

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/audit-events` | List audit events |
| GET | `/v1/audit-events/export` | Export audit events |

### Event Schema

```typescript
interface AuditEvent {
  id: string;
  organizationId: string;

  // What happened
  action: string;  // e.g., 'feature.created'

  // Who did it
  actor: {
    type: 'user' | 'api_key' | 'system';
    id: string;
    name?: string;
    ip?: string;
  };

  // What was affected
  resource: {
    type: string;  // e.g., 'feature'
    id: string;
    name?: string;
  };

  // State changes
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };

  // Request context
  context: {
    requestId: string;
    environment?: string;
    userAgent?: string;
  };

  // Timestamp (immutable)
  createdAt: string;
}
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| action | string | Filter by action type |
| actorId | string | Filter by actor ID |
| resourceType | string | Filter by resource type |
| resourceId | string | Filter by resource ID |
| from | ISO 8601 | Start of date range |
| to | ISO 8601 | End of date range |
| cursor | string | Pagination cursor |
| limit | number | Results per page (max 100) |

### Request/Response Example

```json
// GET /v1/audit-events?action=feature.created&limit=10
{
  "events": [
    {
      "id": "evt_abc123",
      "organizationId": "org_xyz",
      "action": "feature.created",
      "actor": {
        "type": "user",
        "id": "usr_admin",
        "name": "Admin User",
        "ip": "192.168.1.1"
      },
      "resource": {
        "type": "feature",
        "id": "feat_billing_v2",
        "name": "billing_v2"
      },
      "changes": {
        "before": null,
        "after": {
          "key": "billing_v2",
          "type": "plan",
          "plans": ["pro", "enterprise"]
        }
      },
      "context": {
        "requestId": "req_xyz789",
        "environment": "prod"
      },
      "createdAt": "2024-01-15T10:30:00.123Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "cursor": "eyJpZCI6ImV2dF9hYmMxMjMifQ=="
  }
}
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `audit-logs` module | Pattern reference |
| `audit_logs` table | Different from FlagShip's audit |
| BullMQ queue | Async event processing |
| Request ID middleware | Correlate events |

### Differences from ForgeStack Audit Logs
| Aspect | ForgeStack | FlagShip |
|--------|------------|----------|
| Scope | Internal platform | Customer-facing product |
| Volume | Low (admin actions) | High (evaluations possible) |
| Export | CSV/JSON | Same, but customer-accessible |
| Retention | Platform policy | Customer-configurable |

---

## Design Rules (from agents.md)

- **Audit events for all critical actions** - Comprehensive logging
- **Immutable** - No modifications allowed
- **Reconstructable** - Logs must enable replay of actions
- **Async processing** - Non-blocking event emission

---

## Migration Notes

- New `flagship_audit_events` table separate from ForgeStack's `audit_logs`
- Higher volume consideration for evaluation logging
- May need partitioning by date for large deployments
- Consider external audit log forwarding (Datadog, Splunk)

