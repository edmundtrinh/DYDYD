# DYDYD Roadmap

> Single source of truth for what's planned, in progress, and complete.
> Owned by PRODUCT agent. All agents read.

## Current Phase: Phase 5 — Intelligence (Expo 53 upgrade in progress)

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

## Phase 3A: Merge & Stabilize (v0.3.1) — COMPLETE

### Goal

Unblock main by merging the 10 open PRs from the Phase 3 testing sprint. Backend now has 94+ unit tests across auth, quest, and user routes, plus 7 critical bug fixes.

| Task | PR | Status |
|------|-----|--------|
| Fix 7 backend bugs + add 94 unit tests (auth, quests, user) + CLAUDE.md/SKILL.md | #74 | DONE (squash merged) |
| Prisma initial migration + DB CI validation | #68 | DONE |
| Backend test infra + auth/user route tests | #65 | DONE (superseded by #74) |
| Quest route tests | #69 | DONE |
| Health route tests | #70 | DONE |
| Progress route tests | #71 | DONE |
| Badge route tests | #72 | DONE |
| Notification route tests | #73 | DONE |
| Settings screen logout + delete account fixes | #66 | DONE |
| GitHub API workflow docs | #67 | DONE |

---

## Phase 3B: Mobile Tests (v0.3.2)

### Goal

Expand mobile test coverage to auth screens, HomeScreen, quest screens, and all Redux slices.

| Task | Issue | Status | Owner |
|------|-------|--------|-------|
| Auth screen tests (Login, Register, Welcome, ForgotPassword) | #57 | PENDING | MOBILE |
| HomeScreen tests (quest display, completion flow, health sync) | #58 | PENDING | MOBILE |
| Quest screen tests (QuestDetail, expanded AddQuest, search) | #59 | PENDING | MOBILE |
| Redux slice tests (all 7 slices: auth, quests, progress, user, health, notifications, ui) | #60 | PENDING | MOBILE |

---

## Phase M: Modernization (Backend + Mobile Stack Upgrade)

### Status: BACKEND COMPLETE, MOBILE IN PROGRESS

Backend framework and runtime migrated. Mobile Expo 53 upgrade in fresh branch (previous attempts stale).

