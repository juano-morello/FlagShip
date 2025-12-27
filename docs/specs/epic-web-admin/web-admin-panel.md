# Web Admin Panel

**Epic:** Web Admin Panel  
**Priority:** P1 (User Interface)  
**Depends on:** Epic 1-7 (All Core Epics)  
**Status:** Draft

---

## Overview

FlagShip's web admin panel provides a configuration interface for managing features, limits, and viewing audit logs. Built on ForgeStack's existing Next.js web application, it extends the admin experience with FlagShip-specific pages and components.

### Key Components
- **Feature Management** - CRUD for feature flags
- **Limit Configuration** - Define and manage usage limits
- **Usage Dashboard** - Visualize current usage
- **Audit Log Viewer** - Search and export audit events
- **Environment Switcher** - Toggle between dev/staging/prod

### Architecture

```
Web Admin Structure:
┌────────────────────────────────────────────────────────────────┐
│                    apps/web (Next.js)                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  ForgeStack Base                         │   │
│  │  - Auth (Clerk)                                          │   │
│  │  - Organization switcher                                 │   │
│  │  - Settings pages                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  FlagShip Pages                          │   │
│  │                                                          │   │
│  │  /flagship                                               │   │
│  │    ├── /features          Feature list & management     │   │
│  │    ├── /features/[key]    Feature detail & rules        │   │
│  │    ├── /limits            Limit configuration           │   │
│  │    ├── /usage             Usage dashboard               │   │
│  │    ├── /audit             Audit log viewer              │   │
│  │    └── /settings          FlagShip settings             │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Feature Management
- [ ] List all features with search and filter
- [ ] Create new feature with type selection
- [ ] Edit feature properties
- [ ] Delete feature with confirmation
- [ ] Manage environment-specific rules
- [ ] Toggle feature enabled/disabled

### Limit Configuration
- [ ] List all limits by plan
- [ ] Create new limit definition
- [ ] Edit limit thresholds
- [ ] Configure soft vs hard limits
- [ ] Set notification thresholds

### Usage Dashboard
- [ ] Current usage per metric
- [ ] Usage vs limit visualization
- [ ] Historical usage charts
- [ ] Period selector (day/week/month)
- [ ] Export usage data

### Audit Log Viewer
- [ ] List audit events with pagination
- [ ] Filter by action, actor, resource
- [ ] Date range selection
- [ ] Event detail modal
- [ ] Export to CSV/JSON

### Environment Switcher
- [ ] Dropdown to select environment
- [ ] Visual indicator of current environment
- [ ] Persist selection in session
- [ ] Warn when in production

### Navigation
- [ ] FlagShip section in sidebar
- [ ] Breadcrumb navigation
- [ ] Quick actions menu

---

## Tasks & Subtasks

### 1. Frontend Tasks

#### 1.1 Navigation Integration
- [ ] Add FlagShip section to sidebar
- [ ] Create navigation items
- [ ] Add environment switcher to header

#### 1.2 Feature List Page
- [ ] Create `apps/web/app/(dashboard)/flagship/features/page.tsx`
- [ ] Data table with columns: key, name, type, status
- [ ] Search and filter controls
- [ ] Create feature button

#### 1.3 Feature Detail Page
- [ ] Create `apps/web/app/(dashboard)/flagship/features/[key]/page.tsx`
- [ ] Feature properties form
- [ ] Environment rules section
- [ ] Percentage rollout slider
- [ ] Plan entitlement checkboxes

#### 1.4 Limit Configuration Page
- [ ] Create `apps/web/app/(dashboard)/flagship/limits/page.tsx`
- [ ] Limits grouped by plan
- [ ] Inline editing
- [ ] Add new limit form

#### 1.5 Usage Dashboard Page
- [ ] Create `apps/web/app/(dashboard)/flagship/usage/page.tsx`
- [ ] Usage cards with progress bars
- [ ] Line charts for historical data
- [ ] Period selector

#### 1.6 Audit Log Page
- [ ] Create `apps/web/app/(dashboard)/flagship/audit/page.tsx`
- [ ] Event list with filters
- [ ] Event detail modal
- [ ] Export buttons

#### 1.7 Environment Switcher Component
- [ ] Create `apps/web/components/flagship/environment-switcher.tsx`
- [ ] Dropdown with environment options
- [ ] Store selection in context/cookie
- [ ] Production warning badge

### 2. API Integration

#### 2.1 SDK Client Setup
- [ ] Configure FlagShip SDK for admin panel
- [ ] Add API routes for server-side calls
- [ ] Handle authentication

#### 2.2 React Query Hooks
- [ ] Create hooks for features CRUD
- [ ] Create hooks for limits CRUD
- [ ] Create hooks for usage data
- [ ] Create hooks for audit events

---

## Test Plan

### Unit Tests
- [ ] Component rendering tests
- [ ] Form validation tests
- [ ] Environment switcher logic

### Integration Tests
- [ ] Feature CRUD flow
- [ ] Limit configuration flow
- [ ] Audit log filtering

### E2E Tests
- [ ] Create feature via UI
- [ ] View usage dashboard
- [ ] Export audit log
- [ ] Switch environments

---

## UI/UX Reference

### Feature List Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Features                                    [+ Create Feature]  │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Search features...          [Type ▼] [Status ▼] [Plan ▼]    │
├─────────────────────────────────────────────────────────────────┤
│ Key              │ Name           │ Type       │ Status │ ⋮    │
├──────────────────┼────────────────┼────────────┼────────┼──────┤
│ billing_v2       │ Billing V2     │ Plan       │ ✓ On   │ ⋮    │
│ ai_chat          │ AI Chat        │ Percentage │ 50%    │ ⋮    │
│ dark_mode        │ Dark Mode      │ Boolean    │ ✓ On   │ ⋮    │
└──────────────────┴────────────────┴────────────┴────────┴──────┘
```

### Usage Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Usage Dashboard                              [This Month ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ API Calls       │  │ Storage         │  │ Seats           │ │
│  │ 9,501 / 10,000  │  │ 5.0 / 10.0 GB   │  │ 8 / 10          │ │
│  │ ████████████░░  │  │ ██████████░░░░  │  │ ████████████░░  │ │
│  │ 95% used        │  │ 50% used        │  │ 80% used        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  API Calls Over Time                     │   │
│  │  10k ┤                                          ╭────    │   │
│  │   8k ┤                              ╭───────────╯        │   │
│  │   6k ┤                    ╭─────────╯                    │   │
│  │   4k ┤          ╭─────────╯                              │   │
│  │   2k ┤──────────╯                                        │   │
│  │    0 ┼────┬────┬────┬────┬────┬────┬────┬────┬────┬────  │   │
│  │      Jan 1   5    10   15   20   25   30                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ForgeStack Integration

### Leveraged Components
| Component | Usage |
|-----------|-------|
| `apps/web` | Extend with FlagShip pages |
| shadcn/ui | Use existing component library |
| React Query | Data fetching patterns |
| Clerk auth | User authentication |
| Organization context | Org-scoped data |

### Patterns to Follow
- Page structure from existing dashboard pages
- Data table pattern from members/API keys pages
- Form patterns from settings pages
- Modal patterns from existing dialogs

### New Components
- Environment switcher (header)
- Usage progress cards
- Percentage rollout slider
- Audit event timeline

---

## Migration Notes

- New pages under `/flagship` route group
- Extends existing layout and navigation
- Uses ForgeStack's SDK for API calls
- No modifications to existing ForgeStack pages

