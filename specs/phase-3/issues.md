# Phase 3: Testing & Quality -- GitHub Issues

> 17 issues for milestone **v0.4.0 -- Testing & Quality**.
> This document is for review before creating as actual GitHub issues.

---

## Backend Unit Tests

---

### Issue: Add unit tests for auth routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

The auth route file (`apps/backend/src/routes/auth.ts`, 462 lines) handles six endpoints: register, login, refresh-token, logout, forgot-password, and reset-password. It currently has zero test coverage. These are the most security-sensitive endpoints in the application and must be tested thoroughly with mocked Prisma calls, covering validation rules, JWT generation/verification, password hashing, and error paths.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/auth.test.ts`
- [ ] POST `/api/auth/register` -- tests for successful registration (201), duplicate email (409), missing fields (400), weak password (400), and password complexity rules (uppercase, lowercase, digit required)
- [ ] POST `/api/auth/login` -- tests for successful login (200), wrong password (401), non-existent email (401), and missing fields (400)
- [ ] POST `/api/auth/refresh-token` -- tests for valid refresh (200 with new tokens), expired token (401), revoked token (401), and missing token (400)
- [ ] POST `/api/auth/logout` -- tests for revoking a specific refresh token, revoking all tokens when no token provided, and unauthenticated request (401)
- [ ] POST `/api/auth/forgot-password` -- tests for existing email (returns reset token in dev mode), non-existent email (still returns 200 to avoid email enumeration), and invalid email format (400)
- [ ] POST `/api/auth/reset-password` -- tests for valid reset (200), expired token (400), already-used token (400), weak new password (400), and verification that all existing refresh tokens are revoked after reset
- [ ] Password is never included in any response body
- [ ] Prisma client is mocked (no real database calls)
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/auth.test.ts --verbose
# Expect: 20+ test cases, all passing
# Verify no test hits a real database (mock assertions)
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for quests routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

The quests route file (`apps/backend/src/routes/quests.ts`, 401 lines) handles the quest library, user quest listing, quest activation/reactivation, quest completion with XP awarding, quest deactivation, and custom quest creation with tier-based limits. Zero tests exist. XP calculations on completion and the free/premium custom quest limits are critical business logic that must be verified against the shared package constants.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/quests.test.ts`
- [ ] GET `/api/quests/library` -- tests for listing predefined quests (200), correct ordering by category then name
- [ ] GET `/api/quests/user` -- tests for listing active user quests with today's completions, unauthenticated request (401)
- [ ] POST `/api/quests/activate` -- tests for activating a new quest (201), reactivating a deactivated quest (200), duplicate activation (409), non-existent quest (404), invalid UUID (400)
- [ ] POST `/api/quests/:id/complete` -- tests for successful completion (201 with XP earned), max completions per period enforcement (400), period boundary calculation for daily/weekly/monthly frequencies, streak increment logic, user totalXP increment
- [ ] DELETE `/api/quests/:id` -- tests for deactivating a quest (200), non-existent quest (404), quest belonging to another user (404)
- [ ] POST `/api/quests/custom` -- tests for creating a custom quest (201 with auto-activation), free user limit of 3 custom quests (400 when exceeded), premium user limit of 50, validation of category/frequency enums, baseXP range (1-10)
- [ ] XP values in completion responses match `baseXP` from quest definition (or `customXP` override)
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/quests.test.ts --verbose
# Expect: 25+ test cases, all passing
# Spot-check: completion XP matches shared package baseXP values
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for health routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** high

#### Description

