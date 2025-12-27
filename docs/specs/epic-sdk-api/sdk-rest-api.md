# SDK & REST API

**Epic:** SDK & REST API  
**Priority:** P1 (Developer Experience)  
**Depends on:** Epic 5 (Evaluation API), Epic 6 (Usage Ingestion API)  
**Status:** Draft

---

## Overview

FlagShip provides a Node.js SDK and comprehensive REST API documentation for customer integration. The SDK wraps the REST API with type-safe methods, caching, and error handling, while the API documentation enables direct HTTP integration.

### Key Components
- **Node.js SDK** - Type-safe client library
- **REST API Docs** - OpenAPI specification
- **Code Examples** - Integration guides
- **Error Handling** - Consistent error responses

### Architecture

```
SDK Architecture:
┌────────────────────────────────────────────────────────────────┐
│                   Customer Application                          │
│                                                                 │
│  import { FlagShip } from '@flagship/sdk';                     │
│                                                                 │
│  const flagship = new FlagShip({                               │
│    apiKey: 'fsk_live_xxx',                                     │
│    environment: 'prod',                                        │
│  });                                                            │
│                                                                 │
│  const { features, limits } = await flagship.evaluate({        │
│    features: ['billing_v2'],                                   │
│    limits: ['api_calls'],                                      │
│  });                                                            │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      @flagship/sdk                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ HTTP Client │  │ Cache Layer │  │ Error Handler           │ │
│  │ (fetch/got) │  │ (in-memory) │  │ (typed errors)          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   FlagShip API Server                           │
│                                                                 │
│  POST /v1/evaluate                                              │
│  POST /v1/usage/ingest                                          │
│  GET  /v1/features                                              │
│  GET  /v1/limits/check                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Node.js SDK
- [ ] Published to npm as `@flagship/sdk`
- [ ] TypeScript with full type definitions
- [ ] Zero runtime dependencies (minimal bundle)
- [ ] Tree-shakeable exports
- [ ] Works in Node.js 18+ and Edge runtimes

### SDK Methods
- [ ] `evaluate()` - Evaluate features and limits
- [ ] `ingest()` - Record usage events
- [ ] `checkLimit()` - Check single limit
- [ ] `getFeature()` - Get single feature value
- [ ] `isEnabled()` - Boolean feature check

### SDK Configuration
- [ ] API key configuration
- [ ] Environment selection
- [ ] Base URL override
- [ ] Timeout configuration
- [ ] Retry configuration
- [ ] Cache TTL configuration

### SDK Caching
- [ ] In-memory cache for evaluations
- [ ] Configurable TTL (default 60s)
- [ ] Cache invalidation method
- [ ] Stale-while-revalidate option

### Error Handling
- [ ] Typed error classes
- [ ] Error codes match API
- [ ] Retry on transient errors
- [ ] Timeout handling

### REST API Documentation
- [ ] OpenAPI 3.0 specification
- [ ] Swagger UI hosted at /docs
- [ ] Request/response examples
- [ ] Authentication documentation
- [ ] Error code reference

---

## Tasks & Subtasks

### 1. SDK Development

#### 1.1 Package Setup
- [ ] Create `packages/flagship-sdk/` directory
- [ ] Initialize package.json with proper config
- [ ] Configure TypeScript for dual ESM/CJS
- [ ] Set up build with tsup

#### 1.2 Core Client
- [ ] Create `src/client.ts` with FlagShip class
- [ ] Implement HTTP client wrapper
- [ ] Add request/response interceptors
- [ ] Handle authentication headers

#### 1.3 Evaluate Method
- [ ] Create `src/methods/evaluate.ts`
- [ ] Type-safe request/response
- [ ] Cache integration
- [ ] Error handling

#### 1.4 Ingest Method
- [ ] Create `src/methods/ingest.ts`
- [ ] Batch support
- [ ] Idempotency key generation
- [ ] Fire-and-forget option

#### 1.5 Convenience Methods
- [ ] `isEnabled(featureKey)` - Boolean check
- [ ] `checkLimit(metric)` - Single limit check
- [ ] `getUsage(metric)` - Current usage

#### 1.6 Cache Layer
- [ ] Create `src/cache.ts`
- [ ] In-memory LRU cache
- [ ] TTL support
- [ ] Manual invalidation

#### 1.7 Error Classes
- [ ] Create `src/errors.ts`
- [ ] FlagShipError base class
- [ ] Specific error types (AuthError, RateLimitError, etc.)

#### 1.8 Types Export
- [ ] Create `src/types.ts`
- [ ] Export all public types
- [ ] JSDoc documentation

### 2. API Documentation

#### 2.1 OpenAPI Spec
- [ ] Create `docs/openapi.yaml`
- [ ] Document all endpoints
- [ ] Include schemas
- [ ] Add examples

#### 2.2 Swagger UI
- [ ] Configure Swagger UI in API
- [ ] Host at /docs endpoint
- [ ] Enable "Try it out" feature

#### 2.3 Integration Guide
- [ ] Create `docs/integration-guide.md`
- [ ] Quick start section
- [ ] Code examples
- [ ] Best practices

---

## Test Plan

### Unit Tests
- [ ] Client initialization
- [ ] Method parameter validation
- [ ] Cache behavior
- [ ] Error handling

### Integration Tests
- [ ] Full evaluate flow
- [ ] Full ingest flow
- [ ] Retry behavior
- [ ] Timeout handling

### E2E Tests
- [ ] SDK against live API
- [ ] All methods work correctly
- [ ] Error responses handled

---

## API Reference

### SDK Installation

```bash
npm install @flagship/sdk
# or
yarn add @flagship/sdk
# or
pnpm add @flagship/sdk
```

### SDK Usage

```typescript
import { FlagShip } from '@flagship/sdk';

