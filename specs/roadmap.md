# DYDYD Roadmap

> Single source of truth for what's planned, in progress, and complete.
> Owned by PRODUCT agent. All agents read.

## Current Phase: Phase 0 — Unblock Everything

### Status: IN PROGRESS

| Task | Status | Owner |
|------|--------|-------|
| Restore `packages/shared/` from git | DONE | ARCHITECT |
| Create missing mobile screen stubs | DONE | MOBILE |
| Create ThemeProvider + hooks + LoadingScreen | DONE | MOBILE |
| Set up agent definitions (7 agents) | DONE | ALL |
| Set up `specs/` directory | DONE | PRODUCT |
| Verify `yarn build:all` succeeds | PENDING | ARCHITECT |
| Gate 0 sign-off | PENDING | FOUNDER |

---

## Phase 1: Core Feature Completion (~2-3 weeks)

### Track A — Backend
| Task | Status | Owner |
|------|--------|-------|
| Badge routes (library, user, check/award) | PENDING | ARCHITECT |
| Notification routes + Firebase integration | PENDING | ARCHITECT |
| Health sync endpoint | PENDING | ARCHITECT |
| Password reset flow | PENDING | ARCHITECT |
| Fix streak logic (real day-over-day) | PENDING | ARCHITECT |

### Track B — Mobile Screens
| Task | Status | Owner |
|------|--------|-------|
| ThemeProvider (full design system integration) | DONE (stub) | MOBILE |
| Component library (Button, Input, Card, XPBar, Badge) | PENDING | MOBILE |
| Auth screens (Welcome, Login, Register, ForgotPassword) | DONE (functional) | MOBILE |
| Onboarding screens (5 steps) | DONE (functional) | MOBILE |
| Progress screens (Progress, Badges) | DONE (stub) | MOBILE |
| Settings screens (Settings, Notifications, HealthIntegrations) | DONE (stub) | MOBILE |
| AddQuestScreen | DONE (functional) | MOBILE |

### Track C — Specs & Compliance
| Task | Status | Owner |
|------|--------|-------|
| PRDs for all feature groups | PENDING | PRODUCT |
| Privacy Policy draft | PENDING | COMPLIANCE |
| Terms of Service draft | PENDING | COMPLIANCE |
| Onboarding funnel metrics + analytics taxonomy | PENDING | GROWTH |
| ASO keyword research | PENDING | GROWTH |

---

## Phase 2: Polish & Integration (~1-2 weeks)
- Design system alignment audit
- Font bundling (Sora, Manrope, JetBrains Mono)
- Offline support
- Push notifications (end-to-end)
- Health data integration (HealthKit, Google Fit)
- Animations (level-up, XP counter, badge award)
- Home screen widgets
- Apple Watch companion
- Sentry error monitoring
- EAS Updates (OTA patches)

## Phase 3: Testing & QA (~1-2 weeks)
- Unit tests (shared, backend, mobile)
- Integration tests (API routes)
- E2E tests (Detox)
- Performance profiling
- Security review
- Accessibility audit

## Phase 4: Store Preparation (~1 week)
- App Store assets + metadata
- Google Play assets + metadata
- Legal docs finalized + hosted
- Account deletion flow
- Production infrastructure
- Apple Developer + Google Play accounts
- EAS Submit configuration

## Phase 5: Beta Testing (~1-2 weeks)
- TestFlight + Google Play internal testing
- External beta
- Bug triage + fixes

## Phase 6: Store Submission & Launch (~1 week)
- Final production builds
- App Store submission
- Google Play submission
- Launch monitoring

---

*Last updated: 2026-05-28*
