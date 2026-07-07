# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DYDYD is a gamified habit tracking app (quests, XP, badges, streaks) with React Native mobile, Node.js/Express backend, and a shared TypeScript package. Managed as a **Yarn Workspaces + Turbo monorepo**.

## Commands

### Running Development Servers
```bash
yarn start:backend    # Backend with hot reload (ts-node-dev)
yarn start:mobile     # Metro bundler for React Native
```

### Building
```bash
yarn build:all        # Build all packages via Turbo
yarn shared build     # Build shared package only (required before backend/mobile use it)
```

### Testing
```bash
yarn test:all                        # All workspaces
yarn workspace @dydyd/backend test   # Backend only
yarn workspace @dydyd/mobile test    # Mobile only
yarn workspace @dydyd/shared test    # Shared only

# Single test file
yarn workspace @dydyd/shared jest src/__tests__/constants.test.ts
```

### Linting
```bash
yarn lint:all                        # All workspaces
yarn workspace @dydyd/backend lint   # Backend only
```

### Database (Backend)
```bash
yarn workspace @dydyd/backend db:migrate   # Run Prisma migrations
yarn workspace @dydyd/backend db:generate  # Regenerate Prisma client
yarn workspace @dydyd/backend db:seed      # Seed database
```

### Cleanup
```bash
yarn clean    # Remove all build artifacts and node_modules
```

### EAS Build (cloud builds via Expo)
```bash
# From apps/mobile/
eas build --profile development --platform all   # Dev client builds (iOS sim + Android APK)
eas build --profile preview --platform ios       # iOS IPA (internal distribution)
eas build --profile preview --platform android   # Android APK (internal distribution)
eas build --profile production --platform all    # Store-ready builds

# Or via yarn scripts in apps/mobile/
yarn eas:build:dev
yarn eas:build:preview
yarn eas:build:ios
yarn eas:build:android
```

EAS Build runs in the cloud — iOS builds work from Windows too. Requires an Expo account and `EXPO_TOKEN` secret in GitHub.

## GitHub API

Do **not** use the `gh` CLI for GitHub operations. Use the GitHub REST API directly with a Personal Access Token.

- Token location: `token.txt` in the repo root (gitignored — never commit)
- Read the token at runtime: `Get-Content token.txt -Raw | ForEach-Object { $_.Trim() }`
- Pass as header: `Authorization: Bearer <token>`
- Example (PowerShell):
  ```powershell
  $token = Get-Content token.txt -Raw | ForEach-Object { $_.Trim() }
  Invoke-RestMethod -Uri "https://api.github.com/repos/edmundtrinh/DYDYD/issues" `
    -Headers @{ Authorization = "Bearer $token"; "User-Agent" = "DYDYD" }
  ```

## Architecture

### Monorepo Structure
```
apps/backend/    # Express API server
apps/mobile/     # React Native app (iOS + Android)
packages/shared/ # Shared types, constants, utilities
```

Turbo pipelines define build order: `shared` must build before `backend` or `mobile` consume it.

### Shared Package (`@dydyd/shared`)
The single source of truth for domain types and business logic:
- **`src/types.ts`** — All TypeScript interfaces/enums: `User`, `Quest`, `Badge`, `HealthData`, `Progress`, `QuestCategory`, `QuestStatus`, etc.
- **`src/constants.ts`** — 30+ predefined quests, 20+ badges, level titles (1–100), XP config (base 100, 1.15× growth)
- **`src/utils.ts`** — XP calculations, streak logic, date helpers, validation, ID generation

Always import domain types from `@dydyd/shared`, not defined locally in backend or mobile.

### Backend (`@dydyd/backend`)
- **Express 4** with TypeScript, Prisma ORM, PostgreSQL
- Route structure: `/api/auth`, `/api/quests`, `/api/user`, `/api/progress`, `/api/health`, `/api/badges`, `/api/notifications`, `/health`
- JWT auth: 15m access tokens, 7d refresh tokens; middleware in `src/middleware/auth.ts`
- Rate limiting: 100 req/15min globally
- Prisma schema at `prisma/schema.prisma` — 11 models covering users, quests, completions, badges, notifications, devices, refresh tokens
- Migrations managed via `prisma migrate` (not `db push`); initial baseline at `prisma/migrations/20260618000000_init`
- Environment: copy `.env.example` → `.env` and configure `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

