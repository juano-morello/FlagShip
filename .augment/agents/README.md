# ForgeStack Augment Sub-Agents

> Augment-specific sub-agent definitions for ForgeStack development.

## Overview

ForgeStack uses a **spec-driven, strict TDD, multi-agent workflow** for feature development. These agents are configured specifically for Augment's sub-agent system.

**Key Principles:**
- **Spec-First**: Every feature starts with a specification
- **Strict TDD**: Tests MUST be written BEFORE implementation code
- **Multi-Agent Review**: Specialized reviewers for backend, frontend, and E2E
- **Context7 Integration**: All agents use Context7 for current best practices

---

## Agent Inventory

### Implementation Agents

| Agent | Model | Description | Scope |
|-------|-------|-------------|-------|
| [forge-spec-writer](./forge-spec-writer.md) | claude-opus-4-5 | Write feature specifications | `/docs/specs/` |
| [forge-backend](./forge-backend.md) | claude-sonnet-4-5 | Implement API, worker, DB (TDD) | `apps/api/`, `apps/worker/`, `packages/db/`, `packages/shared/` |
| [forge-frontend](./forge-frontend.md) | claude-sonnet-4-5 | Implement UI, pages, components (TDD) | `apps/web/`, `packages/ui/` |

### Review Agents

| Agent | Model | Description | Scope |
|-------|-------|-------------|-------|
| [forge-review-orchestrator](./forge-review-orchestrator.md) | claude-opus-4-5 | Orchestrate multi-agent review | Coordinates all reviewers |
| [forge-backend-code-reviewer](./forge-backend-code-reviewer.md) | claude-opus-4-5 | Review backend code + TDD compliance | Backend files |
| [forge-frontend-code-reviewer](./forge-frontend-code-reviewer.md) | claude-opus-4-5 | Review frontend code + a11y + Playwright | Frontend files |
| [forge-end-to-end-code-reviewer](./forge-end-to-end-code-reviewer.md) | claude-opus-4-5 | Full stack integration testing | All files |

---

## ⚠️ STRICT TDD ENFORCEMENT

**Implementation agents MUST write tests BEFORE implementation code.**

### Backend TDD Workflow
1. Write tests FIRST → Run tests → They FAIL
2. Implement minimal code → Run tests → They PASS
3. Refactor → Keep tests green
4. Verify → All tests pass, build succeeds

### Frontend TDD Workflow
1. Write tests + Storybook stories FIRST → Run tests → They FAIL
2. Implement minimal UI → Run tests → They PASS, stories render
3. Refactor → Keep tests green
4. Verify → All tests pass, build succeeds

**Enforcement**: Reviewers will reject code if tests weren't written first.

---

## Mandatory Workflow

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

---

## Strict Rules

### 1. Scope Boundaries
- **No agent may work outside its scope**
- Backend agent cannot modify frontend files
- Frontend agent cannot modify backend files
- Spec-writer cannot write code

### 2. Spec-First Development
- **No implementation without specs**
- Every feature starts with forge-spec-writer
- Implementation agents read specs before coding

### 3. Strict TDD (ENFORCED)
- **Tests MUST be written BEFORE implementation**
- Backend: Unit tests first, then implementation
- Frontend: Tests + Storybook stories first, then implementation
- Reviewers will reject code if TDD wasn't followed

### 4. Mandatory Multi-Agent Review
- **Every implementation must pass all reviewers**
- forge-review-orchestrator coordinates the process
- Backend and frontend reviewers run in parallel
- E2E reviewer validates full integration
- All reviewers must approve before feature is done

### 5. Context7 Integration
- **All agents must use Context7**
- Verify library usage against current documentation
- Check for deprecated patterns
- Follow latest best practices

### 6. No Feature Expansion
- **Implement exactly what's in the spec**
- Don't add features not specified
- Flag spec gaps rather than assuming

---

## Augment Tool Usage

All agents should use Augment's tools effectively:

### Context7 (MANDATORY)
```
resolve-library-id_Context_7: "nestjs" or "nextjs" etc.
get-library-docs_Context_7: topic="routing" or relevant topic
```

### Context Gathering
```
codebase-retrieval: "How is [feature] implemented?"
```

### File Reading
```
view: /path/to/file.ts
view with search_query_regex: "pattern" to find specific code
```

### File Editing
```
str-replace-editor: For precise, targeted edits
```

### Running Commands
```
launch-process: pnpm test, pnpm build, pnpm typecheck
```

### Task Tracking
```
Use task management tools to track progress
```

---

## Context References

All agents should consult the `.ai/` directory for patterns and context:

| Topic | Reference |
|-------|-----------|
| Architecture | `.ai/architecture.md` |
| Code conventions | `.ai/conventions.md` |
| API patterns | `.ai/patterns/api-endpoint.md` |
| Database patterns | `.ai/patterns/database-query.md` |
| React patterns | `.ai/patterns/react-hook.md` |
| Feature docs | `.ai/features/*.md` |
| Common issues | `.ai/troubleshooting.md` |

---

## Parallelization

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Specification | forge-spec-writer | No (sequential) |
| Implementation | forge-backend, forge-frontend | **Yes** |
| Parallel Review | forge-backend-code-reviewer, forge-frontend-code-reviewer | **Yes** |
| E2E Review | forge-end-to-end-code-reviewer | No (after parallel review) |

---

## Error Escalation

If an agent is stuck after 3 attempts:
1. Document the specific issue
2. List what was tried
3. Escalate to the orchestrator
4. Do NOT keep retrying the same approach

---

## Quick Reference

### Starting a Feature
```
1. Run forge-spec-writer with the feature request
2. Review the generated spec
3. Run forge-backend (TDD: tests first, then implementation)
4. Run forge-frontend (TDD: tests + stories first, then implementation)
5. forge-review-orchestrator coordinates review:
   a. forge-backend-code-reviewer (if backend changes)
   b. forge-frontend-code-reviewer (if frontend changes)
   c. forge-end-to-end-code-reviewer (integration)
6. Fix any issues, repeat review if needed
7. Commit when all reviewers approve
```

### Common Commands
```bash
pnpm test          # Run tests
pnpm build         # Build all packages
pnpm typecheck     # Check TypeScript types
pnpm lint          # Run linter
pnpm dev           # Start development servers
pnpm storybook     # Run Storybook
pnpm playwright    # Run Playwright tests
```
