# Decision: E2E Testing Framework — Maestro over Detox

**Status**: Accepted  
**Date**: 2026-07-15  
**Issue**: #61  

## Context

DYDYD needs end-to-end testing for its React Native mobile app (19 screens across auth, home, quests, progress, and profile flows). The app runs on Expo 50 managed workflow (Expo 53 upgrade pending in PR #94) with config plugins for iOS widgets and Apple Watch — meaning it requires custom dev client builds, not Expo Go.

Primary development happens on Windows 11 (Android), with a MacBook Pro M2 Max as secondary (iOS). CI runs on GitHub Actions.

## Decision

**Maestro** is the chosen E2E framework for DYDYD.

## Comparison

| Criterion | Maestro | Detox |
|---|---|---|
| **Expo managed workflow** | Build-agnostic — drives any installed APK/IPA via accessibility layer. No changes to `app.json` or build config. Works with EAS Build output directly. | No official Expo support. Requires `expo prebuild` to generate native projects. Community-maintained integration is poorly documented and fragile across Expo SDK versions. |
| **Windows development** | Windows support via zip download + PATH or WSL curl install. Runs Android tests on emulator/device. Requires Java 17+. Maestro Studio Desktop has a native `.exe` installer. | Supports Android on Windows, but setup is more complex (native build toolchain, Gradle hooks). iOS is macOS-only for both frameworks. |
| **CI integration** | GitHub Actions: use `mobile-dev-inc/action-maestro-cloud` for cloud execution, or run locally on macOS runners with Android emulator. | Requires macOS runners with Xcode for iOS. Android CI is possible on Ubuntu but needs emulator setup and longer build times. |
| **Cross-platform** | iOS + Android. Same YAML flows run on both platforms. Platform-specific selectors supported via `runFlow` conditions. | iOS + Android. Same TypeScript tests target both, but platform-specific build configs needed. |
| **Test authoring** | YAML-based: low barrier, readable, but less expressive for complex assertions. No TypeScript compilation step. | TypeScript/JavaScript: full programmatic control, matches codebase language, better for complex test logic. |
| **Reliability** | Accessibility-layer driven (no gray-box). Teams report 99%+ reliability (Todoist case study). Built-in retry and wait mechanisms. | Gray-box architecture syncs with app internals. Historically more flaky on Android. Requires careful synchronization config. |
| **Community** | 10,800+ GitHub stars. Active development by mobile.dev. Growing adoption. | 11,000+ GitHub stars. Maintained by Wix. Mature but Expo integration is stagnant. |
| **Version coupling** | Version-agnostic — tests drive the built app, not the build system. Works identically on Expo 50 and 53 with no changes. | Tightly coupled to RN/build config. Major Expo upgrades often break Detox integration and require config updates. |
| **Cost** | CLI and Maestro Studio Desktop are free. Maestro Cloud (parallel remote execution) is paid — pricing requires contacting sales. Self-hosted local execution is free. | Fully open source. CI cost is runner time only (macOS runners are ~10x more expensive than Linux on GitHub Actions). |
| **Setup complexity** | CLI install (zip/curl) + Java 17 + YAML flows. No native build modifications. ~15 min to first test. | npm install + native build config + Jest config + Detox build config. Typically 1-2 hours to first test. |

## Rationale

1. **Expo compatibility is the primary discriminator.** Detox has no official Expo support and requires prebuild/bare workflow, which conflicts with our EAS Build cloud-only approach. Maestro is build-agnostic and works with any APK/IPA output from EAS Build.

2. **Version-agnostic testing.** With PR #94 upgrading from Expo 50 to 53, Maestro flows require zero changes since they drive the built app via accessibility, not the build system. Detox would need revalidation and likely config changes.

3. **Windows-first development.** Maestro runs natively on Windows for Android testing. While Detox also supports Android on Windows, the setup burden is significantly higher and the Expo integration issues compound.

4. **Simplicity over expressiveness.** YAML tests are less powerful than TypeScript, but our E2E tests are smoke tests and critical path validations — not complex programmatic assertions. The simplicity of YAML reduces maintenance burden and makes tests accessible to non-TypeScript contributors.

5. **No interference with existing test infrastructure.** Maestro YAML flows are completely separate from Jest. No additional Jest config, no TypeScript compilation, no risk of `yarn test:all` regressions.

## Trade-offs Accepted

- **Less expressive assertions**: YAML cannot express complex conditional logic. If we need sophisticated E2E assertions in the future, we may need to supplement with Detox for specific scenarios.
- **Cloud execution costs**: Maestro Cloud is paid for parallel remote execution. We mitigate this by running tests locally in CI on macOS runners with Android emulator for now.
- **No gray-box testing**: Maestro cannot directly inspect Redux state or make assertions about internal app state. Our unit tests (Jest + @testing-library/react-native) cover that layer.

## Consequences

- Maestro CLI installed as a system tool (zip download on Windows, `curl` on macOS — not a package.json dependency). Requires Java 17+.
- E2E flows stored in `apps/mobile/.maestro/`
- Separate GitHub Actions workflow (`e2e.yml`) runs on push to main only
- Developers run E2E tests locally after building a dev client via EAS Build