// Initialize client
const flagship = new FlagShip({
  apiKey: process.env.FLAGSHIP_API_KEY,
  environment: 'prod',
  baseUrl: 'https://api.flagship.io', // optional
  timeout: 5000, // optional, ms
  cache: {
    enabled: true,
    ttl: 60000, // optional, ms
  },
});

// Evaluate features and limits
const result = await flagship.evaluate({
  features: ['billing_v2', 'ai_chat'],
  limits: ['api_calls', 'storage'],
  context: {
    userId: 'usr_123',
  },
});

if (result.features.billing_v2.value) {
  // Show billing v2 UI
}

if (result.limits.api_calls.allowed) {
  // Proceed with API call
  await flagship.ingest({
    metric: 'api_calls',
    delta: 1,
  });
}

// Convenience methods
const isEnabled = await flagship.isEnabled('billing_v2');
const canProceed = await flagship.checkLimit('api_calls');
```

### SDK Types

```typescript
interface FlagShipConfig {
  apiKey: string;
  environment: 'dev' | 'staging' | 'prod';
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

interface EvaluateOptions {
  features?: string[];
  limits?: string[];
  context?: Record<string, unknown>;
  skipCache?: boolean;
}

interface EvaluateResult {
  features: Record<string, { value: boolean; reason?: string }>;
  limits: Record<string, { allowed: boolean; current: number; limit: number; remaining: number }>;
}

interface IngestOptions {
  metric: string;
  delta: number;
  timestamp?: Date;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}
```

### Error Types

```typescript
class FlagShipError extends Error {
  code: string;
  statusCode?: number;
}

class AuthenticationError extends FlagShipError {
  code = 'UNAUTHORIZED';
}

class RateLimitError extends FlagShipError {
  code = 'RATE_LIMITED';
  retryAfter?: number;
}

class ValidationError extends FlagShipError {
  code = 'VALIDATION_ERROR';
  details: Record<string, string[]>;
}
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `packages/sdk` | Pattern reference for SDK structure |
| Swagger/OpenAPI | API documentation |
| tsup | Build tooling |
| Vitest | Testing framework |

### Package Location
- SDK: `packages/flagship-sdk/`
- Separate from ForgeStack's `packages/sdk`
- Published as `@flagship/sdk`

---

## Migration Notes

- New package in monorepo
- Independent versioning from ForgeStack
- Can be used standalone (no ForgeStack dependency)
- Published to npm registry

