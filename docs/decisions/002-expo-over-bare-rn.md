# ADR-002: Expo + EAS Build Over Bare React Native

**Status:** Accepted
**Date:** 2026-05-28 (inception; formally recorded 2026-07-07)
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD is a React Native mobile app targeting both iOS and Android. The primary developer works on Windows 11 with a MacBook Pro M2 Max as secondary. Building native iOS apps traditionally requires macOS with Xcode, which would make iOS development impossible from the primary machine.

The project needs: cloud-based builds (iOS from Windows), push notifications, health data integrations, over-the-air updates, and eventually home screen widgets and an Apple Watch companion app.

## Decision

Use **Expo** as the React Native framework with **EAS Build** for cloud-based native builds. This means:

- Expo SDK and managed workflow for standard features (notifications, splash screen, app icons)
- EAS Build for cloud-compiled iOS and Android binaries from any OS
- Config plugins for native code injection where needed (health integrations, widgets)
- `expo prebuild` for generating native projects on demand (see ADR-003: CNG)

## Consequences

### What becomes easier

- **iOS builds from Windows.** EAS Build compiles iOS binaries in the cloud. The primary development machine (Windows 11) can produce iOS builds without macOS, removing the biggest development bottleneck.
- **Push notifications.** Expo Notifications provides a unified API across platforms with token management and credential handling built in. Implemented in Phase 2 with minimal native code.
- **Over-the-air updates.** EAS Updates enables pushing JavaScript-only fixes without App Store review (24-72 hour delay). Critical for beta testing and post-launch hotfixes.
- **Build profiles.** EAS supports development, preview, and production profiles in `eas.json`. Internal testers get APKs and IPAs directly; production builds go to stores.
- **Credential management.** Apple certificates, provisioning profiles, and Android keystores are managed by EAS, eliminating local keychain complexity.

### What becomes harder

- **Native module access.** Features requiring custom native code (HealthKit, Watch connectivity) need config plugins or `expo-modules`, adding a layer of indirection compared to direct Xcode/Gradle modification.
- **Build cost.** EAS Build has usage limits on the free tier. Production builds during active development can consume the monthly allocation, requiring a paid plan.
- **Expo SDK version coupling.** Upgrading the Expo SDK can be a significant effort, and the project must wait for Expo to support new React Native versions or OS features.
- **Debugging native code.** When native crashes occur in EAS-built binaries, debugging is harder than with a locally-compiled Xcode project. Sentry integration (Phase 2) mitigates this.
- **Widget and Watch complexity.** Home screen widgets (WidgetKit) and Apple Watch apps (WatchKit) push the boundaries of what Expo supports. These require config plugins that inject Swift code during prebuild -- the Expo ecosystem has experimental libraries (`expo-widgets`, `react-native-watch-connectivity`) but they are less mature than bare RN equivalents.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Expo + EAS Build (chosen)** | iOS builds from Windows, managed push notifications, OTA updates, credential management, config plugins for native access | Build cost, SDK version coupling, native debugging harder, widget/watch support experimental |
| **Bare React Native + manual builds** | Full native control, direct Xcode/Gradle access, no SDK version coupling | iOS builds require macOS, manual credential management, no built-in OTA, push notification setup is complex, CI requires self-hosted Mac runners |
| **Bare RN + Bitrise/App Center** | Full native control with cloud builds | Higher CI cost than EAS, no OTA updates, no managed notifications, App Center sunsetting |
| **Flutter** | Single codebase for iOS/Android/web, strong widget support, Dart is type-safe | Different language (Dart), smaller React ecosystem, health integrations less mature, team knowledge is in React/TypeScript |
| **Native (Swift + Kotlin)** | Best performance, first-class widget/watch support, no framework overhead | Two codebases, doubled development effort, no shared business logic, requires both macOS and Windows/Linux |