The health route file (`apps/backend/src/routes/health.ts`, 207 lines) has a single POST `/api/health/sync` endpoint that receives aggregated health metrics from the mobile app and auto-completes matching quests. This is the bridge between wearable data and the gamification loop. The auto-completion logic -- matching metric types to quest `healthDataType`, checking `targetValue` thresholds, respecting `maxCompletionsPerPeriod` -- is complex enough to warrant thorough testing.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/health.test.ts`
- [ ] POST `/api/health/sync` -- tests for successful sync with matching quests auto-completed, correct XP calculation and user totalXP update
- [ ] Tests for metric-to-quest matching: only quests whose `healthDataType` matches the metric `type` are considered
- [ ] Tests for target value threshold: metric value below `targetValue` does not trigger completion
- [ ] Tests for max completions enforcement: quest already at max for the period is skipped
- [ ] Tests for period calculation: daily, weekly, monthly period boundaries are correct
- [ ] Tests for multiple metrics in a single request (batch processing)
- [ ] Tests for empty metrics array (400 validation error)
- [ ] Tests for invalid metric types, sources, and timestamp formats (400 validation errors)
- [ ] Tests for unauthenticated request (401)
- [ ] Response includes `questsAutoCompleted` array and `xpEarned` total
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/health.test.ts --verbose
# Expect: 12+ test cases, all passing
# Key scenario: send steps=12000 with quest target=10000 -> auto-complete
# Key scenario: send steps=5000 with quest target=10000 -> no completion
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for progress routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** high

#### Description

The progress route file (`apps/backend/src/routes/progress.ts`, 474 lines) provides four endpoints: user stats, daily progress, weekly progress, and a leaderboard. It aggregates data across quest completions, badges, and streaks, using the `calculateOverallDayStreak` and `calculateUserQuestStreak` functions from `lib/streaks`. The weekly endpoint iterates over 7 days of data. All of this must be tested to ensure the stats surfaces in the mobile app are accurate.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/progress.test.ts`
- [ ] GET `/api/progress/stats` -- tests for correct aggregation of totalXP, level, totalQuestsCompleted, currentDayStreak, longestDayStreak, badgesEarned, and per-category stats
- [ ] GET `/api/progress/daily` -- tests for correct daily XP total, questsCompleted vs questsTotal counts, category breakdown, and custom date parameter support (ISO 8601)
- [ ] GET `/api/progress/weekly` -- tests for 7-day data array, correct weekStart/weekEnd bounds, topCategory calculation, and custom weekStart parameter
- [ ] GET `/api/progress/leaderboard` -- tests for both "weekly" and "all-time" types, correct rank ordering by totalXP descending, limit parameter (1-100), and default limit of 10
- [ ] GET `/api/progress/badges` -- tests for listing user's earned badges ordered by earnedAt descending
- [ ] Streak calculation functions (`calculateOverallDayStreak`, `calculateUserQuestStreak`) are mocked or tested via a separate utility test file
- [ ] Unauthenticated requests return 401 for all endpoints
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/progress.test.ts --verbose
# Expect: 18+ test cases, all passing
# Key check: weekly endpoint returns exactly 7 DailyProgress entries
# Key check: leaderboard respects limit and returns correct rank numbers
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for badges routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** high

#### Description

