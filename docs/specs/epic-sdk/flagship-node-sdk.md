# FlagShip Node.js SDK

**Epic:** SDK
**Priority:** P1 (Developer Experience)
**Depends on:** Epic 5 (Evaluation API), Epic 6 (Usage Ingestion API)
**Status:** Draft

---

## Overview

The FlagShip Node.js SDK provides a type-safe client library for integrating with the FlagShip control plane. It wraps the REST API endpoints (`POST /v1/evaluate` and `POST /v1/usage/ingest`) with ergonomic methods, automatic retries, and comprehensive error handling.

### Key Components
- **FlagShipClient** - Main client class with configuration
- **evaluate()** - Evaluate features and limits in a single call
- **ingest()** - Record usage events (single or batch)
- **isFeatureEnabled()** - Convenience method for boolean features
- **getLimit()** - Check limit status for a single metric
- **Typed Errors** - Structured error classes for error handling
- **Retry Logic** - Exponential backoff for transient failures

### Architecture

```
SDK Integration Flow:
┌────────────────────────────────────────────────────────────────┐
│                   Customer Application                          │
│                                                                 │
│  import { FlagShipClient } from '@flagship/sdk';               │
│                                                                 │
│  const flagship = new FlagShipClient({                         │
│    apiKey: 'fsk_live_xxx',                                     │
│    environmentId: 'env_prod_123',                              │
│  });                                                            │
│                                                                 │
│  // Full evaluation                                             │
│  const result = await flagship.evaluate({                       │
│    features: ['billing_v2'],                                   │
│    limits: ['api_calls'],                                      │
│  });                                                            │
│                                                                 │
│  // Convenience methods                                         │
│  if (await flagship.isFeatureEnabled('ai_chat')) { ... }       │
│  const limit = await flagship.getLimit('api_calls');           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    @flagship/sdk                                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ HTTP Client │  │   Retry     │  │  Error Handler          │ │
│  │   (fetch)   │  │   Layer     │  │  (typed errors)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  Headers:                                                       │
│  • X-API-Key: fsk_xxx                                          │
│  • X-Environment: env_xxx                                       │
│  • Content-Type: application/json                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   FlagShip API Server                           │
│                                                                 │
│  POST /v1/evaluate        → Feature + Limit evaluation          │
│  POST /v1/usage/ingest    → Usage event ingestion               │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Package Structure
- [ ] Package name: `@flagship/sdk` (or `@forgestack/flagship-sdk`)
- [ ] Located at `packages/flagship-sdk/`
- [ ] TypeScript-first with full type definitions
- [ ] Zero/minimal runtime dependencies
- [ ] ESM and CommonJS dual exports
- [ ] Works in Node.js 18+ and Edge runtimes

### Configuration
- [ ] `apiKey: string` (required) - FlagShip API key
- [ ] `environmentId: string` (required) - Target environment ID
- [ ] `baseUrl?: string` (optional) - Defaults to `https://api.flagship.io`
- [ ] `timeout?: number` (optional) - Request timeout in ms (default: 5000)
- [ ] `retries?: number` (optional) - Max retry attempts (default: 3)
- [ ] `retryDelay?: number` (optional) - Initial retry delay in ms (default: 1000)

### Core Methods

#### `evaluate(request: EvaluateRequest): Promise<EvaluateResponse>`
- [ ] Accepts features array and/or limits array
- [ ] Supports optional context object
- [ ] Supports optional debug flag
- [ ] Returns typed response with features and limits results
- [ ] Throws typed errors on failure

#### `ingest(events: UsageEvent | UsageEvent[]): Promise<IngestResponse>`
- [ ] Accepts single event or array of events (max 1000)
- [ ] Auto-generates idempotency keys if not provided
- [ ] Returns accepted/rejected counts and summary
- [ ] Throws typed errors on failure

#### `isFeatureEnabled(key: string, context?: EvaluationContext): Promise<boolean>`
- [ ] Convenience wrapper around evaluate()
- [ ] Returns `false` for unknown features (fail-safe)
- [ ] Caches result when caching is enabled

#### `getLimit(key: string): Promise<LimitResult>`
- [ ] Convenience wrapper around evaluate()
- [ ] Returns full limit status (allowed, current, limit, remaining)
- [ ] Throws if limit key not found

