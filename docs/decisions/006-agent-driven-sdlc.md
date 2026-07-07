# ADR-006: Agent-Driven SDLC

**Status:** Accepted
**Date:** 2026-05-28 (inception; formally recorded 2026-07-07)
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD is a solo-founder project with a full-stack scope: React Native mobile app, Node.js backend, shared TypeScript package, PostgreSQL database, CI/CD pipelines, cloud builds, and native platform integrations. A single developer doing all of this sequentially -- backend routes, then mobile screens, then tests, then documentation -- would result in extremely slow velocity.

The project needed a way to parallelize development across concerns (architecture, mobile, QA, product, compliance, growth) without hiring a team.

## Decision

Use **Claude Code agents** as specialized team members, each with a defined area of ownership:

| Agent | Responsibility |
|-------|---------------|
| **Architect** | Backend API, shared package, database schema, CI/CD, infrastructure |
| **Mobile** | React Native screens, components, navigation, animations, platform integrations |
| **QA** | Test strategy, test writing (unit/integration/E2E), coverage, bug triage |
| **Product** | PRDs, user stories, acceptance criteria, roadmap |
| **Compliance** | Privacy policy, terms of service, store listings, security audits |
| **Design** | Visual QA, design tokens, component specs, brand consistency |
| **Growth** | Analytics, onboarding optimization, push strategy, ASO |

An **orchestrator pattern** governs feature development: each feature issue has a designated orchestrator that reads the issue, spawns subagents for plan/architect/build/test phases, tracks completion, and opens the PR. This workflow is documented in `specs/feature-workflow.md`.

## Consequences

### What becomes easier

- **Parallel development.** Multiple features can be implemented simultaneously. Phase 1 shipped 13 features across two tracks (Screen Wiring and Gamification Polish) in parallel.
- **Specialization.** Each agent operates within its domain with appropriate context. The QA agent writes tests without needing to understand navigation architecture; the mobile agent builds screens without needing to know Prisma query patterns.
- **Consistent patterns.** Agents follow documented patterns (commit message format, branch naming, test structure) from `CLAUDE.md` and `specs/feature-workflow.md`, producing consistent output across features.
- **Documentation as a byproduct.** The agent workflow naturally produces decision records, PRDs, and workflow documentation because agents need written specs to operate.

### What becomes harder

- **Coordination overhead.** Multiple agents working on overlapping areas produce merge conflicts and duplicated boilerplate. Phase 3 experienced this directly: multiple test PRs copied auth/user test infrastructure instead of building on a shared base.
- **PR merge bottleneck.** Agents produce PRs faster than a solo founder can review and merge. Phase 3 had 10 PRs sitting unmerged for 2 weeks, stalling downstream work.
- **Branch divergence.** Parallel agents create branches from the same base, but their changes diverge. When branches add similar files (test helpers, setup scripts), the merge order matters and later merges face conflicts.
- **Quality variance.** Agent output quality depends on prompt quality and context. Under-specified issues produce code that passes tests but misses architectural intent. The SDLC workflow (code review, silent-failure hunting) was added to catch these gaps.
- **Context limits.** Long agent sessions can lose track of earlier decisions or file states, producing inconsistencies that require manual review.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Agent-driven SDLC (chosen)** | Parallel development, specialization, consistent patterns, documentation as byproduct | Coordination overhead, merge bottlenecks, branch divergence, quality variance |
| **Solo sequential development** | No coordination overhead, no merge conflicts, full context retained | Extremely slow velocity, impossible to ship full-stack features in reasonable time, burnout risk |
| **Hire contractors/freelancers** | Human judgment, real-time collaboration, pair programming | Cost, hiring time, onboarding, timezone coordination, code style alignment |
| **Open source community** | Diverse skills, free labor, community building | Repo is private (Q10), contributors need extensive onboarding, quality control is harder, feature prioritization conflicts |
| **No-code / low-code tools** | Fast prototyping, no coding for standard features | Cannot build custom gamification, widget, or watch features; platform lock-in; limited by tool capabilities |