The badges route file (`apps/backend/src/routes/badges.ts`, 203 lines) provides three endpoints: listing the full badge library, listing a user's earned badges, and a POST `/api/badges/check` that evaluates all unearned badges against the user's current stats and awards any newly qualified ones. The check endpoint implements four requirement types (`total_completions`, `xp_threshold`, `streak`, `category_completions`) plus a `special` type that is skipped. Badge awarding includes XP bonuses via a Prisma transaction.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/badges.test.ts`
- [ ] GET `/api/badges` -- tests for listing all badges ordered by rarity then name, accessible without authentication (optionalAuth)
- [ ] GET `/api/badges/user` -- tests for listing earned badges for authenticated user, ordered by earnedAt descending, unauthenticated request (401)
- [ ] POST `/api/badges/check` -- tests for each requirement type:
  - `total_completions`: user with 50 completions earns badge requiring 50, does not earn badge requiring 100
  - `xp_threshold`: user with 500 XP earns badge requiring 500
  - `streak`: user with 7-day streak earns badge requiring 7
  - `category_completions`: user with 20 physical_health completions earns category-specific badge
  - `special`: badge is skipped (not auto-awarded)
- [ ] POST `/api/badges/check` -- tests that already-earned badges are excluded from evaluation
- [ ] POST `/api/badges/check` -- tests that XP bonus is added to user's totalXP when badges are awarded
- [ ] POST `/api/badges/check` -- tests response structure: `{ awarded: [...], xpBonusTotal: number }`
- [ ] POST `/api/badges/check` -- tests for user with all badges already earned (returns empty awarded array)
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/badges.test.ts --verbose
# Expect: 15+ test cases, all passing
# Key scenario: user crosses XP threshold -> badge awarded + XP bonus applied in single transaction
# Key scenario: user already has all badges -> no awards, xpBonusTotal = 0
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for user routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

The user route file (`apps/backend/src/routes/user.ts`, 333 lines) handles profile CRUD, settings CRUD, category priority management, and account deletion with a full cascade. The account deletion endpoint performs a 9-table transaction. **Known bug**: the deletion cascade at line 309 calls `prisma.questCompletion.deleteMany({ where: { userId } })`, but the `QuestCompletion` model does not have a direct `userId` field -- it only references `userQuestId`. This test suite should expose and document that bug so it can be fixed.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/user.test.ts`
- [ ] GET `/api/user/profile` -- tests for returning user profile without password field, user not found (404), unauthenticated (401)
- [ ] PUT `/api/user/profile` -- tests for updating displayName, updating avatarUrl, validation (displayName length 2-50, avatarUrl must be valid URL), partial updates (only specified fields change)
- [ ] GET `/api/user/settings` -- tests for returning user settings, settings not found (404)
- [ ] PUT `/api/user/settings` -- tests for updating each setting field (notificationsEnabled, dailyReminderTime HH:mm format, weeklyResetDay 0-6, timezone, theme light/dark/system, soundEnabled, hapticFeedbackEnabled), validation errors for invalid values
- [ ] GET `/api/user/category-priorities` -- tests for returning priorities ordered by priority descending
- [ ] PUT `/api/user/category-priorities` -- tests for replacing all priorities (delete + create transaction), validation of category enum values, priority range 1-5, isEnabled boolean
- [ ] DELETE `/api/user/account` -- tests for successful deletion with correct password, incorrect password (401), missing password (400), and verification that all related data across all 9 tables is deleted in the correct cascade order
- [ ] DELETE `/api/user/account` -- test should document the bug where `QuestCompletion.deleteMany({ where: { userId } })` will fail because `QuestCompletion` has no `userId` column (only `userQuestId`); the correct query should filter through the `userQuest` relation
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/user.test.ts --verbose
# Expect: 20+ test cases, all passing
# Key check: account deletion test exposes the QuestCompletion.userId bug
# Key check: password never appears in any GET/PUT profile response
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add unit tests for notifications routes

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** high

#### Description

The notifications route file (`apps/backend/src/routes/notifications.ts`, 164 lines) provides three endpoints: device token registration (upsert), paginated notification history, and mark-as-read. These are straightforward CRUD operations but need test coverage to verify pagination logic, the upsert behavior for device tokens, and the ownership check on mark-as-read.

#### Acceptance Criteria

- [ ] Test file created at `apps/backend/src/__tests__/routes/notifications.test.ts`
- [ ] POST `/api/notifications/device-token` -- tests for creating a new device token (201), updating an existing token (upsert behavior), validation of platform enum values (ios, android, watchos, wear_os, tizen, garmin), missing token field (400), unauthenticated request (401)
- [ ] GET `/api/notifications` -- tests for paginated notification listing, default page=1 and perPage=20, custom pagination parameters, correct `meta` response (page, perPage, total, hasMore), empty notification list, unauthenticated request (401)
- [ ] PUT `/api/notifications/:id/read` -- tests for marking as read (sets readAt timestamp), already-read notification (returns as-is without error), notification belonging to another user (404), non-existent notification (404), invalid UUID (400)
- [ ] Prisma client is mocked
- [ ] All tests pass via `yarn workspace @dydyd/backend test`

#### Test Plan

