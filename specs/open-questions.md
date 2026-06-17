# DYDYD Open Questions

> Decisions requiring founder input before implementation can proceed.
> Each question blocks specific Phase 3+ work. Resolve in order of priority.
>
> **Status**: ALL DECIDED
> **Last updated**: 2026-06-16

---

### Q1: E2E Testing Framework

**Context:** Phase 3 requires end-to-end tests. The framework choice affects CI setup, test authoring speed, and contributor onboarding. The primary developer works on Windows 11, which constrains options.

**Options:**
- **A: Detox** -- React Native native, mature ecosystem, strong community. However, setup is complex, Windows development is painful (iOS tests require macOS), and debugging flaky tests is time-consuming.
- **B: Maestro** -- YAML-based, simpler setup, cross-platform runner, visual test recording. Less React Native-specific (no direct component access), newer ecosystem with smaller community.

**Recommendation:** Maestro. For a portfolio project with future open-source contributors, the lower barrier to entry matters. YAML-based tests are readable without React Native expertise. Windows development is not penalized. Maestro Cloud provides CI integration without maintaining device farms. Detox's advantages (direct RN bridge access, component queries) are more valuable for large teams with dedicated QA engineers.

**DECISION: DEFERRED — Revisit after founder evaluates both.** The founder has both Windows 11 and macOS (MacBook Pro M2 Max) with Claude on both, so the macOS constraint for Detox's iOS tests is not a blocker. Revised recommendation leans toward **Detox** given tighter React Native integration and the founder's desire to stay in the RN ecosystem. Final decision after hands-on evaluation of both frameworks. Note: Kotlin is now the dominant Android language (not Java).

**Blocks:** All E2E test work in Phase 3; CI pipeline configuration for E2E.

---

### Q2: Android Native Directory Strategy

**Context:** The project uses Expo but has inconsistent native directory handling. The `android/` directory was regenerated via `expo prebuild` and is committed to git with build issues. The `ios/` directory is partially committed -- generated Xcode project files are gitignored, but hand-authored Swift extensions (widget, watch app) are tracked. This inconsistency creates confusion for contributors and risks merge conflicts on generated files.

**Options:**
- **A: Continuous Native Generation (CNG)** -- Gitignore both `ios/` and `android/` generated output. Move hand-authored Swift widget/watch code into Expo config plugins or a separate `native-extensions/` directory. This is Expo's recommended workflow: `npx expo prebuild` regenerates native projects on demand.
- **B: Bare workflow** -- Commit both `ios/` and `android/` directories. Manually maintain native code alongside Expo. Gives full native control but increases maintenance burden and merge conflict surface.
- **C: Hybrid** -- Gitignore generated files but commit only hand-authored Swift extensions in their current `ios/` locations. Requires careful `.gitignore` patterns and contributor documentation.

**Recommendation:** Option A (CNG). This is the Expo standard and simplifies contributor experience -- nobody needs Xcode or Android Studio to contribute JS/TS code. The iOS widget (DYDYDWidget.swift, 435 lines) and watch app (DYDYDWatchApp.swift, 503 lines) should move into Expo config plugins that inject them during prebuild. This also resolves the Android build issues since prebuild generates a clean project each time.

**DECISION: Option A (CNG).** Move iOS widget and watch app code into Expo config plugins. Gitignore both `ios/` and `android/` generated output.

**Blocks:** Android build fix; contributor documentation; CI build pipeline.

---

### Q3: Widget Strategy

**Context:** An iOS home screen widget exists in Swift (small/medium/large sizes, quest list, XP progress) but is not connected to the React Native app -- no App Group data sharing is wired up. The Android Glance widget was deleted during a package rename. Widgets are listed in Phase 2 of the roadmap but were not completed.

**Options:**
- **A: Phase 4 priority** -- Implement widgets as a key differentiator feature. Wire up iOS widget via App Groups + shared UserDefaults. Rebuild Android widget with Jetpack Glance. Requires native code maintenance on both platforms.
- **B: Use react-native-widget-extension** -- Cross-platform widget library. Simpler maintenance but less native feel and limited widget families.
- **C: Defer post-launch** -- Ship v1.0 without widgets. Add them in a post-launch update once core stability is proven. Reduces launch scope.

**Recommendation:** Option C (defer post-launch). The existing Swift widget code is well-structured and can be revived later, but wiring up App Groups, shared data serialization, and cross-platform parity is significant work. For initial store submission, the core app experience matters more than widget support. Plan widgets for the first major post-launch update (v1.1) when real user feedback can guide which widget sizes and data points are most valuable.

