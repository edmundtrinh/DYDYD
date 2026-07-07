# Architecture Decision Records (ADRs)

> Design decisions for DYDYD, recorded in [ADR format](https://adr.github.io/).
> Each record captures the context, decision, consequences, and alternatives for a significant technical or product choice.
>
> **Last updated:** 2026-07-07

## Index

| ADR | Summary | Status | Date |
|-----|---------|--------|------|
| [001](001-monorepo-structure.md) | Why Yarn Workspaces + Turbo monorepo over separate repos | Accepted | 2026-05-28 |
| [002](002-expo-over-bare-rn.md) | Why Expo + EAS Build over bare React Native + manual builds | Accepted | 2026-05-28 |
| [003](003-cng-adoption.md) | Why Continuous Native Generation (gitignore ios/android, use config plugins) | Accepted | 2026-06-16 |
| [004](004-compassionate-streaks.md) | Why compassionate streak design over punitive (Finch/Duolingo model) | Accepted | 2026-06-16 |
| [005](005-widget-first-philosophy.md) | Why widgets + Watch are core product, not polish features | Accepted | 2026-06-16 |
| [006](006-agent-driven-sdlc.md) | Why Claude Code agents for development (architect, mobile, QA, etc.) | Accepted | 2026-05-28 |
| [007](007-prisma-over-raw-sql.md) | Why Prisma ORM with migrations over raw SQL or other ORMs | Accepted | 2026-05-28 |
| [008](008-redux-toolkit-state.md) | Why Redux Toolkit + Persist over alternatives (Zustand, MobX, Context) | Accepted | 2026-05-28 |
| [009](009-github-api-over-cli.md) | Why GitHub REST API with PAT over gh CLI for PR management | Accepted | 2026-06-17 |
| [010](010-phase-resequencing.md) | Why widgets pulled forward from Phase 5 to Phase 4A | Accepted | 2026-07-07 |

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
