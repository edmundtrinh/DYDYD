# Expo 50 to 53 / React Native 0.73 to 0.79 Upgrade

**Date:** 2026-07-07
**Status:** Package versions updated; install and runtime validation pending

This document tracks the complete upgrade from Expo SDK 50 (React Native 0.73, React 18.2)
to Expo SDK 53 (React Native 0.79.6, React 19.0.0).

---

## Version Changes

### Core Platform

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `expo` | ~50.0.0 | ~53.0.0 | Three major SDK bumps (50 -> 51 -> 52 -> 53) |
| `react` | 18.2.0 | 19.0.0 | Major version; breaking changes (see below) |
| `react-native` | 0.73.0 | 0.79.6 | Six minor versions; includes New Arch default |

### Navigation (v6 -> v7)

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `@react-navigation/native` | ^6.1.0 | ^7.3.8 | Major version; API changes (see below) |
| `@react-navigation/native-stack` | ^6.9.0 | ^7.17.10 | Requires react-native-screens >= 4.0.0 |
| `@react-navigation/bottom-tabs` | ^6.5.0 | ^7.18.8 | Tab options renamed (see below) |

### Native Modules (Expo-pinned versions from bundledNativeModules.json)

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `react-native-gesture-handler` | ^2.14.0 | ~2.24.0 | Minor bump within v2 |
| `react-native-reanimated` | ^3.6.0 | ~3.17.4 | Minor bump within v3 |
| `react-native-screens` | ^3.29.0 | ~4.11.1 | **Major version**; breaking API changes |
| `react-native-safe-area-context` | ^4.8.0 | 5.4.0 | **Major version**; API changes |
| `react-native-svg` | ^14.1.0 | 15.11.2 | **Major version** |
| `@react-native-async-storage/async-storage` | ^1.21.0 | 2.1.2 | **Major version**; API mostly compatible |
| `@react-native-community/netinfo` | ^11.2.0 | 11.4.1 | Minor bump |

### State Management

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `@reduxjs/toolkit` | ^2.0.0 | ^2.12.0 | Minor bump; React 19 peer dep added in 2.5.0+ |
| `react-redux` | ^9.0.0 | ^9.3.0 | Minor bump; React 19 peer dep support |
| `redux` | ^5.0.1 | ^5.0.1 | No change needed |
| `redux-persist` | ^6.0.0 | ^6.0.0 | No change; maintenance declining but functional |

### Health and Wearables

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `react-native-health` | ^1.17.0 | ^1.19.0 | Minor bump; peer dep is RN >= 0.67.3 |
| `react-native-watch-connectivity` | ^1.1.0 | ^2.0.0 | **Major version**; API changes possible |
| `react-native-google-fit` | ^0.21.0 | ^0.21.0 | **HIGH RISK**: Google Fit API deprecated |
| `react-native-haptic-feedback` | ^2.2.0 | ^2.2.0 | No change needed |

### Dev Dependencies

| Package | Old | New | Notes |
|---------|-----|-----|-------|
| `@react-native/babel-preset` | ^0.73.0 | ^0.79.0 | Matched to RN version |
| `@react-native/eslint-config` | ^0.73.0 | ^0.79.0 | Matched to RN version |
| `@react-native/metro-config` | ^0.73.0 | ^0.79.0 | Matched to RN version |
| `@react-native/typescript-config` | ^0.73.0 | ^0.79.0 | Matched to RN version |
| `@babel/core` | ^7.23.0 | ^7.26.0 | Bumped for compatibility |
| `@babel/preset-env` | ^7.23.0 | ^7.26.0 | Bumped for compatibility |
| `@babel/runtime` | ^7.23.0 | ^7.26.0 | Bumped for compatibility |
| `@types/react` | ^18.2.0 | ^19.0.0 | **Major**; matches React 19 |
| `react-test-renderer` | 18.2.0 | 19.0.0 | Deprecated but still ships; pinned to React version |
| `@testing-library/react-native` | ^12.4.3 | ^13.3.0 | Supports React 19 + RN >= 0.71; v14 requires Node 22.13+ |
| `@testing-library/jest-native` | ^5.4.3 | **REMOVED** | Deprecated; matchers built into @testing-library/react-native |
| `jest-expo` | (not present) | ~53.0.14 | **ADDED**; Expo's recommended Jest preset |
| `typescript` | ^5.3.0 | ~5.8.3 | Bumped to Expo 53 recommended version |

### Config File Changes