### Error Handling
- [ ] `FlagShipError` - Base error class with code and message
- [ ] `AuthenticationError` - Invalid or missing API key (401)
- [ ] `AuthorizationError` - API key not authorized for environment (403)
- [ ] `ValidationError` - Request validation failed (400)
- [ ] `RateLimitError` - Rate limit exceeded with retryAfter (429)
- [ ] `NetworkError` - Connection/timeout errors
- [ ] `ServerError` - Internal server errors (5xx)

### Retry Logic
- [ ] Retry on 5xx errors and network failures
- [ ] Exponential backoff with jitter
- [ ] Configurable max retries (default: 3)
- [ ] Do NOT retry on 4xx errors (except 429)
- [ ] Respect Retry-After header on 429 responses

---

## Tasks & Subtasks

### 1. Package Setup

#### 1.1 Directory Structure
- [ ] Create `packages/flagship-sdk/` directory
- [ ] Create `package.json` with proper configuration
- [ ] Configure `tsconfig.json` for dual ESM/CJS output
- [ ] Set up build with `tsup`
- [ ] Configure exports in package.json

#### 1.2 Project Files
- [ ] Create `src/index.ts` - Main exports
- [ ] Create `src/client.ts` - FlagShipClient class
- [ ] Create `src/types.ts` - Type definitions
- [ ] Create `src/errors.ts` - Error classes
- [ ] Create `README.md` - Package documentation

### 2. Core Implementation

#### 2.1 FlagShipClient Class (`src/client.ts`)
- [ ] Constructor with configuration validation
- [ ] Private HTTP client with headers
- [ ] Request/response logging (debug mode)
- [ ] Connection pooling support

#### 2.2 HTTP Layer (`src/http.ts`)
- [ ] Fetch-based HTTP client
- [ ] Request timeout handling
- [ ] Response parsing and error detection
- [ ] Header management (X-API-Key, X-Environment)

#### 2.3 Retry Layer (`src/retry.ts`)
- [ ] Exponential backoff implementation
- [ ] Jitter to prevent thundering herd
- [ ] Retry-After header parsing
- [ ] Configurable max retries

### 3. Method Implementation

#### 3.1 Evaluate Method (`src/methods/evaluate.ts`)
- [ ] Request building from parameters
- [ ] Response parsing to typed result
- [ ] Error handling and transformation
- [ ] Debug mode support

#### 3.2 Ingest Method (`src/methods/ingest.ts`)
- [ ] Single event to array normalization
- [ ] Idempotency key auto-generation (UUID v4)
- [ ] Batch validation (max 1000 events)
- [ ] Response parsing with summary

#### 3.3 Convenience Methods (`src/methods/convenience.ts`)
- [ ] `isFeatureEnabled()` - Boolean feature check
- [ ] `getLimit()` - Single limit check
- [ ] Default value handling for missing features

### 4. Error Handling

#### 4.1 Error Classes (`src/errors.ts`)
- [ ] `FlagShipError` base class
- [ ] `AuthenticationError` (401)
- [ ] `AuthorizationError` (403)
- [ ] `ValidationError` (400) with details
- [ ] `RateLimitError` (429) with retryAfter
- [ ] `NetworkError` for connection issues
- [ ] `ServerError` (5xx)

#### 4.2 Error Factory (`src/errors.ts`)
- [ ] `fromResponse()` - Create error from HTTP response
- [ ] `fromException()` - Wrap native errors

### 5. Type Definitions

#### 5.1 Configuration Types (`src/types.ts`)
- [ ] `FlagShipClientConfig` interface
- [ ] `RetryConfig` interface

#### 5.2 Request/Response Types (`src/types.ts`)
- [ ] `EvaluateRequest` and `EvaluateResponse`
- [ ] `IngestRequest` and `IngestResponse`
- [ ] `UsageEvent` interface
- [ ] `FeatureResult` and `LimitResult` interfaces
- [ ] `EvaluationContext` interface

---

## Test Plan

### Unit Tests
- [ ] Client initialization with valid config
- [ ] Client initialization rejects invalid config
- [ ] evaluate() builds correct request
- [ ] evaluate() parses response correctly
- [ ] ingest() normalizes single event to array
- [ ] ingest() auto-generates idempotency keys
- [ ] isFeatureEnabled() returns false for missing features
- [ ] getLimit() throws for missing limits
- [ ] Retry logic respects max retries
- [ ] Retry logic applies exponential backoff
- [ ] Error classes are correctly instantiated

