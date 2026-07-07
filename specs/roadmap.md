# DYDYD Roadmap

> Single source of truth for what's planned, in progress, and complete.
> Owned by PRODUCT agent. All agents read.

## Current Phase: Phase 3A — Merge & Stabilize (then Phase 4A — The Vision)

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

## Phase 4A: The Vision (v0.4.0) — CURRENT PRIORITY

### Strategic Context

> This is why DYDYD exists. The founder's core vision is to **replace the phone homescreen** with an all-in-one habit and routine builder. Widgets and the Watch app are not polish features — they are the product. Compassionate streak design ensures the app meets the user where they are (scatter-brained, procrastination-prone) with encouragement, not guilt.
>
> **Industry context:** Apps with interactive widgets see 12-18% lifts in re-engagement. Finch (compassionate gamification) grew to ~$30M ARR. Duolingo's streak mechanics drove 36% YoY DAU growth. The opportunity is to combine proven engagement patterns with genuinely supportive design.

### Milestone 1 — Interactive iOS Widgets

| Task | Notes | Owner |
|------|-------|-------|
| Set up `expo-widgets` for iOS home screen widgets | WidgetKit + App Groups, no native Swift required | MOBILE |
| Small widget: streak count + daily XP progress ring | Glanceable daily status | MOBILE |
| Medium widget: top 3 daily quests with interactive check buttons | Complete habits without opening the app | MOBILE |
| Large widget: full daily dashboard with progress rings, streak, next quest | "Replace the homescreen" experience | MOBILE |
| StandBy Mode support | Full-screen widget display while charging (nightstand dashboard) | MOBILE |
| Live Activities for active quest timers | Real-time progress during focus sessions | MOBILE |

### Milestone 2 — Apple Watch Companion

| Task | Notes | Owner |
|------|-------|-------|
| WatchConnectivity bridge via `react-native-watch-connectivity` | EAS Build bare workflow, bridge RN ↔ WatchOS | MOBILE |
| Watch app: quest list with quick-complete buttons | Standalone habit completion (no iPhone needed) | MOBILE |
| Complications: streak count + daily progress rings | Glanceable on watch face | MOBILE |
| Haptic reminders for upcoming quests | Gentle wrist taps at quest-scheduled times | MOBILE |
| HealthKit auto-logging from Watch | Steps, workouts, sleep → auto-complete matching quests | MOBILE |

### Milestone 3 — Compassionate Streak Design

| Task | Notes | Owner |
|------|-------|-------|
| Streak Freezes | Bank a freeze on good days, auto-apply on misses (Duolingo model) | ARCHITECT / MOBILE |
| Comeback Quests | Miss a day → special "Welcome Back" quest with bonus XP | ARCHITECT / MOBILE |
| Progressive onboarding | Start with ONE morning habit, add more over weeks (Fabulous model) | MOBILE |
| 2-minute minimum quest bars | Every quest has a minimum bar so low "you'd feel silly saying no" | ARCHITECT |
| Gentle re-engagement notifications | "We missed you!" not "You broke your streak!" | MOBILE |

### Milestone 4 — History Logging MVP

PRD: `specs/phase-1/prd-history-logging.md` (APPROVED)

| Task | Notes | Owner |
|------|-------|-------|
| Add `TimeBucket` enum + `timeBucket` field to `QuestCompletion` | Prisma migration — EARLY_MORNING/MORNING/AFTERNOON/EVENING/NIGHT | ARCHITECT |
| Silent completion logging with `timeBucket` on every quest completion | US-1: record time-of-day bucket automatically | ARCHITECT / MOBILE |
| Weekly digest modal | US-3: totals, XP, streak, week-over-week comparison on Monday app open | MOBILE |
| Basic completion history list on Progress screen | Chronological list of recent completions with category + time bucket | MOBILE |

---

## Phase 4B: Quality Gates (v0.4.1)

### Goal

Quality gates that block store submission but not personal use. Complete these before entering beta.

| Task | Issue | Status | Owner |
|------|-------|--------|-------|
| API integration tests with Docker Postgres | #56 | PENDING | ARCHITECT |
| E2E testing framework setup (Detox vs Maestro eval) | #61 | PENDING | QA |
| CI coverage reporting + thresholds (70% backend, 50% mobile) | #64 | PENDING | ARCHITECT |
| CNG migration — move Swift widget/watch to config plugins | #62 | PENDING | ARCHITECT / MOBILE |
| Configure EAS Updates (OTA) for beta hot-fixes | — | PENDING | ARCHITECT |
| Performance profiling baseline | — | PENDING | QA |
| Security review | — | PENDING | QA |
| Accessibility audit | — | PENDING | QA |

---

## Phase 5: Intelligence (v0.5.0)

### Goal

Add AI-powered features that differentiate DYDYD from competitors. The LLM coach is the marquee feature — it turns natural language goals into actionable quests and adapts to the user's behavior patterns.

