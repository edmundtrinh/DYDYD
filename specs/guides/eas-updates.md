# EAS Update — Over-the-Air Updates Guide

## Overview

EAS Update enables over-the-air (OTA) JavaScript and asset updates to DYDYD without going through the App Store or Google Play review process. This is ideal for beta hot-fixes, copy changes, and non-native bug fixes.

**Key constraint:** OTA updates can only change JavaScript code and assets (images, fonts). Any change that adds or modifies a native module (e.g., a new `expo-*` package with native code, changes to `ios/` or `android/` directories) requires a full EAS Build.

## How It Works

### Channels and Branches

Each EAS Build is assigned to a **channel** (configured in `eas.json`):

| Build Profile | Channel        | Purpose                                    |
|---------------|----------------|--------------------------------------------|
| development   | `development`  | Local dev client builds — rarely needs OTA |
| preview       | `preview`      | Beta testing builds for internal testers   |
| production    | `production`   | App Store / Google Play release builds     |

When you publish an update, you target a **branch**. Channels map to branches by default (channel "preview" receives updates from branch "preview").

### Runtime Version

The `runtimeVersion` in `app.json` uses the `appVersion` policy, meaning the runtime version is derived from the `version` field in `app.json`. OTA updates are only delivered to builds with a matching runtime version.

**Example:** If `version` is `1.0.0`, only builds created with that version will receive OTA updates published against runtime version `1.0.0`. When you bump to `1.1.0` and create new builds, old `1.0.0` builds stop receiving updates.

### Update Flow

1. App launches and calls `Updates.checkForUpdateAsync()`
2. EAS checks if a newer update exists for the build's channel + runtime version
3. If available, the update is downloaded in the background via `Updates.fetchUpdateAsync()`
4. The update is applied on the **next cold start** (no forced restart mid-session)
5. If offline or the check fails, the app continues with the current bundle

## Publishing an Update

### Prerequisites

- EAS CLI installed: `npm install -g eas-cli`
- Authenticated: `eas login`
- Project linked: `eas init` (this sets `extra.eas.projectId` in `app.json`)

### Step-by-Step

1. **Make your JS/asset changes** on the appropriate branch

2. **Publish to preview** (for beta testers):
   ```bash
   cd apps/mobile
   yarn eas:update:preview
   ```

3. **Publish with a message** (recommended for tracking):
   ```bash
   cd apps/mobile
   yarn eas:update:message "fix: resolve crash on quest completion screen"
   ```

4. **Publish to production** (after verifying on preview):
   ```bash
   cd apps/mobile
   yarn eas:update:production
   ```

5. **Verify the update** was published:
   ```bash
   eas update:list
   ```

### Promotion Workflow

For safe rollouts, always follow this order:

```
development -> preview -> production
```

1. Publish to `preview` branch first
2. Have beta testers verify the fix
3. If verified, publish the same code to `production` branch
4. Monitor crash reports / user feedback

## Rollback Procedure

If a bad update reaches users, you have two options:

### Option 1: Publish a Fix (Preferred)

1. Revert the problematic change in code
2. Publish a new update to the affected branch:
   ```bash
   eas update --branch production --message "revert: undo broken quest screen"
   ```
3. Users receive the fix on their next app launch

### Option 2: Republish a Known-Good Commit

1. Check out the last known-good commit:
   ```bash
   git checkout <good-commit-hash>
   ```
2. Publish from that commit:
   ```bash
   eas update --branch production --message "rollback: revert to v1.0.0-build-42"
   ```
3. Return to your working branch:
   ```bash
   git checkout -
   ```

### Option 3: Delete the Update (Emergency)

```bash
eas update:delete --group <update-group-id>
```

This removes the update from the CDN. Devices that already downloaded it keep it, but new devices will not receive it.

## When to Use OTA vs. Full Build

| Change Type                          | OTA Update | Full Build |
|--------------------------------------|:----------:|:----------:|
| Bug fix in JS/TS code               | Yes        | No         |
| Copy/text change                     | Yes        | No         |
| Style/layout change                  | Yes        | No         |
| Asset change (images, fonts)         | Yes        | No         |
| New screen (JS only)                 | Yes        | No         |
| New native module / Expo package     | No         | Yes        |
| iOS/Android config change            | No         | Yes        |
| app.json native config change        | No         | Yes        |
| Expo SDK upgrade                     | No         | Yes        |
| React Native version bump            | No         | Yes        |
| Change to `plugins` array            | No         | Yes        |

**Rule of thumb:** If `npx expo prebuild` would produce different native project files, you need a full build.

## Configuration Reference

### app.json

```json
{
  "expo": {
    "runtimeVersion": { "policy": "appVersion" },
    "updates": {
      "url": "https://u.expo.dev/<project-id>",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 5000
    },
    "extra": {
      "eas": {
        "projectId": "<project-id>"
      }
    }
  }
}
```

### eas.json

Each build profile includes a `channel`:

```json
{
  "build": {
    "development": { "channel": "development", ... },
    "preview": { "channel": "preview", ... },
    "production": { "channel": "production", ... }
  }
}
```

### Package Scripts

| Script                    | Command                                         |
|---------------------------|--------------------------------------------------|
| `eas:update:preview`      | `eas update --branch preview`                   |
| `eas:update:production`   | `eas update --branch production`                |
| `eas:update:message`      | `eas update --branch preview --message "<msg>"` |

## Setup Checklist (First Time)

- [ ] Run `eas init` to create the EAS project and set the project ID
- [ ] Replace `YOUR_EAS_PROJECT_ID` in `app.json` with the real project ID (both `updates.url` and `extra.eas.projectId`)
- [ ] Create an initial EAS Build for each channel (`eas build --profile preview`)
- [ ] Verify OTA works: make a small visible change, publish update, confirm it appears on device after restart

## Troubleshooting

**Update not appearing on device:**
- Ensure the build was created AFTER `expo-updates` was added (old builds lack the native module)
- Check that `runtimeVersion` matches between the build and the published update
- Kill and restart the app fully (swipe away from app switcher)
- Check network connectivity on the device

**"Updates.checkForUpdateAsync is not available":**
- This API is not available in Expo Go or development builds — only in EAS Build production/preview builds
- The `useOTAUpdates` hook guards against this with `__DEV__` and `Updates.isEnabled` checks

**Expo 53 upgrade note:**
- When PR #94 (Expo 53 upgrade) merges, re-run `npx expo install --fix` to align `expo-updates` version with the new SDK
- The app.json, eas.json, and hook code are forward-compatible and require no changes
