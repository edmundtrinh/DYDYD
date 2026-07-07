# Lessons Learned: Phases 0-3

> Retrospective on DYDYD development from inception (Phase 0, May 2026) through the Phase 3A merge sprint (July 2026).
> Written with candor for future contributors -- human or agent -- to avoid repeating mistakes and build on what works.
>
> **Date:** 2026-07-07
> **Author:** Founder (Edmund Trinh)
> **Scope:** Phase 0 (Unblock Everything) through Phase 3A (Merge & Stabilize)

---

## What Went Well

### 1. Shared package as single source of truth

The `@dydyd/shared` package -- containing all domain types (`User`, `Quest`, `Badge`, etc.), 30+ predefined quests, 20+ badges, level titles, and utility functions -- eliminated type drift across the monorepo. Backend routes and mobile screens import from the same source. Zero type mismatches were reported across 3 packages and 47+ merged PRs.

**Why it worked:** The shared package was established in Phase 0 before any feature work began. By the time agents started building routes and screens, the types were already defined and tested (120/120 tests passing). There was never a "sync the types" step because there was only one copy.

**Lesson:** Invest in the shared layer before building features on top of it. The upfront cost of defining types, constants, and utilities pays for itself many times over.

### 2. Agent parallelism

Phase 1 shipped 13 features across two parallel tracks (Screen Wiring and Gamification Polish) with 6 CI fix PRs -- a scope that would have taken a solo developer weeks of sequential work. Agents operated in their specialization domains (architect for backend, mobile for screens, QA for tests) and produced consistent output following documented patterns.

**Why it worked:** Clear agent ownership boundaries (defined in `specs/feature-workflow.md`) and a structured SDLC (plan -> architect -> build -> test -> validate -> PR) meant agents could work independently without blocking each other.

**Lesson:** Parallelism works when the interfaces between agents are well-defined. It breaks down when agents share files or build on each other's uncommitted work (see "What Didn't Go Well" below).

### 3. Test-first approach in Phase 3

Adding 94+ backend unit tests across auth, quests, and user routes immediately caught 7 critical bugs: route validation errors, incorrect Prisma queries, and streak logic edge cases. These bugs had been silently present since Phase 1 and would have surfaced as user-facing failures.

**Why it worked:** The QA agent tested against the actual route handlers with mocked Prisma, not against the spec. The tests asked "what does this code actually do?" not "what should this code do?" This revealed gaps between intent and implementation.

**Lesson:** Backend code without tests is not "working code" -- it is "code that has not failed yet." The 7 bugs were not edge cases; they were mainstream paths (e.g., auth validation, quest creation) that happened to not be exercised by manual testing.

### 4. Phase planning with clear milestones

Phases 0, 1, and 2 each had a clear definition of done tracked in `specs/roadmap.md`. Milestones v0.2.0 (Phase 1) and v0.3.0 (Phase 2) were both closed cleanly with all planned features merged. The roadmap served as the single source of truth for "what's next" and prevented scope drift within completed phases.

**Why it worked:** Each phase had an explicit task table with issue numbers, PR numbers, and status. The definition of done was a checklist, not a vibe. When all rows showed "DONE," the phase was complete.

**Lesson:** Milestones work when they are concrete and bounded. "Phase 1: Core Gamification Loop" is a clear scope. "Phase 3: Testing and Quality" is not (see scope creep below).

### 5. Decision records in specs/open-questions.md

All 10 open questions were documented with context, options, recommendations, and founder decisions in a single file. Each decision included the reasoning, what it blocked, and what it enabled. The decision tracking table at the bottom provided at-a-glance status.

**Why it worked:** The format forced structured thinking. Writing "Option A: Pros / Cons. Option B: Pros / Cons. Recommendation: ..." required the founder to consider tradeoffs explicitly, not just pick the first idea. The "Blocks" field connected decisions to downstream work, making the impact of indecision visible.

**Lesson:** Decision records are not bureaucracy -- they are time machines. When Phase 4A planning began weeks later, the Q3 (widgets) and Q8 (Watch) decisions and their rationale were immediately accessible without re-deriving them.

---

## What Didn't Go Well

### 1. PR merge bottleneck

Phase 3's testing sprint produced 10 PRs in rapid succession. All 10 sat unmerged for approximately 2 weeks, stalling downstream work. The PRs were ready (tests passing, CI green), but the solo founder could not review and merge fast enough.

**Root cause:** The agent-driven SDLC produces PRs faster than a single human can review. There was no merge authority delegation and no automated merge rules.

**Impact:** Downstream Phase 3 work was blocked. Contributors (agents) could not build on merged code. New branches forked from an increasingly stale `main`.

**Fix adopted:** The Phase 3A "Merge & Stabilize" sub-phase was created specifically to clear the backlog. PR #74 squash-merged the combined backend tests and bug fixes, and the remaining PRs were merged or superseded. Going forward, smaller batches with faster merge cycles are planned.

### 2. Branch divergence

Multiple agents created branches from the same `main` commit but added overlapping files. The git history shows literal evidence: commits `2c1a1ef` and `c0bffb8` are the same change on divergent branches; `fb6e3ef` and `c8a5f58` duplicate the same test infrastructure. When these branches attempted to merge, conflicts arose on files that should not have conflicted.

**Root cause:** Agents working in parallel did not coordinate on shared infrastructure files. Each test PR independently created test helpers, Jest setup, and mock utilities rather than building on a shared base.

**Impact:** Merge conflicts required manual resolution. Some PRs were superseded entirely because the conflict resolution was more effort than re-implementing on top of the merged base.

**Fix adopted:** The "supersede-and-close" pattern: when a PR's changes are subsumed by a later, broader PR (e.g., PR #74 superseded #65), close the original rather than attempting to rebase it. Additionally, the clean cherry-pick strategy was adopted for extracting specific changes from conflicting branches.

