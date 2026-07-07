# ADR-010: Phase Resequencing -- Vision Before Quality Gates

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Founder (Edmund Trinh)

## Context

The original roadmap had a linear progression:

- Phase 3: Testing infrastructure (backend/mobile unit tests, E2E framework, coverage thresholds, integration tests)
- Phase 4: Feature polish (widgets, Watch, streaks, history logging)
- Phase 5: Beta testing
- Phase 6: Store submission

A CTO-level review identified that this sequencing was misaligned with the founder's goals. Widgets and the Watch companion app -- the core product thesis ("replace the homescreen") -- were buried behind months of quality gate work (E2E testing, coverage thresholds, security audits, accessibility audits) that primarily gate *store submission*, not *personal use*.

The founder wanted to use the app personally (on their own phone, watch, and homescreen) long before submitting to app stores. Quality gates that block store submission should not block the founder from experiencing the core product vision.

Additionally, Phase 3 scope had crept: it originally covered backend testing but expanded to include E2E framework setup, security audits, accessibility audits, and CNG migration -- effectively packing three phases of work into one.

## Decision

Resequence the roadmap to **ship vision features before quality gates**:

| Phase | Before (Original) | After (Resequenced) |
|-------|-------------------|---------------------|
| 3A | Backend tests | Backend tests (merged) |
| 3B | Mobile tests + E2E + coverage + security + accessibility | Mobile tests only |
| **4A** | ~~Widget polish~~ | **The Vision:** iOS widgets, Apple Watch, compassionate streaks, history logging MVP |
| **4B** | ~~Quality gates~~ | **Quality gates:** integration tests, E2E, coverage thresholds, CNG migration, EAS Updates, security, accessibility |
| 5 | Beta | **Intelligence:** LLM coach, timing insights, analytics dashboard, Android widgets |
| 6 | Store submission | **Store prep + beta** (merged into one phase) |
| 7 | (none) | **Store submission + launch** |

Key changes:
1. **Phase 4A ("The Vision")** -- Widgets, Watch, compassionate streaks, and history logging MVP. The founder can use the app with widgets on their homescreen and Watch on their wrist.
2. **Phase 4B ("Quality Gates")** -- E2E, coverage, integration tests, CNG migration, security, accessibility. These gate store submission, not personal use.
3. **Phase 5 ("Intelligence")** -- LLM coach deferred. High-impact but requires backend LLM integration, prompt engineering, and careful UX. Ship widget/watch first, layer intelligence on top.
4. **Beta and store prep merged** into Phase 6. They are a single workflow, not separate phases.

## Consequences

### What becomes easier

- **Founder dogfooding.** The founder can use DYDYD with widgets and Watch support months before the app reaches stores. Real personal usage generates better feedback than test plans.
- **Vision validation.** If the "replace the homescreen" thesis works, it validates the product direction before investing in store-submission quality gates. If it does not work, the feedback comes earlier.
- **Motivation alignment.** Building the features the founder is most excited about (widgets, Watch) maintains development momentum. Quality gate work (coverage thresholds, E2E setup) is important but not energizing.
- **Phase 3 unblocking.** Splitting Phase 3 scope (removing E2E, security, accessibility from 3B) means mobile tests can ship without being blocked by framework evaluation decisions.

### What becomes harder

- **Testing coverage gap.** Vision features (Phase 4A) ship before comprehensive testing infrastructure (Phase 4B). Widget and Watch code will initially lack E2E test coverage and may have integration test gaps.
- **Technical debt accumulation.** Building new features on top of an undertested foundation risks compounding bugs. The 7 critical bugs caught by Phase 3 backend tests suggest more may lurk in untested code paths.
- **Store readiness timeline.** Quality gates are pushed later in the roadmap. If store submission is urgent, Phases 4B through 6 must execute quickly.
- **Scope management.** Phase 4A is ambitious: 4 milestones (widgets, Watch, compassionate streaks, history logging MVP). Without strict scope discipline, it could expand the way Phase 3 did.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Vision before quality gates (chosen)** | Founder dogfooding, vision validation, motivation alignment, unblocks Phase 3 | Testing gap for vision features, technical debt risk, later store readiness |
| **Original linear sequence** | Comprehensive testing before new features, no quality gap | Vision features delayed by months of quality gate work, misaligned with founder goals, Phase 3 scope creep persists |
| **Parallel tracks (quality + vision simultaneously)** | Both progress at once, no sequencing tradeoff | Splits agent bandwidth, increases coordination overhead, merge conflicts between quality and feature branches |
| **Skip quality gates entirely** | Fastest path to vision features and store | Unacceptable risk for store submission, no regression safety net, poor portfolio impression |
