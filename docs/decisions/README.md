# Architecture Decision Records (ADRs)

> Design decisions for DYDYD, recorded in [ADR format](https://adr.github.io/).
> Each record captures the context, decision, consequences, and alternatives for a significant technical or product choice.
>
> **Last updated:** 2026-07-07

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-monorepo-structure.md) | Yarn Workspaces + Turborepo Monorepo | Accepted | 2026-05-28 |
| [002](002-expo-over-bare-rn.md) | Expo + EAS Build Over Bare React Native | Accepted | 2026-05-28 |
| [003](003-cng-adoption.md) | Continuous Native Generation (CNG) | Accepted | 2026-06-16 |
| [004](004-compassionate-streaks.md) | Compassionate Streak Design | Accepted | 2026-06-16 |
| [005](005-widget-first-philosophy.md) | Widget-First Philosophy | Accepted | 2026-06-16 |
| [006](006-agent-driven-sdlc.md) | Agent-Driven SDLC | Accepted | 2026-05-28 |
| [007](007-prisma-over-raw-sql.md) | Prisma ORM With Migrations | Accepted | 2026-05-28 |
| [008](008-redux-toolkit-state.md) | Redux Toolkit + Redux Persist for State Management | Accepted | 2026-05-28 |
| [009](009-github-api-over-cli.md) | GitHub REST API Over gh CLI | Accepted | 2026-06-17 |
| [010](010-phase-resequencing.md) | Phase Resequencing -- Vision Before Quality Gates | Accepted | 2026-07-07 |

## How to Read These

Each ADR follows a consistent structure:

- **Context** -- The problem or situation that motivated the decision
- **Decision** -- What was chosen and why
- **Consequences** -- What becomes easier *and* harder as a result
- **Alternatives Considered** -- Other options evaluated with their tradeoffs

## Categories

### Architecture (inception decisions)
- ADR-001: Monorepo structure
- ADR-002: Expo + EAS Build
- ADR-007: Prisma ORM
- ADR-008: Redux Toolkit

### Infrastructure (mid-project decisions)
- ADR-003: CNG adoption
- ADR-009: GitHub REST API

### Product (founder decisions from open questions)
- ADR-004: Compassionate streaks
- ADR-005: Widget-first philosophy

### Process
- ADR-006: Agent-driven SDLC
- ADR-010: Phase resequencing

## Related Documents

- `specs/open-questions.md` -- All 10 open questions with founder decisions (2026-06-16)
- `specs/roadmap.md` -- Full roadmap with resequencing rationale
- `specs/feature-workflow.md` -- Agent-driven feature development workflow
- `docs/lessons-learned.md` -- Retrospective on Phases 0-3
