# ADR-005: Widget-First Philosophy

**Status:** Accepted
**Date:** 2026-06-16
**Deciders:** Founder (Edmund Trinh)

## Context

An iOS home screen widget existed in Swift (small/medium/large sizes, quest list, XP progress) but was not connected to the React Native app -- no App Group data sharing was wired up. The Android Glance widget was deleted during a package rename. Widgets were listed in Phase 2 of the roadmap but were never completed due to prioritization behind store-ready features (Sentry, offline sync, push notifications).

The initial recommendation was to defer widgets post-launch (ship v1.0 without them, add in v1.1). The founder rejected this, viewing widgets not as polish but as the core product thesis.

This corresponded to **Q3 (Widget Strategy)** and was further reinforced in the **Phase 4A resequencing** (see ADR-010).

## Decision

Treat home screen widgets and Apple Watch as **core product features** -- not deferred polish. Specifically:

1. **Phase 4A priority.** Widgets pulled forward from Phase 5 to Phase 4A, ahead of quality gates (E2E tests, coverage thresholds, integration tests).
2. **Interactive widgets.** Medium widget enables completing quests without opening the app. This is the "replace the homescreen" vision.
3. **Full size range.** Small (streak + XP ring), medium (top 3 quests with check buttons), large (full daily dashboard with progress rings).
4. **StandBy Mode.** Full-screen widget display while charging -- nightstand dashboard for morning and evening routines.
5. **Live Activities.** Real-time progress during active quest timers (focus sessions).
6. **iOS 27 research.** Expected late 2026, may expand widget capabilities. Investigate Apple developer docs for new APIs.

## Consequences

### What becomes easier

- **Re-engagement without app launch.** Users interact with DYDYD from the home screen, reducing friction to zero. Industry data shows apps with interactive widgets see 12-18% lifts in re-engagement.
- **"Replace the homescreen" narrative.** The large widget with progress rings, streak, and next quest makes the case that DYDYD is a homescreen experience, not just another app in a folder. This is the marketing story and the product thesis.
- **Daily habit reinforcement.** Seeing quest status on every home screen glance creates ambient awareness of daily goals, reinforcing the habit loop without requiring deliberate app opens.
- **Apple Watch synergy.** Treating the Watch companion as a core feature (ADR-005 + Q8 decision) creates a complete ecosystem: phone homescreen + wrist + charging nightstand.

### What becomes harder

- **Native code complexity.** iOS widgets use WidgetKit (Swift), Android widgets use Jetpack Glance (Kotlin). Both require native code injected via Expo config plugins (per ADR-003: CNG). This is significantly more complex than pure JavaScript features.
- **App Group data sharing.** iOS widgets read data via shared UserDefaults through App Groups. Wiring this from React Native through the native bridge requires careful data serialization and synchronization logic.
- **Cross-platform parity.** iOS and Android widget APIs are fundamentally different. Achieving feature parity requires maintaining two separate native implementations with a shared data contract.
- **Timeline pressure.** Pulling widgets forward to Phase 4A means building native features before the quality gate infrastructure (E2E tests, integration tests) is in place. Widget bugs are harder to catch without automated testing.
- **Expo ecosystem maturity.** `expo-widgets` is experimental. If it does not support the required widget families or interaction patterns, the project may need to write custom config plugins or fall back to bare native code.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Phase 4A priority (chosen)** | Core product thesis, highest differentiator, founder conviction, re-engagement lift | Native complexity, App Group wiring, no quality gates yet, cross-platform parity effort |
| **react-native-widget-extension** | Cross-platform widget library, simpler maintenance | Less native feel, limited widget families, fewer interaction options, dependency on third-party library |
| **Defer post-launch (v1.1)** | Ship faster, validate core app first, use user feedback to guide widget design | Misses the core product thesis, launches as "just another habit app," loses the differentiator |
| **Android-only first** | Jetpack Glance is more JS-friendly, no App Group complexity | Misses iOS (primary user base for habit apps), widget experience is inconsistent, splits effort |