| Task | PR | Status | Notes |
|------|-----|--------|-------|
| M1: Fix `req.userId!` assertions | #88 | DONE | Replaced unsafe non-null assertions with proper Hono context typing |
| M2: Express 4 -> Hono 4 migration | #88 | DONE | Full framework swap: routes, middleware, error handling, validation (express-validator -> Zod) |
| M3: Node.js -> Bun runtime | #88 | DONE | Scripts updated to `bun`, `@hono/node-server` retained as fallback |
| M4: Expo 50 -> 53, RN 0.73 -> 0.79, React 18 -> 19 | — | IN PROGRESS | Fresh branch `chore/expo-53-upgrade` from main (old #89 stale, abandoned) |

### Key technical changes

- **Backend framework**: Express 4 -> Hono 4 (lighter, faster, Web Standards-based)
- **Validation**: express-validator -> Zod + `@hono/zod-validator` (type-safe schemas)
- **Runtime**: Node.js -> Bun (primary), `@hono/node-server` for Node.js fallback
- **Testing**: supertest -> Hono native `app.request()` (no HTTP server needed)
- **Security**: `helmet()` -> `secureHeaders()` (Hono built-in)
- **Mobile (in progress)**: React Native 0.73 -> 0.79, Expo 50 -> 53, React 18 -> 19, React Navigation 6 -> 7

---

## Phase 4A: The Vision (v0.4.0) — COMPLETE

### Strategic Context

> This is why DYDYD exists. The founder's core vision is to **replace the phone homescreen** with an all-in-one habit and routine builder. Widgets and the Watch app are not polish features — they are the product. Compassionate streak design ensures the app meets the user where they are (scatter-brained, procrastination-prone) with encouragement, not guilt.

### Milestone 1 — Interactive iOS Widgets

**Status: MERGED** (PR #82)

| Task | Status |
|------|--------|
| WidgetKit + App Groups iOS home screen widgets | DONE |
| Small widget: streak count + daily XP progress ring | DONE |
| Medium widget: top 3 daily quests with interactive check buttons | DONE |
| Large widget: full daily dashboard | DONE |
| StandBy Mode support | DONE |
| Live Activities for active quest timers | DONE |

### Milestone 2 — Apple Watch Companion

**Status: MERGED** (PR #95)

| Task | Status |
|------|--------|
| WatchConnectivity bridge via `react-native-watch-connectivity` | DONE |
| Watch app: quest list with quick-complete buttons | DONE |
| Complications: streak count + daily progress rings | DONE |

### Milestone 3 — Compassionate Streak Design

**Status: MERGED** (PR #92)

| Task | Status |
|------|--------|
| Streak Freezes (bank on good days, auto-apply on misses) | DONE |
| Comeback Quests (miss a day → special "Welcome Back" quest) | DONE |
| Progressive onboarding (start with ONE morning habit) | DONE |

### Milestone 4 — History Logging MVP

**Status: MERGED** (PR #93)

| Task | Status |
|------|--------|
| `TimeBucket` enum + `timeBucket` field on `QuestCompletion` | DONE |
| Silent completion logging with `timeBucket` | DONE |
| Weekly digest endpoint (`/weekly-digest`) | DONE |
| Completion history endpoint (`/history`) | DONE |

---

## Phase 4B: Quality Gates (v0.4.1) — MOSTLY COMPLETE

### Goal

Quality gates that block store submission but not personal use. Complete these before entering beta.

| Task | Issue / PR | Status |
|------|-----------|--------|
| API integration tests with Docker Postgres | #56 / #113 | DONE (merged) |
| E2E testing framework setup (Maestro) | #61 / #110 | DONE (merged) |
| CI coverage reporting + thresholds (70% backend, 50% mobile) | #64 | PENDING |
| CNG migration — move Swift widget/watch to config plugins | #62 | PENDING (needs Xcode) |
| Configure EAS Updates (OTA) for beta hot-fixes | #97 / #109 | DONE (merged) |
| Performance profiling baseline | #98 / #111 | DONE (merged) |
| Security review (12 findings, 3 critical fixes applied) | #99 / #112 | DONE (merged) |
| Accessibility audit (32 findings, fixes across 34 files) | #100 / #114 | DONE (merged) |

---

## Phase 5: Intelligence (v0.5.0) — IN PROGRESS

### Goal

Add AI-powered features that differentiate DYDYD from competitors. The LLM coach is the marquee feature — it turns natural language goals into actionable quests and adapts to the user's behavior patterns.

| Task | Issue / PR | Status |
|------|-----------|--------|
| Time-of-day badges (Early Riser, Night Owl, etc.) | #105 / #115 | DONE (merged) |
| Timing pattern insights (backend logic) | #104 / #115 | DONE (merged, backend only — mobile UI pending) |
| Timing insights mobile UI | — | PENDING |
| LLM Coach: natural language quest creation | #101 | PENDING (needs provider decision) |
| LLM Coach: completion pattern analysis | #102 | PENDING (needs provider decision) |
| LLM Coach: proactive encouraging check-ins | #103 | PENDING (needs provider decision) |
| Weekly digest enhancements | #106 | PENDING |
| Analytics dashboard | #107 | PENDING |
| Android home screen widgets (Jetpack Glance) | #108 | PENDING (blocked on Expo 53 upgrade) |

---

## Phase 6: Store Preparation (v0.6.0)

| Task | Notes | Owner |
|------|-------|-------|
| App Store assets + metadata (screenshots, descriptions, keywords) | — | GROWTH |
| Google Play assets + metadata (feature graphic, screenshots, descriptions) | — | GROWTH |
| ASO keyword research | — | GROWTH |
| Legal docs finalized + hosted (Privacy Policy, ToS) | Docs written in Phase 2, need hosting | COMPLIANCE |
| Production infrastructure (DB, hosting, monitoring) | — | ARCHITECT |
| Apple Developer + Google Play Console accounts | — | FOUNDER |
| EAS Submit configuration | — | ARCHITECT |
| TestFlight internal testing | — | QA |
| Google Play internal testing track | — | QA |
| External beta (invited testers) | — | QA / GROWTH |
| Bug triage + fixes from beta | — | ALL |
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

## Current State Summary (as of 2026-09-03)

### What exists

| Layer | Coverage |
|-------|----------|
| **Backend** | 9 route files (auth, quests, health, progress, badges, user, notifications, streaks, index), Hono 4 framework, Zod validation, Prisma schema (11 models), JWT auth with refresh tokens, rate limiting, streak logic (freezes, comeback quests). 223 tests (166 unit + 37 integration + 20 streaks) using Hono native `app.request()`. Docker Postgres for integration tests. Bun runtime (primary) with Node.js fallback. |
| **Mobile** | 20+ screens, 18 components, 7 Redux slices, health integration (HealthKit, Google Fit), offline sync queue, push notifications (Expo), Sentry, interactive iOS widgets (WidgetKit), Apple Watch companion, compassionate streaks. 22 test files. Expo 50 → 53 upgrade in progress. |
| **Shared** | Types (including TimeBucket, TimingInsights), constants (30+ quests, 20+ badges, 5 time-of-day badges), utils (XP calc, streak logic, time buckets). 120+ tests passing. |
| **Infrastructure** | GitHub Actions CI (test + lint + db-validate + typecheck), EAS build configs (dev/preview/production), EAS Updates (OTA), Maestro E2E smoke tests, Sentry, performance profiling. WCAG 2.1 AA accessibility audit applied. 117+ merged PRs. |

### Remaining gaps

- **Expo 53 upgrade** — in progress on `chore/expo-53-upgrade` branch (RN 0.73→0.79, React 18→19, Nav 6→7)
- **Mobile test coverage** — 4 open issues (#57-#60): auth screens, HomeScreen, quest screens, Redux slices (~105 test cases needed)
- **CI coverage thresholds** — not enforced yet (#64)
- **CNG migration** — Swift widget/watch code not moved to config plugins (#62, needs Xcode)
- **Timing insights mobile UI** — backend logic exists, no mobile screens yet
- **LLM Coach** — blocked on provider decision (#101-#103)
- **Android widgets** — blocked on Expo 53 upgrade (#108)
- **Stale remote branches** — ~37 remote branches need cleanup (local branches cleaned)

### Key decisions (2026-06-16)

All 10 open questions resolved — see `specs/open-questions.md` for full details.

| Decision | Choice |
|----------|--------|
| Android native strategy | CNG (gitignore generated dirs, config plugins) |
| Test DB | Docker PostgreSQL everywhere |
| Coverage thresholds | 70% backend / 50% mobile (excl. screens) |
| Widgets | Phase 4A priority — core vision, not polish |
| Apple Watch | Phase 4A priority |
| Streak design | Compassionate (Finch/Duolingo model) — no punitive streak-breaking |
| Premium | Feature-flag, launch free |
| Open source | At store launch |

### Development environment

- **Windows 11** (primary): Android emulator, backend, shared package, backend + Android testing
- **MacBook Pro M2 Max** (secondary): iOS simulator, Xcode, Apple Watch, Expo Go, iOS/Watch manual testing
- Cross-platform workflow: develop on Windows → push branch → pull on Mac for iOS/Watch testing

---

*Last updated: 2026-09-03*