| Task | Notes | Owner |
|------|-------|-------|
| LLM Coach: natural language quest creation | "I want to read more" → specific daily 15-min reading quest | ARCHITECT / MOBILE |
| LLM Coach: completion pattern analysis | Suggest optimal times, detect burnout signals, adjust difficulty | ARCHITECT |
| LLM Coach: proactive encouraging check-ins | Context-aware nudges, not generic reminders | MOBILE |
| Timing pattern insights | US-2: "Completed 1h earlier than average" banners | ARCHITECT / MOBILE |
| Time-of-day badges | US-4: Early Bird, Night Owl, Steady Eddie, Dawn Patrol | ARCHITECT / MOBILE |
| Weekly digest enhancements | Week-over-week trends, personal records, AI-generated summaries | MOBILE |
| Analytics dashboard | US-5: completion heat map, per-category trends, personal records | MOBILE |
| Android home screen widgets | Jetpack Glance with Material You theming | MOBILE |

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

## Current State Summary (as of 2026-07-07)

### What exists

| Layer | Coverage |
|-------|----------|
| **Backend** | 7 route files (auth, quests, health, progress, badges, user, notifications), Prisma schema (15 models), JWT auth with refresh tokens, rate limiting, streak logic. 94+ unit tests across auth, quests, and user routes. 7 critical bugs fixed. |
| **Mobile** | 19 screens, 14 components, 7 Redux slices, health integration (HealthKit, Google Fit, Garmin, Samsung), offline sync queue, push notifications (Expo), Sentry. 19 test files. |
| **Shared** | Types, constants, utils. 2 test files, 120/120 passing. |
| **Infrastructure** | GitHub Actions CI workflow (test + lint + typecheck), EAS build configs (dev/preview/production), Sentry integration. 47+ merged PRs, 59+ commits. |

### Resolved since last update (2026-06-17 → 2026-07-07)

- Backend unit tests landed on main (auth, quests, user routes — 94+ tests)
- 7 critical backend bugs fixed (route validation, Prisma queries, streaks)
- All 10 open PRs merged or superseded
- Milestones v0.2.0 and v0.3.0 closed
- CLAUDE.md and SKILL.md updated with testing/SDLC guidance

### Remaining gaps

- Mobile test coverage incomplete (auth screens, HomeScreen, Redux slices — Phase 3B)
- No E2E test framework installed (Detox vs Maestro decision deferred)
- CNG migration not complete (android/ios gitignored but Swift code not in config plugins)
- EAS Updates (OTA) not configured
- Widgets exist as Swift stubs but not connected to RN (Phase 4A priority)
- Apple Watch companion Swift code not connected (Phase 4A priority)
- History logging PRD approved but not implemented (Phase 4A M4)
- Compassionate streak design not implemented (Phase 4A M3)
- No integration tests (blocked on Docker Postgres CI — Phase 4B)
- No coverage thresholds in CI (Phase 4B)

### Key decisions (2026-06-16)

All 10 open questions resolved — see `specs/open-questions.md` for full details.

| Decision | Choice |
|----------|--------|
| Android native strategy | CNG (gitignore generated dirs, config plugins) |
| Test DB | Docker PostgreSQL everywhere |
| Coverage thresholds | 70% backend / 50% mobile (excl. screens) |
| EAS Updates | Phase 3 (now) |
| Widgets | Phase 4A priority — core vision, not polish |
| Apple Watch | Phase 4A priority — macOS + Watch + iPhone available |
| History logging | Full PRD, milestoned MVP-first delivery |
| Premium | Feature-flag, launch free |
| Open source | At store launch |
| Streak design | Compassionate (Finch/Duolingo model) — no punitive streak-breaking |

### Roadmap resequencing rationale (2026-07-07)

The roadmap was resequenced based on a CTO-level review. Key strategic changes:

1. **Widgets and Watch pulled forward to Phase 4A** — These are the core vision ("replace the homescreen"), not polish features. They should ship before quality gates that only matter for store submission.
2. **Compassionate streak design added to Phase 4A** — The founder is self-described scatter-brained and procrastination-prone. Punitive streak mechanics will cause churn. Streak Freezes, Comeback Quests, and progressive onboarding are evidence-backed alternatives.
3. **Quality gates (E2E, coverage, integration tests) moved to Phase 4B** — These gate store submission, not personal use. The founder can start using the app with widgets and Watch before these are complete.
4. **LLM coach deferred to Phase 5** — High-impact differentiator but requires backend LLM integration, prompt engineering, and careful UX. Ship widget/watch first, then layer intelligence on top.
5. **Beta testing merged into Phase 6** — Store prep and beta are a single workflow, not separate phases.

### Development environment

- **Windows 11** (primary): Android emulator, backend, shared package, backend + Android testing
- **MacBook Pro M2 Max** (secondary): iOS simulator, Xcode, Apple Watch, Expo Go, iOS/Watch manual testing
- Cross-platform workflow: develop on Windows → push branch → pull on Mac for iOS/Watch testing → merge after confirmation
- See `specs/cross-platform-workflow.md` for detailed process

---

*Last updated: 2026-07-07*
