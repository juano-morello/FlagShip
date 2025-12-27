# FlagShip Web Panel Admin Pages

**Epic:** Web Admin Panel
**Priority:** P1 (User Interface)
**Depends on:** Epic 1-7 (Core APIs), Epic 8 (Web Admin Panel Base)
**Status:** Draft

---

## Overview

FlagShip's web admin panel provides configuration pages for managing features, environments, plans, usage, and audit logs. Built on ForgeStack's existing Next.js web application (`apps/web`), it extends the admin experience with FlagShip-specific pages under the `/flagship` route group.

### Key Components
- **Features Management** - CRUD for feature flags with environment rules
- **Environments Page** - View and manage deployment environments
- **Plans Management** - Configure subscription plans and feature associations
- **Usage Dashboard** - Visualize current usage metrics vs limits
- **Audit Log Viewer** - Read-only search and export of audit events

### Architecture

```
Web Admin Structure:
┌────────────────────────────────────────────────────────────────────┐
│                    apps/web (Next.js)                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  ForgeStack Base (Existing)                    │ │
│  │  - Auth (better-auth)                                          │ │
│  │  - Organization switcher                                       │ │
│  │  - Settings pages (members, billing, api-keys)                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  FlagShip Pages (New)                          │ │
│  │                                                                │ │
│  │  /flagship                                                     │ │
│  │    ├── /features            Feature list & management         │ │
│  │    ├── /features/[key]      Feature detail & rules            │ │
│  │    ├── /environments        Environment list & config         │ │
│  │    ├── /plans               Plan management                   │ │
│  │    ├── /usage               Usage metrics dashboard           │ │
│  │    └── /audit               Audit log viewer                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## User Stories

### Features Management
1. **As an admin**, I want to view all feature flags in a searchable table, so I can quickly find and manage features.
2. **As an admin**, I want to create a new feature flag with type selection (boolean, percentage, plan), so I can gate functionality.
3. **As an admin**, I want to toggle a feature on/off per environment, so I can control feature availability.
4. **As an admin**, I want to configure percentage rollout for gradual releases.
5. **As an admin**, I want to assign features to specific plans.

### Environments
6. **As an admin**, I want to view all environments (dev, staging, prod) with their status, so I can understand deployment contexts.
7. **As an admin**, I want to see feature/limit status per environment at a glance.
8. **As an admin**, I want to create a new environment with type and settings.

### Plans Management
9. **As an admin**, I want to view all subscription plans with their limits, so I can manage pricing tiers.
10. **As an admin**, I want to create/edit plans with feature associations and limits.
11. **As an admin**, I want to assign features to plans, so I can define entitlements.

### Usage Dashboard
12. **As an admin**, I want to see current usage metrics with visual indicators, so I can monitor consumption.
13. **As an admin**, I want to compare usage to limits with progress bars, so I can identify approaching limits.
14. **As an admin**, I want to view usage per metric key in a summary table.

### Audit Log
15. **As an admin**, I want to view a read-only list of audit events with pagination.
16. **As an admin**, I want to filter audit events by date range, action type, and user.
17. **As an admin**, I want to export audit events to CSV/JSON for compliance.

---

## Page Wireframes

### Features List Page (`/flagship/features`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Features                                    [+ Create Feature]        │
├──────────────────────────────────────────────────────────────────────┤
│ 🔍 Search features...          [Type ▼] [Environment ▼] [Plan ▼]     │
├──────────────────────────────────────────────────────────────────────┤
│ Key              │ Name           │ Type       │ Dev   │ Prod │ ⋮    │
├──────────────────┼────────────────┼────────────┼───────┼──────┼──────┤
│ billing_v2       │ Billing V2     │ Plan       │ ✓ On  │ ✓ On │ ⋮    │
│ ai_chat          │ AI Chat        │ Percentage │ 100%  │ 50%  │ ⋮    │
│ dark_mode        │ Dark Mode      │ Boolean    │ ✓ On  │ ✗ Off│ ⋮    │
│ api_v3           │ API Version 3  │ Plan       │ ✓ On  │ ✗ Off│ ⋮    │
└──────────────────┴────────────────┴────────────┴───────┴──────┴──────┘
                              [< Prev] Page 1 of 5 [Next >]
```