### Integration Tests
- [ ] Full evaluate flow with mocked API
- [ ] Full ingest flow with mocked API
- [ ] Retry behavior on 500 responses
- [ ] Retry-After handling on 429 responses
- [ ] Timeout handling
- [ ] Network error handling

### E2E Tests
- [ ] SDK against live FlagShip API
- [ ] evaluate() returns expected results
- [ ] ingest() records events correctly
- [ ] Error responses handled correctly

---

## API Reference

### Installation

```bash
npm install @flagship/sdk
# or
pnpm add @flagship/sdk
# or
yarn add @flagship/sdk
```

### Initialization

```typescript
import { FlagShipClient } from '@flagship/sdk';

const flagship = new FlagShipClient({
  apiKey: process.env.FLAGSHIP_API_KEY!,       // Required: fsk_live_xxx
  environmentId: process.env.FLAGSHIP_ENV_ID!, // Required: env_xxx
  baseUrl: 'https://api.flagship.io',          // Optional: defaults to production
  timeout: 5000,                                // Optional: request timeout in ms
  retries: 3,                                   // Optional: max retry attempts
  retryDelay: 1000,                             // Optional: initial retry delay in ms
});
```

### evaluate()

```typescript
const result = await flagship.evaluate({
  features: ['billing_v2', 'ai_chat', 'advanced_analytics'],
  limits: ['api_calls', 'storage_bytes'],
  context: { userId: 'usr_abc123' },
  debug: true,
});

// Access feature results
if (result.features.billing_v2.value) {
  console.log('Billing V2 is enabled');
}

// Access limit results
if (result.limits.api_calls.allowed) {
  console.log(`Remaining: ${result.limits.api_calls.remaining}`);
}
```

### ingest()

```typescript
// Single event
await flagship.ingest({
  metric: 'api_calls',
  delta: 1,
  idempotencyKey: 'req_abc123',  // Optional: auto-generated if not provided
  metadata: { endpoint: '/api/users', method: 'GET' },
});

// Batch events
const result = await flagship.ingest([
  { metric: 'api_calls', delta: 1 },
  { metric: 'storage_bytes', delta: 1048576 },
]);

console.log(`Accepted: ${result.accepted}, Rejected: ${result.rejected}`);
```

### isFeatureEnabled()

```typescript
// Simple boolean check
if (await flagship.isFeatureEnabled('billing_v2')) {
  showBillingV2UI();
}

// With context for percentage rollouts
if (await flagship.isFeatureEnabled('new_dashboard', { userId: 'usr_123' })) {
  showNewDashboard();
}
```

### getLimit()

```typescript
const limit = await flagship.getLimit('api_calls');

if (limit.allowed) {
  // Proceed with action
  await performApiCall();
  await flagship.ingest({ metric: 'api_calls', delta: 1 });
} else {
  console.log(`Limit exceeded: ${limit.current}/${limit.limit}`);
}
```

### Error Handling

```typescript
import {
  FlagShipClient,
  AuthenticationError,
  RateLimitError,
  ValidationError
} from '@flagship/sdk';

try {
  await flagship.evaluate({ features: ['test'] });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.details);
  }
}
```

---

## Type Definitions

### Configuration

```typescript
interface FlagShipClientConfig {
  /** FlagShip API key (fsk_live_xxx or fsk_test_xxx) */
  apiKey: string;

  /** Target environment ID (env_xxx) */
  environmentId: string;

  /** Base URL for FlagShip API (default: https://api.flagship.io) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;

  /** Maximum retry attempts for transient errors (default: 3) */
  retries?: number;

  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}
```

### Evaluate Types

