# DYDYD Manual Test Plan

Comprehensive manual test plan for hands-on validation of the DYDYD mobile app, iOS widgets, and Apple Watch companion.

**Testing environments:**
- **Android:** Android Emulator on Windows 11 (Pixel 7, API 34)
- **iOS:** Physical iPhone + Xcode Simulator on MacBook Pro M2 Max
- **Apple Watch:** Physical Apple Watch paired to iPhone
- **Backend:** Local dev server on Windows or Mac

**Last updated:** 2026-07-07

---

## 1. Setup Prerequisites

### 1.1 Software Requirements

| Tool | Purpose | Platform |
|------|---------|----------|
| Node.js >= 18 | Runtime | Both |
| Yarn 4 | Package manager | Both |
| PostgreSQL 15+ | Backend database | Both (Docker recommended) |
| Android Studio | Android emulator (AVD Manager) | Windows |
| Xcode 15+ | iOS Simulator + Watch Simulator | macOS only |
| Expo CLI | Dev build / Metro bundler | Both |
| EAS CLI | Cloud builds | Both |

### 1.2 Android Emulator Setup (Windows)

1. Open Android Studio > **Tools > Device Manager**.
2. Create Virtual Device: **Pixel 7, API 34, Google Play**.
3. Start emulator and verify via `adb devices`.
4. Confirm internet access (open Chrome in emulator).

### 1.3 iOS Simulator Setup (macOS)

1. Install Xcode 15+ from the Mac App Store.
2. Open Xcode > **Settings > Platforms** > download latest iOS runtime.
3. Open Simulator.app and create a device: **iPhone 15 Pro, iOS 17+**.
4. For Watch testing: create an **Apple Watch Series 9, watchOS 10+** paired device.

### 1.4 Physical Device Setup (iOS)

1. Build a development client: `eas build --profile development --platform ios`
2. Install via Expo Go or direct install from EAS.
3. Pair Apple Watch to iPhone via the Watch app.
4. Enable Developer Mode on both iPhone and Apple Watch (Settings > Privacy & Security > Developer Mode).

### 1.5 Environment Configuration

```bash
# 1. Install dependencies
yarn install

# 2. Start PostgreSQL via Docker
docker run --name dydyd-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# 3. Create apps/backend/.env
#    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dydyd?schema=public"
#    JWT_SECRET="test-jwt-secret-change-in-prod"
#    JWT_REFRESH_SECRET="test-jwt-refresh-secret-change-in-prod"

# 4. Build shared package
yarn shared build

# 5. Run database migrations and seed
yarn workspace @dydyd/backend db:migrate
yarn workspace @dydyd/backend db:generate
yarn workspace @dydyd/backend db:seed
```

### 1.6 Starting the App

**Terminal 1 -- Backend:**
```bash
yarn start:backend
# Verify: http://localhost:3000/health returns { "status": "ok" }
```

**Terminal 2 -- Metro Bundler:**
```bash
yarn start:mobile
# Press 'a' for Android Emulator, 'i' for iOS Simulator
```

### 1.7 Test Accounts

After seeding, use seeded accounts or register a new one in TC-001. For tests requiring a second account or premium status, register additional accounts.

---

## 2. Main App Test Scenarios

### 2.1 Registration and Login

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-001 | Auth | Register new account - happy path | 1. Tap "Create Account" on WelcomeScreen 2. Enter name: `Test Adventurer` 3. Enter email: `testuser@example.com` 4. Enter password: `StrongPass1!` 5. Confirm password 6. Tap "Create Account" | Registration succeeds, navigates to onboarding (CategoryPriorityScreen). Loading spinner shown during request. | Not Tested | Both |
| TC-002 | Auth | Register with already-used email | 1. Navigate to RegisterScreen 2. Enter same email from TC-001 3. Tap "Create Account" | Server error "Email already in use" shown. User stays on RegisterScreen. | Not Tested | Both |
| TC-003 | Auth | Login - happy path | 1. Tap "Log In" on WelcomeScreen 2. Enter email + password 3. Tap "Log In" | Login succeeds. HomeScreen loads (or onboarding resumes). Loading indicator shown. | Not Tested | Both |
| TC-004 | Auth | Login with wrong password | 1. Go to LoginScreen 2. Enter correct email 3. Enter wrong password 4. Tap "Log In" | Error "Invalid credentials" shown. User stays on LoginScreen. Password field not cleared. | Not Tested | Both |
| TC-005 | Auth | Forgot password flow | 1. Tap "Forgot Password?" on LoginScreen 2. Enter email 3. Tap "Reset Password" | Success confirmation shown (UI-only; no email sent). | Not Tested | Both |
| TC-006 | Auth | Registration field validation | 1. Leave all fields empty, tap Create Account 2. Enter 1-char name 3. Enter email without @ 4. Enter password < 8 chars 5. Mismatch confirm password | All validation errors shown simultaneously. Individual errors match: "Name must be at least 2 characters", "Enter a valid email", "Password must be at least 8 characters", "Passwords do not match" | Not Tested | Both |

