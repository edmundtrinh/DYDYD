# DYDYD Roadmap

> Single source of truth for what's planned, in progress, and complete.
> Owned by PRODUCT agent. All agents read.

## Current Phase: Phase 3 — Testing & Quality

---

## Phase 0 — Unblock Everything

### Status: COMPLETE (2026-05-28)

| Task | Status | Owner |
|------|--------|-------|
| Restore `packages/shared/` from git | DONE | ARCHITECT |
| Create missing mobile screen stubs | DONE | MOBILE |
| Create ThemeProvider + hooks + LoadingScreen | DONE | MOBILE |
| Set up agent definitions (7 agents) | DONE | ALL |
| Set up `specs/` directory | DONE | PRODUCT |
| Verify build succeeds (all packages 0 errors) | DONE | ARCHITECT |
| Shared package tests (120/120 passing) | DONE | QA |
| Gate 0 sign-off | DONE | FOUNDER |

---

## Phase 1: Core Gamification Loop (v0.2.0)

### Status: COMPLETE

All features implemented across 13 issues and 13 feature PRs, plus 6 CI fix PRs.

### Track A — Screen Wiring & Redux Integration

| Task | Issue / PR | Status |
|------|-----------|--------|
| Toast notification system | #1 / #14 | DONE |
| Wire ProgressScreen to real Redux data | #2 / #15 | DONE |
| Wire BadgesScreen to real Redux data | #3 / #16 | DONE |
| Wire AddQuestScreen form to Redux | #4 / #17 | DONE |
| Wire SettingsScreen switches to Redux state | #5 / #18 | DONE |
| Wire NotificationsScreen switches to Redux state | #6 / #19 | DONE |

### Track B — Gamification Polish

| Task | Issue / PR | Status |
|------|-----------|--------|
| Add haptic feedback to key interactions | #7 / #20 | DONE |
| Add quest completion celebration overlay | #8 / #21 | DONE |
| Trigger badge check after quest completion | #9 / #22 | DONE |
| Add badge earned celebration modal | #10 / #24 | DONE |
| Add quest search bar to QuestsScreen | #11 / #25 | DONE |
| Add streak calendar and progress visualization | #12 / #26 | DONE |
| Add level up celebration overlay | #13 / #27 | DONE |

### CI Fixes

| PR | Description |
|----|-------------|
| #23 | CI fixes from Track A |
| #28 | CI fixes batch 1 |
| #29 | CI fixes batch 2 |
| #30 | CI fixes batch 3 |
| #31 | CI fixes batch 4 |
| #32 | CI fixes batch 5 |

---

## Phase 2: Store-Ready Polish (v0.3.0)

### Status: COMPLETE

7 features implemented across 7 issues and 8 PRs.

| Task | Issue / PR | Status |
|------|-----------|--------|
| Push notification service with Expo | #33 / #40 | DONE |
| Offline support with sync queue | #34 / #41 | DONE |
| Health data integration with backend sync | #35 / #42 | DONE |
| Custom typography font infrastructure | #36 / #43 | DONE |
| Account deletion flow | #37 / #44 | DONE |
| Privacy Policy and Terms of Service | #38 / #45 | DONE |
| Sentry error monitoring integration | #39 / #46 | DONE |
| Fix CI failures from Phase 2 | — / #47 | DONE |

---

## Phase 3: Testing & Quality (v0.4.0) — CURRENT

### Goal

Bring test coverage and infrastructure quality up to store-submission standard. The backend currently has zero tests, mobile has 19 test files covering Phase 1-2 features, and shared has 2 test files (120/120 passing). Several infrastructure gaps (no DB migrations, Android build issues) must also be resolved.

### Track A — Backend Unit Tests

The backend has 7 route files and zero test coverage. Each route file gets a corresponding test suite.

| Task | Status | Owner |
|------|--------|-------|
| Auth route tests (`src/routes/auth.ts`) — register, login, refresh, logout, forgot/reset password | PENDING | ARCHITECT |
| Quest route tests (`src/routes/quests.ts`) — CRUD, assign, complete, frequency filters | PENDING | ARCHITECT |
| Health route tests (`src/routes/health.ts`) — sync endpoint, auto-complete | PENDING | ARCHITECT |
| Progress route tests (`src/routes/progress.ts`) — XP, streaks, level data | PENDING | ARCHITECT |
| Badge route tests (`src/routes/badges.ts`) — library, user badges, check/award | PENDING | ARCHITECT |
| User route tests (`src/routes/user.ts`) — profile, settings, account deletion | PENDING | ARCHITECT |
| Notification route tests (`src/routes/notifications.ts`) — device token, history, mark read | PENDING | ARCHITECT |
| Middleware tests (`src/middleware/auth.ts`) — JWT validation, expired tokens, missing headers | PENDING | ARCHITECT |