| File | Change |
|------|--------|
| `babel.config.js` | Switched from `module:@react-native/babel-preset` to `babel-preset-expo` |
| `tsconfig.json` | Changed `extends` from `@react-native/typescript-config/tsconfig.json` to `expo/tsconfig.base` |
| `metro.config.js` | **NEW FILE**: Expo 53 metro config with monorepo watchFolders |
| `jest.config.js` | Changed preset from `react-native` to `jest-expo`; added `expo-modules-core` to transform allowlist |
| `app.json` | Added `"newArchEnabled": false` and `"deploymentTarget": "16.0"` under `expo.ios` |
| `eas.json` | Bumped CLI version requirement from `>= 7.0.0` to `>= 16.0.0` |

---

## Breaking Changes Requiring Code Updates

### 1. React Navigation v6 -> v7

**Impact: All navigator and screen files**

Key API changes:
- `navigate()` no longer backtracks if a screen already exists in the stack; use `popTo()` instead
- `tabBarTestID` renamed to `tabBarButtonTestID`
- `sceneContainerStyle` renamed to `sceneStyle`
- `unmountOnBlur` removed; use `popToTopOnBlur`
- `customAnimationOnGesture` renamed to `animationMatchesGesture`
- Group-level `screenOptions` may behave differently

Files affected:
- `src/navigation/RootNavigator.tsx` - stack navigator creation API
- `src/navigation/MainTabNavigator.tsx` - tab navigator options
- `src/navigation/AuthNavigator.tsx` - stack navigator creation API
- `src/navigation/OnboardingNavigator.tsx` - stack navigator creation API

### 2. React 18 -> React 19

**Impact: Components using deprecated patterns**

Key changes:
- `forwardRef` is no longer needed; `ref` is a regular prop
- `defaultProps` on function components is deprecated; use JS defaults instead
- `propTypes` runtime checking removed
- `Context.Provider` can be simplified to just `Context` (optional)
- `useRef()` requires an argument (even if `null`)
- `react-test-renderer` is deprecated (still works but shows console warnings)
- Stricter hydration error reporting

Files to audit:
- All component files for `forwardRef` usage (likely none given codebase patterns)
- All files for `useRef()` calls without arguments
- `src/theme/ThemeProvider.tsx` - `createContext` usage (compatible, no change needed)

### 3. react-native-screens v3 -> v4

**Impact: Navigation behavior**

- Custom screen transitions may have API changes
- `enableScreens()` call pattern may differ
- Screen container component APIs updated

### 4. react-native-safe-area-context v4 -> v5

**Impact: Layout components**

- `SafeAreaView` component may have changed props
- `useSafeAreaInsets()` hook should be stable
- Edge behavior configuration may differ

### 5. @react-native-async-storage/async-storage v1 -> v2

**Impact: Storage layer**

- API is largely backwards-compatible
- TypeScript types may have changed
- Import path unchanged

### 6. react-native-watch-connectivity v1 -> v2

**Impact: Apple Watch integration**

Files affected:
- `src/services/wearables/watchConnectivityService.ts`
- `src/hooks/useWatchConnectivity.ts`
- `jest.setup.js` - mock may need updating

### 7. @testing-library/react-native v12 -> v13

**Impact: All test files**

- v13 is chosen over v14 because v14 requires Node.js >= 22.13 (our CI uses Node 20)
- Built-in matchers replace `@testing-library/jest-native` (already removed from deps)
- When Node 22.13+ is adopted project-wide, upgrade to v14 for async query defaults

Files affected:
- All `__tests__/*.test.tsx` files (if any import patterns changed between v12 and v13)
- No `@testing-library/jest-native` imports found in codebase (safe removal confirmed)

### 8. Jest Setup File (jest.setup.js)

Two mocks that commonly break on RN 0.79:
- `react-native/Libraries/Animated/NativeAnimatedHelper` - path may have changed
- `react-native-reanimated/mock` - mock module approach deprecated in Reanimated v3.17+;
  use `jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))` or
  the new `react-native-reanimated/jestUtils` approach

---

## High-Risk Items

### react-native-google-fit
Google Fit API has been deprecated by Google in favor of Health Connect.
The `react-native-google-fit` package (v0.21.0) is a maintenance risk:
- May not build against RN 0.79's Android Gradle configuration
- Consider migrating to `react-native-health-connect` in a follow-up PR

### react-native-health
The package (v1.19.0) declares `react-native >= 0.67.3` as a peer dependency.
It uses the old bridge-based native module architecture (not TurboModules/Fabric).
With `newArchEnabled: false` in app.json, it should continue to work.
Enabling New Architecture later will require verifying interop layer support or
finding a Fabric-compatible alternative.

### react-native-vector-icons
The package (v10.3.0) is marked as deprecated on npm. The library is migrating to
per-icon-family packages (`@react-native-vector-icons/*`). Current usage should still
work, but plan to migrate to either:
- The new per-icon-family packages, OR
- `@expo/vector-icons` (^14.1.0, bundled with Expo)

