# ForgeStack – agents.md (V2)

## 1. Project Summary

ForgeStack is a **production-grade multi-tenant SaaS starter**, built for engineering teams that want:

- Real multi-tenancy with **PostgreSQL Row-Level Security (RLS)**
- A clean monorepo architecture
- Fully tested auth + orgs + roles + invitations
- Extensible modules for billing, webhooks, API keys, audit logs, file uploads, notifications, and feature flags

ForgeStack is the foundation for **real** SaaS products, not a toy boilerplate.

Primary goal (V2): expand ForgeStack into a complete SaaS platform with robust infrastructure modules and polished UX flows.

---

## 2. Monorepo Structure

ForgeStack/  
├── apps/  
│   ├── api/ — NestJS backend  
│   ├── web/ — Next.js frontend  
│   └── worker/ — BullMQ jobs  
├── packages/  
│   ├── db/ — Drizzle ORM + schema + migrations + RLS  
│   ├── shared/ — Types, DTOs, constants  
│   └── ui/ — Shared UI components + design system  
└── docs/  
├── agents.md  
└── specs/ — Spec-driven development

---

## 3. Existing Features (Preserved)

### Authentication (better-auth)
- Email/password signup + login
- Sessions via secure cookies
- UUID user IDs
- Organizations + roles
- Invitation workflows

### Multi-tenancy
- Full RLS
- Tenant context enforcement
- Owner/member role logic
- Protection against removing last owner

### Projects Module
- CRUD
- Organization-scoped
- Fully tested

### Infrastructure
- PostgreSQL
- Drizzle ORM
- Redis + BullMQ
- Docker Compose
- Resend integration
- Test coverage >90%

---

## 4. V2 feature modules (New)

Agents MUST implement these modules:

### Billing (Stripe)
- Customer creation
- Subscription management
- Billing portal
- Stripe webhooks via worker
- RLS-safe billing records

### File Uploads (Cloudflare R2 default; S3 optional)
- Presigned URLs
- Direct uploads
- Metadata validation
- Optional AWS S3 adapter

### API Keys
- Hashed keys
- Key creation + revocation
- Scopes: read/write/admin
- Nest API key guard
- UI to manage keys

### Outgoing Webhooks
- Endpoints table
- Event queue
- Retry logic
- Signing secrets
- Delivery logs
- RLS scoped

### Incoming Webhooks
- Signed payload verification
- Worker processing
- Idempotency keys
- Logging

### Audit Logs (Immutable)
- Append only
- Org-scoped
- Event types: auth, org, billing, API keys, etc.

### Activity Feed
- Human-readable
- Grouped events
- Dashboard view

### Notifications
- In-app notifications
- Read/unread states
- Email triggers via Resend

### Feature Flags (GrowthBook)
- Server-side evaluation
- Per-user/org targeting
- UI for toggles
- Caching

### Rate Limiting
- NestJS-level
- User/org/API key aware

### User Settings
- Profile
- Avatar upload
- Email change
- Password reset

### Organization Settings
- Logo upload
- Preferences

---

## 5. Third-Party Integrations (Defaults)

- Transactional emails → Resend
- Marketing emails → Customer.io (optional: Mailchimp)
- Feature flags → GrowthBook (optional: LaunchDarkly, Unleash)
- File storage → Cloudflare R2 (optional: AWS S3)
- Billing → Stripe
- Queues → Redis/BullMQ

---

## 6. Architecture Rules (Hard constraints)

### Multi-tenancy
- RLS is mandatory
- All org tables must include org_id
- All DB access must use:

withTenantContext({ orgId, userId, role }, (db) => ...)

### Database Schema (packages/db)
- Drizzle ORM schema files in `src/schema/`
- **IMPORTANT**: Schema imports must NOT use `.js` extensions
  - ✅ `import { organizations } from './organizations'`
  - ❌ `import { organizations } from './organizations.js'`
  - Reason: drizzle-kit reads .ts files directly and fails with .js extensions