### Track B — Mobile Test Coverage

19 test files exist. Expand coverage to remaining screens and services.

| Task | Status | Owner |
|------|--------|-------|
| Audit existing 19 test files for passing status and coverage gaps | PENDING | QA |
| Auth screens tests (Login, Register, Welcome, ForgotPassword) | PENDING | MOBILE |
| Onboarding screens tests (CategoryPriority, SelectQuests, OnboardingComplete) | PENDING | MOBILE |
| Home screen tests (QuestsScreen main view, quest toggling) | PENDING | MOBILE |
| Profile screen tests (ProfileScreen) | PENDING | MOBILE |
| Redux slice tests (auth, quests, progress, user, health, notifications, ui) | PENDING | MOBILE |
| Navigation tests (auth flow, onboarding flow, tab switching) | PENDING | MOBILE |

### Track C — Integration Tests

API route testing with a test database, verifying the full request-response cycle.

| Task | Status | Owner |
|------|--------|-------|
| Set up test database configuration (separate test DB, seeding, teardown) | PENDING | ARCHITECT |
| Auth integration tests (register -> login -> refresh -> logout flow) | PENDING | ARCHITECT |
| Quest lifecycle integration tests (create -> assign -> complete -> XP award) | PENDING | ARCHITECT |
| Health sync integration tests (sync -> auto-complete -> XP) | PENDING | ARCHITECT |
| Badge award integration tests (complete quest -> badge check -> badge earned) | PENDING | ARCHITECT |
| Account deletion integration tests (delete -> verify cascading cleanup) | PENDING | QA |

### Track D — E2E Framework Setup

Leaning toward **Detox** (founder has macOS for iOS testing). Evaluate both before committing.

| Task | Status | Owner |
|------|--------|-------|
| Evaluate Detox vs Maestro hands-on (framework selection) | PENDING | FOUNDER / QA |
| Install and configure chosen E2E framework | PENDING | QA |
| Write smoke test suite (auth flow, complete one quest, check XP) | PENDING | QA |
| Add E2E tests to CI pipeline | PENDING | QA |

### Track E — Infrastructure

| Task | Status | Owner |
|------|--------|-------|
| Set up proper Prisma migrations (replace shadow DB with migration history) | PENDING | ARCHITECT |
| Adopt CNG — gitignore android/ and ios/, move Swift code to Expo config plugins | PENDING | ARCHITECT / MOBILE |
| Configure EAS Updates (OTA) — expo-updates plugin, eas.json update channels | PENDING | ARCHITECT |
| Close stale GitHub milestones v0.2.0 and v0.3.0 (all issues closed) | PENDING | PRODUCT |
| Fix 3 UI bugs (dark mode logic, missing logout button, unwired delete account) | PENDING | MOBILE |
| Fix Prisma bug (user.ts deleteMany uses wrong column — userId vs userQuestId) | PENDING | ARCHITECT |
| Performance profiling baseline | PENDING | QA |
| Security review | PENDING | QA |
| Accessibility audit | PENDING | QA |

---

## Phase 4: Polish & Platform Features (v0.5.0)

### Milestone 1 — History Logging MVP

PRD: `specs/phase-1/prd-history-logging.md` (APPROVED)

| Task | Notes | Owner |
|------|-------|-------|
| Add `TimeBucket` enum + `timeBucket` field to `QuestCompletion` | Prisma migration — EARLY_MORNING/MORNING/AFTERNOON/EVENING/NIGHT | ARCHITECT |
| Silent completion logging with `timeBucket` on every quest completion | US-1: record time-of-day bucket automatically | ARCHITECT / MOBILE |
| Weekly digest modal | US-3: totals, XP, streak, week-over-week comparison on Monday app open | MOBILE |
| Basic completion history list on Progress screen | Chronological list of recent completions with category + time bucket | MOBILE |

### Milestone 2 — Insights & Time Badges

| Task | Notes | Owner |
|------|-------|-------|
| Timing pattern insights | US-2: "Completed 1h earlier than average" banners after 5+ completions | ARCHITECT / MOBILE |
| Time-of-day badges | US-4: Early Bird, Night Owl, Steady Eddie, Dawn Patrol | ARCHITECT / MOBILE |
| Backend analytics service | Compute averages, detect deviations, generate insight data | ARCHITECT |

### Milestone 3 — Widgets & Watch

| Task | Notes | Owner |
|------|-------|-------|
| iOS home screen widgets | Wire App Groups + shared UserDefaults, connect Swift widget to RN data | MOBILE |
| Android home screen widgets | Rebuild with Jetpack Glance under CNG config plugin | MOBILE |
| Research iOS 27 widget APIs | Explore new capabilities for enhanced widget experiences | MOBILE |
| Apple Watch companion | Build WatchConnectivity bridge (expo-modules), connect Swift watch app | MOBILE |