**DECISION: Option A (Phase 4 priority).** Founder views widgets as a key differentiator and wants to pioneer widget functionality. iOS 27 (expected late 2026) may expand widget capabilities — investigate Apple developer docs for new APIs. The Phase 2 roadblock was prioritization: App Groups + shared UserDefaults wiring was deprioritized behind store-ready features (Sentry, offline sync, push notifications). The basic design should be completed first, and then time should be invested in the App Groups + shared UserDefaults integration challenge.

**Blocks:** Widget-related issues in Phase 4; History Logging PRD's widget requirements (US-6, AC-7); iOS 27 developer docs research.

---

### Q4: History Logging Scope

**Context:** The History Logging PRD (specs/phase-1/prd-history-logging.md) is ambitious: completion logging, timing pattern insights, weekly digest, time-of-day badges, analytics dashboard, and widget/watch data feeds. It was scoped for Phase 1-2 but never implemented. Implementing the full PRD in Phase 4 would be 2-3 weeks of work alone.

**Options:**
- **A: Full PRD** -- Implement all 6 user stories, all 8 acceptance criteria, including dashboard charts and widget feeds. Delivers the complete "transformative" experience described in the PRD.
- **B: Minimal viable version** -- Implement US-1 (completion logging with timeBucket field), US-3 (weekly digest as a simple modal), and basic completion history on the Progress screen. Skip insights engine, time-of-day badges, and dashboard charts. Ship the data model now; build the analysis layer post-launch.
- **C: Data model only** -- Add the `timeBucket` and enhanced completion fields to the schema. Log all data silently. Build zero UI. Ensures data is captured from day one so insights can be built later without losing history.

**Recommendation:** Option B (minimal). Ship completion logging and weekly digest -- these are the highest-impact features with the lowest implementation cost. The data model captures everything needed for future insights. Time-of-day badges and the analytics dashboard are genuinely valuable but can ship in v1.1 alongside widgets, using real user data to validate the insight algorithms.

**DECISION: Full PRD (A) documented, Minimal viable (B) milestoned first, Data model (C) included.** Produce the full PRD with all 6 user stories and 8 acceptance criteria as the north star. Create milestones to ship B first (US-1 completion logging + `timeBucket` field, US-3 weekly digest, basic completion history on Progress screen). The data model should capture everything from day one (silent logging) so insights can be built iteratively. Phase 4 milestone 1 = data model + completion logging + weekly digest. Phase 4 milestone 2 = timing insights + time-of-day badges. Post-launch = analytics dashboard + charts.

**Current schema state:** `QuestCompletion` model already has `completedAt`, `value`, `source`, `periodStart`, `notes`. Missing: `timeBucket` enum field. The data model is ~80% there.

**Blocks:** Progress screen redesign; backend analytics service scope; Phase 4 timeline; Prisma migration for `timeBucket` enum.

---

### Q5: Backend Test Database Strategy

**Context:** The backend has zero tests. Phase 3 adds unit and integration tests for all API routes. Integration tests need a real PostgreSQL-compatible database because Prisma with PostgreSQL uses features (enums, JSON columns, array types) that SQLite does not support. The choice affects both local developer experience and CI pipeline cost.

**Options:**
- **A: Docker PostgreSQL everywhere** -- Use `docker-compose` for local dev and a PostgreSQL service container in GitHub Actions CI. Consistent environment. Requires Docker on contributor machines.
- **B: SQLite locally, PostgreSQL in CI** -- Faster local iteration, no Docker dependency. But Prisma behavior differences between SQLite and PostgreSQL mean tests can pass locally and fail in CI (or vice versa), especially around enums and JSON fields.
- **C: Prisma with PostgreSQL test container** -- Use `testcontainers` library to spin up a disposable PostgreSQL Docker container per test suite. Automatic cleanup, consistent behavior. Still requires Docker but abstracts the setup.

**Recommendation:** Option A (Docker PostgreSQL everywhere). The Prisma schema uses PostgreSQL-specific features (enums for QuestCategory, QuestStatus, BadgeRarity; JSON fields). SQLite would require a separate Prisma schema or constant workarounds. Docker Compose is standard for open-source projects, and a simple `docker-compose.test.yml` with a PostgreSQL service is a 10-line file. Contributors who can run `yarn test` need Docker anyway for a real dev environment.

**DECISION: Option A (Docker PostgreSQL everywhere).**