```bash
yarn workspace @dydyd/backend jest src/__tests__/routes/notifications.test.ts --verbose
# Expect: 12+ test cases, all passing
# Key check: pagination meta.hasMore is correct at boundary (total = page * perPage)
# Key check: device token upsert updates lastActive timestamp
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

## Backend Integration

---

### Issue: Create initial Prisma migration and add database CI

**Labels:** `backend`, `infrastructure`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** critical

#### Description

The backend has a fully defined Prisma schema (`apps/backend/prisma/schema.prisma`, 15 models) but zero migration files exist in the `prisma/migrations/` directory. This means the schema has never been formally migrated -- it likely was applied via `prisma db push` during development. A proper migration history is required before integration tests can spin up test databases and before production deployment. This issue also adds a migration check to CI. **Note**: the first migration run may expose schema issues, such as the `QuestCompletion` cascade bug where `deleteMany({ where: { userId } })` references a non-existent column.

#### Acceptance Criteria

- [ ] Initial migration created via `prisma migrate dev --name init` capturing all 15 models: User, UserSettings, CategoryPriority, Quest, UserQuest, QuestCompletion, Badge, UserBadge, RefreshToken, DeviceToken, Notification
- [ ] Migration SQL file committed at `apps/backend/prisma/migrations/<timestamp>_init/migration.sql`
- [ ] Migration applies cleanly on a fresh PostgreSQL database
- [ ] CI workflow updated to include `prisma migrate deploy` or `prisma migrate status` check (does not require a live database; validates migration files are consistent with schema)
- [ ] `MIGRATION.md` or section in backend README documenting the migration workflow: how to create migrations, how to apply them, how to reset the dev database
- [ ] Seed script (`db:seed`) still works after migration is applied

#### Test Plan

```bash
# Locally:
yarn workspace @dydyd/backend db:migrate
# Expect: migration applies without errors

# In CI:
# The workflow step should validate migration files exist and are in sync with schema
yarn workspace @dydyd/backend npx prisma migrate status
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add API integration tests with test database

**Labels:** `testing`, `backend`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** high

#### Description

The unit tests (issues 1-7) mock Prisma entirely. Integration tests should exercise the full request/response cycle through Express with a real test database to catch issues that mocks miss -- such as Prisma query errors from incorrect field references, transaction ordering problems, and middleware integration (auth + validation + error handling). Use a dedicated test database (e.g., `dydyd_test`) that is migrated and torn down per test suite.

#### Acceptance Criteria

- [ ] Integration test infrastructure: test database setup/teardown helpers, Prisma client pointed at test database, migration applied before tests run
- [ ] Test file created at `apps/backend/src/__tests__/integration/auth.integration.test.ts` covering: full register -> login -> refresh -> logout cycle, full forgot-password -> reset-password cycle
- [ ] Test file created at `apps/backend/src/__tests__/integration/quests.integration.test.ts` covering: activate quest -> complete quest -> verify XP updated -> verify completion recorded
- [ ] Auth middleware integration: verify that protected endpoints reject requests without a valid JWT, accept requests with a valid JWT, and reject expired JWTs
- [ ] Rate limiting integration: verify that exceeding 100 requests in 15 minutes returns 429
- [ ] Database cleanup between test suites (truncate tables or use transactions)
- [ ] Integration tests are in a separate Jest project or use a distinct config so they can be run independently from unit tests (they require a database)
- [ ] CI runs integration tests only when a PostgreSQL service is available (skip gracefully otherwise)
- [ ] All integration tests pass via `yarn workspace @dydyd/backend test:integration`

#### Test Plan

