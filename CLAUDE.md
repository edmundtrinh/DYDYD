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
- Route structure: `/api/auth`, `/api/quests`, `/api/user`, `/api/progress`, `/health`
- JWT auth: 15m access tokens, 7d refresh tokens; middleware in `src/middleware/auth.ts`
- Rate limiting: 100 req/15min globally
- Prisma schema at `prisma/schema.prisma` — 15 models covering users, quests, completions, badges, notifications, devices, refresh tokens
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
- Free users: max 5 custom quests; Premium: max 100
- Badges have rarity tiers; streak tracking is per-day/week/month