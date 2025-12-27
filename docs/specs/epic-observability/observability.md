# Observability

**Epic:** Observability
**Priority:** P1 (Operational Excellence)
**Depends on:** All Core Epics
**Status:** Draft

---

## Overview

FlagShip's observability stack provides comprehensive visibility into system behavior, performance, and errors. Built on ForgeStack's existing infrastructure, it extends logging, metrics, and tracing for FlagShip-specific operations.

### Key Components
- **Structured Logging** - JSON logs with context
- **Request Tracing** - Distributed trace IDs
- **Metrics Collection** - Performance and business metrics
- **Health Checks** - Readiness and liveness probes
- **Alerting** - Threshold-based notifications

### Architecture

```
Observability Stack:
┌────────────────────────────────────────────────────────────────┐
│                    FlagShip Services                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   API       │  │   Worker    │  │   Web                   │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
│         └────────────────┼─────────────────────┘                │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Observability Layer                     │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ Pino Logger │  │ OpenTelemetry│  │ Prometheus     │  │   │
│  │  │ (JSON logs) │  │ (traces)     │  │ (metrics)      │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └───────┬─────────┘  │   │
│  │         │                │                 │             │   │
│  └─────────┼────────────────┼─────────────────┼─────────────┘   │
└────────────┼────────────────┼─────────────────┼─────────────────┘
             │                │                 │
             ▼                ▼                 ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐
│ Log Aggregator │  │ Trace Backend  │  │ Metrics Backend        │
│ (Datadog/Loki) │  │ (Jaeger/Tempo) │  │ (Prometheus/Datadog)   │
└────────────────┘  └────────────────┘  └────────────────────────┘
```

---

## Acceptance Criteria

### Structured Logging
- [ ] All logs in JSON format
- [ ] Request ID in every log
- [ ] Organization ID in tenant logs
- [ ] Environment in FlagShip logs
- [ ] Log levels: debug, info, warn, error
- [ ] Sensitive data redacted

### Request Tracing
- [ ] Trace ID propagated across services
- [ ] Spans for key operations
- [ ] Database query spans
- [ ] Redis operation spans
- [ ] External API call spans

### Metrics
- [ ] Request latency histograms
- [ ] Request count by endpoint
- [ ] Error rate by type
- [ ] Evaluation latency
- [ ] Cache hit/miss ratio
- [ ] Queue depth and processing time

### Health Checks
- [ ] `/health/live` - Process alive
- [ ] `/health/ready` - Dependencies ready
- [ ] Database connectivity check
- [ ] Redis connectivity check
- [ ] Queue connectivity check

### Alerting
- [ ] Error rate threshold alerts
- [ ] Latency threshold alerts
- [ ] Queue backlog alerts
- [ ] Limit threshold notifications

---

## Tasks & Subtasks

### 1. Logging Tasks

#### 1.1 Logger Configuration
- [ ] Configure Pino for FlagShip context
- [ ] Add environment to log context
- [ ] Add organization ID to log context
- [ ] Configure log redaction

#### 1.2 Request Logging
- [ ] Log all incoming requests
- [ ] Log response status and duration
- [ ] Log errors with stack traces
- [ ] Exclude health check logs

#### 1.3 Evaluation Logging
- [ ] Log evaluation requests
- [ ] Log evaluation results (debug level)
- [ ] Log cache hits/misses
- [ ] Log errors with context

### 2. Tracing Tasks

#### 2.1 OpenTelemetry Setup
- [ ] Configure OTEL SDK
- [ ] Set up trace exporter
- [ ] Configure sampling rate
- [ ] Add service name and version

#### 2.2 Span Instrumentation
- [ ] Evaluation endpoint span
- [ ] Ingestion endpoint span
- [ ] Database query spans
- [ ] Redis operation spans

#### 2.3 Context Propagation
- [ ] Extract trace context from headers
- [ ] Propagate to downstream calls
- [ ] Include in worker jobs