### 3. Test file duplication

Each backend test PR (auth, quests, health, progress, badges, notifications) independently set up test infrastructure: mock Prisma, test app creation, UUID generation, and JWT helpers. The result was 6 copies of nearly identical boilerplate across test files.

**Root cause:** The QA agent was given individual issues (one per route) rather than a single "establish test infrastructure, then test all routes" issue. Without a shared test helper file as a starting point, each PR reinvented the setup.

**Impact:** Increased maintenance surface. When the Prisma mock pattern needed updating, it required changes in 6+ files rather than one.

**Fix adopted:** PR #74 consolidated test infrastructure. Going forward, test helpers live in `apps/backend/src/__tests__/helpers/` and are shared across all test suites. New test files import from helpers rather than defining their own setup.

### 4. README vs. reality disconnect

The README displayed a "PRs Welcome" badge and linked to `CONTRIBUTING.md`, presenting the project as open-source-ready. Meanwhile, the repo was private and the founder's decision (Q10) was to keep it private until store launch. The README was aspirational rather than current.

**Root cause:** The README was authored as a best-practices template rather than a description of the project's current state. The open-source badges and contributing links were added before the open-source timeline decision was made.

**Impact:** Minimal -- the repo is private, so only the founder sees the disconnect. But it set a pattern of documentation describing the future rather than the present, which is confusing when documents are used for decision-making.

**Lesson:** Documentation should describe what *is*, with a clearly marked section for what *will be*. Aspirational content should be labeled as such.

### 5. Phase 3 scope creep

Phase 3 was originally "Backend Testing." It expanded to include: backend unit tests, mobile unit tests, E2E framework setup (Detox vs. Maestro evaluation), integration tests (Docker Postgres), CI coverage thresholds, CNG migration, EAS Updates configuration, security audit, accessibility audit, and performance profiling.

That is 10+ distinct workstreams packaged as a single phase. The result was a phase that could never be "done" because the scope kept growing.

**Root cause:** "Testing and Quality" is a category, not a phase. Phases work when they have bounded scope. A phase named "Backend Testing" can be completed; a phase named "Quality" cannot.

**Impact:** Phase 3 stalled. The feeling of making progress disappeared because the finish line kept moving. This contributed to the PR merge bottleneck (no urgency to merge if the phase is never done anyway).

**Fix adopted:** Phase resequencing (ADR-010). Phase 3 was split: 3A (merge & stabilize -- done), 3B (mobile tests only). Quality gates that previously bloated Phase 3 moved to Phase 4B, separated from vision features in Phase 4A. Each sub-phase now has a bounded, completable scope.

---

## Process Improvements Adopted

### 1. Phase resequencing (ADR-010)

Vision features (widgets, Watch, compassionate streaks) pulled forward to Phase 4A. Quality gates (E2E, coverage, integration tests) moved to Phase 4B. The founder can use the app personally before store-readiness gates are satisfied.

**Rationale:** Quality gates exist to satisfy app store reviewers and external users. The founder does not need E2E tests to install the app on their own phone. Building the features the founder is most excited about maintains development momentum.

### 2. Clean cherry-pick strategy

When multiple branches diverge from the same base and conflict, do not attempt to rebase them all. Instead:
1. Merge the broadest, most complete PR first
2. Cherry-pick specific commits from remaining branches if needed
3. Close (supersede) remaining PRs with a comment explaining the supersession

This is faster and less error-prone than resolving cascading merge conflicts.

### 3. Supersede-and-close pattern

When PR B subsumes PR A's changes (either by implementing them independently or by building on top of them), close PR A with a comment: "Superseded by #B -- changes incorporated in the broader PR." This keeps the PR list clean and avoids zombie PRs that will never merge.

### 4. Bounded phase scope

Every phase and sub-phase must have a finite, enumerable task list. The definition of done is a checklist that can be completed. If a phase's task list keeps growing, it is a category, not a phase -- split it.

### 5. Comprehensive manual test plan

Before building vision features (Phase 4A), a comprehensive manual test plan was created at `specs/testing/manual-test-plan.md`. This ensures that even without E2E test automation (deferred to Phase 4B), there is a structured way to validate features before merge.

---

## Metrics

| Metric | Value |
|--------|-------|
| Phases completed | 4 (Phase 0, 1, 2, 3A) |
| Total PRs merged | 47+ |
| Total commits on main | 59+ |
| Backend unit tests | 162+ (7 suites: auth, quests, user, health, progress, badges, notifications) |
| Shared package tests | 120 (2 suites) |
| Mobile test files | 19 |
| Critical bugs caught by tests | 7 |
| Open questions resolved | 10/10 |
| Features shipped (Phase 1) | 13 |
| Features shipped (Phase 2) | 7 |

---

## Recommendations for Phase 4A and Beyond

1. **Merge frequently.** Do not accumulate more than 3 unmerged PRs at any time. Review and merge daily, not in batches.
2. **Shared infrastructure first.** Before spawning parallel agents for a set of related tasks, establish the shared helpers/utilities/types in a merged PR. Then fan out.
3. **One concern per issue.** Phase 3 issues were too broad ("add backend test infrastructure and auth/user route tests" -- that is two issues). Smaller issues merge faster and conflict less.
4. **Label aspirational content.** If documentation describes future plans, mark it clearly. Use "Planned" or "Not yet implemented" labels. Do not present future features as current capabilities.
5. **Scope phases by outcome, not category.** "Ship widgets to homescreen" is a phase. "Quality" is not. Every phase should answer: "What can the user do after this phase that they could not do before?"

---

*This document will be updated after Phase 4A to capture lessons from the vision feature implementation.*