**Blocks:** All backend testing in Phase 3; CI pipeline setup; CONTRIBUTING.md prerequisites.

---

### Q6: Test Coverage Thresholds

**Context:** Phase 3 introduces CI-enforced test coverage. Setting thresholds too high slows development and incentivizes low-value tests. Setting them too low makes the gate meaningless. The backend starts from 0% coverage; mobile has 19 test files but coverage percentage is unknown.

**Options:**
- **A: Aggressive** -- 80% backend, 70% mobile. Industry standard for production apps. Catches most regressions but requires significant test investment upfront.
- **B: Moderate** -- 70% backend lines/branches, 50% mobile (excluding screen components). Balances coverage with development velocity. Screen components are expensive to test and change frequently.
- **C: Progressive** -- Start at 50%/30%, ratchet up 5% per phase. Avoids a Phase 3 bottleneck. Risk: the ratchet never gets turned.

**Recommendation:** Option B (moderate). Backend business logic (XP calculation, streak logic, badge awarding, auth flows) is deterministic and must be well-tested -- 70% is achievable and meaningful. Mobile UI code changes rapidly; enforce 50% but exclude screen components from the threshold (test hooks, services, store slices, and utilities instead). Apply thresholds on PR checks, not on every commit, to avoid blocking rapid iteration.

**DECISION: Option B (70% backend, 50% mobile excluding screen components).**

**Blocks:** Jest configuration for coverage enforcement; CI workflow updates; Phase 3 definition of done.

---

### Q7: EAS Updates (OTA) Timing

**Context:** EAS Updates enables pushing JavaScript-only fixes without going through App Store/Play Store review (24-72 hour delay). The roadmap lists this in Phase 2 (incomplete). Setting it up requires configuring `expo-updates`, release channels, and update policies.

**Options:**
- **A: Phase 3 (now)** -- Set up alongside testing infrastructure. OTA is available before beta begins. First beta testers can receive instant bug fixes.
- **B: Phase 5 (beta)** -- Set up when beta testing starts. Delays availability but avoids configuring something unused for weeks.
- **C: Post-launch** -- Set up only after the app is in stores. Misses the beta testing window where rapid iteration is most valuable.

**Recommendation:** Option A (Phase 3). OTA is infrastructure, not a feature -- it belongs with testing and CI setup. The configuration is lightweight (add `expo-updates` plugin, configure `eas.json` update channels). Having it ready before beta means the first time a tester reports a bug, you can push a fix in minutes instead of rebuilding and redistributing. The cost of setting it up early is near zero; the cost of not having it during beta is significant.

**DECISION: Option A (Phase 3).**

**Blocks:** Beta testing workflow; hotfix deployment process; `eas.json` configuration.

---

### Q8: Apple Watch Companion App

**Context:** A complete Apple Watch SwiftUI app exists (DYDYDWatchApp.swift, 503 lines) with quest list, progress view, WatchConnectivity session manager, and ClockKit complications. It is not connected to the React Native app -- no WatchConnectivity bridge exists on the RN side. Building the bridge and testing the watch app requires macOS with Xcode and a paired Apple Watch (or simulator). The primary developer is on Windows 11.

**Options:**
- **A: Phase 4 priority** -- Build the RN-to-Watch bridge, test on simulator, ship with v1.0. Differentiator feature, but requires macOS access for development and testing.
- **B: Defer to post-launch (v1.1 or v1.2)** -- Keep the Swift code in the repo as a starting point. Ship v1.0 without Watch support. Revisit when the app has real users who request it.
- **C: Remove entirely** -- Delete the Swift watch code. Reduce maintenance surface. Rebuild from scratch if demand materializes.

**Recommendation:** Option B (defer). The Swift code is well-written and represents real work -- deleting it wastes that investment. But connecting it requires macOS development, WatchConnectivity bridging (likely via a native module or expo-modules), and testing with physical or simulated watch hardware. None of this is possible on Windows 11. Keep the code, document it as "planned but not connected," and prioritize it when a macOS contributor is available or the developer has access to a Mac.

**DECISION: Option A (Phase 4 priority).** The founder has macOS (MacBook Pro M2 Max), Xcode, Apple Watch, and iPhone available. Development workflow: build and test on Windows (Android), push to a `ios/*` branch, pull on MacBook for iOS/Watch-specific testing. A cross-platform workflow document should be created to make switching seamless. Claude on macOS can pick up where Windows left off using a handoff `.md` file in the repo.