### Milestone 4 — Polish

| Task | Notes | Owner |
|------|-------|-------|
| Analytics dashboard | US-5: completion heat map, per-category trends, personal records | MOBILE |
| Widget/Watch data feeds | US-6: today's count, streak, pace indicator for widgets and complications | MOBILE |
| Design system alignment audit | Verify all screens match design tokens | MOBILE |
| Onboarding funnel metrics + analytics taxonomy | Define events, implement tracking | GROWTH |
| Animations polish (level-up, XP counter, badge award) | Refinement pass on Phase 1 celebrations | MOBILE |

---

## Phase 5: Store Preparation (v0.6.0)

| Task | Notes | Owner |
|------|-------|-------|
| App Store assets + metadata (screenshots, descriptions, keywords) | — | GROWTH |
| Google Play assets + metadata (feature graphic, screenshots, descriptions) | — | GROWTH |
| ASO keyword research | — | GROWTH |
| Legal docs finalized + hosted (Privacy Policy, ToS) | Docs written in Phase 2, need hosting | COMPLIANCE |
| Production infrastructure (DB, hosting, monitoring) | — | ARCHITECT |
| Apple Developer + Google Play Console accounts | — | FOUNDER |
| EAS Submit configuration | — | ARCHITECT |

---

## Phase 6: Beta Testing (v0.7.0)

| Task | Notes | Owner |
|------|-------|-------|
| TestFlight internal testing | — | QA |
| Google Play internal testing track | — | QA |
| External beta (invited testers) | — | QA / GROWTH |
| Bug triage + fixes | — | ALL |
| Crash monitoring via Sentry (validate production) | Sentry integrated in Phase 2 | QA |

---

## Phase 7: Store Submission & Launch (v1.0.0)

| Task | Notes | Owner |
|------|-------|-------|
| Final production builds | — | ARCHITECT |
| App Store submission | — | FOUNDER |
| Google Play submission | — | FOUNDER |
| Launch monitoring (crash rates, API errors, user funnel) | — | QA / GROWTH |
| Post-launch hotfix process | — | ALL |

---

## Current State Summary (as of 2026-06-17)

### What exists

| Layer | Coverage |
|-------|----------|
| **Backend** | 7 route files (auth, quests, health, progress, badges, user, notifications), Prisma schema (11 models), JWT auth with refresh tokens, rate limiting, streak logic. Zero tests. |
| **Mobile** | 19 screens, 14 components, 7 Redux slices, health integration (HealthKit, Google Fit, Garmin, Samsung), offline sync queue, push notifications (Expo), Sentry. 19 test files. |
| **Shared** | Types, constants, utils. 2 test files, 120/120 passing. |
| **Infrastructure** | GitHub Actions CI workflow, EAS build configs (dev/preview/production), Sentry integration. |

### Known gaps

- Backend has zero test coverage
- No E2E test framework installed (leaning Detox — evaluating)
- Database uses shadow DB instead of proper migrations
- Android native directory committed but should be gitignored (CNG decision made)
- History logging PRD approved but not implemented (Phase 4 M1)
- Widgets exist as Swift stubs but not connected (Phase 4 M3)
- Apple Watch companion Swift file exists but not connected (Phase 4 M3)
- EAS Updates (OTA) not configured (Phase 3 Track E)
- GitHub milestones v0.2.0 and v0.3.0 still open despite all issues closed
- 3 UI bugs: dark mode logic, missing logout button, unwired delete account handler
- 1 Prisma bug: user.ts deleteMany references wrong column (userId vs userQuestId)

### Key decisions (2026-06-16)

All 10 open questions resolved — see `specs/open-questions.md` for full details.

| Decision | Choice |
|----------|--------|
| Android native strategy | CNG (gitignore generated dirs, config plugins) |
| Test DB | Docker PostgreSQL everywhere |
| Coverage thresholds | 70% backend / 50% mobile (excl. screens) |
| EAS Updates | Phase 3 (now) |
| Widgets | Phase 4 priority (iOS 27 research) |
| Apple Watch | Phase 4 priority (macOS + Watch available) |
| History logging | Full PRD, milestoned MVP-first delivery |
| Premium | Feature-flag, launch free |
| Open source | At store launch |

### Development environment

- **Windows 11** (primary): Android emulator, backend, shared package
- **MacBook Pro M2 Max** (secondary): iOS simulator, Xcode, Apple Watch, Expo Go
- Cross-platform workflow: develop on Windows → push branch → pull on Mac for iOS testing → merge after confirmation
- See `specs/cross-platform-workflow.md` for detailed process

---

*Last updated: 2026-06-17*