### 2.2 Onboarding Flow

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-007 | Onboarding | Complete full onboarding flow | 1. On CategoryPriorityScreen, select 3 categories 2. Tap Continue 3. Select starter quests 4. Tap Continue 5. Allow/skip health permissions 6. Allow/skip notification permissions 7. Tap finish on OnboardingCompleteScreen | Each screen transitions with slide-from-right animation. After final screen, HomeScreen loads with selected quests. | Not Tested | Both |
| TC-008 | Onboarding | Back navigation through onboarding | 1. Progress to HealthPermissionsScreen 2. Press back 3. Verify return to SelectQuestsScreen 4. Press back to CategoryPriorityScreen | Back navigation works. Previously entered data preserved. | Not Tested | Both |
| TC-009 | Onboarding | Zero categories selected | On CategoryPriorityScreen, tap Continue with no categories selected | Continue is disabled or validation error shown. | Not Tested | Both |
| TC-010 | Onboarding | Category reordering | On CategoryPriorityScreen, long-press and drag a category to reorder | Priority list reorders. Order preserved through remaining onboarding steps. | Not Tested | Both |

### 2.3 Home Screen

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-011 | Home | Initial load with active quests | Open app or navigate to Home tab | Shows: greeting with user name + date, level badge, progress ring, stat cards (Today's XP, completed count), today's active quests sorted by priority | Not Tested | Both |
| TC-012 | Home | No active quests state | Deactivate all quests, navigate to HomeScreen | Empty state shown. Stats show 0 XP, 0/0 completion. Progress ring at 0%. | Not Tested | Both |
| TC-013 | Home | Pull-to-refresh | Pull down on HomeScreen | RefreshControl indicator appears, data reloads from backend. | Not Tested | Both |

### 2.4 Quest Completion

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-014 | Quests | Complete a quest - happy path | Tap incomplete quest card on HomeScreen | Card animates (spring scale), QuestCompletionOverlay shows XP earned, quest shows checkmark, daily XP increments, completion count increments, progress ring updates. | Not Tested | Both |
| TC-015 | Quests | Level up on completion | Complete quest that pushes XP past next level threshold | QuestCompletionOverlay appears, then LevelUpOverlay (~2.2s delay) shows new level. Level badge updates. | Not Tested | Both |
| TC-016 | Quests | Tap already-completed quest | Tap a quest already completed today | Quest is disabled, does not respond to taps. | Not Tested | Both |
| TC-017 | Quests | Complete all daily quests | Complete every active daily quest | Progress ring shows 100%. All quest cards show completed state. | Not Tested | Both |
| TC-018 | Quests | Badge earned on completion | Complete a quest that triggers a badge (e.g., "First Steps") | Badge check runs after completion. Navigate to BadgesScreen to verify badge is earned. | Not Tested | Both |

### 2.5 Quest Library, Search, and Filtering

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-019 | Quests | Browse quest library | Navigate to Quests tab, scroll through list | QuestsScreen loads with filter tabs (All, Active, categories). Each card shows name, category icon, status. | Not Tested | Both |
| TC-020 | Quests | Search quests by name | Type partial name in search field (e.g., "walk") | List filters in real-time (case-insensitive). Non-matching quests disappear. | Not Tested | Both |
| TC-021 | Quests | Filter by category | Tap "Physical Health" filter tab, then "All" to reset, then "Active" | Each filter correctly narrows displayed quests. | Not Tested | Both |
| TC-022 | Quests | Activate quest from library | Tap inactive quest > QuestDetailScreen > Tap "Activate" | Quest appears under "Active" filter and on HomeScreen. | Not Tested | Both |
| TC-023 | Quests | View quest detail | Tap any quest card | Detail screen shows: name, category with icon/color, frequency, XP reward, description, completion status, action button. | Not Tested | Both |
| TC-024 | Quests | Search with no matches | Type a nonexistent term in search | Empty list shown (ideally with empty-state message). | Not Tested | Both |

### 2.6 Custom Quest Creation

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-025 | Custom Quest | Create custom quest - happy path | 1. Navigate to QuestsScreen 2. Tap "+" to open AddQuestScreen 3. Enter name: `Evening Stretches` 4. Select category: Physical Health 5. Select frequency: Daily 6. Tap Create | Success toast: `"Evening Stretches" has been added to your quests.` Navigates back. New quest appears in library. | Not Tested | Both |
| TC-026 | Custom Quest | Validation errors | 1. Leave name empty, tap Create 2. Enter name but no category, tap Create | Alerts: "Quest needs a name" / "Choose a category" | Not Tested | Both |
| TC-027 | Custom Quest | Hit free tier limit (5 custom quests) | Create 6th custom quest | Error toast indicating limit reached. Quest not created. | Not Tested | Both |
| TC-028 | Custom Quest | Frequency selection | Toggle between Daily/Weekly/Monthly | Only one selected at a time. Visual feedback on selected option. | Not Tested | Both |

### 2.7 Badge Earning and Display

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-029 | Badges | View badges screen | Navigate to Progress tab > Badges | Badges grouped by rarity (Legendary, Epic, Rare, Common). Shows earned/locked state. Header shows earned count / total. | Not Tested | Both |
| TC-030 | Badges | Earn a badge | Complete action that meets badge requirement | BadgeEarnedModal may appear. Badge shows as earned on BadgesScreen. | Not Tested | Both |
| TC-031 | Badges | Zero badges earned | Fresh account, navigate to BadgesScreen | All badges show as locked/greyed out. | Not Tested | Both |

### 2.8 Progress and Streaks

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-032 | Progress | View progress screen | Navigate to Progress tab | Shows: XP bar with level, stat cards, weekly XP chart (Mon-Sun), category breakdown. Loading indicator during fetch. | Not Tested | Both |
| TC-033 | Progress | Streak calendar | Navigate to ProgressScreen, scroll to StreakCalendar | Completion days highlighted. Current streak count matches consecutive days. Today visually distinct. | Not Tested | Both |
| TC-034 | Progress | Category breakdown accuracy | Complete quests across 2+ categories, navigate to Progress | Each category shows correct completion count with icon/color. | Not Tested | Both |
| TC-035 | Progress | Weekly XP chart | Earn XP on at least 1 day this week | Bars show relative XP per day. Today's bar reflects today's completions. Zero-XP days show empty bars. | Not Tested | Both |
| TC-036 | Progress | Fresh account progress | New account, navigate to Progress | All stats show 0. Charts render correctly with no data. | Not Tested | Both |

### 2.9 Theme Switching

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-037 | Theme | Switch to dark mode | Settings > toggle Dark Mode ON | Entire app switches to dark theme. All screens render correctly. | Not Tested | Both |
| TC-038 | Theme | Switch to light mode | Settings > toggle Dark Mode OFF | All screens render with light backgrounds, dark text. | Not Tested | Both |
| TC-039 | Theme | Theme persists across restart | Set theme, force-close app, reopen | Theme preference persisted via Redux Persist / AsyncStorage. | Not Tested | Both |
| TC-040 | Theme | Known issue: system theme toggle | Set Android/iOS to light system appearance, check Dark Mode toggle | **KNOWN BUG (BUG-001):** Toggle shows ON when theme is 'system' regardless of OS appearance. `isDarkMode = theme === 'dark' \|\| theme === 'system'` conflates the two. | Not Tested | Both |

### 2.10 Settings and Profile

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-041 | Profile | View profile screen | Navigate to Profile tab | Shows: display name, level with title, XP progress bar, total XP, premium status, badge count, quest count, category distribution. Pull-to-refresh works. | Not Tested | Both |
| TC-042 | Settings | Navigate settings subsections | Tap Notifications, go back. Tap Health Integrations, go back. | Each row navigates to corresponding screen. Back navigation works. | Not Tested | Both |
| TC-043 | Settings | Notification settings | Toggle Daily Reminder ON/OFF. Observe Streak at Risk toggle. | Toggles dispatch updateSettings to Redux. Reminder Time shows static "9:00 AM" (picker not wired). | Not Tested | Both |
| TC-044 | Settings | Health integrations screen (Android) | Settings > Health Integrations on Android | Shows Google Fit, Garmin, Samsung Health. Apple Health/Watch NOT shown. Connect buttons are UI-only. | Not Tested | Android |
| TC-045 | Settings | Health integrations screen (iOS) | Settings > Health Integrations on iOS | Shows Apple Health, Apple Watch, Garmin. Google Fit/Samsung NOT shown. Connect buttons are UI-only. | Not Tested | iOS |
| TC-046 | Settings | Haptic feedback toggle | Toggle OFF, complete quest, toggle ON, complete quest | On physical device: haptics absent when OFF, present when ON. On emulator: verify toggle state persists. | Not Tested | Both |

### 2.11 Account Management

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-047 | Account | Logout | Navigate to Settings or Profile > Tap "Log Out" | Auth state cleared, navigates to WelcomeScreen. Back button cannot return to authenticated screens. **NOTE:** If no logout button is visible, see BUG-002. PR #66 adds this. | Not Tested | Both |
| TC-048 | Account | Delete account | Settings > Tap "Delete Account" > Confirm > Enter password | Confirmation prompt shown. After confirming + password, account deleted, user returned to WelcomeScreen. **NOTE:** If button does nothing, see BUG-003. PR #66 wires this. | Not Tested | Both |
| TC-049 | Account | Login after deletion | Try logging in with deleted account credentials | Login fails: "Invalid credentials" or "Account not found". | Not Tested | Both |
| TC-050 | Account | Re-register after deletion | Register with previously deleted email | Registration succeeds (email is available again). | Not Tested | Both |

### 2.12 Offline Mode

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-051 | Offline | Complete quest while offline | 1. Enable airplane mode 2. Complete a quest | Quest completion queued locally via OfflineQueue. UI may show optimistic completion or error toast. | Not Tested | Both |
| TC-052 | Offline | Sync after returning online | 1. Complete quest(s) offline 2. Disable airplane mode 3. Pull-to-refresh | OfflineQueue flushes. Completions sync to backend. XP/stats update. No duplicate completions. | Not Tested | Both |
| TC-053 | Offline | Queue persistence across restart | 1. Complete quest offline 2. Force-close app 3. Reopen with network | Queue persisted to AsyncStorage. Flushes on reopen. | Not Tested | Both |
| TC-054 | Offline | Backend down retry | 1. Stop backend 2. Complete quest (request fails, enqueued) 3. Start backend 4. Wait or pull-to-refresh | Queue flushes when backend available. Actions failing 3+ times (MAX_RETRIES) are dropped. | Not Tested | Both |

### 2.13 Notifications

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-055 | Notifications | Push notification receipt | Enable notifications, trigger a notification (e.g., streak at risk) | Push notification appears in system tray. Tapping opens app to relevant screen. | Not Tested | Both |
| TC-056 | Notifications | Notification list | Navigate to notifications list (if UI exists) | Shows list of received notifications with timestamps. Mark as read on tap. | Not Tested | Both |
| TC-057 | Notifications | Notification permissions denied | Deny notification permissions during onboarding | App functions normally without notifications. Settings shows notifications disabled. | Not Tested | Both |

### 2.14 Toast Notifications

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-058 | Toast | Success toast on quest creation | Create a valid custom quest | Success toast: "Quest created!" with quest name. Auto-dismisses. | Not Tested | Both |
| TC-059 | Toast | Error toast on failed action | Create quest with backend unreachable | Error toast: "Failed to create quest". AddQuestScreen remains active. | Not Tested | Both |

### 2.15 Error Handling

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-060 | Error | Network timeout on login | Stop backend, attempt login | Error message shown. Login button re-enabled. Loading spinner stops. No crash. | Not Tested | Both |
| TC-061 | Error | Expired token handling | Login, wait 15+ minutes (or advance clock), perform API action | App attempts token refresh. If refresh succeeds: seamless. If both tokens expired: logout to WelcomeScreen. | Not Tested | Both |
| TC-062 | Error | Empty/invalid input submission | Submit forms with whitespace-only, special characters, excessively long input | Validation catches edge cases. No crashes. Error messages are user-friendly. | Not Tested | Both |

### 2.16 Miscellaneous UI

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-063 | UI | Pull-to-refresh on all main screens | Pull down on Home, Quests, Progress, Profile | Screens with RefreshControl show indicator and reload. Others just scroll. | Not Tested | Both |
| TC-064 | UI | Keyboard handling | On Login/Register, tap input to show keyboard | KeyboardAvoidingView adjusts so inputs + submit button stay visible. Submit works while keyboard is shown. | Not Tested | Both |
| TC-065 | UI | Animation smoothness | Navigate between tabs, complete quest, observe overlays | All animations smooth (Reanimated spring, FadeIn). No frame drops or layout jumps. | Not Tested | Both |
| TC-066 | UI | Tab navigation | Tap each bottom tab rapidly | Correct screens load. No duplicate navigation events. Active tab highlighted. | Not Tested | Both |

---

## 3. iOS-Specific Test Cases

These test cases specifically target iOS behavior and should be run on the MacBook Pro with iPhone/Simulator.

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-100 | iOS | Swipe-back gesture navigation | On any detail screen (QuestDetail, Settings sub-screens), swipe from left edge | Screen dismisses with slide-back animation. Consistent with iOS navigation patterns. | Not Tested | iOS |
| TC-101 | iOS | Safe area / notch handling | Open app on iPhone with Dynamic Island (iPhone 15 Pro) | Content does not overlap with Dynamic Island or home indicator. Safe area insets respected on all screens. | Not Tested | iOS |
| TC-102 | iOS | KeyboardAvoidingView behavior | On Login/RegisterScreen, tap input to show keyboard | With `behavior="padding"`, input fields shift up properly. No content cut off. | Not Tested | iOS |
| TC-103 | iOS | Apple HealthKit permission prompt | During onboarding or from Health Integrations, tap connect Apple Health | iOS Health permission dialog appears. Selecting specific data types works. After granting, health data syncs. | Not Tested | iOS |
| TC-104 | iOS | App backgrounding and resume | 1. Open app 2. Press home button 3. Reopen app | App resumes from last state. No data loss. Auth tokens still valid. | Not Tested | iOS |
| TC-105 | iOS | Force quit and reopen | 1. Open app 2. Swipe up from app switcher 3. Reopen | App loads to HomeScreen (if logged in). Persisted state restored (theme, quests, auth). | Not Tested | iOS |
| TC-106 | iOS | Orientation lock | Rotate device to landscape | App stays in portrait mode (React Native default). No layout issues. | Not Tested | iOS |
| TC-107 | iOS | iOS 17 text rendering | Review all screens for text clipping or truncation | All text renders correctly with iOS 17 system fonts. Custom typography (if configured) loads properly. | Not Tested | iOS |

---

## 4. Android-Specific Test Cases

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-150 | Android | Hardware back button | On detail screens, press back button | Navigates back correctly. On HomeScreen, either exits app or shows confirmation. | Not Tested | Android |
| TC-151 | Android | Material You theming | On Android 12+, check if app respects system dynamic colors | App uses its own theme colors (not system). Verify no conflicts with Material You. | Not Tested | Android |
| TC-152 | Android | Google Fit permission | From Health Integrations, tap Connect on Google Fit | Google Fit permission flow initiates (requires Google Fit installed on device). | Not Tested | Android |
| TC-153 | Android | Split screen / multi-window | Open app, enter split-screen mode | App handles resize gracefully. No crashes or layout issues. | Not Tested | Android |
| TC-154 | Android | App killed by system | Open app, open many other apps to trigger memory pressure, return | App state restored from persisted storage. Seamless resume. | Not Tested | Android |

---

## 5. iOS Widget Test Cases (Phase 4A - Not Yet Implemented)

These test cases are for the interactive iOS home screen widgets. They will become testable once Phase 4A widget implementation is complete.

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-200 | Widget-Small | Streak count display | 1. Add small DYDYD widget to home screen 2. Verify streak count matches app | Small widget shows current streak number with flame icon. Updates when streak changes. | Not Implemented | iOS |
| TC-201 | Widget-Small | XP progress ring | Observe the progress ring on small widget | Ring fills based on daily XP progress (0-100%). Color matches category theme. | Not Implemented | iOS |
| TC-202 | Widget-Small | Tap to open app | Tap the small widget | App opens to HomeScreen. | Not Implemented | iOS |
| TC-203 | Widget-Medium | Top 3 quests display | Add medium DYDYD widget to home screen | Shows top 3 uncompleted daily quests with names and category icons. | Not Implemented | iOS |
| TC-204 | Widget-Medium | Interactive check buttons | Tap the check button on a quest in the medium widget | Quest marked as complete WITHOUT opening the app. Widget refreshes to show next uncompleted quest. XP updates. | Not Implemented | iOS |
| TC-205 | Widget-Medium | All quests completed state | Complete all daily quests, check medium widget | Widget shows congratulatory message or completion summary instead of quest list. | Not Implemented | iOS |
| TC-206 | Widget-Large | Full daily dashboard | Add large DYDYD widget to home screen | Shows: progress rings for each category, streak count, daily XP, completed/total quests, top uncompleted quests with check buttons. | Not Implemented | iOS |
| TC-207 | Widget-Large | Category progress rings | Observe category rings on large widget | Each ring corresponds to a quest category. Fill percentage matches completions in that category for today. | Not Implemented | iOS |
| TC-208 | Widget | Data refresh timing | Complete a quest in the app, check widget | Widget updates within 15 minutes (WidgetKit timeline refresh). Force refresh via app should update immediately. | Not Implemented | iOS |
| TC-209 | Widget | Data accuracy after app restart | Force-quit app, check widget data | Widget continues showing correct data via App Groups shared container (independent of app process). | Not Implemented | iOS |
| TC-210 | Widget | Multiple widget sizes simultaneously | Add small, medium, and large widgets | All three display correctly with no data conflicts. Completing via medium widget updates all three. | Not Implemented | iOS |
| TC-211 | Widget | Dark mode appearance | Toggle device dark mode with widgets on home screen | Widgets adapt to system dark/light mode. Text remains readable. Colors adjust appropriately. | Not Implemented | iOS |
| TC-212 | Widget | StandBy Mode display | Place iPhone on charger in landscape orientation (iOS 17+ StandBy) | DYDYD widget renders in full-screen StandBy format. Progress rings and streak count are large and readable. | Not Implemented | iOS |
| TC-213 | Widget | Lock Screen widget | Add DYDYD widget to lock screen (iOS 16+) | Compact widget shows streak count or daily progress. Tapping opens app. | Not Implemented | iOS |
| TC-214 | Widget | Live Activity - quest timer | Start a timed quest (e.g., "Meditate for 10 min") | Live Activity appears on lock screen and Dynamic Island showing timer countdown. Auto-dismisses when complete. | Not Implemented | iOS |
| TC-215 | Widget | Live Activity - daily progress | Check Dynamic Island throughout the day | Compact view shows progress fraction (e.g., "3/7"). Expanded view shows progress bar. Updates on completion. | Not Implemented | iOS |
| TC-216 | Widget | Widget when not logged in | Log out of app, check widget | Widget shows a "Log in to see your quests" message or placeholder state. | Not Implemented | iOS |
| TC-217 | Widget | Widget after fresh install | Install app, add widget before logging in | Widget shows onboarding or login prompt. | Not Implemented | iOS |

---

## 6. Apple Watch Test Cases (Phase 4A - Not Yet Implemented)

These test cases are for the Apple Watch companion app. They will become testable once Phase 4A Watch implementation is complete.

### 6.1 Complications

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-300 | Watch-Complication | Streak count complication | Add DYDYD streak complication to watch face | Shows current streak number. Updates when streak changes. | Not Implemented | Watch |
| TC-301 | Watch-Complication | Progress ring complication | Add DYDYD progress complication to watch face | Shows circular progress ring with daily completion percentage. Ring fills as quests are completed. | Not Implemented | Watch |
| TC-302 | Watch-Complication | Tap complication to open | Tap the DYDYD complication on watch face | Opens the DYDYD Watch app to the main view. | Not Implemented | Watch |
| TC-303 | Watch-Complication | Complication data freshness | Complete a quest on phone, check watch complication | Complication updates within reasonable time (1-5 min via WatchConnectivity or background refresh). | Not Implemented | Watch |

### 6.2 Watch App

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-310 | Watch-App | Main view - daily quests | Open DYDYD app on Watch | Shows today's uncompleted quests as a scrollable list with category icons. Progress summary at top. | Not Implemented | Watch |
| TC-311 | Watch-App | Quick-complete a habit | Tap a quest in the Watch app list | Quest marked as complete. Haptic confirmation (success tap). Quest moves to completed section or disappears from list. | Not Implemented | Watch |
| TC-312 | Watch-App | All quests completed | Complete all daily quests | Watch app shows congratulatory message with XP earned today and streak count. | Not Implemented | Watch |
| TC-313 | Watch-App | Quest completion syncs to phone | Complete quest on Watch, open phone app | Phone app reflects the completion. XP, progress, and streak updated. No duplicates. | Not Implemented | Watch |
| TC-314 | Watch-App | Phone completion syncs to Watch | Complete quest on phone, check Watch app | Watch app list updates to show quest as completed. | Not Implemented | Watch |

### 6.3 Haptic Reminders

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-320 | Watch-Haptic | Daily reminder haptic | Set daily reminder time, wait for it to trigger | Watch delivers haptic tap at the scheduled time with a notification showing uncompleted quests. | Not Implemented | Watch |
| TC-321 | Watch-Haptic | Streak at risk haptic | Have uncompleted quests near end of day | Watch delivers stronger haptic alert warning that streak is at risk. | Not Implemented | Watch |
| TC-322 | Watch-Haptic | Haptics disabled | Disable haptic feedback in phone app Settings | Watch respects the setting. No haptic reminders delivered. | Not Implemented | Watch |

### 6.4 Health Auto-Logging

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-330 | Watch-Health | Steps auto-logging | Walk and accumulate steps tracked by Apple Watch | Step-based quests (e.g., "Walk 10,000 steps") auto-complete when threshold reached. HealthKit data synced via Watch. | Not Implemented | Watch |
| TC-331 | Watch-Health | Workout auto-logging | Start and finish a workout on Apple Watch | Workout-related quests auto-complete. Duration and type logged from HealthKit. | Not Implemented | Watch |
| TC-332 | Watch-Health | Sleep tracking | Wear Watch overnight with sleep tracking enabled | Sleep-related quests reflect tracked sleep data. Duration matches HealthKit records. | Not Implemented | Watch |
| TC-333 | Watch-Health | HealthKit permission denied | Deny HealthKit permissions for Watch | Watch app functions without health data. Manual quest completion still works. Health-based quests show "Connect Health" prompt. | Not Implemented | Watch |

### 6.5 Standalone Operation

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-340 | Watch-Standalone | Without iPhone nearby | Leave iPhone at home, use Watch | Watch app opens and shows cached quest list. Can complete quests. Changes sync when iPhone is in range again. | Not Implemented | Watch |
| TC-341 | Watch-Standalone | Offline Watch + WiFi | Connect Watch to WiFi without iPhone | Watch can sync directly to backend via WiFi (if implemented). Quest data updates. | Not Implemented | Watch |
| TC-342 | Watch-Standalone | Sync after reconnecting | Complete quests on Watch while disconnected, then reconnect to iPhone | All completions sync. No duplicates. XP and progress accurate. | Not Implemented | Watch |

---

## 7. Android Widget Test Cases (Phase 4A - Not Yet Implemented)

| ID | Category | Test Case | Steps | Expected Result | Status | Platform |
|----|----------|-----------|-------|-----------------|--------|----------|
| TC-400 | Android-Widget | Streak widget | Add DYDYD streak widget to home screen | Shows streak count with flame icon. Updates on completion. | Not Implemented | Android |
| TC-401 | Android-Widget | Quest list widget | Add DYDYD quest list widget to home screen | Shows today's top quests. Tap to open app to that quest. | Not Implemented | Android |
| TC-402 | Android-Widget | Material You colors | Check widget with different wallpaper colors | Widget adapts to system dynamic colors (Material You, Android 12+). | Not Implemented | Android |
| TC-403 | Android-Widget | Widget resizing | Long-press widget, drag resize handles | Widget adjusts content layout based on size. Small = streak only, large = quest list. | Not Implemented | Android |
| TC-404 | Android-Widget | Dark mode | Toggle system dark mode | Widget adapts to dark/light mode. | Not Implemented | Android |

---

## 8. Known Bugs

| Bug ID | Severity | Description | File | Status |
|--------|----------|-------------|------|--------|
| BUG-001 | Low | Dark Mode toggle conflates `'dark'` and `'system'` themes. When system is light, toggle incorrectly shows ON. | `SettingsScreen.tsx:18` | Open |
| BUG-002 | High | No logout button in any UI screen. Redux thunk and API endpoint exist but no UI entry point. | `ProfileScreen.tsx`, `SettingsScreen.tsx` | Open (PR #66 pending) |
| BUG-003 | Medium | Delete Account button has no `onPress` handler. Redux thunk and API service exist but UI button is not wired. | `SettingsScreen.tsx:71-74` | Open (PR #66 pending) |

---

## 9. Platform-Specific Notes

### 9.1 Android Emulator

**Recommended:** Pixel 7, API 34, 4096 MB RAM, hardware acceleration enabled.

**Limitations:**
- Haptic feedback cannot be felt on emulator (verify toggle state only)
- Google Fit requires Google account + Google Fit installed
- Push notifications may require FCM configuration

**Useful ADB commands:**
```bash
adb devices                                    # List devices
adb shell am force-stop com.dydyd.app          # Force-stop app
adb shell pm clear com.dydyd.app               # Clear app data
adb exec-out screencap -p > screenshot.png     # Screenshot
adb shell settings put global airplane_mode_on 1  # Airplane mode ON
adb shell settings put global airplane_mode_on 0  # Airplane mode OFF
```

### 9.2 iOS Simulator (macOS)

**Limitations:**
- No HealthKit (use physical device for TC-103, TC-330-333)
- No push notifications (local notifications work)
- No haptic feedback
- No Apple Watch pairing (use physical devices for Watch tests)

### 9.3 Physical iOS Device

**Required for:**
- HealthKit integration (TC-103)
- Apple Watch testing (all TC-3xx)
- Push notifications (TC-055)
- Haptic feedback (TC-046)
- StandBy Mode (TC-212)
- Live Activities (TC-214, TC-215)
- Real-world widget testing (TC-200 through TC-217)

### 9.4 Features With Incomplete Backend Wiring

| Feature | Screen | Status |
|---------|--------|--------|
| Forgot Password | ForgotPasswordScreen | UI-only; uses setTimeout to simulate. No email sent. |
| Health Connect/Disconnect | HealthIntegrationsScreen | Connect buttons have no onPress handler. |
| Reminder Time picker | NotificationsScreen | Shows "9:00 AM" static. Picker not wired. |
| Export Data | SettingsScreen | Row present but not wired. |
| Delete Account (UI) | SettingsScreen | Button visible but no onPress. PR #66 pending. |
| Logout (UI) | No screen | No button exists. PR #66 pending. |

---

## 10. Test Execution Checklist

### Phase 3 Testing (Current - Main App)
- [ ] **Windows (Android Emulator):** Run TC-001 through TC-066 on Android emulator
- [ ] **Windows (Backend):** Verify all backend endpoints respond correctly
- [ ] **macOS (iOS Simulator):** Run TC-001 through TC-066 on iOS Simulator
- [ ] **macOS (iPhone):** Run TC-100 through TC-107 on physical iPhone
- [ ] **macOS (Android):** Run TC-150 through TC-154 on Android emulator if available

### Phase 4A Testing (Planned - Widgets & Watch)
- [ ] **iPhone:** Run TC-200 through TC-217 (iOS Widgets)
- [ ] **Apple Watch:** Run TC-300 through TC-342 (Watch Companion)
- [ ] **Android Emulator:** Run TC-400 through TC-404 (Android Widgets)

### Test Summary Template

| Section | Total | Pass | Fail | Not Tested | Not Implemented |
|---------|-------|------|------|------------|-----------------|
| Auth (TC-001–006) | 6 | | | 6 | |
| Onboarding (TC-007–010) | 4 | | | 4 | |
| Home (TC-011–013) | 3 | | | 3 | |
| Quest Completion (TC-014–018) | 5 | | | 5 | |
| Quest Library (TC-019–024) | 6 | | | 6 | |
| Custom Quest (TC-025–028) | 4 | | | 4 | |
| Badges (TC-029–031) | 3 | | | 3 | |
| Progress (TC-032–036) | 5 | | | 5 | |
| Theme (TC-037–040) | 4 | | | 4 | |
| Settings (TC-041–046) | 6 | | | 6 | |
| Account (TC-047–050) | 4 | | | 4 | |
| Offline (TC-051–054) | 4 | | | 4 | |
| Notifications (TC-055–057) | 3 | | | 3 | |
| Toast (TC-058–059) | 2 | | | 2 | |
| Error Handling (TC-060–062) | 3 | | | 3 | |
| Misc UI (TC-063–066) | 4 | | | 4 | |
| iOS-Specific (TC-100–107) | 8 | | | 8 | |
| Android-Specific (TC-150–154) | 5 | | | 5 | |
| iOS Widgets (TC-200–217) | 18 | | | | 18 |
| Watch Complications (TC-300–303) | 4 | | | | 4 |
| Watch App (TC-310–314) | 5 | | | | 5 |
| Watch Haptics (TC-320–322) | 3 | | | | 3 |
| Watch Health (TC-330–333) | 4 | | | | 4 |
| Watch Standalone (TC-340–342) | 3 | | | | 3 |
| Android Widgets (TC-400–404) | 5 | | | | 5 |
| **TOTAL** | **131** | | | **83** | **48** |