### New Architecture (deferred)
SDK 53 defaults `newArchEnabled: true`. We have explicitly set it to `false`
to decouple the SDK upgrade from the New Architecture migration. This is because:
- `react-native-health` uses old bridge-based modules
- `react-native-google-fit` uses old bridge-based modules
- `react-native-watch-connectivity` compatibility unverified

A separate PR should enable New Architecture after verifying all native modules.
Note: SDK 55+ will remove the opt-out, so this must be addressed before that upgrade.

---

## Files Requiring Manual Attention After Install

### Must Change (will not compile or run without changes)
1. None expected from the version bump alone, but verify after `yarn install`
2. `jest.config.js` has a hand-written `transformIgnorePatterns` that overrides `jest-expo`'s
   default. If tests fail on module transforms, try removing the override entirely

### Should Audit (may need changes depending on usage patterns)
1. `src/navigation/RootNavigator.tsx` - React Navigation v7 API
2. `src/navigation/MainTabNavigator.tsx` - Tab navigator option renames
3. `src/navigation/AuthNavigator.tsx` - Stack navigator API
4. `src/navigation/OnboardingNavigator.tsx` - Stack navigator API
5. `src/hooks/useWatchConnectivity.ts` - v2 API changes
6. `src/services/wearables/watchConnectivityService.ts` - v2 API changes
7. `jest.setup.js` - Reanimated mock and NativeAnimatedHelper mock paths
8. All `__tests__/*.test.tsx` files - @testing-library/react-native v14 API changes

### Risk Monitoring (may break at build time on macOS)
1. `react-native-health` - native module build with RN 0.79
2. `react-native-google-fit` - native module build with RN 0.79
3. `react-native-watch-connectivity` - v2 API and native build

---

## Post-Install Testing Checklist

### Prerequisites
- [ ] Verify Node.js >= 20 is installed (Expo 53 requirement; Node 18 is EOL)
- [ ] Note: if upgrading to Node 22.13+, consider bumping `@testing-library/react-native` to v14

### Immediate (on macOS after `yarn install`)
- [ ] Run `npx expo-doctor` to check for version mismatches
- [ ] Run `npx expo install --check` to validate all Expo-compatible versions
- [ ] Run `yarn workspace @dydyd/mobile test` and fix any failing tests
- [ ] Run TypeScript check: `npx tsc --noEmit` in `apps/mobile/`
- [ ] Run linter: `yarn workspace @dydyd/mobile lint`

### iOS Build Verification
- [ ] Run `npx expo prebuild --platform ios` (clean prebuild)
- [ ] Open in Xcode, verify deployment target is 16.0
- [ ] Build for iOS Simulator (iPhone 14+)
- [ ] Verify HealthKit entitlements still present
- [ ] Test HealthKit data reading
- [ ] Test Apple Watch connectivity

### Android Build Verification
- [ ] Run `npx expo prebuild --platform android`
- [ ] Build Android APK
- [ ] Verify Google Fit integration (may fail - see High Risk section)
- [ ] Test on Android emulator

### Runtime Smoke Tests
- [ ] App launches without crash
- [ ] Auth flow (login/register) works
- [ ] Navigation between all tabs works
- [ ] Quest list loads and scrolls
- [ ] Quest completion animation plays
- [ ] Haptic feedback triggers
- [ ] Push notification permissions prompt
- [ ] AsyncStorage persistence (kill and reopen app, state preserved)
- [ ] Network status detection
- [ ] Dark mode / light mode switching

### EAS Build Verification
- [ ] `eas build --profile development --platform ios` succeeds
- [ ] `eas build --profile development --platform android` succeeds

---

## Decision Record

### Why skip intermediate SDK versions (50 -> 53 directly)?

Expo's upgrade tool (`npx expo install expo@latest`) handles multi-version jumps.
The intermediate SDKs (51, 52) are EOL and stepping through them one-by-one provides
no benefit for a project that has not yet shipped. The breaking changes are cumulative
regardless of whether you step through each version.

### Why opt out of New Architecture?

Three of our native module dependencies (react-native-health, react-native-google-fit,
react-native-watch-connectivity) use the old bridge-based module system. Enabling New
Architecture requires either:
1. Verifying each module works with the interop layer, or
2. Finding Fabric/TurboModule-compatible replacements

This is a separate concern from the SDK version upgrade and should be its own PR
with dedicated testing on physical devices.

### Why upgrade React Navigation to v7?

React Navigation v7's `@react-navigation/native-stack` requires
`react-native-screens >= 4.0.0`. Expo 53 pins `react-native-screens ~4.11.1`.
While v6's peer dependency (`>= 3.0.0`) technically accepts v4, the major version
bump in screens means v6 was never tested against it. Upgrading to v7 ensures
we use a tested, supported combination.