**Blocks:** Watch-related acceptance criteria in History Logging PRD (US-6); Watch complication data feeds; cross-platform dev workflow doc.

---

### Q9: Premium Features at Launch

**Context:** The codebase references a free/premium tier split: free users get max 5 custom quests, premium users get 100. The `User` type includes premium flags. No payment infrastructure exists (no Stripe, no RevenueCat, no in-app purchase setup). Building and testing IAP adds 1-2 weeks and introduces App Store review complexity (Apple's 30% cut, subscription management, restore purchases flow).

**Options:**
- **A: Ship with monetization** -- Integrate RevenueCat, implement IAP, enforce free-tier limits. Revenue from day one but significant implementation and review risk.
- **B: Feature-flag for later** -- Keep the premium fields in the data model but set all users to premium-equivalent access at launch. Add a feature flag that can enable the paywall in a future update. Ship free-tier-only.
- **C: Remove premium references** -- Strip all premium/free logic from the codebase. Simplify the user model. Reintroduce monetization when usage data justifies it.

**Recommendation:** Option B (feature-flag). Keep the data model intact -- removing and re-adding premium fields is wasteful churn. But do not build payment infrastructure for launch. A free app with generous limits gets more downloads, more reviews, and more portfolio visibility. When usage data shows which features users value most, that data should drive what goes behind the paywall. The feature flag can be toggled via EAS Updates (OTA) without a store review.

**DECISION: Option B (feature-flag for later).**

**Blocks:** User model changes; onboarding flow copy (references to limits); store listing pricing decisions.

---

### Q10: Open Source Timeline

**Context:** DYDYD is intended as an open-source portfolio project with community contributions. The repo is currently private. Going public affects how issues are written (public visibility), whether contributor docs are needed now, and whether security-sensitive patterns (API keys, auth flows) need extra scrutiny before exposure.

**Options:**
- **A: Go public now** -- Immediate visibility. Contributors can find the project during Phase 3 development. Requires CONTRIBUTING.md, issue templates, and a security audit of committed code before flipping the switch.
- **B: Go public at beta (Phase 5)** -- The app is feature-complete and tested. Contributors join a stable codebase. Less risk of exposing half-built features or architectural decisions that will change.
- **C: Go public at store launch (Phase 6)** -- Maximum polish. The "finished product" narrative is strongest. But misses beta testing contributions and delays portfolio visibility.

**Recommendation:** Option B (at beta). Phase 5 is the sweet spot: the codebase is tested (Phase 3), polished (Phase 4), and stable enough for contributors to build on without constant breaking changes. Going public now exposes a codebase with zero backend tests and inconsistent native directories -- not the first impression you want for a portfolio project. Going public at launch misses the opportunity for beta testers to become contributors. Write CONTRIBUTING.md and issue templates during Phase 3 so they are ready when the repo goes public.

**DECISION: Option C (at store launch).** Keep as personal project until polished and stable. Open source when the time feels right, post-launch.

**Blocks:** CONTRIBUTING.md authoring timeline; issue template design; security audit scope; `.env.example` completeness.

---

## Decision Tracking

| # | Question | Decision | Decided By | Date |
|---|----------|----------|------------|------|
| Q1 | E2E Framework | **Deferred** — leaning Detox, evaluate both (macOS available) | Founder | 2026-06-16 |
| Q2 | Android Native Strategy | **Option A: CNG** — config plugins for widget/watch | Founder | 2026-06-16 |
| Q3 | Widget Strategy | **Option A: Phase 4 priority** — pioneer widgets, research iOS 27 | Founder | 2026-06-16 |
| Q4 | History Logging Scope | **Full PRD + iterative milestones** — MVP first, full vision documented | Founder | 2026-06-16 |
| Q5 | Backend Test Database | **Option A: Docker PostgreSQL everywhere** | Founder | 2026-06-16 |
| Q6 | Coverage Thresholds | **Option B: 70% backend / 50% mobile** (excl. screens) | Founder | 2026-06-16 |
| Q7 | EAS Updates Timing | **Option A: Phase 3 (now)** | Founder | 2026-06-16 |
| Q8 | Apple Watch | **Option A: Phase 4 priority** — macOS + Watch + iPhone available | Founder | 2026-06-16 |
| Q9 | Premium Features | **Option B: Feature-flag for later** | Founder | 2026-06-16 |
| Q10 | Open Source Timeline | **Option C: At store launch** — personal project until polished | Founder | 2026-06-16 |
