# Feature Development Workflow

> Standard workflow for implementing any feature issue. Each issue references
> this document instead of repeating the process inline.

## Orchestrator Pattern

Every feature issue has a designated **orchestrator agent** that:
1. Reads the issue and any linked PRD
2. Spawns subagents for each phase below
3. Tracks completion across subagents
4. Opens the PR when all phases pass

## Phases

### 1. Plan
**Agent:** Plan (or Product for PRD-driven features)
- Read the issue acceptance criteria
- Identify affected files (backend routes, mobile screens, shared types)
- Produce a step-by-step implementation plan
- Flag any open questions that block implementation

### 2. Architect
**Agent:** Architect
- Design data model changes (Prisma schema, shared types)
- Define API contracts (request/response shapes, status codes)
- Identify cross-cutting concerns (auth, validation, error handling)
- For test-only issues: define test structure, mocking strategy, coverage targets

### 3. Build
**Agents:** Mobile, Architect (in parallel where independent)
- Implement the code changes
- Follow existing patterns in the codebase (import from @dydyd/shared, use existing middleware)
- Run `yarn build:all` to verify no type errors

### 4. Unit Test
**Agent:** QA
- Write unit tests alongside or after implementation
- Backend: mock Prisma, test validation + error paths + happy paths
- Mobile: use @testing-library/react-native, mock Redux store
- Target: every acceptance criterion has at least one test
- Run `yarn test:all` — all tests must pass

### 5. Validate
**Agent:** QA
- Run full CI checks locally: `yarn build:all && yarn test:all && yarn lint:all`
- Type-check: `yarn workspace @dydyd/backend tsc --noEmit` and same for mobile
- Verify no regressions in existing tests

### 6. PR
**Agent:** Orchestrator
- Create branch: `feat/<issue-number>-<short-description>` or `test/<issue-number>-<short-description>`
- Commit with descriptive message referencing issue number
- Open PR against `main` with issue link, summary, and test plan
- Request QA agent review

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<issue>-<slug>` | `feat/48-auth-route-tests` |
| Bug fix | `fix/<issue>-<slug>` | `fix/52-splashscreen-color` |
| Infrastructure | `infra/<issue>-<slug>` | `infra/50-prisma-migrations` |
| Test | `test/<issue>-<slug>` | `test/48-auth-route-tests` |

## Commit Message Format

```
<type>: <short description> (#<issue>)
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `infra`, `chore`

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] `yarn build:all` passes
- [ ] `yarn test:all` passes
- [ ] `yarn lint:all` passes
- [ ] Type-check passes for affected workspaces
- [ ] PR opened with issue reference
- [ ] No regressions in existing tests
