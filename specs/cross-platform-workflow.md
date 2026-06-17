# Cross-Platform Development Workflow

> How to develop on Windows 11 and test iOS/Watch on macOS seamlessly.
>
> **Last updated**: 2026-06-17

---

## Environment Summary

| Machine | OS | Role | Tools |
|---------|-----|------|-------|
| Primary | Windows 11 | Android, backend, shared, main development | Android Studio, Docker, VS Code, Claude Code |
| Secondary | MacBook Pro M2 Max | iOS, Watch, native testing | Xcode, Expo Go, Apple Watch, iPhone, Claude Code |

---

## Day-to-Day Workflow

### 1. Develop on Windows (default)

All backend, shared package, Android, and cross-platform React Native work happens here.

```powershell
# Start development
yarn start:backend
yarn start:mobile    # Metro bundler — test on Android emulator

# Run tests
yarn test:all
yarn lint:all
```

### 2. When iOS/Watch Testing Is Needed

#### On Windows — prepare the handoff

```powershell
# Create or switch to an ios-testing branch
git checkout -b ios/<feature>-testing

# Commit all work
git add -A
git commit -m "feat: <description> — ready for iOS testing"
git push -u origin ios/<feature>-testing
```

Create or update the handoff file:

```powershell
# Update the handoff note (see template below)
# This file tells Claude on macOS what to test
```

#### On macOS — pick up and test

```bash
# Pull the branch
git fetch origin
git checkout ios/<feature>-testing
git pull

# Install dependencies
yarn install

# Generate native projects (CNG)
cd apps/mobile
npx expo prebuild --clean

# Run on iOS Simulator
npx expo run:ios

# Run on physical iPhone (with Expo Go or dev client)
npx expo start

# For Apple Watch testing
# Open apps/mobile/ios/*.xcworkspace in Xcode
# Select the Watch target, build and run on paired Watch simulator
```

#### Test, fix, push back

```bash
# If fixes are needed on macOS
git add <files>
git commit -m "fix: iOS-specific fix for <issue>"
git push

# When testing is complete
# Update handoff file with results
```

#### On Windows — merge

```powershell
git checkout main
git merge ios/<feature>-testing
git push
git branch -d ios/<feature>-testing
git push origin --delete ios/<feature>-testing
```

---

## Handoff File

Keep `specs/ios-test-handoff.md` updated when handing off between machines. This file is checked into git so Claude on either machine can read it for context.

### Template

```markdown
# iOS Test Handoff

## Current Branch
ios/<feature>-testing

## What Changed
- <list of changes to test>

## What to Test
- [ ] <test case 1>
- [ ] <test case 2>
- [ ] <specific screen or flow>

## Known Issues
- <any known issues on iOS>

## Environment Notes
- <any special setup needed — env vars, DB state, etc.>

## Results (filled in on macOS)
- [ ] All tests passing
- [ ] Visual QA on iPhone
- [ ] Watch app tested (if applicable)
- Notes: <any findings>
```

---

## Branch Naming Convention

| Purpose | Pattern | Example |
|---------|---------|---------|
| iOS feature testing | `ios/<feature>-testing` | `ios/watch-bridge-testing` |
| iOS bug fix | `ios/fix-<issue>` | `ios/fix-widget-layout` |
| Watch-specific work | `ios/watch-<feature>` | `ios/watch-connectivity` |
| Cross-platform release validation | `ios/release-<version>` | `ios/release-v0.5.0` |

---

## What Stays on Each Machine

### Windows Only
- Android emulator configuration
- Docker containers (PostgreSQL for backend tests)
- Backend development server

### macOS Only
- Xcode project files (generated via `expo prebuild`, gitignored)
- iOS Simulator state
- Apple Watch pairing
- Provisioning profiles and signing certificates

### Shared via Git
- All TypeScript/JavaScript source code
- Expo config (`app.json`, `eas.json`)
- Config plugins (widget, watch app injection)
- Test files and test plans
- Handoff file (`specs/ios-test-handoff.md`)

---

## CI/CD Notes

- GitHub Actions CI runs on Ubuntu — handles linting, type-checking, and unit tests
- EAS Build runs in the cloud — handles iOS and Android builds regardless of dev machine
- iOS builds via EAS do NOT require macOS locally (cloud builds use Apple silicon)
- Use `eas build --profile development --platform ios` from either machine

---

## Tips

- **Keep commits atomic**: Don't batch Windows + macOS fixes in one commit. Commit on the machine where the fix was made.
- **Expo prebuild is ephemeral**: Never commit `ios/` or `android/` directories. They are regenerated on each machine via `npx expo prebuild`.
- **Use Claude for continuity**: Claude on macOS can read this workflow doc and the handoff file to pick up exactly where Windows left off. Start the macOS session with: "Read specs/ios-test-handoff.md and continue testing."
- **Sync yarn.lock**: Always run `yarn install` after pulling on either machine to ensure lockfile consistency.