```bash
# Requires a running PostgreSQL instance with dydyd_test database
yarn workspace @dydyd/backend test:integration --verbose
# Expect: 10+ integration test cases, all passing
# Key scenario: register user -> login -> complete quest -> check XP increased
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** QA + ARCHITECT
- **Review:** QA agent validates

---

## Mobile Test Coverage

---

### Issue: Add tests for auth screens

**Labels:** `testing`, `mobile`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

The auth flow has four screens (LoginScreen, RegisterScreen, ForgotPasswordScreen, WelcomeScreen) with zero test files. These screens handle form validation, Redux dispatch for login/register thunks, navigation between auth screens, and error display from failed API calls. The existing mobile test infrastructure uses `@testing-library/react-native` with `redux-mock-store`, which should be followed for consistency.

#### Acceptance Criteria

- [ ] Test file created at `apps/mobile/src/screens/Auth/__tests__/WelcomeScreen.test.tsx` -- tests for rendering welcome content, navigation to Login and Register screens
- [ ] Test file created at `apps/mobile/src/screens/Auth/__tests__/LoginScreen.test.tsx` -- tests for rendering form fields, email validation, password validation, successful login dispatch, error message display on failed login, navigation to ForgotPassword, navigation to Register
- [ ] Test file created at `apps/mobile/src/screens/Auth/__tests__/RegisterScreen.test.tsx` -- tests for rendering form fields (email, password, displayName), validation (email format, password 8+ chars with uppercase/lowercase/digit, displayName 2-50 chars), successful register dispatch, error display, navigation to Login
- [ ] Test file created at `apps/mobile/src/screens/Auth/__tests__/ForgotPasswordScreen.test.tsx` -- tests for rendering form, email validation, successful submission, confirmation message display, navigation back to Login
- [ ] All tests use `redux-mock-store` with appropriate initial state
- [ ] All tests mock `@react-navigation/native` for navigation assertions
- [ ] All tests pass via `yarn workspace @dydyd/mobile test`

#### Test Plan

```bash
yarn workspace @dydyd/mobile jest src/screens/Auth/__tests__/ --verbose
# Expect: 20+ test cases across 4 files, all passing
# Key check: form validation prevents submission with invalid input
# Key check: successful auth dispatches correct Redux action
```

#### Agent Workflow

- **Orchestrator:** MOBILE
- **Build:** MOBILE + QA
- **Review:** QA agent validates

---

### Issue: Add tests for HomeScreen

**Labels:** `testing`, `mobile`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

HomeScreen (`apps/mobile/src/screens/home/HomeScreen.tsx`, 753 lines) is the most complex screen in the app. It displays the user's active quests, handles quest completion (including quick-complete mode), shows daily progress, triggers health data sync, and manages the quest completion overlay animation. No test file exists. Given its size and complexity, this screen needs comprehensive test coverage with careful mocking of Redux state, navigation, and health service calls.

#### Acceptance Criteria

- [ ] Test file created at `apps/mobile/src/screens/home/__tests__/HomeScreen.test.tsx`
- [ ] Tests for initial render: user greeting, XP bar, level display, active quest list
- [ ] Tests for quest display: quests grouped or filtered correctly, completed quests visually distinguished, empty state when no quests active
- [ ] Tests for quest completion flow: tapping complete button dispatches the correct thunk, XP earned display, streak update
- [ ] Tests for quick-complete mode: if implemented, toggling quick-complete and verifying single-tap completion behavior
- [ ] Tests for health sync trigger: verify health sync action is dispatched on screen mount or pull-to-refresh
- [ ] Tests for daily progress summary: correct XP total, quests completed count vs total
- [ ] Tests for loading state: spinner or skeleton shown while data loads
- [ ] Tests for error state: error message displayed when quest fetch fails
- [ ] All tests use `redux-mock-store` with realistic initial state (user with quests, completions, streaks)
- [ ] All tests pass via `yarn workspace @dydyd/mobile test`

#### Test Plan

```bash
yarn workspace @dydyd/mobile jest src/screens/home/__tests__/HomeScreen.test.tsx --verbose
# Expect: 15+ test cases, all passing
# Key check: quest completion dispatches correct Redux action with correct questId
# Key check: screen handles zero-quest state gracefully
```

#### Agent Workflow

- **Orchestrator:** MOBILE
- **Build:** MOBILE + QA
- **Review:** QA agent validates

---

### Issue: Add and expand tests for quest screens

**Labels:** `testing`, `mobile`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** high

#### Description

The quest screens have partial coverage: `AddQuestScreen.test.tsx` and `QuestsScreenSearch.test.tsx` exist but `QuestDetailScreen` has no tests, and the existing files likely lack edge case coverage. QuestDetailScreen shows quest details, completion history, streak visualization, and the deactivation action. The existing tests for AddQuestScreen need expansion for category selection, frequency selection, XP range validation (1-10), and the free/premium quest limit error state.

#### Acceptance Criteria

- [ ] Test file created at `apps/mobile/src/screens/quests/__tests__/QuestDetailScreen.test.tsx` -- tests for rendering quest name/description/category/frequency, completion history list, streak display, deactivate button dispatch, navigation back
- [ ] Existing `AddQuestScreen.test.tsx` expanded with tests for: category selector (5 categories), frequency selector (daily/weekly/monthly), baseXP validation (1-10 range), maxCompletionsPerPeriod field, successful custom quest creation dispatch, free user limit error (3 max), premium user limit (50 max)
- [ ] Existing `QuestsScreenSearch.test.tsx` expanded with tests for: search filtering by quest name, filtering by category, empty search results state, clearing search
- [ ] All tests pass via `yarn workspace @dydyd/mobile test`

#### Test Plan

```bash
yarn workspace @dydyd/mobile jest src/screens/quests/__tests__/ --verbose
# Expect: 20+ test cases across 3 files, all passing
# Key check: QuestDetailScreen renders all quest properties
# Key check: AddQuestScreen enforces baseXP 1-10 range
```

#### Agent Workflow

- **Orchestrator:** MOBILE
- **Build:** MOBILE + QA
- **Review:** QA agent validates

---

### Issue: Add unit tests for all Redux slices

**Labels:** `testing`, `mobile`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** critical

#### Description

The app has 7 Redux slices (auth, quests, progress, user, health, notifications, ui) but only 2 test files exist: `checkBadges.test.ts` and `deleteAccount.test.ts`. These test specific thunks, not the slices themselves. Every slice needs unit tests for its reducers (verifying state transitions) and async thunks (verifying pending/fulfilled/rejected states). Redux slices are the backbone of the app's state management and must have full coverage.

#### Acceptance Criteria

- [ ] Test file created at `apps/mobile/src/store/__tests__/authSlice.test.ts` -- tests for initial state, login/register thunks (pending/fulfilled/rejected), logout, token refresh, setCredentials reducer
- [ ] Test file created at `apps/mobile/src/store/__tests__/questsSlice.test.ts` -- tests for initial state, fetchQuests, activateQuest, completeQuest (with XP update), deactivateQuest, createCustomQuest thunks, quest list state management
- [ ] Test file created at `apps/mobile/src/store/__tests__/progressSlice.test.ts` -- tests for initial state, fetchStats, fetchDailyProgress, fetchWeeklyProgress thunks, state shape after each
- [ ] Test file created at `apps/mobile/src/store/__tests__/userSlice.test.ts` -- tests for initial state, fetchProfile, updateProfile, updateSettings, updateCategoryPriorities thunks
- [ ] Test file created at `apps/mobile/src/store/__tests__/healthSlice.test.ts` -- tests for initial state, syncHealth thunk, health data state management, sync status tracking
- [ ] Test file created at `apps/mobile/src/store/__tests__/notificationsSlice.test.ts` -- tests for initial state, fetchNotifications, markAsRead thunks, unread count management
- [ ] Test file created at `apps/mobile/src/store/__tests__/uiSlice.test.ts` -- tests for initial state, all UI state toggles (loading states, modal visibility, theme)
- [ ] Each thunk test covers all three states: pending (sets loading), fulfilled (updates data, clears loading), rejected (sets error, clears loading)
- [ ] API service calls are mocked (no real network requests)
- [ ] All tests pass via `yarn workspace @dydyd/mobile test`

#### Test Plan

```bash
yarn workspace @dydyd/mobile jest src/store/__tests__/ --verbose
# Expect: 50+ test cases across 7 files, all passing
# Key check: every async thunk has pending/fulfilled/rejected test
# Key check: state shape after fulfilled matches expected types from @dydyd/shared
```

#### Agent Workflow

- **Orchestrator:** MOBILE
- **Build:** MOBILE + QA
- **Review:** QA agent validates

---

## E2E & Infrastructure

---

### Issue: Set up E2E testing framework with smoke test

**Labels:** `testing`, `e2e`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** L
**Priority:** medium

#### Description

The app has no end-to-end test framework. An E2E framework is needed to verify critical user flows work across the full stack (mobile app -> backend API -> database). This issue covers framework selection, configuration, and a first smoke test. The two main options are Detox (Wix, established, requires native builds) and Maestro (newer, YAML-based, simpler setup). A decision document should be produced before implementation.

#### Acceptance Criteria

- [ ] Decision document comparing Detox vs Maestro for this project's needs (React Native 0.73, Expo managed workflow, CI on GitHub Actions, runs on both iOS and Android)
- [ ] Chosen framework installed and configured in the mobile workspace
- [ ] First smoke test implemented: app launches -> Welcome screen visible -> tap "Login" -> Login screen visible -> enter credentials -> Home screen visible
- [ ] E2E test can be run locally via a documented command (e.g., `yarn workspace @dydyd/mobile test:e2e`)
- [ ] E2E test configuration does not break existing Jest unit tests (separate config or project)
- [ ] README section documenting E2E setup, prerequisites, and how to run
- [ ] CI integration plan documented (may require a separate workflow with emulator/simulator setup)

#### Test Plan

```bash
# Local run (framework-dependent):
yarn workspace @dydyd/mobile test:e2e
# Expect: smoke test passes (app launches, navigates through auth to home)
# Verify: existing unit tests still pass after framework installation
yarn workspace @dydyd/mobile test
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** ARCHITECT
- **Review:** QA agent validates

