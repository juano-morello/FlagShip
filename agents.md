# agents.md — FlagShip

## Project Overview

**FlagShip** is a **production-grade B2B SaaS reference product** that demonstrates how to design, ship, and operate a real **control plane** for SaaS products.

It proves senior/staff-level ownership across:
- product boundaries
- system design
- async processing
- enforcement logic
- operational discipline

FlagShip is intentionally **narrow**.  
If a feature does not strengthen *control*, it does not exist.

---

## Core Architecture

FlagShip is composed of **three services**, built on top of **ForgeStack**:

```
/apps
  /web        → Admin & configuration panel
  /api        → Server engine (control plane)
  /worker     → Async enforcement & background processing
/shared       → Domain models, contracts, utilities
```

All services:
- are multi-tenant
- are environment-aware (`dev | staging | prod`)
- enforce RBAC explicitly
- emit audit events

---

## ForgeStack Usage (Non-Negotiable)

ForgeStack is used to accelerate **infrastructure and discipline**, not to abstract thinking.

### ForgeStack provides:
- Auth integration (Clerk)
- Base RBAC scaffolding
- Org / project primitives
- Background job infrastructure
- Logging & observability baseline
- Repo & app structure

### ForgeStack must NOT:
- hide domain logic
- auto-generate business rules
- introduce “magic” abstractions

If ForgeStack conflicts with FlagShip’s control-plane model, **FlagShip wins**.

---

## Application Responsibilities

### 1. Web Panel (`/apps/web`)

**Purpose:**  
Configuration surface for *humans*.  
Never the source of truth for enforcement.

#### Responsibilities
- Organization management
- Member invitations & role assignment
- Project creation
- Environment visibility
- Feature flag toggling
- Plan assignment
- Usage snapshot (numbers only)
- Audit log read-only view

#### Explicit Non-Goals
- No end-user dashboards
- No analytics
- No UI-driven enforcement
- No “wizard” flows
- No design polish beyond clarity

---

### 2. Server Engine (`/apps/api`)

**This is the product.**

**Purpose:**  
Act as the **control plane** for client applications.

#### Core Responsibilities
- Evaluate access decisions at runtime
- Enforce:
  - feature availability
  - usage limits
  - permissions
- Maintain system truth:
  - plans
  - limits
  - flags
  - roles
- Emit audit events
- Provide SDK + REST API

#### Critical Endpoints (V1)
- `POST /v1/evaluate`
- `POST /v1/usage/ingest`

#### Design Rules
- Server-side enforcement only
- Fail-closed for limits
- Fail-open for non-critical flags
- Explicit permission checks in code
- Idempotent request handling

---

### 3. Worker Node (`/apps/worker`)

**Purpose:**  
Asynchronous enforcement, durability, and seniority signals.

#### Responsibilities
- Process background jobs
- Retry with backoff
- Dead-letter handling
- Auto-actions (flag disable, notifications)
- Batch audit persistence

#### Required Properties
- Idempotent handlers
- Explicit schemas
- Safe reprocessing

---

## Core Domain Model (Locked)

- Organization
- Project
- Environment (`dev | staging | prod`)
- User
- Role
- Plan
- Feature
- UsageMetric
- AuditEvent

---

## Integration Model

Clients integrate via:
- Server-side SDK (Node.js first)
- REST API

Principles:
- FlagShip is read-mostly
- Client enforces decisions
- FlagShip never touches customer data

---

## Observability & Auditability

- Structured logs
- Request IDs
- Audit events for all critical actions

---

## Hard Non-Goals

- AI features
- Marketplace
- Plugin system
- White-labeling
- End-user UI
- Multi-region
- Enterprise SSO

---

## Acceptance Criteria

FlagShip V1 is complete when:
- Real SaaS backends can gate features
- Limits block behavior
- Async jobs enforce correctly
- Audit logs reconstruct actions

---

## Final Rule

FlagShip exists to prove **judgment**, not output.
