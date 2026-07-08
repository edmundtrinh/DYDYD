# Changelog

All notable changes to DYDYD are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Phase 4A: Apple Watch companion app (in progress)
- Compassionate streak design (streak freezes, comeback quests)

### Changed

- Upgraded to Expo SDK 53, React Native 0.79, React 19
- Upgraded React Navigation from v6 to v7
- Set iOS deployment target to 16.0 (iPhone 13+)

## [v0.4.0] - 2026-07-07

### Changed

- Migrated backend from Express 4 to Hono framework
- Replaced express-validator with Zod + @hono/zod-validator
- Migrated all 7 test suites from supertest to Hono native testing
- Added Bun as primary backend runtime (Node.js fallback preserved)
- Fixed 40+ req.userId! non-null assertions with typed middleware

### Added

- iOS widget infrastructure (WidgetKit integration with Swift views)

### Removed

- Express, express-validator, express-rate-limit, helmet, compression, cors, morgan dependencies
- supertest dependency (replaced by Hono native testing)

## [v0.3.2] - 2026-07-07

### Added

- Resequenced roadmap pulling widgets and Watch to Phase 4A as core vision features
- 131-case manual test plan covering all screens and user flows
- 72 additional backend route tests (health, progress, badges, notifications)
- Prisma migration baseline and database CI validation job
- GitHub API workflow documentation

### Fixed

- Merged 10 open PRs to unblock main

## [v0.3.1] - 2026-07-07

### Added

- 94 backend unit tests covering auth, user, and quest routes
- Logout and delete account functionality on Settings screen
- CLAUDE.md updated with testing, CI, and SDLC workflow sections

### Fixed

- 7 critical backend bug fixes in route handlers (validation, Prisma queries, streak logic)

## [v0.3.0] - 2026-06-17

### Added

- Push notification service with Expo (`#33`)
- Offline support with sync queue (`#34`)
- Health data integration with backend sync -- HealthKit, Google Fit, Garmin, Samsung (`#35`)
- Custom typography font infrastructure (`#36`)
- Account deletion flow (`#37`)
- Privacy Policy and Terms of Service (`#38`)
- Sentry error monitoring integration (`#39`)
- Continuous Native Generation (CNG) workflow adoption

### Fixed

- CI failures from Phase 2 changes (`#47`)

## [v0.2.0] - 2026-06-09

### Added

- Toast notification system (`#1`)
- Wire ProgressScreen to real Redux data (`#2`)
- Wire BadgesScreen to real Redux data (`#3`)
- Wire AddQuestScreen form to Redux (`#4`)
- Wire SettingsScreen switches to Redux state (`#5`)
- Wire NotificationsScreen switches to Redux state (`#6`)
- Haptic feedback on key interactions (`#7`)
- Quest completion celebration overlay (`#8`)
- Badge check triggered after quest completion (`#9`)
- Badge earned celebration modal (`#10`)
- Quest search bar on QuestsScreen (`#11`)
- Streak calendar and progress visualization (`#12`)
- Level up celebration overlay (`#13`)

### Fixed

- CI failures in type check and EAS build (`#23`)
- CI workflow failures -- 5 rounds of fixes (`#28`, `#29`, `#30`, `#31`, `#32`)

## [v0.1.0] - 2026-05-28

### Added

- Project skeleton and monorepo setup (Yarn Workspaces + Turbo)
- Backend API server with Express 4, Prisma ORM, PostgreSQL
- Auth routes with JWT (15-minute access tokens, 7-day refresh tokens)
- Quest, progress, user, badge, notification, and health sync API routes
- Rate limiting (100 requests per 15 minutes)
- Streak logic and XP calculation utilities
- React Native mobile app with 19 screens
- Redux Toolkit state management with 7 slices and Redux Persist
- React Navigation 6 with auth, onboarding, and main tab navigators
- Axios-based API client with service stubs for wearable integrations
- Design system with tokens, assets, and UI kit
- Reusable component library
- Polished Auth, Onboarding, and Progress screens
- ThemeProvider with dark/light mode support
- Multi-agent development system with 7 specialized agents
- Spec-driven workflow (`specs/feature-workflow.md`)
- Shared package (`@dydyd/shared`) with domain types, constants, and utilities
- 120 shared package tests passing
- CI/CD workflows (GitHub Actions: test, lint, typecheck)
- EAS build configuration (development, preview, production profiles)
- Project assets and branding