### Backend
- NestJS only
- Drizzle ORM only
- No direct SQL bypassing RLS
- DTOs/types must live in packages/shared

### Frontend
- Next.js App Router
- shadcn/ui
- Shared UI in packages/ui
- Strict TypeScript
- Server components by default

### Workers
- All async logic via BullMQ
- Webhooks/emails/audit logs/notifications must be worker-driven

---

## 7. Development Methodology (SDD + Strict TDD + Multi-Agent Review)

### Spec-Driven Development (SDD)
- Every feature MUST begin with a spec at:
  /docs/specs/<epic>/<story>.md
- Specs contain:
    - Context
    - User story
    - Acceptance criteria
    - Tasks (backend/frontend/worker/tests)
    - Test plan
- Written ONLY by forge-spec-writer
- Implementation may not begin without a spec.

### Strict Test-Driven Development (TDD) - ENFORCED

**TDD is MANDATORY. Implementation agents MUST NOT write any implementation code before writing comprehensive tests.**

#### Backend TDD Workflow (Exact Order)
1. **Write Tests First**: Based on spec's acceptance criteria and test plan, write ALL necessary unit tests BEFORE any implementation code
   - Tests must cover: happy paths, edge cases, error conditions, boundary conditions
   - Tests must be comprehensive enough to validate all acceptance criteria
2. **Implement Minimal Logic**: Write the minimum business logic required to make all tests pass
   - Focus on making tests green, not on premature optimization
   - Implement only what's needed to satisfy test requirements
3. **Refactor**: Once all tests pass, refactor for:
   - Readability and maintainability
   - Performance optimization (if needed)
   - Code organization and structure
   - Adherence to project conventions and architecture rules
4. **Verify**: Re-run all tests to ensure refactoring didn't break functionality

**Enforcement**: `forge-backend` MUST NOT write any implementation code before writing comprehensive tests. If implementation code is detected before tests, the agent must stop and write tests first.

#### Frontend TDD Workflow (Exact Order)
1. **Write Tests First**:
   - Create component tests for all UI components
   - Write Storybook stories for every component with all relevant states and variants
   - Include unit tests for any state management, hooks, or business logic
   - Cover user interaction flows and edge cases
2. **Implement Minimal UI/Logic**: Build components and pages with just enough code to pass tests and render stories correctly
3. **Refactor**: Improve component structure, styling, accessibility, and performance while keeping tests green
4. **Verify**: Re-run all tests and validate Storybook stories

**Enforcement**: `forge-frontend` MUST NOT create component implementation code before writing component tests and Storybook stories.

#### Workers
- Unit tests for handlers MUST be written first
- Integration tests for multi-step external interactions

### Context7 Integration (MANDATORY)

**All agents** (implementation and review) MUST use Context7 to:
- Consult the most current documentation for languages, frameworks, and libraries
- Verify API usage, best practices, and patterns against official documentation
- Check for deprecated methods or outdated patterns
- Ensure code follows the latest recommended approaches

**Specific Context7 Usage**:
- Before implementing: Query Context7 for current best practices
- During review: Validate code against Context7 documentation
- When in doubt: Always defer to Context7 for authoritative guidance

---

## 8. Subagent Roles (Strict boundaries)

### Implementation Agents