---

### Issue: Fix Android native build issues

**Labels:** `android`, `tech-debt`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** high

#### Description

The Android native directory has several issues that will block builds and E2E testing. The `colors.xml` file is missing the `splashscreen_background` color referenced by the splash screen theme. The AndroidManifest.xml declares 8 permissions while `app.json` only specifies 3, creating drift between managed and bare configurations. No adaptive icon XML files exist despite `app.json` defining an adaptive icon background color. Additionally, a decision is needed on whether `apps/mobile/android/` should be gitignored (Expo managed workflow regenerates it) or committed (bare workflow).

#### Acceptance Criteria

- [ ] `apps/mobile/android/app/src/main/res/values/colors.xml` updated to include `<color name="splashscreen_background">#ffffff</color>` (or the correct design system value)
- [ ] Permission audit completed and documented:
  - Manifest currently declares: `ACTIVITY_RECOGNITION`, `BODY_SENSORS`, `INTERNET`, `READ_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`, `WRITE_EXTERNAL_STORAGE`, `com.google.android.gms.permission.ACTIVITY_RECOGNITION`
  - app.json declares: `ACTIVITY_RECOGNITION`, `BODY_SENSORS`, `com.google.android.gms.permission.ACTIVITY_RECOGNITION`
  - Decision made on which permissions are actually needed; manifest and app.json aligned
