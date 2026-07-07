# Contributing to DYDYD

Thank you for your interest in contributing to DYDYD (Did You Do Your Dailies?) -- a gamified habit tracking app built with React Native, Node.js/Express, and TypeScript.

We welcome contributions of all kinds: bug fixes, new features, documentation improvements, test coverage, and design suggestions.

## Table of Contents

- [Development Setup](#development-setup)
- [Monorepo Structure](#monorepo-structure)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Agent-Driven Development](#agent-driven-development)
- [Code of Conduct](#code-of-conduct)

## Development Setup

### Prerequisites

- **Node.js 22+** (LTS recommended)
- **Yarn 4** via Corepack (`corepack enable` activates it automatically)
- **Docker** (required for the PostgreSQL test database)
- **EAS CLI** (`npm install -g eas-cli`) for Expo cloud builds
- **Git** with hooks enabled (never use `--no-verify`)

### Clone and Install

```bash
git clone https://github.com/edmundtrinh/DYDYD.git
cd DYDYD
corepack enable
yarn install
```

### Environment Configuration

Create a `.env` file in `apps/backend/` with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dydyd
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
```

### Build the Shared Package

The shared package must be built before the backend or mobile app can consume it:

```bash
yarn workspace @dydyd/shared build
```

### Start Development Servers

```bash
yarn start:backend    # Express API with hot reload (ts-node-dev)
yarn start:mobile     # Metro bundler for React Native
```

### Database Setup

```bash
yarn workspace @dydyd/backend db:migrate    # Run Prisma migrations
yarn workspace @dydyd/backend db:generate   # Regenerate Prisma client
yarn workspace @dydyd/backend db:seed       # Seed database with sample data
```

## Monorepo Structure

DYDYD is a Yarn Workspaces + Turbo monorepo with three packages:

```
apps/backend/      # Express API server (Node.js, Prisma, PostgreSQL)
apps/mobile/       # React Native app (iOS + Android, Expo)
packages/shared/   # Shared TypeScript types, constants, and utilities
```

Turbo pipelines enforce build order: `shared` must build before `backend` or `mobile` can consume it.

| Package | Description | Key Technologies |
|---------|-------------|-----------------|
| `@dydyd/shared` | Domain types, constants, XP/streak logic | TypeScript |
| `@dydyd/backend` | REST API, authentication, database | Express 4, Prisma, PostgreSQL, JWT |
| `@dydyd/mobile` | Mobile app with gamification UI | React Native 0.73, Redux Toolkit, React Navigation 6 |

## Development Workflow

### 1. Create a GitHub Issue

Every change starts with an issue. Search existing issues first to avoid duplicates.

### 2. Create a Feature Branch

Branch from `main` (or from a parent feature branch if building on in-progress work).

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<issue>-<slug>` | `feat/48-auth-route-tests` |
| Bug fix | `fix/<issue>-<slug>` | `fix/52-splashscreen-color` |
| Infrastructure | `infra/<issue>-<slug>` | `infra/50-prisma-migrations` |
| Test | `test/<issue>-<slug>` | `test/48-auth-route-tests` |
| Chore | `chore/<description>` | `chore/update-dependencies` |
| Docs | `docs/<description>` | `docs/contributing-guide` |

### 3. Build and Validate

Before committing, always run the full validation suite:

```bash
yarn workspace @dydyd/shared build   # Build shared package first
yarn build:all                       # Build all packages
yarn test:all                        # Run all tests
yarn lint:all                        # Run all linters
```

For type checking individual workspaces:

```bash
yarn workspace @dydyd/backend tsc --noEmit
yarn workspace @dydyd/mobile tsc --noEmit
```

### 4. Commit and Push

Write a descriptive commit message following the conventions below, then push your branch and open a pull request.

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message follows this format:

```
<type>: <short description> (#<issue>)
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | A new feature or user-facing behavior |
| `fix` | A bug fix |
| `test` | Adding or updating tests (no production code change) |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only |
| `infra` | CI/CD, build config, deployment changes |
| `chore` | Maintenance tasks, dependency updates |

### Examples

```
feat: add quest completion celebration overlay (#8)
fix: resolve CI failures from Phase 2 changes (#47)
test: add health, progress, badges, and notifications route tests
docs: add Phase 3 planning docs and record all founder decisions
infra: adopt Continuous Native Generation (CNG) workflow
```

## Pull Request Process

### Opening a PR

1. Push your branch to the remote.
2. Open a pull request against `main`.
3. Use a clear, concise title (under 70 characters).
4. Fill out the PR template with a summary, description of changes, test plan, and checklist.
5. Reference the related issue in the PR body.

### PR Requirements

All of the following must pass before a PR can be merged:

- [ ] All tests pass (`yarn test:all`)
- [ ] Linting passes (`yarn lint:all`)
- [ ] Type checking passes (backend and mobile)
- [ ] Build succeeds (`yarn build:all`)
- [ ] No regressions in existing tests
- [ ] PR description includes a test plan

### CI Pipeline

The CI workflow runs automatically on every PR:

- **Test & Lint** -- runs all tests and linters
- **Database Schema Validation** -- validates Prisma schema, checks migration drift, verifies migrations apply cleanly
- **Type Check** -- TypeScript strict mode on backend and mobile

### Project Convention: GitHub REST API

This project uses the GitHub REST API (not the `gh` CLI) for all GitHub operations. This is documented in `CLAUDE.md` and applies to both human and agent contributors.

## Code Style

### TypeScript

- **Strict mode is enforced** across all workspaces. No implicit `any`, no loose nulls.
- **Import domain types from `@dydyd/shared`** -- never redefine `User`, `Quest`, `Badge`, or other domain types locally in backend or mobile code.
- **Avoid `as any`** -- the only accepted exception is stripping sensitive fields before a response (e.g., `password: undefined as any`), and even that is a TODO to replace with Prisma `select`/`omit`.

### Formatting

- Prettier is configured at the root level.
- ESLint configs exist per workspace.

## Testing

### Backend

- **Jest + supertest** for route-level unit tests.
- Each test suite creates its own Express app with only the route under test plus the error handler.
- Prisma is mocked via `jest.mock('../../lib/prisma')`.
- Use proper UUIDs in test data (the validator rejects non-UUID params).
- Mock external modules (`bcryptjs`, `../../lib/streaks`) at module level.
- `beforeEach(() => jest.clearAllMocks())` for test isolation.

### Test Patterns

- **Use `it.each` for parameterized tests** -- all validation-error cases should use a single `it.each` table covering each invalid field, not repeated `it()` blocks.
- Test every route's validation rules with a single `it.each` table.

### Running Tests

```bash
yarn test:all                                               # All workspaces
yarn workspace @dydyd/backend test                          # Backend only
yarn workspace @dydyd/backend jest --testPathPattern=quests  # Single suite
yarn workspace @dydyd/mobile test                           # Mobile only
yarn workspace @dydyd/shared test                           # Shared only
```

### Integration Tests

Integration tests require Docker:

```bash
yarn workspace @dydyd/backend test:db:up       # Start test Postgres (port 5433)
yarn workspace @dydyd/backend test:integration  # Run integration tests
```

## Agent-Driven Development

DYDYD uses Claude Code agents as part of its development workflow. The project defines seven specialized agents:

| Agent | Responsibility |
|-------|---------------|
| **Architect** | Backend API, shared package, database schema, CI/CD, infrastructure |
| **Mobile** | React Native app, screens, components, navigation, animations |
| **QA** | Test strategy, test writing, coverage reports, bug triage |
| **Product** | PRDs, user stories, acceptance criteria, roadmap |
| **Design** | Visual QA, design tokens, component specs, brand consistency |
| **Growth** | Analytics, onboarding, push notification strategy, ASO |
| **Compliance** | Privacy policy, terms of service, security audits |

### How Human Contributors Interact

- **You do not need to use agents.** Human contributors follow the standard GitHub workflow: fork, branch, code, test, PR.
- **Agents may review your PR.** After a PR is opened, agents may run automated reviews for correctness, security, and test coverage.
- **Feature issues reference `specs/feature-workflow.md`** which describes the agent orchestration pattern. You can read it to understand the phases (Plan, Architect, Build, Test, Validate, PR), but you are not required to follow them -- they describe how agents work, not how humans must work.
- **CLAUDE.md is the source of truth** for project conventions, commands, and architecture. If you are ever unsure about how something works, start there.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. All contributors are expected to:

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them get started.
- Focus on what is best for the project and its users.
- Accept constructive criticism gracefully.
- Show empathy toward other community members.

Harassment, discrimination, and disrespectful behavior will not be tolerated. If you experience or witness unacceptable behavior, please open an issue or contact the maintainer directly.
