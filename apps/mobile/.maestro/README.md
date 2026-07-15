# DYDYD E2E Tests (Maestro)

End-to-end tests for the DYDYD mobile app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

### Install Maestro CLI

**Prerequisite:** Java 17+ must be installed and on your PATH.

**Windows:**

Option A — Download the zip from [maestro.mobile.dev](https://maestro.mobile.dev/), extract to
`C:\Users\<you>\maestro`, and add `maestro\bin` to your system PATH.

Option B — Install via WSL:
```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

**macOS:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Maestro Studio Desktop** (optional, for interactive test authoring):
Download the native installer from [maestro.mobile.dev](https://maestro.mobile.dev/) — available for both Windows (`.exe`) and macOS.

Verify installation:
```bash
maestro --version
```

### Build the App

E2E tests run against a built app binary (APK or IPA), not the Metro bundler. You need a development build from EAS Build:

```bash
# From apps/mobile/
eas build --profile development --platform android   # Android APK
eas build --profile development --platform ios        # iOS simulator build
```

After the build completes, download and install the APK/app on your emulator or simulator.

### Start an Emulator/Simulator

**Android (Windows or macOS):**
```bash
# List available AVDs
emulator -list-avds

# Start an AVD
emulator -avd <avd-name>
```

**iOS (macOS only):**
```bash
# List available simulators
xcrun simctl list devices available

# Boot a simulator
xcrun simctl boot "iPhone 15 Pro"
```

## Running Tests

### Run all E2E tests

```bash
# From apps/mobile/
maestro test .maestro/
```

### Run a single test

```bash
maestro test .maestro/01-app-launch.yaml
```

### Run with Maestro Studio (interactive mode)

```bash
maestro studio
```

This opens a visual interface where you can inspect the app's view hierarchy, build selectors, and run commands interactively. Very useful for authoring new tests.

## Test Inventory

| Flow | File | Description | Auth Required |
|---|---|---|---|
| App Launch | `01-app-launch.yaml` | Verifies app launches to Welcome screen | No |
| Registration | `02-auth-register.yaml` | Fills out registration form and submits | No |
| Tab Navigation | `03-tab-navigation.yaml` | Navigates through all 4 main tabs | Yes |

## Platform-Specific Notes

### Windows (Android only)
- Maestro runs on Windows via zip download + PATH (or WSL)
- Requires Java 17+ installed and on PATH
- Only Android emulator/device testing is supported
- Install Android SDK and set `ANDROID_HOME` environment variable
- Ensure `adb` is in your PATH

### macOS (Android + iOS)
- Both platforms supported
- iOS requires Xcode and a booted simulator
- Android requires Android SDK and a running emulator

## Writing New Tests

1. Use `maestro studio` to inspect the app and find selectors
2. Prefer text-based selectors (visible labels, placeholders) over resource IDs
3. Use `scrollUntilVisible` for elements below the fold
4. Add comments explaining prerequisites (auth state, test data)
5. Name files with numeric prefix for execution order: `04-feature-name.yaml`

## Troubleshooting

**"No devices found"**: Ensure an emulator/simulator is running and detected by `adb devices` (Android) or `xcrun simctl list` (iOS).

**"App not installed"**: Build and install a development client first. Maestro cannot install apps — it drives already-installed apps.

**"Element not found"**: Use `maestro studio` to inspect the current view hierarchy. Text selectors are case-sensitive. Animated elements may need a `- waitForAnimationToEnd` step before assertion.