### 3. Metrics Tasks

#### 3.1 Prometheus Metrics
- [ ] Configure Prometheus client
- [ ] Expose /metrics endpoint
- [ ] Add default Node.js metrics

#### 3.2 Custom Metrics
- [ ] `flagship_evaluation_duration_seconds` histogram
- [ ] `flagship_evaluation_total` counter
- [ ] `flagship_ingestion_total` counter
- [ ] `flagship_cache_hits_total` counter
- [ ] `flagship_cache_misses_total` counter

#### 3.3 Business Metrics
- [ ] Active organizations gauge
- [ ] Features per organization gauge
- [ ] Usage near limit gauge

### 4. Health Check Tasks

#### 4.1 Liveness Probe
- [ ] Create `/health/live` endpoint
- [ ] Return 200 if process running
- [ ] No dependency checks

#### 4.2 Readiness Probe
- [ ] Create `/health/ready` endpoint
- [ ] Check database connection
- [ ] Check Redis connection
- [ ] Return 503 if not ready

---

## Test Plan

### Unit Tests
- [ ] Logger includes correct context
- [ ] Metrics increment correctly
- [ ] Health checks return correct status

### Integration Tests
- [ ] Traces propagate across services
- [ ] Metrics exposed at /metrics
- [ ] Health checks reflect dependency state

### E2E Tests
- [ ] Logs appear in aggregator
- [ ] Traces visible in backend
- [ ] Metrics scraped by Prometheus

---

## API Reference

### Health Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |

### Log Format

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.123Z",
  "msg": "Evaluation completed",
  "requestId": "req_xyz789",
  "traceId": "abc123def456",
  "service": "flagship-api",
  "environment": "prod",
  "organizationId": "org_123",
  "duration": 12,
  "features": ["billing_v2", "ai_chat"],
  "cacheHit": true
}
```

### Metrics

```prometheus
# HELP flagship_evaluation_duration_seconds Evaluation request duration
# TYPE flagship_evaluation_duration_seconds histogram
flagship_evaluation_duration_seconds_bucket{le="0.01"} 100
flagship_evaluation_duration_seconds_bucket{le="0.05"} 450
flagship_evaluation_duration_seconds_bucket{le="0.1"} 490
flagship_evaluation_duration_seconds_bucket{le="+Inf"} 500
flagship_evaluation_duration_seconds_sum 15.5
flagship_evaluation_duration_seconds_count 500

# HELP flagship_evaluation_total Total evaluation requests
# TYPE flagship_evaluation_total counter
flagship_evaluation_total{status="success"} 495
flagship_evaluation_total{status="error"} 5

# HELP flagship_cache_hits_total Cache hit count
# TYPE flagship_cache_hits_total counter
flagship_cache_hits_total{cache="features"} 400
flagship_cache_hits_total{cache="limits"} 350
```

### Trace Spans

| Span Name | Attributes |
|-----------|------------|
| `flagship.evaluate` | features, limits, cacheHit |
| `flagship.ingest` | metric, delta, batchSize |
| `flagship.db.query` | table, operation |
| `flagship.redis.get` | key, hit |
| `flagship.redis.set` | key, ttl |

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| Pino logger | Extend with FlagShip context |
| OpenTelemetry | Reuse existing setup |
| Health module | Extend with FlagShip checks |
| Prometheus | Add FlagShip metrics |

### Configuration
Extend existing observability config:
```typescript
// apps/api/src/config/observability.ts
export const observabilityConfig = {
  ...forgeStackConfig,
  flagship: {
    logLevel: process.env.FLAGSHIP_LOG_LEVEL || 'info',
    metricsPrefix: 'flagship_',
    traceServiceName: 'flagship-api',
  },
};
```

---

## Migration Notes

- Extends ForgeStack's observability infrastructure
- No new external dependencies
- Adds FlagShip-specific metrics and spans
- Log format compatible with existing aggregators
