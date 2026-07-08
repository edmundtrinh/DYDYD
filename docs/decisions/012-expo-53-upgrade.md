# ADR-012: Upgrade to Expo 53, React Native 0.79, React 19

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Founder (Edmund Trinh)

## Context

The mobile app was on Expo SDK 50, React Native 0.73, and React 18. This stack was falling behind the ecosystem in several ways:

1. **Expo SDK 50 end-of-life approaching.** Expo drops active support for SDKs older than the current minus two. SDK 50 was losing access to the latest Expo modules, build tooling improvements, and security patches.
2. **React Native New Architecture.** RN 0.79 makes the New Architecture (TurboModules, Fabric renderer) the default. Staying on 0.73 meant accumulating distance from the ecosystem's direction, making a future upgrade harder with each release.
3. **React Navigation v7.** The app used React Navigation v6, which is incompatible with react-native-screens v4 (required by newer RN versions). Upgrading RN required upgrading React Navigation.
4. **iOS deployment target.** The app's minimum iOS target needed to be 16.0 to support iPhone 13+ and Apple Watch Series 4+ -- both required for the Phase 4A widget and Watch companion app features.
5. **React 19 features.** React 19 introduces `use()`, improved Suspense, and the foundation for server components -- features that benefit the app's data loading patterns even without server-side rendering.

## Decision

Upgrade the full mobile stack in a single coordinated jump:

1. **Expo SDK 50 to 53** -- skip SDK 51 and 52 to avoid two intermediate migration cycles. Expo's upgrade guides cover direct jumps.
2. **React 18 to 19** -- adopt React 19's new hooks and concurrent features.
3. **React Native 0.73 to 0.79.6** -- the latest stable release at time of upgrade.
4. **React Navigation v6 to v7** -- required by react-native-screens v4, which is required by RN 0.79.
5. **Explicitly disable New Architecture** -- bridge-based native modules (health integrations, widget bridge) have not been verified against TurboModules. The New Architecture is disabled via `newArchEnabled: false` in app config until native modules are validated.
6. **Set iOS deployment target to 16.0** -- aligns with Apple Watch Series 4+ and iPhone 13+ support requirements for widgets and Watch companion.

## Consequences

### What becomes easier

- **Expo module access.** SDK 53 provides access to the latest versions of expo-notifications, expo-file-system, expo-secure-store, and other modules the app depends on. Bug fixes and performance improvements in these modules are immediately available.
- **Build tooling.** EAS Build improvements in SDK 53 include faster build times, better caching, and improved error messages. The CNG workflow (ADR-003) benefits from updated config plugin APIs.
- **React 19 patterns.** The `use()` hook simplifies data loading in components. Improved Suspense boundaries reduce boilerplate for loading states. These patterns benefit the quest list, progress charts, and badge screens.
- **Future-proofing.** Being on the current SDK means the next upgrade (SDK 54 or 55) is a single-version jump rather than a multi-version catch-up. Incremental upgrades are lower risk.
- **React Navigation v7 features.** Type-safe navigation with `StaticParamList`, improved deep linking, and better TypeScript inference across navigators.

### What becomes harder

- **New Architecture deadline.** Expo SDK 55 is expected to remove the opt-out for New Architecture. Disabling it now buys time but creates a hard deadline: all native modules (health integrations, widget bridge, Watch bridge) must be verified or rewritten as TurboModules before SDK 55.
- **Google Fit deprecation.** Google deprecated the Google Fit API in favor of Health Connect. The existing Google Fit integration works but is on borrowed time. A Health Connect migration is now a known future task.
- **Health module bridge dependency.** The health data integration modules rely on bridge-based native modules. These work with New Architecture disabled but will need TurboModule wrappers when New Architecture is enabled.
- **react-native-vector-icons.** This package has declining maintenance and incomplete New Architecture support. A migration to a maintained icon solution (expo-symbols, custom SVG icons) is needed before enabling New Architecture.
- **Navigation API migration.** React Navigation v7 changes several APIs (screen options, navigation state, type definitions). Existing screen components required updates to their navigation prop types and option configurations.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Stay on Expo 50 / RN 0.73** | No migration work, known stable | Losing Expo support, growing ecosystem distance, no React 19, blocks widget/Watch iOS 16 target |
| **Incremental upgrade (50 to 51, then 52, then 53)** | Lower risk per step, easier to isolate breakage | Three migration cycles, three sets of dependency resolution, 3x the total effort |
| **Direct jump to Expo 53 (chosen)** | Single migration effort, immediately current, unlocks all downstream features | Higher risk in one step, must resolve all breaking changes at once, temporarily disables New Architecture |