- [ ] Adaptive icon XML files created at `res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`, or adaptive icon section removed from app.json if not ready
- [ ] Decision documented: gitignore `android/` (stay Expo managed) vs commit `android/` (go bare workflow)
- [ ] If staying managed: add `apps/mobile/android/` to `.gitignore` and remove tracked files
- [ ] If going bare: ensure `npx expo prebuild --platform android` produces a clean, buildable project
- [ ] Android build compiles without errors after fixes (verify via `eas build --profile development --platform android` or local `./gradlew assembleDebug`)

#### Test Plan

```bash
# If staying managed workflow:
npx expo prebuild --clean --platform android
cd apps/mobile/android && ./gradlew assembleDebug
# Expect: build succeeds without missing resource errors

# If already bare:
cd apps/mobile/android && ./gradlew assembleDebug
# Expect: no missing @color/splashscreen_background, no permission warnings
```

#### Agent Workflow

- **Orchestrator:** MOBILE
- **Build:** MOBILE + ARCHITECT
- **Review:** DESIGN agent validates

---

### Issue: Close stale milestones and create v0.4.0

**Labels:** `infrastructure`
**Milestone:** (none -- this is about milestones themselves)
**Size:** S
**Priority:** medium

#### Description

The GitHub repository has milestones v0.2.0 and v0.3.0 with all issues closed, but the milestones themselves remain open. These should be closed to keep the project board clean. A new v0.4.0 milestone should be created for the Testing & Quality phase, and all 16 other issues from this document should be assigned to it.

#### Acceptance Criteria

- [ ] Milestone v0.2.0 closed (all issues already resolved)
- [ ] Milestone v0.3.0 closed (all issues already resolved)
- [ ] Milestone v0.4.0 created with title "v0.4.0 -- Testing & Quality" and description summarizing Phase 3 goals
- [ ] All other Phase 3 issues (from this document) assigned to milestone v0.4.0
- [ ] Milestone due date set (suggest 4 weeks from creation date)

#### Test Plan