### Feature Detail Page (`/flagship/features/[key]`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to Features                                    [Save Changes] │
├──────────────────────────────────────────────────────────────────────┤
│ Feature: billing_v2                                                  │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ General                                                          │ │
│ │ Name:        [Billing V2_________________]                       │ │
│ │ Key:         billing_v2 (immutable)                              │ │
│ │ Description: [New billing system with Stripe________________]   │ │
│ │ Type:        [Plan ▼]                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Environment Rules                           [+ Add Override]     │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Environment │ Status    │ Override │ Actions                    │ │
│ ├─────────────┼───────────┼──────────┼────────────────────────────┤ │
│ │ Development │ [✓ On]    │ Force On │ [Edit] [Remove]            │ │
│ │ Staging     │ [✓ On]    │ Default  │ [Edit]                     │ │
│ │ Production  │ [✗ Off]   │ Default  │ [Edit]                     │ │
│ └─────────────┴───────────┴──────────┴────────────────────────────┘ │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Plan Entitlements (for type: Plan)                               │ │
│ │ ☑ Pro       ☑ Enterprise       ☐ Free                           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Environments Page (`/flagship/environments`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Environments                                   [+ Create Environment] │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ │
│ │ 🟢 Development     │ │ 🟡 Staging         │ │ 🔴 Production      │ │
│ │                    │ │                    │ │                    │ │
│ │ Features: 12/15 On │ │ Features: 10/15 On │ │ Features: 8/15 On  │ │
│ │ Limits: Normal     │ │ Limits: Normal     │ │ Limits: 2 warnings │ │
│ │                    │ │                    │ │                    │ │
│ │ API Key Prefix:    │ │ API Key Prefix:    │ │ API Key Prefix:    │ │
│ │ fsk_dev_           │ │ fsk_staging_       │ │ fsk_prod_          │ │
│ │                    │ │                    │ │                    │ │
│ │ [View Details]     │ │ [View Details]     │ │ [View Details]     │ │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Plans Management Page (`/flagship/plans`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Plans                                              [+ Create Plan]    │
├──────────────────────────────────────────────────────────────────────┤
│ Name       │ Display Name │ Price/mo │ Features │ Limits   │ Actions│
├────────────┼──────────────┼──────────┼──────────┼──────────┼────────┤
│ free       │ Free Plan    │ $0       │ 3        │ 3 limits │ [Edit] │
│ pro        │ Pro Plan     │ $49      │ 8        │ 5 limits │ [Edit] │
│ enterprise │ Enterprise   │ $199     │ 15 (all) │ Unlimited│ [Edit] │
└────────────┴──────────────┴──────────┴──────────┴──────────┴────────┘
```

### Usage Dashboard (`/flagship/usage`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Usage Dashboard                        [Environment: Production ▼]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ API Calls        │  │ Storage          │  │ Seats            │   │
│  │ 9,501 / 10,000   │  │ 5.0 / 10.0 GB    │  │ 8 / 10           │   │
│  │ ████████████░░░  │  │ ██████████░░░░░  │  │ ████████████░░░  │   │
│  │ ⚠️ 95% used      │  │ 50% used         │  │ 80% used         │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Usage by Metric                                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Metric Key     │ Current    │ Limit      │ % Used │ Status    │   │
│  ├────────────────┼────────────┼────────────┼────────┼───────────┤   │
│  │ api_calls      │ 9,501      │ 10,000     │ 95%    │ ⚠️ Warning │   │
│  │ storage_bytes  │ 5.0 GB     │ 10.0 GB    │ 50%    │ ✓ OK      │   │
│  │ seats          │ 8          │ 10         │ 80%    │ ✓ OK      │   │
│  │ projects       │ 3          │ 5          │ 60%    │ ✓ OK      │   │
│  └────────────────┴────────────┴────────────┴────────┴───────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Audit Log Page (`/flagship/audit`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Audit Log                                         [Export CSV] [JSON]│
├──────────────────────────────────────────────────────────────────────┤
│ 📅 Date Range: [Last 7 days ▼]  [Action ▼]  [User ▼]  🔍 Search...   │
├──────────────────────────────────────────────────────────────────────┤
│ Time           │ Action           │ Actor      │ Resource    │ Detail│
├────────────────┼──────────────────┼────────────┼─────────────┼───────┤
│ 2 hours ago    │ feature.updated  │ admin@...  │ billing_v2  │ [👁]  │
│ 5 hours ago    │ plan.updated     │ admin@...  │ pro         │ [👁]  │
│ 1 day ago      │ feature.created  │ admin@...  │ ai_chat     │ [👁]  │
│ 1 day ago      │ limit.enforced   │ api_key    │ api_calls   │ [👁]  │
│ 2 days ago     │ environment.upd  │ admin@...  │ staging     │ [👁]  │
└────────────────┴──────────────────┴────────────┴─────────────┴───────┘
                              [< Prev] Page 1 of 12 [Next >]
```

---

## Component Breakdown

### Shared Components

| Component | Path | Description |
|-----------|------|-------------|
| `EnvironmentSwitcher` | `components/flagship/environment-switcher.tsx` | Dropdown to select environment context |
| `UsageProgressCard` | `components/flagship/usage-progress-card.tsx` | Card with metric, progress bar, and status |
| `PercentageSlider` | `components/flagship/percentage-slider.tsx` | Slider for percentage rollout (0-100) |
| `PlanSelector` | `components/flagship/plan-selector.tsx` | Checkbox group for plan entitlements |

### Features Module

| Component | Path | Description |
|-----------|------|-------------|
| `FeaturesList` | `components/flagship/features/features-list.tsx` | Data table with search, filter, pagination |
| `FeatureForm` | `components/flagship/features/feature-form.tsx` | Create/edit form for features |
| `FeatureDialog` | `components/flagship/features/feature-dialog.tsx` | Modal wrapper for create/edit |
| `FeatureRulesTable` | `components/flagship/features/feature-rules-table.tsx` | Environment rules management |
| `FeatureTypeSelector` | `components/flagship/features/feature-type-selector.tsx` | Radio/select for boolean/percentage/plan |

### Environments Module

| Component | Path | Description |
|-----------|------|-------------|
| `EnvironmentCards` | `components/flagship/environments/environment-cards.tsx` | Grid of environment summary cards |
| `EnvironmentDetail` | `components/flagship/environments/environment-detail.tsx` | Full environment view |
| `EnvironmentForm` | `components/flagship/environments/environment-form.tsx` | Create/edit environment form |

### Plans Module

| Component | Path | Description |
|-----------|------|-------------|
| `PlansList` | `components/flagship/plans/plans-list.tsx` | Data table for plans |
| `PlanForm` | `components/flagship/plans/plan-form.tsx` | Create/edit plan with limits config |
| `PlanFeaturesEditor` | `components/flagship/plans/plan-features-editor.tsx` | Assign features to plan |
| `LimitsEditor` | `components/flagship/plans/limits-editor.tsx` | Key-value editor for limits JSON |

### Usage Module

| Component | Path | Description |
|-----------|------|-------------|
| `UsageSummaryCards` | `components/flagship/usage/usage-summary-cards.tsx` | Top-level usage metrics |
| `UsageMetricsTable` | `components/flagship/usage/usage-metrics-table.tsx` | Detailed usage per metric |

### Audit Module

| Component | Path | Description |
|-----------|------|-------------|
| `AuditLogTable` | `components/flagship/audit/audit-log-table.tsx` | Paginated audit events table |
| `AuditLogFilters` | `components/flagship/audit/audit-log-filters.tsx` | Date range, action, user filters |
| `AuditEventDetail` | `components/flagship/audit/audit-event-detail.tsx` | Modal showing event details |
| `AuditExportButton` | `components/flagship/audit/audit-export-button.tsx` | Export to CSV/JSON


---

## React Query Hooks

### Features Hooks

```typescript
// apps/web/src/hooks/use-flagship-features.ts
interface UseFlagshipFeaturesOptions {
  projectId: string;
  autoFetch?: boolean;
}

export function useFlagshipFeatures({ projectId, autoFetch }: UseFlagshipFeaturesOptions) {
  // List features with pagination
  // Create/update/delete mutations
  // Toggle feature status
}

export function useFlagshipFeature(featureKey: string) {
  // Get single feature detail
  // Environment rules
}

export function useFeatureRules(featureId: string) {
  // CRUD for environment-specific rules
}
```

### Plans Hooks

```typescript
// apps/web/src/hooks/use-flagship-plans.ts
export function useFlagshipPlans(options: UseFlagshipPlansOptions) {
  // List plans with pagination
  // Create/update/delete mutations
}

export function useFlagshipPlan(planId: string) {
  // Get single plan with features
}

export function usePlanFeatures(planId: string) {
  // Add/remove/update plan-feature associations
}
```

### Usage Hooks

```typescript
// apps/web/src/hooks/use-flagship-usage.ts
export function useFlagshipUsage(options: { environmentId?: string }) {
  // Get current usage metrics
  // Comparison to limits
}
```

### Audit Hooks

```typescript
// apps/web/src/hooks/use-flagship-audit.ts
export function useFlagshipAuditLogs(options: UseFlagshipAuditOptions) {
  // List audit events with filters
  // Pagination
  // Export functionality
}
```

---

## API Integration

### Endpoints Used

| Hook | API Endpoint | Method | Description |
|------|--------------|--------|-------------|
| `useFlagshipFeatures` | `/v1/admin/features` | GET | List features |
| `useFlagshipFeatures` | `/v1/admin/features` | POST | Create feature |
| `useFlagshipFeature` | `/v1/admin/features/:key` | GET | Get feature |
| `useFlagshipFeature` | `/v1/admin/features/:key` | PATCH | Update feature |
| `useFlagshipFeature` | `/v1/admin/features/:key` | DELETE | Delete feature |
| `useFeatureRules` | `/v1/admin/features/:key/rules` | GET/POST/PATCH/DELETE | Manage rules |
| `useFlagshipPlans` | `/v1/admin/plans` | GET | List plans |
| `useFlagshipPlans` | `/v1/admin/plans` | POST | Create plan |
| `useFlagshipPlan` | `/v1/admin/plans/:id` | GET/PATCH/DELETE | Manage plan |
| `usePlanFeatures` | `/v1/admin/plans/:id/features` | POST/PATCH/DELETE | Plan-feature assoc |
| `useEnvironments` | `/v1/admin/environments` | GET | List environments |
| `useFlagshipUsage` | `/v1/usage/current` | GET | Current usage |
| `useFlagshipAuditLogs` | `/v1/audit-events` | GET | List events |
| `useFlagshipAuditLogs` | `/v1/audit-events/export` | GET | Export events |

### API Client Configuration

```typescript
// apps/web/src/lib/api/flagship.ts
import { api } from '@/lib/api';

const FLAGSHIP_API_BASE = '/v1';

export const flagshipApi = {
  features: {
    list: (params?: FeatureQueryParams) =>
      api.get<PaginatedResponse<Feature>>(`${FLAGSHIP_API_BASE}/admin/features`, { params }),
    get: (key: string) =>
      api.get<Feature>(`${FLAGSHIP_API_BASE}/admin/features/${key}`),
    create: (data: CreateFeatureDto) =>
      api.post<Feature>(`${FLAGSHIP_API_BASE}/admin/features`, data),
    update: (key: string, data: UpdateFeatureDto) =>
      api.patch<Feature>(`${FLAGSHIP_API_BASE}/admin/features/${key}`, data),
    delete: (key: string) =>
      api.delete(`${FLAGSHIP_API_BASE}/admin/features/${key}`),
  },
  plans: {
    list: (params?: PlanQueryParams) =>
      api.get<PaginatedResponse<Plan>>(`${FLAGSHIP_API_BASE}/admin/plans`, { params }),
    // ... similar pattern
  },
  usage: {
    getCurrent: (environmentId?: string) =>
      api.get<UsageSummary>(`${FLAGSHIP_API_BASE}/usage/current`, { params: { environmentId } }),
  },
  audit: {
    list: (params: AuditQueryParams) =>
      api.get<PaginatedResponse<AuditEvent>>(`${FLAGSHIP_API_BASE}/audit-events`, { params }),
    export: (params: AuditExportParams) =>
      api.get<Blob>(`${FLAGSHIP_API_BASE}/audit-events/export`, {
        params,
        responseType: 'blob'
      }),
  },
};
```

---

## Acceptance Criteria

### Features Management Page
- [ ] Display paginated list of features with columns: key, name, type, status per environment
- [ ] Search features by key or name (client-side filtering for small lists, server-side for >100)
- [ ] Filter by feature type (boolean, percentage, plan)
- [ ] Filter by environment status (on/off in specific environment)
- [ ] Create new feature via modal dialog
- [ ] Edit existing feature by clicking row or edit button
- [ ] Toggle feature enabled/disabled per environment with inline switch
- [ ] Delete feature with confirmation dialog
- [ ] Show loading skeleton while fetching
- [ ] Show empty state when no features exist

### Feature Detail Page
- [ ] Display feature properties (key immutable after creation)
- [ ] Edit name, description, type
- [ ] For percentage type: show slider with 0-100 range
- [ ] For plan type: show plan checkboxes for entitlements
- [ ] Display environment rules table
- [ ] Add/edit/remove environment-specific overrides
- [ ] Save changes button with loading state
- [ ] Navigate back to features list

### Environments Page
- [ ] Display all environments as cards (dev, staging, prod)
- [ ] Show feature count (enabled/total) per environment
- [ ] Show limit status summary per environment
- [ ] Show API key prefix per environment
- [ ] Create new environment (if allowed)
- [ ] Click card to view environment details
- [ ] Visual distinction for production (warning color/badge)

### Plans Management Page
- [ ] Display paginated list of plans
- [ ] Show name, display name, price, feature count, limit count
- [ ] Create new plan via modal/page
- [ ] Edit plan (display name, description, prices, limits)
- [ ] Plan name (slug) immutable after creation
- [ ] Manage plan-feature associations (add/remove features)
- [ ] Delete plan with confirmation (blocked if has active subscriptions)
- [ ] Show active/inactive status badge

### Usage Dashboard
- [ ] Display top-level usage summary cards (3-4 key metrics)
- [ ] Each card shows: metric name, current value, limit, percentage, progress bar
- [ ] Visual indicator for warning (>80%) and critical (>95%) thresholds
- [ ] Environment selector to switch context
- [ ] Detailed usage table with all metrics
- [ ] Show "unlimited" for metrics without limits
- [ ] Auto-refresh every 30 seconds (optional)

### Audit Log Page
- [ ] Display paginated list of audit events
- [ ] Columns: timestamp (relative), action, actor, resource, detail button
- [ ] Date range filter (last 7 days, 30 days, custom)
- [ ] Action type filter (feature.*, plan.*, limit.*, etc.)
- [ ] Actor filter (user email search)
- [ ] Click row or detail button to view full event
- [ ] Event detail modal showing before/after changes
- [ ] Export to CSV button
- [ ] Export to JSON button
- [ ] Pagination with page numbers and count

### Navigation & UX
- [ ] FlagShip section visible in sidebar navigation
- [ ] Breadcrumb navigation on all pages
- [ ] Environment switcher in header (persisted in session)
- [ ] Production environment warning indicator
- [ ] Mobile-responsive layout (desktop-first)
- [ ] Toast notifications for success/error actions
- [ ] Keyboard shortcuts for common actions (optional)

---

## Tasks & Subtasks

### 1. Frontend Infrastructure

#### 1.1 Navigation Integration
- [ ] Add FlagShip section to sidebar in `apps/web/src/components/layout/sidebar.tsx`
- [ ] Create navigation items: Features, Environments, Plans, Usage, Audit
- [ ] Add environment switcher component to header
- [ ] Create FlagShip layout wrapper with environment context

#### 1.2 Route Setup
- [ ] Create route group `apps/web/src/app/(protected)/flagship/`
- [ ] Create layout.tsx with environment provider
- [ ] Create page.tsx (redirect to /flagship/features)

#### 1.3 Shared Components
- [ ] Create `EnvironmentSwitcher` component
- [ ] Create `UsageProgressCard` component
- [ ] Create `PercentageSlider` component
- [ ] Create `PlanSelector` component (checkbox group)

### 2. Features Module

#### 2.1 Features List Page
- [ ] Create `apps/web/src/app/(protected)/flagship/features/page.tsx`
- [ ] Create `FeaturesList` component with data table
- [ ] Create `FeatureDialog` component for create/edit
- [ ] Implement search and filter controls
- [ ] Add inline toggle for feature status

#### 2.2 Feature Detail Page
- [ ] Create `apps/web/src/app/(protected)/flagship/features/[key]/page.tsx`
- [ ] Create `FeatureForm` component
- [ ] Create `FeatureRulesTable` component
- [ ] Create `FeatureTypeSelector` component
- [ ] Implement plan entitlements checkboxes

#### 2.3 Features Hook
- [ ] Create `apps/web/src/hooks/use-flagship-features.ts`
- [ ] Implement list, create, update, delete operations
- [ ] Implement toggle feature status
- [ ] Implement feature rules CRUD

### 3. Environments Module

#### 3.1 Environments Page
- [ ] Create `apps/web/src/app/(protected)/flagship/environments/page.tsx`
- [ ] Create `EnvironmentCards` component
- [ ] Create `EnvironmentDetail` component (modal or page)
- [ ] Create `EnvironmentForm` component

#### 3.2 Environments Hook
- [ ] Create `apps/web/src/hooks/use-flagship-environments.ts`
- [ ] Implement list environments
- [ ] Implement create/update (if allowed)

### 4. Plans Module

#### 4.1 Plans Page
- [ ] Create `apps/web/src/app/(protected)/flagship/plans/page.tsx`
- [ ] Create `PlansList` component
- [ ] Create `PlanForm` component with limits editor
- [ ] Create `PlanFeaturesEditor` component
- [ ] Create `LimitsEditor` component (JSON key-value)

#### 4.2 Plans Hook
- [ ] Create `apps/web/src/hooks/use-flagship-plans.ts`
- [ ] Implement list, create, update, delete operations
- [ ] Implement plan-feature association CRUD

### 5. Usage Module

#### 5.1 Usage Dashboard Page
- [ ] Create `apps/web/src/app/(protected)/flagship/usage/page.tsx`
- [ ] Create `UsageSummaryCards` component
- [ ] Create `UsageMetricsTable` component
- [ ] Implement environment selector integration

#### 5.2 Usage Hook
- [ ] Create `apps/web/src/hooks/use-flagship-usage.ts`
- [ ] Implement get current usage
- [ ] Implement auto-refresh (optional)

### 6. Audit Module

#### 6.1 Audit Log Page
- [ ] Create `apps/web/src/app/(protected)/flagship/audit/page.tsx`
- [ ] Create `AuditLogTable` component
- [ ] Create `AuditLogFilters` component
- [ ] Create `AuditEventDetail` modal component
- [ ] Create `AuditExportButton` component

#### 6.2 Audit Hook
- [ ] Create `apps/web/src/hooks/use-flagship-audit.ts`
- [ ] Implement list with filters and pagination
- [ ] Implement export to CSV/JSON

### 7. API Client

#### 7.1 FlagShip API Module
- [ ] Create `apps/web/src/lib/api/flagship.ts`
- [ ] Implement features API methods
- [ ] Implement plans API methods
- [ ] Implement environments API methods
- [ ] Implement usage API methods
- [ ] Implement audit API methods

#### 7.2 Types
- [ ] Create `apps/web/src/types/flagship/`
- [ ] Define Feature, Plan, Environment, UsageMetric, AuditEvent types
- [ ] Define DTOs for create/update operations
- [ ] Define query parameter types


---

## Test Plan

### Unit Tests (Vitest)

#### Component Tests
- [ ] `FeaturesList` renders features correctly
- [ ] `FeaturesList` filters by search query
- [ ] `FeatureForm` validates required fields
- [ ] `FeatureForm` handles type-specific fields
- [ ] `EnvironmentSwitcher` shows all environments
- [ ] `EnvironmentSwitcher` persists selection
- [ ] `UsageProgressCard` displays correct percentage
- [ ] `UsageProgressCard` shows warning/critical states
- [ ] `PlanForm` validates plan name format
- [ ] `LimitsEditor` parses and serializes JSON correctly
- [ ] `AuditLogFilters` applies date range correctly
- [ ] `AuditExportButton` triggers download

#### Hook Tests
- [ ] `useFlagshipFeatures` fetches and caches correctly
- [ ] `useFlagshipFeatures` handles create mutation
- [ ] `useFlagshipFeatures` handles update mutation
- [ ] `useFlagshipFeatures` handles delete mutation
- [ ] `useFlagshipPlans` pagination works correctly
- [ ] `useFlagshipUsage` returns formatted usage data
- [ ] `useFlagshipAuditLogs` applies filters correctly

### Integration Tests

#### Features Flow
- [ ] Create feature → appears in list
- [ ] Edit feature → changes reflected
- [ ] Toggle feature → status updates
- [ ] Delete feature → removed from list
- [ ] Add environment rule → rule appears in table

#### Plans Flow
- [ ] Create plan → appears in list
- [ ] Edit plan limits → changes saved
- [ ] Add feature to plan → association created
- [ ] Remove feature from plan → association removed
- [ ] Delete plan → removed from list

#### Usage Flow
- [ ] Load usage data → cards display correctly
- [ ] Switch environment → data refreshes

#### Audit Flow
- [ ] Load audit logs → events display
- [ ] Apply filters → results filtered
- [ ] Pagination → next page loads
- [ ] Export CSV → file downloads

### E2E Tests (Playwright)

#### Features Page Tests
- [ ] `features.spec.ts`: Admin can view features list
- [ ] `features.spec.ts`: Admin can create new feature
- [ ] `features.spec.ts`: Admin can edit existing feature
- [ ] `features.spec.ts`: Admin can toggle feature status
- [ ] `features.spec.ts`: Admin can delete feature with confirmation
- [ ] `features.spec.ts`: Search filters features correctly
- [ ] `features.spec.ts`: Feature detail page loads correctly

#### Environments Page Tests
- [ ] `environments.spec.ts`: Admin can view environment cards
- [ ] `environments.spec.ts`: Environment details show feature/limit status
- [ ] `environments.spec.ts`: Environment switcher updates context

#### Plans Page Tests
- [ ] `plans.spec.ts`: Admin can view plans list
- [ ] `plans.spec.ts`: Admin can create new plan
- [ ] `plans.spec.ts`: Admin can edit plan
- [ ] `plans.spec.ts`: Admin can manage plan features

#### Usage Page Tests
- [ ] `usage.spec.ts`: Usage dashboard displays metrics
- [ ] `usage.spec.ts`: Progress bars show correct percentages
- [ ] `usage.spec.ts`: Environment selector works

#### Audit Page Tests
- [ ] `audit.spec.ts`: Audit log displays events
- [ ] `audit.spec.ts`: Date range filter works
- [ ] `audit.spec.ts`: Action type filter works
- [ ] `audit.spec.ts`: Export CSV downloads file
- [ ] `audit.spec.ts`: Export JSON downloads file
- [ ] `audit.spec.ts`: Event detail modal shows changes

### Storybook Stories

#### Components
- [ ] `FeaturesList.stories.tsx`: Default, empty, loading, with filters
- [ ] `FeatureForm.stories.tsx`: Create mode, edit mode, validation errors
- [ ] `FeatureTypeSelector.stories.tsx`: Boolean, percentage, plan types
- [ ] `EnvironmentCards.stories.tsx`: All environment types
- [ ] `EnvironmentSwitcher.stories.tsx`: Default, with production warning
- [ ] `PlansList.stories.tsx`: Default, empty, with many plans
- [ ] `PlanForm.stories.tsx`: Create mode, edit mode
- [ ] `LimitsEditor.stories.tsx`: Empty, with values, validation
- [ ] `UsageProgressCard.stories.tsx`: Normal, warning, critical states
- [ ] `UsageSummaryCards.stories.tsx`: Multiple metrics
- [ ] `AuditLogTable.stories.tsx`: Default, empty, with pagination
- [ ] `AuditLogFilters.stories.tsx`: Default, with active filters
- [ ] `AuditEventDetail.stories.tsx`: Different action types

---

## Multi-Tenancy Considerations

- [ ] All data requests include organization context via session
- [ ] Environment context passed via header or query param
- [ ] API calls use org-scoped API key when configured
- [ ] Permission checks on page load (redirect if unauthorized)
- [ ] RLS enforced on all data queries (server-side)
- [ ] Sensitive actions require additional confirmation
- [ ] Audit events capture actor and organization context

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `apps/web` | Extend with FlagShip pages under `/flagship` route |
| shadcn/ui | Use existing Table, Dialog, Card, Button, Input, etc. |
| `useSession` | Get current user for actor context |
| `useOrgContext` | Get current organization for API calls |
| `api` utility | Base HTTP client with auth headers |
| `useToast` | Toast notifications for feedback |
| Skeleton | Loading states |
| Alert | Error messages |

### Patterns to Follow
- Page structure: server component for metadata, client component for content
- Data table pattern from `MemberList`, `ApiKeysList`, `FeatureFlagsList`
- Form pattern from `WebhookEndpointDialog`
- Hook pattern from `use-webhooks.ts`, `use-dashboard.ts`
- Dialog pattern from existing dialogs with controlled state
- Tabs pattern from `settings/webhooks/page.tsx`

### New shadcn/ui Components Needed
- None - all required components exist in ForgeStack

---

## Design Guidelines

Per AGENTS.md:
- **No design polish beyond clarity** - functional UI only
- **No wizard flows** - direct manipulation
- **No end-user dashboards** - admin-only
- **Desktop-first** - mobile-responsive but optimize for desktop
- Use existing ForgeStack color scheme and typography
- Maintain visual consistency with existing settings pages
- Clear visual hierarchy with proper heading levels
- Accessible: proper labels, focus states, keyboard navigation

---

## Migration Notes

- New pages added under `(protected)/flagship/` route group
- New hooks in `hooks/` following existing patterns
- New API client methods in `lib/api/flagship.ts`
- New types in `types/flagship/` directory
- No modifications to existing ForgeStack pages
- Uses ForgeStack's auth session - no separate authentication
- Extends sidebar navigation with FlagShip section