### Mobile (`@dydyd/mobile`)
- **React Native 0.73** with Redux Toolkit + Redux Persist + React Navigation 6
- **Navigation**: `RootNavigator` → conditionally renders `AuthNavigator`, `OnboardingNavigator`, or `MainTabNavigator` based on auth/onboarding state
- **Redux slices**: `auth`, `quests`, `progress`, `user`, `health`, `notifications`, `ui` — persisted slices use AsyncStorage (auth, user, quests); `ui` and `health` are not persisted
- **Services layer** (`src/services/`): axios-based API client, plus wearable integrations (Apple HealthKit, Google Fit, Garmin, Samsung, Apple Watch)
- **Path aliases**: `@/*` maps to `src/*`; also `@components/*`, `@screens/*`, `@services/*`, `@store/*`, `@navigation/*`, `@theme/*`

### Gamification Domain
- XP per level: exponential growth (`baseXP * growthRate^(level-1)`)
- Quest categories: Physical Health, Mental Wellness, Career & Productivity, Relationships & Social, Home & Chores
- Quests have frequency (daily/weekly/monthly), XP reward, optional health data source
- Free users: max 3 custom quests; Premium: max 50
- Badges have rarity tiers; streak tracking is per-day/week/month

## Testing

### Backend Test Infrastructure
- **Jest + supertest** for route-level unit tests; mocked Prisma via `jest.mock('../../lib/prisma')`
- **Docker Postgres** on port 5433 for integration tests: `docker compose -f docker-compose.test.yml up -d`
- Test files live in `apps/backend/src/__tests__/routes/` — 7 suites, 162 tests covering all API endpoints
- Test helpers in `apps/backend/src/__tests__/helpers/prisma.ts` (integration test DB utilities)
- Jest setup in `apps/backend/jest.setup.js` — sets NODE_ENV=test, test secrets, DATABASE_URL

### Test Patterns
- Each test suite creates its own Express app with only the route under test + errorHandler
- Use proper UUIDs in test data (validator rejects non-UUID params)
- Mock external modules (`bcryptjs`, `../../lib/streaks`) at module level
- `beforeEach(() => jest.clearAllMocks())` for test isolation

### Running Tests
```bash
yarn workspace @dydyd/backend test                           # All backend tests
yarn workspace @dydyd/backend jest --testPathPattern=quests   # Single suite
yarn workspace @dydyd/backend test:db:up                      # Start test DB
yarn workspace @dydyd/backend test:integration                # Integration tests (requires Docker)
```

### CI Pipeline
- **test**: Run all tests + lint
- **db-validate**: Postgres service container validates schema syntax, migration drift, and clean migration apply
- **typecheck**: TypeScript strict mode on backend + mobile

## Code Style / Conventions

- **TypeScript strict mode** is enforced across all workspaces — no implicit `any`, no loose nulls
- **Always import domain types from `@dydyd/shared`** — never redefine `User`, `Quest`, `Badge`, etc. locally
- **Avoid `as any`** — the only accepted exception is stripping sensitive fields before a response (e.g. `password: undefined as any`), which is itself a TODO: replace with Prisma `select` / `omit` to avoid the cast entirely
- **Prefer `it.each`** for parameterized tests — use it for all validation-error cases instead of repeating `it()` blocks
- Test every route's validation rules with a single `it.each` table covering each invalid field

## SDLC Workflow

When implementing features, follow this process:
1. Create a GitHub issue (or reference existing one)
2. Create a feature branch from the appropriate base (`main` or parent feature branch)
3. Implement the feature with tests
4. Self-validate: all tests must pass before committing
5. Run `/code-review --effort max` for correctness, security, and silent-failure gaps
6. Create PR via **GitHub REST API** (PAT stored in `token.txt`, which is gitignored) — never use `gh` CLI
7. Post decision record comment on the issue with: approach chosen, alternatives considered (decision table), assumptions, and tradeoffs
8. Close issue via GitHub REST API only after tests are confirmed passing — PRs do not auto-close issues on merge

**Git discipline:** Never skip hooks (`--no-verify` is forbidden). Never commit directly to `main`.