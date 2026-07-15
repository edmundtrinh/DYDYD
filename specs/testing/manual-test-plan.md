# DYDYD Manual Test Plan

Manual test plan for hands-on validation of the DYDYD mobile app on Android Emulator.
All test cases default to **Android Emulator** unless noted otherwise.
See [Section 3: Platform-Specific Notes](#3-platform-specific-notes) for iOS constraints.

---

## 1. Setup Prerequisites

### 1.1 Software Requirements

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js >= 18 | Runtime | https://nodejs.org |
| Yarn 4 | Package manager | Included via `packageManager` field |
| PostgreSQL 15+ | Backend database | Docker (recommended) or native installer |
| Android Studio | Android emulator (AVD Manager) | https://developer.android.com/studio |
| Expo CLI | Dev build / Metro bundler | `npm install -g expo-cli` |
| EAS CLI | Cloud builds (optional, for APK) | `npm install -g eas-cli` |

### 1.2 Android Emulator Setup

1. Open Android Studio and go to **Tools > Device Manager**.
2. Create a new Virtual Device (recommended: **Pixel 7, API 34, Google Play**).
3. Start the emulator and verify it appears in `adb devices`.
4. Ensure the emulator has internet access (open Chrome inside the emulator and load any page).

### 1.3 Environment Configuration

From the repository root in PowerShell:

```powershell
# 1. Install dependencies
yarn install

# 2. Start PostgreSQL via Docker (recommended)
docker run --name dydyd-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# 3. Create the backend .env file
#    Create apps/backend/.env with the following contents:
#      DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dydyd?schema=public"
#      JWT_SECRET="test-jwt-secret-change-in-prod"
#      JWT_REFRESH_SECRET="test-jwt-refresh-secret-change-in-prod"
#    (No .env.example exists in the repo -- create the file manually with these three variables.)

# 4. Build the shared package (must complete before backend or mobile)
yarn shared build

# 5. Run database migrations and seed
yarn workspace @dydyd/backend db:migrate
yarn workspace @dydyd/backend db:generate
yarn workspace @dydyd/backend db:seed
```

### 1.4 Starting the App

Open **two** separate PowerShell terminals:

**Terminal 1 -- Backend:**
```powershell
yarn start:backend
# Verify: http://localhost:3000/health returns { "status": "ok" }
```

**Terminal 2 -- Metro Bundler:**
```powershell
yarn start:mobile
# When Metro is ready, press 'a' to launch on the Android Emulator
```

Wait for the JS bundle to finish loading. The WelcomeScreen should appear.

### 1.5 Test Accounts

After seeding the database, the following test data should be available (depends on seed script contents). If no seeded accounts exist, register a new account in TC-001.

For tests requiring a second account or premium status, register additional accounts as needed.

---

## 2. Test Scenarios

### 2.1 Registration and Login

---

### TC-001: Register a New Account -- Happy Path
**Platform:** Android Emulator
**Prerequisites:** App is on the WelcomeScreen. No existing account with the test email.
**Steps:**
1. Tap "Create Account" on the WelcomeScreen.
2. Enter display name: `Test Adventurer`.
3. Enter email: `testuser@example.com`.
4. Enter password: `StrongPass1!` (observe the password strength indicator changes as you type).
5. Enter confirm password: `StrongPass1!`.
6. Tap the "Create Account" button.
**Expected Result:** Registration succeeds. The app navigates to the Onboarding flow (CategoryPriorityScreen). A loading spinner appears briefly while the request is in flight.
**Edge Cases to Try:**
- Name with only 1 character (should show "Name must be at least 2 characters")
- Email without `@` (should show "Enter a valid email address")
- Password under 8 characters (should show "Password must be at least 8 characters")
- Mismatched confirm password (should show "Passwords do not match")
- Leave all fields empty and tap Create Account (all field errors should appear simultaneously)

---

### TC-002: Register With Already-Used Email
**Platform:** Android Emulator
**Prerequisites:** Account `testuser@example.com` already registered (from TC-001).
**Steps:**
1. Navigate to RegisterScreen.
2. Fill in a valid display name, the same email `testuser@example.com`, and a valid password + confirmation.
3. Tap "Create Account".
**Expected Result:** A server error message appears (e.g., "Email already in use" or similar). The user stays on the RegisterScreen.
**Edge Cases to Try:**
- Email with different casing (`TestUser@Example.com`) -- should still be caught as duplicate if backend normalizes

---

### TC-003: Login -- Happy Path
**Platform:** Android Emulator
**Prerequisites:** Account from TC-001 exists. User is on WelcomeScreen (logged out).
**Steps:**
1. Tap "Log In" on the WelcomeScreen.
2. Enter email: `testuser@example.com`.
3. Enter password: `StrongPass1!`.
4. Tap "Log In".
**Expected Result:** Login succeeds. If onboarding was completed, the HomeScreen loads. If not, the onboarding flow resumes. A loading indicator appears during the request.
**Edge Cases to Try:**
- Tap "Log In" with empty fields (both email and password errors shown)
- Enter a malformed email (inline validation fires before submit)

---

### TC-004: Login With Wrong Password
**Platform:** Android Emulator
**Prerequisites:** Account from TC-001 exists.
**Steps:**
1. Go to LoginScreen.
2. Enter correct email: `testuser@example.com`.
3. Enter wrong password: `WrongPass99`.
4. Tap "Log In".
**Expected Result:** An error message appears (e.g., "Invalid credentials"). The user stays on the LoginScreen. The password field is not cleared automatically.
**Edge Cases to Try:**
- Try 5+ consecutive wrong passwords to see if rate limiting takes effect (backend has 100 req/15min global limit)

---

### TC-005: Forgot Password Flow
**Platform:** Android Emulator
**Prerequisites:** On the LoginScreen.
**Steps:**
1. Tap "Forgot Password?" link on the LoginScreen.
2. Verify the ForgotPasswordScreen loads.
3. Enter email: `testuser@example.com`.
4. Tap "Reset Password".
5. Wait for the loading state to complete.
**Expected Result:** A success confirmation screen appears with a message about checking your email. Note: this flow is currently UI-only -- no email is actually sent (the backend endpoint is not yet wired).
**Edge Cases to Try:**
- Submit with empty email (should show "Email is required")
- Submit with invalid email format (should show "Enter a valid email address")
- Tap the back button to return to LoginScreen

---

### 2.2 Onboarding Flow

---

### TC-006: Complete Onboarding -- Full Flow
**Platform:** Android Emulator
**Prerequisites:** Freshly registered account that has not completed onboarding.
**Steps:**
1. On the CategoryPriorityScreen, tap 3 categories to select them (e.g., Physical Health, Mental Wellness, Career & Productivity). Observe they appear in a priority list.
2. Tap "Continue".
3. On the SelectQuestsScreen, browse and select several starter quests from the available options.
4. Tap "Continue".
5. On the HealthPermissionsScreen, read the permission description. Tap "Allow" or "Skip" as desired.
6. On the NotificationPermissionsScreen, read the description. Tap "Allow" or "Skip".
7. On the OnboardingCompleteScreen, tap the button to finish onboarding.
**Expected Result:** Each screen transitions with a slide-from-right animation. After the final screen, the app navigates to the HomeScreen with the selected quests visible.
**Edge Cases to Try:**
- On CategoryPriorityScreen, try tapping Continue with zero categories selected
- Reorder the priority list by long-pressing and dragging a category
- Use the back button to navigate to a previous onboarding step and change selections

---

### TC-007: Onboarding Back Navigation
**Platform:** Android Emulator
**Prerequisites:** On any onboarding screen past CategoryPriorityScreen.
**Steps:**
1. Progress to the HealthPermissionsScreen (step 3 of 5).
2. Press the hardware/gesture back button.
3. Verify you return to SelectQuestsScreen.
4. Press back again to return to CategoryPriorityScreen.
5. Verify your previously selected categories are still shown.
**Expected Result:** Back navigation works through each step. Previously entered data is preserved when navigating backward within the onboarding stack.
**Edge Cases to Try:**
- Press back on the very first screen (CategoryPriorityScreen) -- behavior depends on navigation config (may do nothing or go to auth)

---

### 2.3 Home Screen

---

### TC-008: Home Screen Initial Load
**Platform:** Android Emulator
**Prerequisites:** Logged in, onboarding complete, at least 3 active quests.
**Steps:**
1. Open the app (or navigate to Home tab).
2. Observe the screen as it loads.
**Expected Result:** The HomeScreen displays:
- A greeting with the user's first name and today's date
- A level badge (e.g., "Lv 1") in the top-right area
- Progress ring showing daily completion percentage
- Stat cards (Today's XP, completed count)
- A list of today's active quests sorted by priority (incomplete first, then by category priority)
- Each quest card shows the category icon, quest name, category label, and XP value
**Edge Cases to Try:**
- Pull-to-refresh and verify data reloads (RefreshControl indicator appears)
- Verify quests from all activated categories appear

---

### TC-009: Home Screen With No Active Quests
**Platform:** Android Emulator
**Prerequisites:** User has deactivated all quests (or freshly registered with no quest selections).
**Steps:**
1. Navigate to HomeScreen.
**Expected Result:** The quest list area shows an empty state or a prompt to activate quests. Stats show 0 XP earned today and 0/0 completion. The progress ring shows 0%.
**Edge Cases to Try:**
- Verify the greeting and level badge still render correctly even with no quest data

---

### 2.4 Quest Completion

---

### TC-010: Complete a Quest -- Happy Path
**Platform:** Android Emulator
**Prerequisites:** At least one incomplete quest is visible on the HomeScreen.
**Steps:**
1. Tap on an incomplete quest card on the HomeScreen.
2. Observe the card animation (scale bounce on press).
**Expected Result:**
- The quest card animates (springs to 0.95 scale then back to 1).
- A QuestCompletionOverlay appears showing the XP earned and the quest name.
- After the overlay dismisses, the quest card shows a green checkmark and appears with a "completed" style (likely grayed or struck-through text).
- The daily XP stat card increments by the quest's baseXP value.
- The completion count increments (e.g., "1/5 completed").
- The progress ring percentage increases.
**Edge Cases to Try:**
- Tap a quest that is already completed today -- it should be disabled (not respond to taps)
- Complete all daily quests and verify the progress ring shows 100%

---

### TC-011: Level Up on Quest Completion
**Platform:** Android Emulator
**Prerequisites:** The user's total XP is near the threshold for the next level. (You may need to complete several quests to reach this state, or use a fresh account where the first few completions trigger level 2.)
**Steps:**
1. Identify a quest whose XP reward will push total XP past the next level boundary.
2. Tap to complete that quest.
**Expected Result:**
- The QuestCompletionOverlay appears first.
- After approximately 2.2 seconds, a LevelUpOverlay appears showing the new level number.
- The level badge in the header updates to show the new level.
**Edge Cases to Try:**
- Dismiss the completion overlay early (tap to dismiss) and verify the level-up overlay still appears on schedule

---

### TC-012: Quest Completion Updates Badge Progress
**Platform:** Android Emulator
**Prerequisites:** Logged in with active quests.
**Steps:**
1. Complete a quest on the HomeScreen.
2. After the overlay dismisses, navigate to the Progress tab, then to the Badges screen.
3. Check if any badge progress updated (e.g., "First Steps" badge for first completion).
**Expected Result:** The `checkBadges()` action dispatched after completion causes newly earned badges to appear. If a badge was earned, it should show as earned in the BadgesScreen.
**Edge Cases to Try:**
- Complete multiple quests in a row and check badge progress after each

---

### 2.5 Quest Library, Search, and Filtering

---

### TC-013: Browse Quest Library
**Platform:** Android Emulator
**Prerequisites:** Logged in.
**Steps:**
1. Navigate to the Quests tab.
2. Scroll through the quest list.
**Expected Result:** The QuestsScreen loads showing quests from the library. Filter tabs are visible (All, Active, and category filters). Each quest card shows its name, category icon, and status (active or not).
**Edge Cases to Try:**
- Pull-to-refresh to reload the library and user quests

---

### TC-014: Search Quests by Name
**Platform:** Android Emulator
**Prerequisites:** On the QuestsScreen with quests loaded.
**Steps:**
1. Tap the search input field at the top.
2. Type a partial quest name (e.g., "walk" or "meditat").
3. Observe the list filtering in real time.
**Expected Result:** The quest list filters to show only quests whose names contain the search term (case-insensitive). Quests that do not match disappear from the list.
**Edge Cases to Try:**
- Search for a term with no matches (list should be empty, ideally with an empty-state message)
- Clear the search field and verify all quests reappear
- Search with leading/trailing spaces

---

### TC-015: Filter Quests by Category
**Platform:** Android Emulator
**Prerequisites:** On the QuestsScreen.
**Steps:**
1. Tap the "Physical Health" filter tab.
2. Observe the list updates.
3. Tap "All" to reset.
4. Tap "Active" to see only activated quests.
**Expected Result:** Each filter tab correctly narrows the displayed quests. The "Active" filter shows only quests the user has activated. Category filters show only quests in that category.
**Edge Cases to Try:**
- Combine search text with a category filter and verify both constraints apply
- Filter to a category with no quests (should show empty state)

---

### TC-016: Activate a Quest From the Library
**Platform:** Android Emulator
**Prerequisites:** On the QuestsScreen. At least one quest is not yet activated.
**Steps:**
1. Find an inactive quest in the list.
2. Tap on the quest to open QuestDetailScreen.
3. Tap the "Activate" button.
**Expected Result:** The quest is activated. Returning to the QuestsScreen, the quest now appears under the "Active" filter. The quest also appears on the HomeScreen in the daily quest list (if it matches today's frequency).
**Edge Cases to Try:**
- Activate a quest, then deactivate it from the detail screen and verify it is removed from active lists

---

### TC-017: View Quest Detail Screen
**Platform:** Android Emulator
**Prerequisites:** On the QuestsScreen with quests loaded.
**Steps:**
1. Tap on any quest card to navigate to QuestDetailScreen.
2. Review all displayed information.
**Expected Result:** The detail screen shows the quest name, category (with icon and color), frequency (Daily/Weekly/Monthly), XP reward, and description. If the user has this quest active, it shows today's completion status and an action button (Complete or Deactivate). Animations play on entry (FadeInDown / FadeInUp).
**Edge Cases to Try:**
- Navigate back to the quest list and verify navigation works smoothly

---

### 2.6 Custom Quest Creation

---

### TC-018: Create a Custom Quest -- Happy Path
**Platform:** Android Emulator
**Prerequisites:** Logged in. User has fewer than 5 custom quests (free tier limit).
**Steps:**
1. Navigate to QuestsScreen.
2. Tap the "Add Quest" / "+" button to open AddQuestScreen.
3. Enter quest name: `Evening Stretches`.
4. Enter description: `10 minutes of stretching before bed`.
5. Select category: "Physical Health".
6. Select frequency: "Daily".
7. Tap "Create" / submit button.
**Expected Result:** A success toast appears: `"Evening Stretches" has been added to your quests.` The screen navigates back to the QuestsScreen. The new custom quest appears in the library.
**Edge Cases to Try:**
- Create a quest with only a name and category (description is optional)
- Create a quest with a very long name (50+ characters) and verify it does not break the UI

---

### TC-019: Create Custom Quest -- Validation Errors
**Platform:** Android Emulator
**Prerequisites:** On the AddQuestScreen.
**Steps:**
1. Leave the quest name empty and tap Create.
2. Observe the alert.
3. Dismiss the alert, enter a name but leave category unselected, and tap Create.
**Expected Result:**
- Step 1: An alert appears with title "Quest needs a name" and message "Every quest needs a title, Adventurer."
- Step 3: An alert appears with title "Choose a category" and message "Select which life area this quest belongs to."
**Edge Cases to Try:**
- Enter only whitespace as the name and tap Create (should be caught by `.trim()` check)

---

### TC-020: Create Custom Quest -- Hit Free Tier Limit
**Platform:** Android Emulator
**Prerequisites:** The user already has 5 custom quests (free tier maximum).
**Steps:**
1. Navigate to the AddQuestScreen.
2. Fill in valid quest details.
3. Tap Create.
**Expected Result:** An error toast appears indicating the limit has been reached (message from backend). The quest is not created. The user stays on the AddQuestScreen.
**Edge Cases to Try:**
- Verify the error message is user-friendly and mentions the limit
- If a Premium upgrade path exists, verify it is mentioned or accessible

---

### TC-021: Custom Quest Frequency Selection
**Platform:** Android Emulator
**Prerequisites:** On the AddQuestScreen.
**Steps:**
1. Observe the default frequency selection (should be "Daily").
2. Tap "Weekly" and verify it becomes selected.
3. Tap "Monthly" and verify it becomes selected.
4. Tap "Daily" again and verify the selection changes back.
**Expected Result:** Only one frequency is selected at a time. The selected option is visually distinct (highlighted). The selected value is used when creating the quest.
**Edge Cases to Try:**
- Create quests with each frequency and verify they appear at the correct interval on the HomeScreen

---

### 2.7 Badge Earning and Display

---

### TC-022: View Badges Screen
**Platform:** Android Emulator
**Prerequisites:** Logged in with some quests completed.
**Steps:**
1. Navigate to the Progress tab.
2. Tap the Badges button/section to open BadgesScreen.
3. Scroll through the badge list.
**Expected Result:** Badges are grouped by rarity tier (Legendary, Epic, Rare, Common). Each badge shows its icon, name, and earned/locked state. The header shows a count of earned badges out of total. A loading indicator appears if badge data is being fetched.
**Edge Cases to Try:**
- With zero badges earned, verify all badges show as locked/greyed out
- Verify the rarity ordering: Legendary first, then Epic, Rare, Common

---

### TC-023: Earn a Badge
**Platform:** Android Emulator
**Prerequisites:** User is close to meeting a badge requirement (e.g., "First Steps" badge likely requires 1 quest completion).
**Steps:**
1. Identify a badge's unlock condition (check the shared constants).
2. Complete the required action (e.g., complete your first quest).
3. Check if a celebration modal / badge-earned notification appears.
4. Navigate to BadgesScreen and verify the badge now shows as earned.
**Expected Result:** When the badge condition is met after `checkBadges()` runs, the badge appears in the earned set on the BadgesScreen. The badge transitions from locked to earned state visually.
**Edge Cases to Try:**
- Earn multiple badges in a single session and verify all are reflected

---

### 2.8 Progress and Streaks

---

### TC-024: View Progress Screen -- Stats Overview
**Platform:** Android Emulator
**Prerequisites:** Logged in with some quest history.
**Steps:**
1. Navigate to the Progress tab.
2. Review the displayed information.
**Expected Result:** The ProgressScreen shows:
- XP bar with current level and progress to next level
- Stat cards (total XP, current streak, quests completed, etc.)
- Weekly XP bar chart (Mon-Sun) showing daily XP totals for the current week
- Category breakdown showing completions per category
- Loading indicator while data is being fetched
**Edge Cases to Try:**
- With a brand new account (zero history), verify stats show 0 values and charts render correctly without data

---

### TC-025: Streak Calendar Visualization
**Platform:** Android Emulator
**Prerequisites:** User has completed quests on multiple consecutive days (or at least on today).
**Steps:**
1. Navigate to the ProgressScreen.
2. Scroll to the streak calendar component (StreakCalendar).
3. Observe the calendar.
**Expected Result:** Days with quest completions are highlighted. The current streak count matches the number of consecutive days with at least one completion. Today's date is visually distinct.
**Edge Cases to Try:**
- Check that a day with zero completions breaks the streak visually
- Verify the calendar shows the correct month

---

### TC-026: Category Breakdown Accuracy
**Platform:** Android Emulator
**Prerequisites:** User has completed quests across at least 2 different categories.
**Steps:**
1. Navigate to the ProgressScreen.
2. Scroll to the category breakdown section.
3. Compare the displayed completion counts per category against your known completion history.
**Expected Result:** Each category shows the correct total completions count. Categories are displayed with their respective icons and colors. Categories with zero completions are shown (with a 0 count or not shown, depending on implementation).
**Edge Cases to Try:**
- Complete a quest, then return to ProgressScreen and pull-to-refresh to see updated counts

---

### TC-027: Weekly XP Chart
**Platform:** Android Emulator
**Prerequisites:** User has earned XP on at least 1 day this week.
**Steps:**
1. Navigate to the ProgressScreen.
2. Observe the weekly XP bar chart (Mon through Sun).
**Expected Result:** Bars show relative XP earned each day. Today's bar reflects the XP earned from today's completions. The weekly total is displayed. Days with no XP show empty/zero-height bars.
**Edge Cases to Try:**
- Check on a Monday with no completions yet (all bars should be at zero)

---

### 2.9 Theme Switching

---

### TC-028: Switch to Dark Mode
**Platform:** Android Emulator
**Prerequisites:** The app is in Light mode (or the default theme).
**Steps:**
1. Navigate to Profile tab and tap Settings.
2. Toggle "Dark Mode" ON.
3. Observe the UI change.
**Expected Result:** The entire app switches to dark colors (dark backgrounds, light text). The toggle shows the ON state. Navigating to other screens (Home, Quests, Progress) also shows dark theme.
**Edge Cases to Try:**
- Toggle back to Light mode and verify all screens revert
- Check that text contrast is readable on all screens in both modes

---

### TC-029: Switch to Light Mode
**Platform:** Android Emulator
**Prerequisites:** The app is currently in Dark mode.
**Steps:**
1. Navigate to Settings.
2. Toggle "Dark Mode" OFF.
3. Navigate through all main tabs (Home, Quests, Progress, Profile).
**Expected Result:** All screens render with light backgrounds and dark text. The toggle shows the OFF state.
**Edge Cases to Try:**
- Verify modals and overlays (QuestCompletionOverlay, LevelUpOverlay) also respect the current theme

---

### TC-030: Theme Persists Across App Restart
**Platform:** Android Emulator
**Prerequisites:** None.
**Steps:**
1. Set the theme to Dark mode in Settings.
2. Force-close the app (swipe away from recents or use `adb shell am force-stop com.dydyd.app`).
3. Reopen the app.
**Expected Result:** The app launches in Dark mode without needing to re-toggle. Theme preference is persisted via Redux Persist / AsyncStorage.
**Edge Cases to Try:**
- Set to Light mode, force-close, reopen, and verify Light mode persists
- Note: When `theme === 'system'`, the toggle shows ON regardless of OS appearance. If you set the Android emulator to Light mode at the system level, the toggle may appear inconsistent. This is a known issue.

---

### 2.10 Settings and Profile

---

### TC-031: View Profile Screen
**Platform:** Android Emulator
**Prerequisites:** Logged in with some activity history.
**Steps:**
1. Navigate to the Profile tab.
2. Review all displayed information.
**Expected Result:** The ProfileScreen shows the user's display name, level (with level title from `getLevelTitle()`), XP progress bar, total XP, premium status, earned badge count, active quest count, and category distribution. Pull-to-refresh triggers data reload.
**Edge Cases to Try:**
- Verify the level title matches the expected value from `@dydyd/shared` level titles table

---

### TC-032: Navigate Settings Subsections
**Platform:** Android Emulator
**Prerequisites:** On the SettingsScreen.
**Steps:**
1. Tap "Notifications" row.
2. Verify the NotificationsScreen opens.
3. Go back. Tap "Health Integrations".
4. Verify the HealthIntegrationsScreen opens.
5. Go back.
**Expected Result:** Each row with a chevron navigates to its corresponding screen. Back navigation returns to Settings.
**Edge Cases to Try:**
- Verify "Export Data" row is present (may not be wired yet)

---

### TC-033: Notification Settings
**Platform:** Android Emulator
**Prerequisites:** On the NotificationsScreen (via Settings > Notifications).
**Steps:**
1. Toggle "Daily Reminder" ON and OFF.
2. Observe the "Streak at Risk" toggle.
3. Observe the "Reminder Time" row.
**Expected Result:** Toggles switch state visually and dispatch `updateSettings` to Redux. The "Reminder Time" row shows the current time (default "9:00 AM") with a chevron, but tapping it may not open a picker (not yet wired).
**Edge Cases to Try:**
- Toggle notifications off, leave the screen, come back -- verify the state persisted

---

### TC-034: Health Integrations Screen
**Platform:** Android Emulator
**Prerequisites:** On the HealthIntegrationsScreen (via Settings > Health Integrations).
**Steps:**
1. Observe the listed integrations.
2. Verify that on Android, "Google Fit" and "Garmin" and "Samsung Health" are shown.
3. Verify that "Apple Health" and "Apple Watch" are NOT shown (iOS-only).
4. Tap a "Connect" button.
**Expected Result:** The integrations list is filtered by `Platform.OS`. Only Android-compatible integrations appear. Note: The Connect/Disconnect buttons are currently UI-only -- no actual integration occurs on tap.
**Edge Cases to Try:**
- Verify the description text at the top renders correctly

---

### TC-035: Haptic Feedback Toggle
**Platform:** Android Emulator
**Prerequisites:** On the SettingsScreen.
**Steps:**
1. Observe the "Haptic Feedback" toggle (default: ON).
2. Toggle it OFF.
3. Complete a quest on the HomeScreen.
4. Toggle it back ON and complete another quest.
**Expected Result:** The toggle dispatches `updateSettings({ hapticFeedbackEnabled: value })`. Note: Haptic feedback cannot be felt on the emulator -- this is only testable on a physical device. On the emulator, verify the toggle state changes and persists.
**Edge Cases to Try:**
- Verify the setting persists after app restart

---

### 2.11 Offline Mode

---

### TC-036: Complete Quest While Offline
**Platform:** Android Emulator
**Prerequisites:** Logged in with active quests visible on HomeScreen. Backend is running.
**Steps:**
1. Enable airplane mode on the Android emulator (swipe down notification shade > Airplane mode, or via Settings).
2. Tap to complete a quest on the HomeScreen.
3. Observe the behavior.
**Expected Result:** The quest completion is queued locally via the OfflineQueue service. The UI may show the quest as completed optimistically, or it may show an error toast. The queued action is persisted to AsyncStorage.
**Edge Cases to Try:**
- Complete multiple quests while offline

---

### TC-037: Sync After Returning Online
**Platform:** Android Emulator
**Prerequisites:** One or more quests were completed while offline (from TC-036).
**Steps:**
1. Disable airplane mode on the emulator.
2. Wait a few seconds, or pull-to-refresh on the HomeScreen.
**Expected Result:** The OfflineQueue flushes queued actions. Completions sync to the backend. XP and stats update to reflect the synced completions. A progress callback may show sync progress (completed/total).
**Edge Cases to Try:**
- Verify no duplicate completions are created (idempotency)
- Force-close the app while offline, reopen after going back online, and verify the queue still flushes (queue is persisted to AsyncStorage)

---

### TC-038: Offline Queue Retry Behavior
**Platform:** Android Emulator
**Prerequisites:** App is online. Backend is stopped.
**Steps:**
1. Stop the backend server (Ctrl+C in Terminal 1).
2. Attempt to complete a quest.
3. Start the backend server again.
4. Pull-to-refresh or wait for the queue to flush.
**Expected Result:** The failed request is caught, and the action is enqueued. When the backend comes back, the queue flushes. Actions that fail more than 3 times (`MAX_RETRIES = 3`) are dropped from the queue.
**Edge Cases to Try:**
- Verify an error toast appears when the completion request initially fails

---

### 2.12 Toast Notifications

---

### TC-039: Success Toast on Quest Creation
**Platform:** Android Emulator
**Prerequisites:** On the AddQuestScreen.
**Steps:**
1. Create a valid custom quest (fill in name, select category).
2. Tap Create.
**Expected Result:** A success toast appears with title "Quest created!" and a message including the quest name. The toast auto-dismisses after a few seconds.
**Edge Cases to Try:**
- Verify the toast does not block interaction with the underlying screen

---

### TC-040: Error Toast on Failed Action
**Platform:** Android Emulator
**Prerequisites:** Backend is stopped or network is unavailable.
**Steps:**
1. Attempt to create a custom quest while the backend is unreachable.
**Expected Result:** An error toast appears with title "Failed to create quest" and a descriptive error message. The AddQuestScreen remains active (user can retry).
**Edge Cases to Try:**
- Verify the toast is visually distinct for error type (different color or icon vs. success)

---

### 2.13 Error Handling

---

### TC-041: Network Timeout on Login
**Platform:** Android Emulator
**Prerequisites:** Backend is stopped.
**Steps:**
1. Open the app to the LoginScreen.
2. Enter valid credentials.
3. Tap "Log In".
**Expected Result:** After the request times out, an error message appears on the LoginScreen. The login button becomes re-enabled so the user can retry. No crash occurs.
**Edge Cases to Try:**
- Verify the loading spinner stops after the timeout

---

### TC-042: Expired Token Handling
**Platform:** Android Emulator
**Prerequisites:** Logged in. The access token is known to be short-lived (15 minutes).
**Steps:**
1. Log in and use the app normally.
2. Wait 15+ minutes without interacting, or manually advance the emulator's clock.
3. Perform an action that requires API access (e.g., pull-to-refresh on HomeScreen).
**Expected Result:** The app should attempt a token refresh using the 7-day refresh token. If the refresh succeeds, the action completes seamlessly. If both tokens are expired, the user is logged out and returned to the WelcomeScreen.
**Edge Cases to Try:**
- Verify the refresh token flow is invisible to the user (no login prompt for short expirations)

---

### 2.14 Account Management

---

### TC-043: Logout
**Platform:** Android Emulator
**Prerequisites:** Logged in.
**Steps:**
1. Navigate to the Profile tab.
2. Scroll down and look for a "Log Out" button (it may be at the bottom of the ProfileScreen, or inside Settings). Note: The `logout` thunk exists in `authSlice` and the API service has `authService.logout()`, but no visible "Log Out" button was found in the ProfileScreen or SettingsScreen source code. If no logout button is present, record this as a **BUG: no UI entry point for logout** -- the Redux thunk and API endpoint exist but the user has no way to trigger them.
3. If the button exists, tap it.
**Expected Result:** The auth state is cleared. The app navigates back to the WelcomeScreen. Attempting to navigate back (hardware back button) does not return to authenticated screens.
**Edge Cases to Try:**
- After logout, log in with a different account and verify the data shown belongs to the new account (no stale data from previous session)
- As a workaround if no logout button exists, clear app data via `adb shell pm clear com.dydyd.app` to reset auth state

---

### TC-044: Account Deletion Flow
**Platform:** Android Emulator
**Prerequisites:** Logged in. On the SettingsScreen.
**Steps:**
1. Scroll to the Account section in Settings.
2. Tap "Delete Account" (red text).
3. If a confirmation dialog appears, observe it.
4. Enter your password if prompted.
5. Confirm deletion.
**Expected Result:** The account deletion flow should present a confirmation prompt (to prevent accidental deletion). After confirming and providing the password, the `deleteAccount` thunk fires, the backend deletes the account, and the user is returned to the WelcomeScreen. Note: The "Delete Account" `TouchableOpacity` in SettingsScreen has **no `onPress` handler** in the current source (line 71-74 of `SettingsScreen.tsx`). The Redux thunk (`deleteAccount` in `userSlice.ts`) and API service (`userService.deleteAccount()`) both exist, but the UI button is not wired. If tapping it does nothing, record this as **BUG: Delete Account button not wired to deleteAccount thunk**.
**Edge Cases to Try:**
- Enter the wrong password during deletion (should show error)
- Cancel out of the confirmation dialog (should not delete)

---

### TC-045: Login After Account Deletion
**Platform:** Android Emulator
**Prerequisites:** Account was deleted in TC-044.
**Steps:**
1. On the WelcomeScreen, tap "Log In".
2. Enter the deleted account's email and password.
3. Tap "Log In".
**Expected Result:** Login fails with an error (e.g., "Invalid credentials" or "Account not found"). The user cannot access a deleted account.
**Edge Cases to Try:**
- Register a new account with the same email address and verify it works (email is available again)

---

### 2.15 Miscellaneous UI

---

### TC-046: Pull-to-Refresh on All Main Screens
**Platform:** Android Emulator
**Prerequisites:** Logged in.
**Steps:**
1. On the HomeScreen, pull down to trigger refresh.
2. Navigate to QuestsScreen, pull to refresh.
3. Navigate to ProgressScreen (may not have RefreshControl -- observe).
4. Navigate to ProfileScreen, pull to refresh.
**Expected Result:** Each screen that supports RefreshControl shows the loading indicator and reloads its data from the backend. Screens without pull-to-refresh simply scroll.
**Edge Cases to Try:**
- Pull-to-refresh while offline (should show error or stale data)

---

### TC-047: Keyboard Handling on Input Screens
**Platform:** Android Emulator
**Prerequisites:** On LoginScreen or RegisterScreen.
**Steps:**
1. Tap an input field to bring up the software keyboard.
2. Verify the input fields are not obscured by the keyboard (KeyboardAvoidingView should scroll/adjust).
3. Tap outside the input or tap "Done" to dismiss the keyboard.
4. Verify `keyboardShouldPersistTaps="handled"` works -- tapping the "Log In" button while the keyboard is up should trigger login, not just dismiss the keyboard.
**Expected Result:** The view adjusts so that the active input and submit button remain visible. Tapping the submit button works even when the keyboard is shown.
**Edge Cases to Try:**
- Test on RegisterScreen where there are 4 input fields -- scroll to the bottom field and verify it remains visible above the keyboard

---

### TC-048: Animation Smoothness
**Platform:** Android Emulator
**Prerequisites:** Logged in.
**Steps:**
1. Navigate between tabs and observe transition animations.
2. On the HomeScreen, observe quest cards entering with FadeInRight stagger animations.
3. Complete a quest and watch the QuestCompletionOverlay animation.
4. On the WelcomeScreen (logged out), observe the entrance animations (logo scale, title fade, button slide-up).
**Expected Result:** All animations run smoothly without visible frame drops. Reanimated-based animations (spring, FadeInDown, FadeInRight) should feel fluid. No visual glitches or layout jumps.
**Edge Cases to Try:**
- Rapidly switch between tabs to check for animation interruption issues
- Trigger multiple animations simultaneously (e.g., complete a quest while a pull-to-refresh is still animating)

---

## Bugs Identified During Test Plan Authoring

The following issues were discovered while reviewing source code to write this test plan. They should be triaged and filed as issues.

**BUG-001: Dark Mode toggle logic is incorrect for "system" theme**
- **File:** `apps/mobile/src/screens/profile/SettingsScreen.tsx`, line 18
- **Code:** `const isDarkMode = theme === 'dark' || theme === 'system';`
- **Problem:** When the theme is set to `'system'` and the device OS is in light mode, the toggle shows as ON (dark), which is incorrect. The toggle conflates "dark" and "system" states. The toggle should reflect actual visual appearance, not just the theme string.
- **Severity:** Low (cosmetic, user can still switch themes)
- **Repro:** Set Android emulator to light system appearance, then observe the Dark Mode toggle in Settings.

**BUG-002: No logout button in any UI screen**
- **Files:** `apps/mobile/src/screens/profile/ProfileScreen.tsx`, `apps/mobile/src/screens/profile/SettingsScreen.tsx`
- **Problem:** The `logout` thunk exists in `authSlice.ts` and the API endpoint `authService.logout()` is implemented, but no screen renders a "Log Out" button. Users have no way to log out of the app.
- **Severity:** High (users cannot switch accounts or log out)

**BUG-003: Delete Account button not wired**
- **File:** `apps/mobile/src/screens/profile/SettingsScreen.tsx`, lines 71-74
- **Problem:** The "Delete Account" `TouchableOpacity` has no `onPress` handler. The Redux thunk (`deleteAccount` in `userSlice.ts`) and API service (`userService.deleteAccount(password)`) both exist and are tested, but the UI button does nothing when tapped.
- **Severity:** Medium (feature exists in backend/Redux but is inaccessible from UI)

---

## 3. Platform-Specific Notes

### 3.1 Android Emulator

**Recommended configuration:**
- Device: Pixel 7 (or any device with Google Play)
- API Level: 34 (Android 14)
- RAM: 2048 MB minimum, 4096 MB recommended
- Enable hardware acceleration (HAXM or Hyper-V) for acceptable performance

**Emulator-specific limitations:**
- Haptic feedback (`useHaptic` hook) cannot be felt on the emulator. TC-035 can only verify the toggle state, not the actual vibration.
- Google Fit integration requires a Google account signed into the emulator and Google Fit installed. For initial testing, verify the UI-level behavior only.
- Push notifications may require FCM configuration and a Google Services JSON. If notifications do not arrive, verify the NotificationsScreen toggle behavior only.
- Airplane mode can be toggled via the emulator's extended controls (three-dot menu > Cellular > Network type: None) or the notification shade.

**Useful ADB commands:**
```powershell
# List connected devices
adb devices

# Force-stop the app
adb shell am force-stop com.dydyd.app

# Clear app data (fresh start)
adb shell pm clear com.dydyd.app

# Take a screenshot
adb exec-out screencap -p > screenshot.png

# Toggle airplane mode
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE

# Disable airplane mode
adb shell settings put global airplane_mode_on 0
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

### 3.2 iOS Testing Limitations on Windows

iOS Simulator requires macOS and Xcode. Since this environment is Windows 11, iOS testing is **not available locally**. Options for iOS testing:

1. **Physical iOS device** -- Install a development build via EAS (`eas build --profile development --platform ios`) and load it onto a device via TestFlight or direct install (requires Apple Developer account).
2. **Remote Mac** -- Use a cloud Mac service (e.g., MacStadium, GitHub Actions macOS runner) to run iOS Simulator tests.
3. **Defer to CI** -- Run automated tests targeting iOS in CI pipelines on macOS runners.

All test cases in this plan are written for Android Emulator. When iOS testing becomes available, re-run all test cases on iOS and pay special attention to:
- `KeyboardAvoidingView` behavior (`behavior="padding"` on iOS vs. `undefined` on Android)
- Health integrations (Apple Health / HealthKit is iOS-only; Google Fit is Android-only)
- Safe area insets (notch handling on iPhone models)
- Navigation gestures (swipe-from-left to go back on iOS vs. hardware back button on Android)
- Any `Platform.OS` conditional logic throughout the codebase

### 3.3 Known Platform Differences

| Feature | Android | iOS |
|---------|---------|-----|
| Health integration | Google Fit, Samsung Health, Garmin | Apple Health, Apple Watch, Garmin |
| Back navigation | Hardware/gesture back button | Swipe-from-left edge gesture |
| Keyboard avoiding | `behavior={undefined}` | `behavior="padding"` |
| Layout animations | Requires `UIManager.setLayoutAnimationEnabledExperimental(true)` (set in CategoryPriorityScreen) | Works natively |
| Haptic feedback | Vibration API | Haptics API (more nuanced) |

### 3.4 Features With Incomplete Backend Wiring

The following features have UI implemented but are not fully wired to the backend. Record these as UI-only during testing:

| Feature | Screen | Status |
|---------|--------|--------|
| Forgot Password | ForgotPasswordScreen | UI-only; uses `setTimeout(1000)` to simulate success. No email sent. |
| Health Connect/Disconnect | HealthIntegrationsScreen | Connect buttons have no `onPress` handler. |
| Reminder Time picker | NotificationsScreen | Chevron row has no `onPress`. Shows "9:00 AM" as static text. |
| Export Data | SettingsScreen | Row present but not wired. |
| Delete Account (UI) | SettingsScreen | Button visible but may lack `onPress` handler. Redux thunk and API service exist. |

---

## 4. Phase 4A Feature Tests

> These tests cover features merged in Phase 4A: iOS Widgets (M1), Apple Watch Companion (M2), Compassionate Streaks (M3), and History Logging (M4). iOS Widget and watchOS tests require a **MacBook with Xcode**. Streak and history tests can run on **Android Emulator** (backend-driven features).

### 4.1 iOS Widgets (Milestone 1)

> **Platform:** Physical iPhone or iOS Simulator (macOS + Xcode required)
> **Prerequisites:** Dev build installed via `npx expo prebuild --platform ios` + Xcode build, or EAS dev client build.

---

### TC-049: Add Small Widget to Home Screen
**Platform:** iOS (Physical or Simulator)
**Prerequisites:** DYDYD app installed and logged in with active quests.
**Steps:**
1. Long-press on the iOS home screen until icons jiggle.
2. Tap the "+" button in the top-left corner.
3. Search for "DYDYD" in the widget gallery.
4. Select the Small widget.
5. Tap "Add Widget" and position it on the home screen.
**Expected Result:** The small widget renders showing the current streak count and a daily XP progress ring. Data matches what the app shows on the HomeScreen.
**Edge Cases to Try:**
- With zero completions today, verify the progress ring shows 0%
- With zero streak, verify streak count shows 0

---

### TC-050: Add Medium Widget With Interactive Buttons
**Platform:** iOS (Physical or Simulator, iOS 17+ for interactivity)
**Prerequisites:** DYDYD app installed, logged in, at least 3 active daily quests.
**Steps:**
1. Add the Medium DYDYD widget to the home screen.
2. Observe the widget displays up to 3 daily quests with check buttons.
3. Tap a quest's check button directly on the widget (iOS 17+ interactive widgets).
4. Observe the widget updates.
**Expected Result:** The medium widget shows the top 3 daily quests with names and interactive completion buttons. Tapping a check button marks the quest as completed — the button changes to a checkmark state. The XP counter on the widget updates.
**Edge Cases to Try:**
- Complete all 3 displayed quests via widget and verify the widget shows all as done
- On iOS 16 (no interactive widgets), verify the widget is tap-to-open only (tapping opens the app)

---

### TC-051: Add Large Widget (Full Dashboard)
**Platform:** iOS (Physical or Simulator)
**Prerequisites:** DYDYD app installed, logged in, active quests with some completions.
**Steps:**
1. Add the Large DYDYD widget to the home screen.
2. Review all displayed information.
**Expected Result:** The large widget renders a full daily dashboard: progress rings per category, current streak, daily XP total, and a list of quests with completion status. Layout is readable and not truncated.
**Edge Cases to Try:**
- With many active quests (10+), verify the widget does not overflow or clip content
- With zero activity, verify the dashboard shows empty/zero states cleanly

---

### TC-052: StandBy Mode Widget Display
**Platform:** Physical iPhone (iOS 17+, requires MagSafe or Lightning charger)
**Prerequisites:** DYDYD widget added to home screen. iPhone on a charger in landscape orientation.
**Steps:**
1. Place the iPhone on a charger in landscape orientation.
2. Lock the screen — StandBy Mode should activate.
3. Swipe to the widgets view in StandBy.
4. Find the DYDYD widget.
**Expected Result:** The DYDYD widget renders in full-screen StandBy format, optimized for the always-on display. Content is legible at nightstand distance. Colors are dimmed appropriately for nighttime viewing.
**Edge Cases to Try:**
- Verify the widget updates periodically while in StandBy (timeline refresh)

---

### TC-053: Widget Data Freshness After App Activity
**Platform:** iOS (Physical or Simulator)
**Prerequisites:** DYDYD widget on home screen. App open.
**Steps:**
1. Note the current widget state (XP, streak, quest completion status).
2. Open the DYDYD app and complete a quest.
3. Return to the home screen and observe the widget.
**Expected Result:** The widget updates to reflect the new completion within the WidgetKit timeline refresh window. The XP count increments and the completed quest shows a checkmark. Note: WidgetKit refreshes are not instant — updates may take up to 15 minutes unless the app explicitly reloads the timeline.
**Edge Cases to Try:**
- Force a timeline reload by removing and re-adding the widget

---

### 4.2 Apple Watch Companion (Milestone 2)

> **Platform:** Apple Watch (physical Series 4+ or watchOS Simulator via Xcode)
> **Prerequisites:** macOS with Xcode, `npx expo prebuild --platform ios`, watchOS target built and installed. iPhone paired with Watch (physical) or Simulator pairing configured.

---

### TC-054: watchOS App — Build Verification
**Platform:** macOS + Xcode
**Prerequisites:** Repository cloned, `yarn install` complete.
**Steps:**
1. Run `npx expo prebuild --platform ios` from `apps/mobile/`.
2. Open the generated `ios/` workspace in Xcode.
3. Verify the watchOS target appears in the scheme selector.
4. Select the watchOS target and build for Watch Simulator (or physical Watch).
5. Check the build log for errors.
**Expected Result:** All 8 Swift files compile without errors:
- `DYDYDWatchApp.swift` — App entry point
- `QuestListView.swift` — Quest list screen
- `QuestRowView.swift` — Individual quest row
- `ProgressRingView.swift` — Circular progress indicator
- `ConnectivityManager.swift` — WatchConnectivity bridge (dual date parsing, send queue guard)
- `HealthKitManager.swift` — HealthKit integration (`authorizationRequested` flag)
- `ComplicationProvider.swift` — Watch face complications
- `Models.swift` — Data models (includes `questId` field)

---

### TC-055: Watch App — Quest List Display
**Platform:** Apple Watch (physical or Simulator)
**Prerequisites:** Watch app built and installed. iPhone app logged in with active daily quests.
**Steps:**
1. Open the DYDYD app on Apple Watch.
2. Observe the quest list.
**Expected Result:** The Watch app displays today's daily quests with quest name, icon, and XP value. Quests that are already completed show a checkmark. The list scrolls smoothly via the Digital Crown.
**Edge Cases to Try:**
- With zero active quests, verify an empty state message appears
- With 10+ daily quests, verify scrolling works and no items are cut off

---

### TC-056: Watch App — Quick-Complete a Quest
**Platform:** Apple Watch (physical or Simulator)
**Prerequisites:** Watch app showing at least one incomplete quest.
**Steps:**
1. Tap on an incomplete quest in the Watch quest list.
2. Observe the completion feedback.
3. Check the iPhone app to verify the completion synced.
**Expected Result:** The quest shows a completion animation on Watch. The quest row updates to show a checkmark. The iPhone app reflects the completion (XP updated, quest marked done) after WatchConnectivity sync.
**Edge Cases to Try:**
- Complete a quest on Watch while the iPhone app is in the foreground vs. background
- Complete a quest on Watch while iPhone is out of Bluetooth range (should queue and sync later)

---

### TC-057: Watch App — Progress Ring
**Platform:** Apple Watch (physical or Simulator)
**Prerequisites:** Watch app installed, some quests completed today.
**Steps:**
1. Open the Watch app and observe the progress ring at the top.
2. Complete a quest and observe the ring update.
**Expected Result:** The progress ring shows the percentage of daily quests completed. The ring animates as progress increases. Colors match the app's theme.
**Edge Cases to Try:**
- At 100% completion, verify the ring fills completely with a distinct visual indicator

---

### TC-058: Watch Complications
**Platform:** Apple Watch (physical or Simulator)
**Prerequisites:** Watch app installed.
**Steps:**
1. Long-press the watch face to enter edit mode.
2. Select a complication slot and browse to DYDYD.
3. Add the DYDYD complication (streak count or progress ring).
4. Return to the watch face.
**Expected Result:** The complication renders on the watch face showing current streak or daily progress. Data updates periodically via the complication timeline.
**Edge Cases to Try:**
- Test circular, modular, and graphic complication families
- Verify the complication is legible on different watch face styles

---

### TC-059: WatchConnectivity — Phone-to-Watch Sync
**Platform:** Apple Watch + iPhone (physical pair or Simulator)
**Prerequisites:** Both apps installed and running.
**Steps:**
1. Complete a quest on the iPhone app.
2. Open the Watch app and observe if the quest status updates.
3. Check that todayXP, streak, and level reflect the phone's state.
**Expected Result:** The Watch receives an `applicationContext` update from the iPhone within seconds. Quest completion status, XP, streak, and level are all current. The `ConnectivityManager` handles both ISO string and numeric date formats for `lastSyncTime`.
**Edge Cases to Try:**
- Kill the Watch app, complete a quest on iPhone, then reopen the Watch app — queued context should be received on launch
- Complete quests rapidly on the phone and verify the Watch doesn't miss updates

---

### TC-060: Watch HealthKit Auto-Logging
**Platform:** Physical Apple Watch (HealthKit not available in Simulator)
**Prerequisites:** Watch app installed. HealthKit permissions granted.
**Steps:**
1. Open the Watch app — it should request HealthKit authorization on first launch.
2. Grant access to step count, workout data, and sleep analysis.
3. Record a workout on the Watch (e.g., via the Workout app).
4. Check if a matching health-related quest auto-completes in DYDYD.
**Expected Result:** The `HealthKitManager` uses `authorizationRequested` (not `isAuthorized`) to check permission state. After granting permissions, health data from the Watch flows into DYDYD. Quests linked to health data sources (steps, workouts, sleep) auto-complete when thresholds are met.
**Edge Cases to Try:**
- Deny HealthKit permissions and verify the app degrades gracefully (no crash, health quests stay manual)
- Verify `NSHealthShareUsageDescription` appears in the permission dialog

---

### 4.3 Compassionate Streaks (Milestone 3)

> **Platform:** Android Emulator or iOS (backend-driven, platform-agnostic)
> **Prerequisites:** Logged in with active quests. Backend running with streak-related schema fields (`streakFreezes`, `maxStreakFreezes`, `activeDaysCount`, `lastActiveDate`, `streakFreezeUsedAt`).

---

### TC-061: Streak Freeze — Earning Freezes
**Platform:** Android Emulator
**Prerequisites:** Fresh account with 0 streak freezes.
**Steps:**
1. Complete at least one quest every day for 7 consecutive days.
2. After day 7, call `GET /api/streaks/status` (or observe the UI if streak freeze count is displayed).
**Expected Result:** After 7 active days, the user earns 1 streak freeze. The `streakFreezes` field increments by 1. Maximum streak freezes cap at `maxStreakFreezes` (default 3). The `activeDaysCount` increments each day a quest is completed via `trackActiveDay()`.
**Edge Cases to Try:**
- Verify freezes cap at 3 (complete 28 consecutive days and confirm no more than 3 are banked)
- Verify `activeDaysCount` only increments once per calendar day (completing 5 quests in one day = 1 active day)

---

### TC-062: Streak Freeze — Auto-Apply on Missed Day
**Platform:** Android Emulator
**Prerequisites:** User has at least 1 streak freeze banked. User has a multi-day streak.
**Steps:**
1. Build up a streak (complete quests for several consecutive days).
2. Intentionally skip one day (no quest completions).
3. On the following day, complete a quest.
**Expected Result:** When `checkAndAutoApplyFreeze()` runs after the next quest completion, it detects the 1-day gap since `lastActiveDate`, auto-applies a streak freeze, and preserves the streak. The `streakFreezes` count decrements by 1. The `streakFreezeUsedAt` updates to today. The streak count continues unbroken.
**Edge Cases to Try:**
- Skip 2 consecutive days with only 1 freeze available — the streak should break (only 1 freeze per gap day)
- Use `POST /api/streaks/freeze` to manually apply a freeze and verify the transaction atomicity (wrapped in `$transaction`)

---

### TC-063: Streak Freeze — Zero Freezes Available
**Platform:** Android Emulator
**Prerequisites:** User has 0 streak freezes and an active streak.
**Steps:**
1. Skip one day of quest completions.
2. Complete a quest the next day.
3. Check streak status via `GET /api/streaks/status`.
**Expected Result:** With no freezes available, the streak resets. `calculateFreezeAwareDayStreak()` calculates the streak as starting from the current active day (not 0→1 — it looks back at historic completions before the gap). The comeback quest system activates.
**Edge Cases to Try:**
- Verify the streak doesn't show a misleading "1" — it should reflect the actual consecutive days since the gap

---

### TC-064: Comeback Quest — Offered After Absence
**Platform:** Android Emulator
**Prerequisites:** User was active, then missed 1-14 days.
**Steps:**
1. After missing at least 1 day, call `GET /api/streaks/comeback`.
2. Observe the comeback quest data.
**Expected Result:** The API returns a comeback quest with 1.5x XP bonus (`COMEBACK_CONFIG.bonusXPMultiplier`). The comeback quest is available for absences of 1-14 days (`COMEBACK_CONFIG.maxMissedDays`). The response includes `comebackXP` calculated via `calculateComebackXP()`.
**Edge Cases to Try:**
- After 15+ days of absence, verify no comeback quest is offered (past the 14-day window)
- Complete the comeback quest and verify the bonus XP is credited to the user's total

---

### TC-065: Progressive Onboarding — Initial Quest Limit
**Platform:** Android Emulator
**Prerequisites:** Fresh account, first day of use.
**Steps:**
1. Register a new account and complete onboarding.
2. Check how many quests can be activated.
**Expected Result:** New users start with a limit of 3 active quests (`PROGRESSIVE_ONBOARDING.initialQuestLimit`). The UI should communicate this limit clearly. Attempting to activate a 4th quest shows an appropriate message.
**Edge Cases to Try:**
- Verify the limit is enforced on the backend (not just UI)

---

### TC-066: Progressive Onboarding — Unlocking More Quests
**Platform:** Android Emulator
**Prerequisites:** Account with several active days.
**Steps:**
1. Use the app actively for 3+ days.
2. After every 3 active days, check the quest activation limit.
**Expected Result:** Every 3 active days (`PROGRESSIVE_ONBOARDING.daysToUnlockMore`), the user unlocks 2 additional quest slots (`PROGRESSIVE_ONBOARDING.maxQuestsPerUnlock`). The limit progression is: 3 → 5 → 7 → 9 → ... calculated by `getOnboardingQuestLimit(activeDaysCount)`.
**Edge Cases to Try:**
- Verify the formula: `initialQuestLimit + floor(activeDays / daysToUnlockMore) * maxQuestsPerUnlock`

---

### 4.4 History Logging (Milestone 4)

> **Platform:** Android Emulator or iOS (backend-driven)
> **Prerequisites:** Backend running with `timeBucket` field on `QuestCompletion` model. At least a few quest completions at different times of day.

---

### TC-067: TimeBucket Auto-Recording
**Platform:** Android Emulator
**Prerequisites:** Backend running. Logged in with active quests.
**Steps:**
1. Complete a quest and note the current time.
2. Query the quest completion record (via API or database inspection).
3. Verify the `timeBucket` field.
**Expected Result:** Every quest completion automatically records a `timeBucket` value based on the server time:
- EARLY_MORNING: 4am-7am
- MORNING: 7am-12pm
- AFTERNOON: 12pm-5pm
- EVENING: 5pm-9pm
- NIGHT: 9pm-4am
The `getTimeBucket(new Date())` utility determines the bucket. No user action is required — it's silent logging.
**Edge Cases to Try:**
- Complete quests at boundary times (e.g., exactly 7:00am, 12:00pm) and verify correct bucket assignment
- Verify existing completions without `timeBucket` (pre-migration) have `null` and don't cause errors

---

### TC-068: Weekly Digest Endpoint
**Platform:** Android Emulator
**Prerequisites:** At least one week of quest completion data.
**Steps:**
1. Call `GET /api/progress/weekly-digest` with auth token.
2. Review the response.
**Expected Result:** The endpoint returns weekly summary data including total completions, XP earned, streak status, and week-over-week comparison. The response is validated with Zod schemas. Dates are properly bounded to the current week.
**Edge Cases to Try:**
- Call on a Monday with no completions yet this week (should return zeros, not errors)
- Call with a brand new account (no history — should return empty/zero data)

---

### TC-069: Completion History Endpoint
**Platform:** Android Emulator
**Prerequisites:** Multiple quest completions across different days and categories.
**Steps:**
1. Call `GET /api/progress/history` with auth token.
2. Call with query params: `?category=physical_health` to filter by category.
3. Call with date range params if supported.
**Expected Result:** The endpoint returns a chronological list of quest completions. Each entry includes the quest name, category, XP earned, completion timestamp, and `timeBucket`. Filtering by `category` uses `z.nativeEnum(QuestCategory)` validation. The `where` clause uses `Prisma.QuestCompletionWhereInput` (no `as any`). Query params are accessed via `c.get('validatedQuery')`.
**Edge Cases to Try:**
- Filter by a category with no completions (should return empty array, not error)
- Pass an invalid category string (should return 400 validation error from Zod)
- Request with no query params (should return all completions, paginated if applicable)

---

### TC-070: TimeBucket Distribution in History
**Platform:** Android Emulator
**Prerequisites:** Quest completions spread across multiple time buckets.
**Steps:**
1. Complete quests at different times of day (or use the backend directly to create test data).
2. Query the history endpoint.
3. Group completions by `timeBucket` and verify distribution.
**Expected Result:** Each completion's `timeBucket` accurately reflects when it was recorded. The distribution can be used to identify patterns (e.g., "most completions happen in the MORNING bucket"). This data feeds the future Phase 5 timing pattern insights feature.
**Edge Cases to Try:**
- Verify completions made during overnight hours (11pm-3am) are correctly assigned to NIGHT bucket
