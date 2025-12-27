# FlagShip

<div align="center">

![FlagShip](https://img.shields.io/badge/FlagShip-Control_Plane-7c3aed?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0-2ea44f?style=for-the-badge)

**A production-grade B2B SaaS control plane for feature flags, usage limits, and plan-based access control**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)](https://redis.io/)
[![Test Coverage](https://img.shields.io/badge/Tests-1,588+-brightgreen)](.)

[Overview](#-overview) •
[Quick Start](#-quick-start) •
[API Reference](#-api-reference) •
[SDK](#-sdk) •
[Admin Panel](#-admin-panel) •
[Deployment](#-deployment)

</div>

---

## 📋 Overview

FlagShip is a **control plane** that enables SaaS backends to:

- **Gate features** based on subscription plans
- **Enforce usage limits** (API calls, storage, seats)
- **Evaluate access decisions** at runtime
- **Track and audit** all control plane actions

### Why FlagShip?

FlagShip is intentionally **narrow**. If a feature does not strengthen *control*, it does not exist.

| Principle | Description |
|-----------|-------------|
| 🎯 **Server-side enforcement** | FlagShip makes decisions, clients enforce them |
| 🔒 **Fail-closed limits** | If unsure, deny access |
| 🟢 **Fail-open flags** | Non-critical features default to enabled |
| 🔁 **Idempotent operations** | Safe to retry any request |
| 📋 **Audit everything** | All mutations are logged |

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Feature Evaluation** | Boolean flags, plan-gated features, percentage rollouts |
| **Limit Enforcement** | Usage tracking with hard/soft limits |
| **Plan Management** | Define plans with feature entitlements and limits |
| **Environment Scoping** | Separate `dev`, `staging`, `prod` configurations |
| **Audit Trail** | Immutable log of all control plane actions |
| **Multi-tenancy** | Organization-based isolation with RBAC |

---

## 🏗️ Architecture

FlagShip is composed of **three services**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FlagShip Control Plane                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐     │
│   │   Web Panel     │   │  Server Engine  │   │     Worker      │     │
│   │   (Admin UI)    │   │  (Control API)  │   │  (Async Jobs)   │     │
│   │   Port 3000     │   │   Port 4000     │   │   Background    │     │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘     │
│            │                     │                      │              │
│            └─────────────────────┼──────────────────────┘              │
│                                  │                                     │
│                    ┌─────────────┴─────────────┐                       │
│                    │   PostgreSQL  +  Redis    │                       │
│                    │   (RLS + BullMQ Queues)   │                       │
│                    └───────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  Your Backend │        │  Your Backend │        │  Your Backend │
│  (Node.js)    │        │  (Python)     │        │  (Go)         │
│  via SDK      │        │  via REST     │        │  via REST     │
└───────────────┘        └───────────────┘        └───────────────┘
```

### Services

| Service | Purpose | Port |
|---------|---------|------|
| **Server Engine** | Control plane API — evaluates features, enforces limits, manages configuration | 4000 |
| **Web Panel** | Admin UI for configuration — feature flags, plans, environments, audit logs | 3000 |
| **Worker** | Async job processing — usage ingestion, audit persistence, notifications | — |

---

## 📊 Domain Model

FlagShip's core entities:

| Entity | Description |
|--------|-------------|
| **Organization** | Multi-tenant root — all data is scoped to an org |
| **Project** | Logical grouping within an organization |
| **Environment** | `dev`, `staging`, `prod` — scopes all evaluations |
| **Plan** | Subscription tier with feature entitlements and usage limits |
| **Feature** | Boolean or plan-gated feature flag |
| **UsageMetric** | Tracked usage (API calls, storage, seats) with limits |
| **AuditEvent** | Immutable record of control plane actions |

---

## 🚀 Quick Start

### Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| [Node.js](https://nodejs.org/) | 20.9+ | Runtime |
| [pnpm](https://pnpm.io/) | 9.14+ | Package manager |
| [Docker](https://www.docker.com/) | Latest | PostgreSQL & Redis |

### 1. Clone and Install

```bash
git clone https://github.com/PulseDevLabs/FlagShip.git
cd FlagShip
pnpm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run Database Migrations

```bash
cd packages/db
pnpm db:push
pnpm db:migrate
```

### 5. Start Development

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Web Panel | http://localhost:3000/flagship |
| API | http://localhost:4000 |
| Health Check | http://localhost:4000/health |

---

## 📡 API Reference

All FlagShip endpoints require authentication via API key header: `X-API-Key: fs_xxxxxxxxxxxx`

### Evaluation API

The primary endpoint for client applications to check feature access and limits.

#### `POST /v1/evaluate`

Evaluate features and limits for a given context.

**Request:**

```json
{
  "features": ["advanced-analytics", "api-access", "white-label"],
  "limits": ["api-calls", "storage-gb"],
  "context": {
    "userId": "user_abc123",
    "attributes": {
      "plan": "pro",
      "country": "US"
    }
  }
}
```

**Response:**

```json
{
  "features": {
    "advanced-analytics": {
      "enabled": true,
      "reason": "plan_entitled"
    },
    "api-access": {
      "enabled": true,
      "reason": "plan_entitled"
    },
    "white-label": {
      "enabled": false,
      "reason": "plan_not_entitled"
    }
  },
  "limits": {
    "api-calls": {
      "allowed": true,
      "current": 4500,
      "limit": 10000,
      "remaining": 5500
    },
    "storage-gb": {
      "allowed": false,
      "current": 52,
      "limit": 50,
      "remaining": 0
    }
  }
}
```

**Evaluation Reasons:**

| Reason | Description |
|--------|-------------|
| `plan_entitled` | Feature included in current plan |
| `plan_not_entitled` | Feature not in current plan |
| `limit_exceeded` | Usage limit reached |
| `flag_disabled` | Feature explicitly disabled |
| `percentage_excluded` | Not in rollout percentage |
| `override_enabled` | Org-level override active |

---

### Usage Ingestion API

Ingest usage metrics asynchronously. Returns `202 Accepted` immediately.

#### `POST /v1/usage/ingest`

**Request:**

```json
{
  "metric": "api-calls",
  "value": 1,
  "idempotencyKey": "req_abc123_1703251200",
  "timestamp": "2024-12-22T12:00:00Z",
  "metadata": {
    "endpoint": "/api/v1/users",
    "method": "GET"
  }
}
```

**Response:** `202 Accepted`

```json
{
  "status": "accepted",
  "idempotencyKey": "req_abc123_1703251200"
}
```

**Notes:**
- Use `idempotencyKey` to prevent duplicate ingestion on retries
- Metrics are processed via BullMQ with automatic retry
- Failed jobs route to dead-letter queue (DLQ)

---

### Admin API

Internal endpoints for managing FlagShip configuration. Requires admin permissions.

#### Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/admin/features` | List all features |
| `POST` | `/v1/admin/features` | Create a feature |
| `GET` | `/v1/admin/features/:key` | Get feature by key |
| `PUT` | `/v1/admin/features/:key` | Update a feature |
| `DELETE` | `/v1/admin/features/:key` | Delete a feature |

**Create Feature Request:**

```json
{
  "key": "advanced-analytics",
  "name": "Advanced Analytics",
  "description": "Access to advanced analytics dashboard",
  "type": "plan_gated",
  "defaultEnabled": false,
  "plans": ["pro", "enterprise"]
}
```

#### Environments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/admin/environments` | List environments |
| `POST` | `/v1/admin/environments` | Create environment |
| `PUT` | `/v1/admin/environments/:id` | Update environment |
| `DELETE` | `/v1/admin/environments/:id` | Delete environment |

#### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/admin/plans` | List plans |
| `POST` | `/v1/admin/plans` | Create plan |
| `PUT` | `/v1/admin/plans/:id` | Update plan |
| `DELETE` | `/v1/admin/plans/:id` | Delete plan |

**Create Plan Request:**

```json
{
  "key": "pro",
  "name": "Pro Plan",
  "features": ["advanced-analytics", "api-access", "priority-support"],
  "limits": {
    "api-calls": 10000,
    "storage-gb": 50,
    "seats": 10
  }
}
```

#### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/admin/audit` | List audit events (paginated) |
| `GET` | `/v1/admin/audit/export` | Export as CSV or JSON |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Filter by action type |
| `actorId` | string | Filter by actor |
| `resourceType` | string | Filter by resource type |
| `startDate` | ISO date | Start of date range |
| `endDate` | ISO date | End of date range |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

---

## 📦 SDK

The `@forgestack/flagship-sdk` package provides a typed Node.js client for integrating with FlagShip.

### Installation

```bash
npm install @forgestack/flagship-sdk
# or
pnpm add @forgestack/flagship-sdk
```

### Usage

```typescript
import { FlagshipClient } from '@forgestack/flagship-sdk';

const client = new FlagshipClient({
  baseUrl: 'https://api.yourapp.com',
  apiKey: 'fs_xxxxxxxxxxxx',
  environment: 'production',
  timeout: 5000,        // Request timeout (ms)
  retries: 3,           // Retry attempts
  retryDelay: 100,      // Base retry delay (ms)
});

// Evaluate features and limits
const result = await client.evaluate({
  features: ['advanced-analytics', 'api-access'],
  limits: ['api-calls', 'storage-gb'],
  context: {
    userId: 'user_123',
    attributes: { plan: 'pro' },
  },
});

// Check feature access
if (result.features['advanced-analytics'].enabled) {
  // Show advanced analytics
}

// Check limit
if (!result.limits['api-calls'].allowed) {
  throw new Error('API call limit exceeded');
}

// Ingest usage (async, fire-and-forget)
await client.ingest({
  metric: 'api-calls',
  value: 1,
  idempotencyKey: `${requestId}_${Date.now()}`,
});
```

### Convenience Methods

```typescript
// Check single feature
const isEnabled = await client.isEnabled('advanced-analytics', context);

// Check single limit
const limitResult = await client.checkLimit('api-calls', context);
if (!limitResult.allowed) {
  console.log(`Limit exceeded: ${limitResult.current}/${limitResult.limit}`);
}
```

### SDK Features

| Feature | Description |
|---------|-------------|
| **Automatic Retry** | Exponential backoff with 0-10% jitter |
| **Timeout Configuration** | Per-request timeout support |
| **TypeScript Types** | Full type safety for requests/responses |
| **Environment Scoping** | Automatic environment header injection |
| **Idempotency** | Built-in idempotency key support |

### Error Handling

```typescript
import { FlagshipError, RateLimitError } from '@forgestack/flagship-sdk';

try {
  await client.evaluate({ features: ['my-feature'] });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry after error.retryAfter seconds
  } else if (error instanceof FlagshipError) {
    // Handle other FlagShip errors
  }
}
```

---

## 🖥️ Admin Panel

The Web Panel provides a UI for managing FlagShip configuration.

### Routes

| Route | Description |
|-------|-------------|
| `/flagship` | Dashboard overview with key metrics |
| `/flagship/features` | Feature flag list and management |
| `/flagship/features/:key` | Feature detail with edit form |
| `/flagship/environments` | Environment management |
| `/flagship/plans` | Plan configuration |
| `/flagship/usage` | Usage metrics dashboard |
| `/flagship/audit` | Audit log viewer with filtering |

### Features Page

- View all feature flags with status
- Create new features (boolean, plan-gated, percentage)
- Toggle features on/off
- View feature details and edit configuration
- See which plans include each feature

### Plans Page

- Define subscription tiers
- Configure feature entitlements per plan
- Set usage limits (API calls, storage, seats)
- View plan statistics

### Audit Log

- Searchable, filterable audit trail
- Export to CSV or JSON
- Filter by action, actor, resource, date range
- View change details (before/after)

---

## ⚙️ Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flagship_dev"

# Redis (BullMQ queues)
REDIS_URL="redis://localhost:6379"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# URLs
APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
CORS_ORIGIN="http://localhost:3000"

# FlagShip API Keys
FLAGSHIP_API_KEY_PREFIX="fs_"

# Observability (optional)
LOG_LEVEL="info"
OTEL_ENABLED="false"
OTEL_EXPORTER_OTLP_ENDPOINT="http://tempo:4318"
```

### API Key Authentication

Generate API keys for client applications:

```bash
# Keys are prefixed with fs_ for identification
fs_a1b2c3d4e5f6g7h8i9j0...
```

Include in requests:

```bash
curl -X POST https://api.yourapp.com/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fs_xxxxxxxxxxxx" \
  -H "X-Environment: production" \
  -d '{"features": ["my-feature"]}'
```

---

## 🧪 Testing

### Test Coverage

| Package | Tests | Coverage |
|---------|-------|----------|
| `apps/api` (FlagShip) | 802 | 95%+ |
| `apps/web` (FlagShip) | 569 | 85%+ |
| `apps/worker` | 81 | 90%+ |
| `packages/flagship-sdk` | 22 | 95%+ |
| **Total** | **~1,588** | — |

### Running Tests

```bash
# All tests
pnpm test

# API tests with coverage
cd apps/api && pnpm test:cov

# Web tests with coverage
cd apps/web && pnpm test:coverage

# SDK tests
cd packages/flagship-sdk && pnpm test

# E2E tests
cd apps/web && pnpm e2e
```

### V1 Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| Real SaaS backends can gate features | ✅ Complete |
| Limits block behavior | ✅ Complete |
| Async jobs enforce correctly | ✅ Complete |
| Audit logs reconstruct actions | ✅ Complete |

---

## 🔄 Worker Jobs

FlagShip uses BullMQ for async processing with Redis.

### Job Types

| Job | Queue | Description |
|-----|-------|-------------|
| `flagship.usage.ingest` | `flagship` | Process usage ingestion with idempotency |
| `flagship.audit.emit` | `flagship` | Persist audit events |

### Job Properties

| Property | Value |
|----------|-------|
| **Retry Strategy** | Exponential backoff with 0-10% jitter |
| **Max Retries** | 3 attempts |
| **Dead Letter Queue** | Failed jobs route to DLQ |
| **Idempotency** | Duplicate detection via Redis keys |

### Starting the Worker

```bash
cd apps/worker && pnpm start
```

---

## 🚢 Deployment

### Docker Build

```bash
# Build all images
docker build -t flagship-api -f apps/api/Dockerfile .
docker build -t flagship-web -f apps/web/Dockerfile .
docker build -t flagship-worker -f apps/worker/Dockerfile .
```

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Production Environment

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/flagship_prod
REDIS_URL=redis://host:6379
BETTER_AUTH_SECRET=<strong-secret-min-32-chars>
BETTER_AUTH_URL=https://api.yourapp.com
APP_URL=https://app.yourapp.com
```

### Platform Deployments

Pre-configured deployment templates in `deploy/`:

| Platform | Config |
|----------|--------|
| Fly.io | `deploy/fly.api.toml`, `deploy/fly.web.toml`, `deploy/fly.worker.toml` |
| Railway | `deploy/railway.json` |
| Render | `deploy/render.yaml` |

---

## 🛠️ Built With

FlagShip is built on [ForgeStack](https://github.com/PulseDevLabs/ForgeStack), a production-ready multi-tenant SaaS starter kit.

### Technology Stack

| Layer | Technology |
|-------|------------|
| **API** | NestJS 11, TypeScript 5.6 |
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| **Database** | PostgreSQL 16 with Drizzle ORM and Row-Level Security |
| **Queue** | Redis 7 with BullMQ |
| **Auth** | better-auth with session cookies and API keys |
| **Testing** | Jest, Vitest, Playwright |
| **Monorepo** | pnpm workspaces, Turborepo |

### ForgeStack Provides

- Multi-tenant organization model
- Authentication and RBAC infrastructure
- Background job processing
- Observability baseline (OpenTelemetry, Pino)
- Deployment templates

FlagShip extends ForgeStack with the control plane domain logic.

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Write specs in `docs/specs/` if needed
3. Write failing tests first (TDD)
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- **TypeScript** — Strict mode enabled
- **ESLint** — Enforced via `pnpm lint`
- **Prettier** — Enforced via `pnpm format`

### Commit Convention

```
type(scope): description

feat(flagship): add percentage rollout support
fix(sdk): handle timeout errors correctly
test(api): add limit evaluation tests
```

---

## ❌ Non-Goals

FlagShip intentionally does NOT include:

- AI features
- Marketplace / plugin system
- White-labeling
- End-user dashboards
- Multi-region deployment
- Enterprise SSO

These are explicitly out of scope to keep FlagShip focused on control plane functionality.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [PulseDevLabs](https://github.com/PulseDevLabs)**

</div>