```bash
gh milestone list --state all
# Expect: v0.2.0 and v0.3.0 show state=closed
# Expect: v0.4.0 shows state=open with correct issue count

gh issue list --milestone "v0.4.0 -- Testing & Quality"
# Expect: 16 issues listed
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** ARCHITECT
- **Review:** QA agent validates

---

### Issue: Add test coverage reporting and thresholds to CI

**Labels:** `ci`, `testing`
**Milestone:** v0.4.0 -- Testing & Quality
**Size:** M
**Priority:** medium

#### Description

The current CI workflow (`.github/workflows/ci.yml`) runs `yarn test:all` and `yarn lint:all` but does not collect or report test coverage. Jest is already configured with `coverageReporters: ['text', 'lcov', 'html']` in the backend. Coverage reporting should be added to CI with minimum thresholds enforced, and coverage badges should be added to the README. This provides ongoing visibility into test health and prevents coverage regressions.

#### Acceptance Criteria

- [ ] CI workflow updated to run tests with `--coverage` flag
- [ ] Coverage thresholds configured in Jest configs:
  - Backend: 70% line coverage minimum (starting target, increase as tests are written)
  - Mobile: 60% line coverage minimum (lower due to UI component complexity)
  - Shared: 90% line coverage minimum (already at high coverage)
- [ ] Jest `coverageThreshold` configuration added to each workspace's `jest.config.js` (global threshold, enforced by Jest itself so CI fails on regression)
- [ ] Coverage summary printed in CI logs (text reporter)
- [ ] LCOV reports uploaded as CI artifacts for detailed review
- [ ] Coverage badge added to root `README.md` (using a service like Codecov, Coveralls, or a custom badge from CI artifacts)
- [ ] CI workflow fails if any workspace drops below its coverage threshold
- [ ] Documentation added explaining how to check coverage locally: `yarn workspace @dydyd/backend test -- --coverage`

#### Test Plan

```bash
# Local verification:
yarn workspace @dydyd/backend test -- --coverage
yarn workspace @dydyd/mobile test -- --coverage
yarn workspace @dydyd/shared test -- --coverage
# Expect: coverage summary printed, no threshold failures

# CI verification:
# Push a branch, verify CI job includes coverage output
# Intentionally drop coverage below threshold, verify CI fails
```

#### Agent Workflow

- **Orchestrator:** ARCHITECT
- **Build:** ARCHITECT
- **Review:** QA agent validates

---

## Summary

| # | Issue | Size | Priority | Labels |
|---|-------|------|----------|--------|
| 1 | Auth route tests | L | critical | `testing`, `backend` |
| 2 | Quests route tests | L | critical | `testing`, `backend` |
| 3 | Health route tests | M | high | `testing`, `backend` |
| 4 | Progress route tests | L | high | `testing`, `backend` |
| 5 | Badges route tests | M | high | `testing`, `backend` |
| 6 | User route tests | L | critical | `testing`, `backend` |
| 7 | Notifications route tests | M | high | `testing`, `backend` |
| 8 | Prisma migration + CI | M | critical | `backend`, `infrastructure` |
| 9 | API integration tests | L | high | `testing`, `backend` |
| 10 | Auth screen tests | L | critical | `testing`, `mobile` |
| 11 | HomeScreen tests | L | critical | `testing`, `mobile` |
| 12 | Quest screen tests | M | high | `testing`, `mobile` |
| 13 | Redux slice tests | L | critical | `testing`, `mobile` |
| 14 | E2E framework setup | L | medium | `testing`, `e2e` |
| 15 | Fix Android native build | M | high | `android`, `tech-debt` |
| 16 | Close stale milestones | S | medium | `infrastructure` |
| 17 | CI coverage reporting | M | medium | `ci`, `testing` |

**Recommended execution order** (by dependency and priority):

1. Issue 8 (Prisma migration) -- unblocks integration tests
2. Issues 1, 2, 6 (critical backend unit tests) -- auth, quests, user routes
3. Issues 3, 4, 5, 7 (remaining backend unit tests) -- can parallelize
4. Issues 10, 11, 13 (critical mobile tests) -- auth screens, HomeScreen, Redux slices
5. Issues 12 (quest screen tests) -- builds on existing test files
6. Issue 9 (integration tests) -- depends on migration being in place
7. Issue 15 (Android fixes) -- unblocks E2E on Android
8. Issue 14 (E2E framework) -- depends on Android fixes
9. Issues 16, 17 (infrastructure cleanup) -- can be done anytime