```typescript
interface EvaluateRequest {
  /** Feature keys to evaluate */
  features?: string[];

  /** Limit metrics to check */
  limits?: string[];

  /** Evaluation context (e.g., userId for percentage rollouts) */
  context?: Record<string, unknown>;

  /** Include debug information in response */
  debug?: boolean;
}

interface EvaluateResponse {
  /** Request tracking ID */
  requestId: string;

  /** Timestamp of evaluation */
  evaluatedAt: string;

  /** Feature evaluation results keyed by feature key */
  features: Record<string, FeatureResult>;

  /** Limit check results keyed by limit key */
  limits: Record<string, LimitResult>;
}

interface FeatureResult {
  /** Evaluated value (true/false for boolean features) */
  value: boolean;

  /** Reason for the evaluation result (if debug=true) */
  reason?: string;
}

interface LimitResult {
  /** Whether the limit allows the operation */
  allowed: boolean;

  /** Current usage value */
  current: number;

  /** Maximum limit value */
  limit: number;

  /** Remaining capacity */
  remaining: number;

  /** Reason for the limit status (if debug=true) */
  reason?: string;
}
```

### Ingest Types

```typescript
interface UsageEvent {
  /** Metric identifier (e.g., "api_calls", "storage_bytes") */
  metric: string;

  /** Change amount (positive to increment, negative to decrement) */
  delta: number;

  /** When the event occurred (ISO 8601). Defaults to server time. */
  timestamp?: string;

  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;

  /** Additional context for the event */
  metadata?: Record<string, string | number>;
}

interface IngestResponse {
  /** Request tracking ID */
  requestId: string;

  /** When the request was processed */
  processedAt: string;

  /** Number of events accepted */
  accepted: number;

  /** Number of events rejected */
  rejected: number;

  /** Details for rejected events */
  errors?: IngestError[];

  /** Current usage summary per metric after ingestion */
  summary?: Record<string, UsageSummary>;
}

interface IngestError {
  /** Index of the rejected event in the request */
  index: number;

  /** Metric key of the rejected event */
  metric: string;

  /** Reason for rejection */
  reason: string;
}

interface UsageSummary {
  /** Current usage value */
  current: number;

  /** Configured limit (-1 for unlimited) */
  limit: number;

  /** Remaining capacity (-1 for unlimited) */
  remaining: number;
}
```



### Error Types

```typescript
/** Base error class for all FlagShip errors */
class FlagShipError extends Error {
  /** Error code (e.g., 'UNAUTHORIZED', 'RATE_LIMITED') */
  code: string;

  /** HTTP status code if applicable */
  statusCode?: number;
}

/** Invalid or missing API key (401) */
class AuthenticationError extends FlagShipError {
  code = 'UNAUTHORIZED';
  statusCode = 401;
}

/** API key not authorized for environment (403) */
class AuthorizationError extends FlagShipError {
  code = 'FORBIDDEN';
  statusCode = 403;
}

/** Request validation failed (400) */
class ValidationError extends FlagShipError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;

  /** Validation error details by field */
  details: Record<string, string[]>;
}

/** Rate limit exceeded (429) */
class RateLimitError extends FlagShipError {
  code = 'RATE_LIMITED';
  statusCode = 429;

  /** Milliseconds until retry is allowed */
  retryAfter?: number;
}

/** Network connection or timeout error */
class NetworkError extends FlagShipError {
  code = 'NETWORK_ERROR';
}

/** Internal server error (5xx) */
class ServerError extends FlagShipError {
  code = 'SERVER_ERROR';
}
```

---

## Package Structure

```
packages/flagship-sdk/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── src/
│   ├── index.ts           # Main exports
│   ├── client.ts          # FlagShipClient class
│   ├── types.ts           # Type definitions
│   ├── errors.ts          # Error classes
│   ├── http.ts            # HTTP client wrapper
│   ├── retry.ts           # Retry logic
│   └── methods/
│       ├── evaluate.ts    # evaluate() implementation
│       ├── ingest.ts      # ingest() implementation
│       └── convenience.ts # isFeatureEnabled(), getLimit()
└── tests/
    ├── client.test.ts
    ├── evaluate.test.ts
    ├── ingest.test.ts
    ├── retry.test.ts
    └── errors.test.ts
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `tsup` | Build tooling for dual ESM/CJS |
| `vitest` | Testing framework |
| Turborepo | Monorepo build orchestration |
| pnpm | Package management |

### Package Location
- SDK: `packages/flagship-sdk/`
- Published as `@flagship/sdk` or `@forgestack/flagship-sdk`
- Independent versioning from ForgeStack core

---

## Migration Notes

- New package in monorepo under `packages/`
- No dependencies on other ForgeStack packages
- Can be used standalone by external applications
- Published to npm registry (public or scoped)
- Types match API DTOs from `apps/api/src/flagship/*/dto/`