#### forge-spec-writer
- ONLY modifies /docs/specs/**
- Writes specs, acceptance criteria, and test plans
- NO code changes allowed

#### forge-backend
- ONLY modifies:
    - apps/api/**
    - apps/worker/**
    - packages/db/**
    - packages/shared/**
- **MUST follow strict TDD**: Write tests FIRST, then implement
- Implements backend + worker logic according to specs
- MUST use Context7 for library best practices
- MUST NOT modify frontend files
- MUST NOT write implementation before tests

#### forge-frontend
- ONLY modifies:
    - apps/web/**
    - packages/ui/**
    - Storybook stories
    - Frontend unit tests
    - Playwright specs
- **MUST follow strict TDD**: Write tests + Storybook stories FIRST, then implement
- Implements UI/pages according to specs
- MUST use Context7 for library best practices
- MUST NOT modify backend or db schema
- MUST NOT write implementation before tests and stories

### Review Agents (Multi-Agent Orchestrated Review)

#### forge-backend-code-reviewer
**Scope**: Reviews all backend code
- `apps/api/**` (NestJS API server)
- `apps/worker/**` (BullMQ workers)
- `packages/db/**` (Database schema, migrations, RLS policies)
- `packages/shared/**` (Shared types, DTOs, constants)

**Responsibilities**:
- Verify TDD compliance: confirm tests were written first and cover all acceptance criteria
- Validate RLS enforcement and multi-tenancy rules
- Check error handling, edge cases, and security vulnerabilities
- Ensure adherence to NestJS and Drizzle ORM best practices
- Verify test coverage meets >90% threshold
- Validate integration with worker queues and external services
- Check for proper use of dependency injection and separation of concerns
- **MUST use Context7** to verify code follows current best practices

#### forge-frontend-code-reviewer
**Scope**: Reviews all frontend code
- `apps/web/**` (Next.js application)
- `packages/ui/**` (Shared UI components)
- Storybook stories
- Frontend unit and component tests

**Responsibilities**:
- Verify TDD compliance: confirm component tests and Storybook stories were created before implementation
- **Access to Playwright**: Run and validate end-to-end test flows for UI interactions
- **Access to Figma** (if configured): Compare implemented designs against Figma specifications
- Check accessibility (a11y) compliance, responsive design, and cross-browser compatibility
- Validate proper use of Next.js App Router, Server Components, and Client Components
- Ensure shadcn/ui and design system consistency
- Review state management, hooks usage, and performance optimizations
- **MUST use Context7** to verify code follows current best practices

#### forge-end-to-end-code-reviewer
**Scope**: Reviews the complete feature implementation across the entire stack

**Responsibilities**:
- Execute full end-to-end flows to validate the feature works as specified
- Test integration between frontend, backend, database, and worker components
- Identify bugs, performance bottlenecks, security issues, and UX problems
- Verify the implementation satisfies ALL acceptance criteria from the original spec
- Check for edge cases or failure scenarios not covered by unit/component tests
- Validate multi-tenancy and RLS work correctly in real-world scenarios
- **Create follow-up tasks**: When issues are found, create new tasks with:
  - Clear description of the issue
  - Steps to reproduce
  - Suggested fix or area to investigate
  - Priority level
- **Trigger workflow restart**: For critical issues, restart the implementation flow with new tasks

#### forge-review-orchestrator
**Role**: Manages the multi-agent code review workflow

**Orchestration Flow**:
1. **Trigger**: Activated when `forge-backend` or `forge-frontend` completes implementation
2. **Parallel Review**: Simultaneously invoke:
   - `forge-backend-code-reviewer` (if backend changes exist)
   - `forge-frontend-code-reviewer` (if frontend changes exist)
3. **Collect Feedback**: Aggregate all feedback, issues, and suggestions from both reviewers
4. **Decision Point**:
   - If critical issues found: Send back to implementation phase with specific tasks
   - If minor issues found: Request refinements from the appropriate implementation agent
   - If approved: Proceed to `forge-end-to-end-code-reviewer`
5. **End-to-End Review**: Invoke `forge-end-to-end-code-reviewer` for full integration testing
6. **Final Decision**:
   - If issues found: Create follow-up tasks and restart workflow from step 2
   - If approved: Mark feature as complete
7. **Documentation**: Generate a review summary documenting all feedback, changes made, and final approval

**Orchestrator Rules**:
- Must ensure all relevant reviewers are invoked based on what code changed
- Cannot skip any review stage
- Must enforce that all critical issues are resolved before proceeding
- Maintains review history and tracks iterations

---

## 9. Mandatory workflow for EVERY feature

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           1. SPECIFICATION                                  │
│                                                                             │
│   User Request ──▶ forge-spec-writer ──▶ /docs/specs/<epic>/<story>.md     │
│                                                                             │
│   Output: Acceptance criteria, tasks, test plan                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    2. IMPLEMENTATION (STRICT TDD)                           │
│                                                                             │
│   ┌─────────────────────────────┐     ┌─────────────────────────────┐      │
│   │      forge-backend          │     │      forge-frontend         │      │
│   │                             │     │                             │      │
│   │  1. Write Tests FIRST       │     │  1. Write Tests FIRST       │      │
│   │  2. Implement Minimal Logic │ AND │  2. Write Storybook Stories │      │
│   │  3. Refactor                │     │  3. Implement Minimal UI    │      │
│   │  4. Verify                  │     │  4. Refactor & Verify       │      │
│   │                             │     │                             │      │
│   │  ⚠️ NO CODE BEFORE TESTS    │     │  ⚠️ NO CODE BEFORE TESTS    │      │
│   └─────────────────────────────┘     └─────────────────────────────┘      │
│                                                                             │
│   Both agents MUST use Context7 for library best practices                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                  3. ORCHESTRATED CODE REVIEW                                │
│                                                                             │
│                    forge-review-orchestrator                                │
│                            │                                                │
│              ┌─────────────┴─────────────┐                                 │
│              ▼                           ▼                                 │
│   ┌─────────────────────┐     ┌─────────────────────┐                      │
│   │ forge-backend-      │     │ forge-frontend-     │                      │
│   │ code-reviewer       │     │ code-reviewer       │                      │
│   │                     │     │                     │                      │
│   │ • TDD compliance    │     │ • TDD compliance    │                      │
│   │ • RLS validation    │     │ • Playwright tests  │                      │
│   │ • Security review   │     │ • Figma comparison  │                      │
│   │ • Context7 verify   │     │ • Context7 verify   │                      │
│   └─────────────────────┘     └─────────────────────┘                      │
│              │                           │                                 │
│              └─────────────┬─────────────┘                                 │
│                            ▼                                               │
│              ┌─────────────────────────┐                                   │
│              │ forge-end-to-end-       │                                   │
│              │ code-reviewer           │                                   │
│              │                         │                                   │
│              │ • Full integration test │                                   │
│              │ • Acceptance criteria   │                                   │
│              │ • Create follow-up tasks│                                   │
│              └─────────────────────────┘                                   │
│                            │                                               │
│              ┌─────────────┴─────────────┐                                 │
│              ▼                           ▼                                 │
│         ❌ Issues Found            ✅ Approved                             │
│              │                           │                                 │
│              ▼                           ▼                                 │
│    Return to Step 2              Mark Feature Complete                     │
│    with follow-up tasks                                                    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Workflow Rules**:
1. NO feature may skip this pipeline
2. NO implementation may proceed without tests written first
3. ALL reviewers must approve before feature is complete
4. Critical issues trigger workflow restart from implementation phase
5. All agents must use Context7 for library documentation

---

## 10. Documentation Structure

/docs  
agents.md  
specs/  
epic-auth/  
epic-orgs/  
epic-projects/  
epic-billing/  
epic-webhooks/  
epic-api-keys/  
epic-audit-logs/  
epic-feature-flags/  
epic-storage/

---

## 11. Implementation Priorities (V2)

1. Billing
2. File uploads
3. API keys
4. Outgoing webhooks
5. Incoming webhooks
6. Audit logs
7. Activity feed
8. Notifications
9. Feature flags
10. Rate limiting
11. User settings
12. Org settings
13. Design system
14. Dashboard
15. Marketing site
16. Onboarding
17. MDX docs site

---

## 12. Global Rules

- Never add libraries without instruction
- Never bypass RLS
- Never skip tests
- Always update specs when behavior changes
- Always use strict TypeScript
- Prefer explicitness over cleverness
- Changes must be PR-sized and well-scoped

---
