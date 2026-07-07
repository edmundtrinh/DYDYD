# Phase 4A: The Vision -- GitHub Issues

> 4 issues for milestone **v0.4.0 -- The Vision**.
> This document is for review before creating as actual GitHub issues.
>
> **Strategic context:** This is why DYDYD exists. The founder's core vision is to replace the phone homescreen with an all-in-one habit and routine builder. Widgets and the Watch app are not polish features -- they are the product. Compassionate streak design ensures the app meets the user where they are (scatter-brained, procrastination-prone) with encouragement, not guilt.
>
> **Industry context:** Apps with interactive widgets see 12--18% lifts in re-engagement. Finch (compassionate gamification) grew to ~$30M ARR. Duolingo's streak mechanics drove 36% YoY DAU growth. The opportunity is to combine proven engagement patterns with genuinely supportive design.

---

## Issue #79: Compassionate Streak Design

**Labels:** `enhancement`, `phase-4a`, `backend`, `mobile`, `shared`
**Milestone:** v0.4.0 -- The Vision
**Size:** XL
**Priority:** critical
**Agent:** ARCHITECT + MOBILE
**Blocked by:** None (first in dependency chain)

### User Stories

- As a user who misses a day, I want my streak preserved by a freeze so that one bad day does not erase weeks of progress
- As a returning user after an absence, I want a special "welcome back" quest with bonus XP so that I feel encouraged rather than punished
- As a new user, I want to start with just one habit and gradually unlock more so that I am not overwhelmed on day one
- As a busy user, I want every quest to have a 2-minute minimum bar so that even on hard days I can complete something
- As an inactive user, I want gentle re-engagement notifications so that I feel missed rather than shamed

### Acceptance Criteria

#### AC-1: Streak Freezes

- [ ] AC-1.1: `User` model in Prisma (`apps/backend/prisma/schema.prisma`) gains four new fields: `streakFreezes Int @default(0)`, `maxStreakFreezes Int @default(3)`, `streakFreezeUsedAt DateTime?`, `lastActiveDate DateTime?`, `activeDaysCount Int @default(0)` -- applied via a new Prisma migration
- [ ] AC-1.2: `User` interface in `packages/shared/src/types.ts` gains matching fields: `streakFreezes: number`, `maxStreakFreezes: number`, `streakFreezeUsedAt?: string`, `lastActiveDate?: string`, `activeDaysCount: number`
- [ ] AC-1.3: New `StreakFreezeResult` interface in `packages/shared/src/types.ts`: `{ used: boolean; freezesRemaining: number; streakPreserved: boolean }`
- [ ] AC-1.4: `STREAK_FREEZE_CONFIG` constant in `packages/shared/src/constants.ts`: `{ maxFreezes: 3, freezeEarnInterval: 7 }` (earn 1 freeze every 7 active days)
- [ ] AC-1.5: Utility `canUseStreakFreeze(user)` in `packages/shared/src/utils.ts` returns `true` only when `user.streakFreezes > 0` AND no freeze was already used today (compare `streakFreezeUsedAt` to current date in user's timezone)
- [ ] AC-1.6: Utility `applyStreakFreeze(user)` in `packages/shared/src/utils.ts` returns `StreakFreezeResult` with decremented freeze count and `used: true`, or `used: false` if no freezes available
- [ ] AC-1.7: Backend route `GET /api/streaks/status` (new file `apps/backend/src/routes/streaks.ts`) returns: `currentDayStreak`, `longestDayStreak`, `streakFreezes`, `maxStreakFreezes`, `freezeAvailable`, `comebackEligible`, `activeDaysCount`, `nextFreezeIn`
- [ ] AC-1.8: Backend route `POST /api/streaks/freeze` deducts one freeze from the user and sets `streakFreezeUsedAt` to now; returns `{ used: true, freezesRemaining, streakPreserved: true }`
- [ ] AC-1.9: Existing streak calculation in `apps/backend/src/lib/streaks.ts` modified to treat days with a freeze used as "streak-continuing" (not a break)
- [ ] AC-1.10: Auto-apply logic: when the streak midnight job (or next quest completion) detects a missed day and the user has freezes, a freeze is auto-applied without user intervention
- [ ] AC-1.11: Freeze count incremented by 1 (up to `maxStreakFreezes`) every `freezeEarnInterval` active days, tracked via `activeDaysCount`
- [ ] AC-1.12: Mobile UI shows freeze count on the streak display (HomeScreen streak section), with a snowflake/shield icon for each available freeze

#### AC-2: Comeback Quests

- [ ] AC-2.1: `ComebackQuest` interface in `packages/shared/src/types.ts` extends `Quest` with `bonusXPMultiplier: number` and `isComeback: true`
- [ ] AC-2.2: `COMEBACK_CONFIG` constant in `packages/shared/src/constants.ts`: `{ bonusXPMultiplier: 1.5, maxMissedDays: 7 }`
- [ ] AC-2.3: Utility `shouldOfferComebackQuest(lastActiveDate, now?)` in `packages/shared/src/utils.ts` returns `true` if the user missed 1--7 days (> 7 days = no comeback, user needs fresh start)
- [ ] AC-2.4: Utility `calculateComebackXP(baseXP)` in `packages/shared/src/utils.ts` returns `Math.floor(baseXP * COMEBACK_CONFIG.bonusXPMultiplier)`
- [ ] AC-2.5: Backend route `GET /api/streaks/comeback` returns a generated comeback quest (selected from simple Mental Wellness daily quests in `PREDEFINED_QUESTS`) with `bonusXPMultiplier` applied to `baseXP`
- [ ] AC-2.6: When a comeback quest is completed, the user's `lastActiveDate` resets and `activeDaysCount` restarts from 1
- [ ] AC-2.7: Mobile displays a "Welcome Back" card on HomeScreen when `comebackEligible` is true, showing the comeback quest with its 1.5x XP bonus highlighted

#### AC-3: Progressive Onboarding

- [ ] AC-3.1: `PROGRESSIVE_ONBOARDING` constant in `packages/shared/src/constants.ts`: `{ initialQuestLimit: 1, daysToUnlockMore: 3, maxQuestsPerUnlock: 2 }`
- [ ] AC-3.2: New `User` field in Prisma: `onboardingStage Int @default(0)` -- tracks how many quest unlocks the user has earned
- [ ] AC-3.3: On first login / account creation, user starts with `onboardingStage = 0` and can activate exactly 1 quest
- [ ] AC-3.4: Backend `POST /api/quests/activate` enforces: `maxActiveQuests = initialQuestLimit + (onboardingStage * maxQuestsPerUnlock)`, returns 400 with message "Complete 3 more active days to unlock additional quests" when limit reached
- [ ] AC-3.5: After every 3 active days (tracked via `activeDaysCount`), `onboardingStage` increments by 1 and the user sees a "New quest slot unlocked!" celebration
- [ ] AC-3.6: Once `onboardingStage >= 5` (11+ quest slots), progressive limit is removed and standard `MAX_ACTIVE_QUESTS` (50) applies
- [ ] AC-3.7: Onboarding progress shown in Settings or a dedicated progress indicator: "X active days until your next quest slot"

#### AC-4: 2-Minute Minimum Quest Bars

- [ ] AC-4.1: `MINIMUM_QUEST_DURATION_MINUTES` constant in `packages/shared/src/constants.ts` set to `2`
- [ ] AC-4.2: Every predefined quest in `PREDEFINED_QUESTS` retains its full target (e.g., 10,000 steps) but the completion UI shows a "minimum bar" at the 2-minute mark: "Even 2 minutes of walking counts"
- [ ] AC-4.3: Custom quest creation form in `apps/mobile/src/screens/quests/AddQuestScreen.tsx` adds an optional "minimum bar" field (defaults to 2 minutes)
- [ ] AC-4.4: Quest completion recognizes minimum-bar completions as valid; XP credit policy (full credit vs. partial credit) is an **open design question requiring founder sign-off** -- see Design Notes for tradeoffs
- [ ] AC-4.5: HomeScreen quest cards show both minimum and full bars visually (e.g., a progress bar with a marker at the 2-minute point)
- [ ] AC-4.6: Backend `POST /api/quests/:id/complete` accepts an optional `durationMinutes` field; if `durationMinutes >= MINIMUM_QUEST_DURATION_MINUTES` but below full target, the completion is recorded with a `minimumBar: true` flag -- XP multiplier is configurable pending founder decision on AC-4.4

#### AC-5: Gentle Re-engagement Notifications

- [ ] AC-5.1: New notification templates in `apps/backend/src/routes/notifications.ts` (or a new `apps/backend/src/services/reengagement.ts`): "We missed you! Here's a quick quest to get back on track", "Your [quest name] streak is at risk -- want to use a freeze?", "It's been [X] days -- a 2-minute [quest name] could turn your day around"
- [ ] AC-5.2: Notification tone is always compassionate -- never uses language like "You broke your streak" or "You failed" or "Don't lose your progress"
- [ ] AC-5.3: Re-engagement notification sent after 24h of inactivity, then again at 48h and 72h, then stops (no spam)
- [ ] AC-5.4: If the user has streak freezes available, the 24h notification mentions the freeze option
- [ ] AC-5.5: Mobile notification settings (`UserSettings`) gains a `gentleRemindersEnabled: boolean` toggle (defaults to `true`), allowing users to opt out of re-engagement notifications separately from other notifications
- [ ] AC-5.6: Push notifications delivered via existing Expo push infrastructure (`apps/mobile/src/services/notifications/notificationService.ts`)

### Technical Requirements

**Prisma migration** (single migration for all User model changes):
- New fields on `User`: `streakFreezes`, `maxStreakFreezes`, `streakFreezeUsedAt`, `lastActiveDate`, `activeDaysCount`, `onboardingStage`
- File: `apps/backend/prisma/migrations/<timestamp>_compassionate_streaks/migration.sql`

**Shared package changes** (`packages/shared/src/`):
- `types.ts`: Add `StreakFreezeResult`, `ComebackQuest`, extend `User` interface with new fields
- `constants.ts`: Add `STREAK_FREEZE_CONFIG`, `COMEBACK_CONFIG`, `PROGRESSIVE_ONBOARDING`, `MINIMUM_QUEST_DURATION_MINUTES`
- `utils.ts`: Add `canUseStreakFreeze`, `applyStreakFreeze`, `shouldOfferComebackQuest`, `calculateComebackXP`

**Backend changes** (`apps/backend/src/`):
- New route file: `routes/streaks.ts` with endpoints `/api/streaks/status`, `/api/streaks/freeze`, `/api/streaks/comeback`
- Register in `app.ts` or `index.ts`: `app.use('/api/streaks', streaksRouter)`
- Modify: `lib/streaks.ts` to respect freeze days in streak calculation
- Modify: `routes/quests.ts` to enforce progressive onboarding limits on activation and accept `durationMinutes` on completion
- New service or extend `routes/notifications.ts`: re-engagement notification scheduling logic

**Mobile changes** (`apps/mobile/src/`):
- New Redux slice or extend `store/slices/questsSlice.ts` with streak freeze state
- New API calls in `services/api.ts`: `getStreakStatus()`, `useStreakFreeze()`, `getComebackQuest()`
- Modify: `screens/home/HomeScreen.tsx` to show freeze icons, comeback card, minimum bars
- Modify: `screens/quests/AddQuestScreen.tsx` to add minimum bar field
- Modify: `screens/settings/SettingsScreen.tsx` to add gentle reminders toggle

**Note:** A working prototype of the freeze/comeback backend and shared utilities exists in worktree `agent-a2f56d0dfbbb05c5d`. Implementers should review that branch before starting.

### Test Plan

**Unit tests (shared):**
- `packages/shared/src/__tests__/streaks.test.ts`: `canUseStreakFreeze` (has freezes / no freezes / already used today / yesterday used), `applyStreakFreeze` (success / failure / edge: 0 freezes), `shouldOfferComebackQuest` (1 day missed / 7 days missed / 8 days missed / 0 days missed), `calculateComebackXP` (standard / 0 baseXP / rounding)
- Progressive onboarding limit calculation tests
- Minimum XP calculation at 50% rate

**Unit tests (backend):**
- `apps/backend/src/__tests__/routes/streaks.test.ts`: GET `/status` (authenticated / unauthenticated / user not found), POST `/freeze` (success / no freezes / already used today), GET `/comeback` (eligible / not eligible / no activity history)
- Modified quests route: activation respects onboarding stage limit, completion accepts durationMinutes

**Mobile tests:**
- Comeback card renders when eligible, hides when not
- Freeze icons display correct count
- Minimum bar UI shows both thresholds
- Gentle reminders toggle persists to settings

**Manual test cases:**
- MT-79-1: Miss a day with freezes available -- verify streak preserved
- MT-79-2: Miss a day with zero freezes -- verify streak resets
- MT-79-3: Return after 3-day absence -- verify comeback quest appears with 1.5x XP
- MT-79-4: Return after 10-day absence -- verify comeback quest does NOT appear
- MT-79-5: New user -- verify can only activate 1 quest initially
- MT-79-6: After 3 active days -- verify 2 more quest slots unlock
- MT-79-7: Complete 2-minute minimum of a 30-minute quest -- verify minimum-bar completion is recorded and XP is awarded per the configured credit policy
- MT-79-8: Receive re-engagement notification after 24h -- verify compassionate tone

### Design Notes

- **Behavioral psychology rationale:** Punitive streak mechanics cause anxiety and eventual churn. Research shows that "loss aversion" messaging (e.g., "Don't lose your streak!") creates short-term engagement spikes but long-term negative associations with the app. Compassionate framing ("We missed you!") builds genuine habit identity.
- **Finch model:** Finch's compassionate approach grew them to ~$30M ARR by making users feel supported rather than judged. DYDYD adopts this tone.
- **Duolingo model:** Streak freezes are directly inspired by Duolingo's mechanic, which drove 36% YoY DAU growth. The key insight: giving users a "save" makes the streak feel achievable rather than fragile.
- **Fabulous model:** Progressive onboarding (start with one habit, add more gradually) is inspired by The Fabulous app, which uses behavioral science to prevent new-user overwhelm.
- **2-minute minimum:** Based on BJ Fogg's "Tiny Habits" framework -- if the bar is so low "you'd feel silly saying no," users build the routine. Full completion is the goal; minimum completion preserves momentum.
- **OPEN QUESTION -- Minimum-bar XP credit (AC-4.4):** Should completing the 2-minute minimum earn **full XP** or **partial XP** (e.g., 50%)? This is a values decision that requires founder sign-off:
  - **Option A -- Full credit:** Aligns with AC-5.2 ("never make the user feel they failed"). The 2-minute bar exists to make starting effortless; penalizing it with reduced XP reintroduces exactly the guilt this feature is designed to eliminate. Finch model: every interaction is celebrated equally.
  - **Option B -- Partial credit (50%):** Creates a clear incentive to do the full quest. Gamification best practice: differentiated rewards drive engagement curves. Duolingo model: completing a partial lesson gives less XP than a full one.
  - **Recommendation:** Lean toward full credit for MVP to validate the compassionate positioning. A/B test partial credit in a later phase once baseline retention data exists. Implement the backend with a configurable multiplier (`MINIMUM_BAR_XP_MULTIPLIER`) so the decision is a config change, not a code change.

---

## Issue #80: iOS Interactive Widgets

**Labels:** `enhancement`, `phase-4a`, `mobile`, `ios`
**Milestone:** v0.4.0 -- The Vision
**Size:** XL
**Priority:** critical
**Agent:** MOBILE
**Blocked by:** CNG migration (#62 -- Swift widget code must move to Expo config plugins for EAS Build compatibility)

### User Stories

- As a user, I want to see my streak count and daily XP ring on my homescreen so that I stay motivated at a glance
- As a user, I want to check off my top 3 quests directly from a widget so that I can complete habits without opening the app
- As a user, I want a full daily dashboard widget so that my homescreen replaces a habit-tracking app entirely
- As a user, I want my widget to work in StandBy Mode so that my nightstand becomes a progress dashboard while charging
- As a user, I want real-time quest timer progress on my Lock Screen so that I can see countdown status during focus sessions

### Acceptance Criteria

#### AC-1: Widget Infrastructure

- [ ] AC-1.1: `expo-apple-targets` (or equivalent Expo config plugin) configured to generate a WidgetKit extension target during `npx expo prebuild`
- [ ] AC-1.2: App Group `group.com.dydyd.app` configured in both the main app entitlements and the widget extension entitlements
- [ ] AC-1.3: New RN-side service `apps/mobile/src/services/widgetData.ts` that writes `WidgetData` (from `@dydyd/shared` types) to App Group `UserDefaults` as JSON, keyed by `widgetData`
- [ ] AC-1.4: `widgetData.ts` is called on every quest completion, quest activation/deactivation, and app foreground event to keep widget data fresh
- [ ] AC-1.5: Widget reads from `UserDefaults(suiteName: "group.com.dydyd.app")` via `loadWidgetData()` helper (already prototyped in `widgets/WidgetData.swift`)
- [ ] AC-1.6: Widget schedules timeline refreshes every 15 minutes via `TimelineProvider` (already prototyped in `widgets/DYDYDTimelineProvider.swift`)
- [ ] AC-1.7: All Swift widget code lives in `apps/mobile/widgets/` and is included in the build via Expo config plugin (CNG-compatible, no committed Xcode project)

#### AC-2: Small Widget (Streak + XP Ring)

- [ ] AC-2.1: `systemSmall` widget family displays: circular XP progress ring (dailyXP / dailyGoal), streak count with flame icon, current level number
- [ ] AC-2.2: XP ring color matches design system category colors from `CATEGORY_METADATA`
- [ ] AC-2.3: If no data loaded (first install, no login), widget shows placeholder text "Open DYDYD to get started"
- [ ] AC-2.4: Tapping the widget deep-links to HomeScreen via URL scheme `dydyd://home`
- [ ] AC-2.5: Widget renders correctly on all iPhone sizes (SE to Pro Max)

#### AC-3: Medium Widget (Top 3 Quests)

- [ ] AC-3.1: `systemMedium` widget displays the top 3 uncompleted quests for today (from `WidgetData.topQuests`), each with: quest name, icon, XP value, and an interactive check button (via `AppIntent`)
- [ ] AC-3.2: Tapping a quest's check button writes a `PendingCompletion` (already prototyped in `WidgetData.swift`) to App Group `UserDefaults` and triggers a timeline reload
- [ ] AC-3.3: When the main app foregrounds, it reads `widgetPendingCompletionsKey` from `UserDefaults`, processes each pending completion via the existing quest completion Redux thunk, and clears the pending list
- [ ] AC-3.4: Completed quests in the widget show a checkmark overlay and dimmed styling
- [ ] AC-3.5: If fewer than 3 quests remain, widget shows "All done for today!" in the empty slots
- [ ] AC-3.6: Quest order matches the order from `widgetData.ts` (priority-sorted by category priority, then by XP descending)

#### AC-4: Large Widget (Full Dashboard)

- [ ] AC-4.1: `systemLarge` widget displays: XP progress ring (same as small), streak count with flame, top 5 quests with check buttons, completed/total quest count, level and level title
- [ ] AC-4.2: Dashboard shows today's date and a motivational quote or progress summary line (e.g., "3 of 8 quests done -- keep going!")
- [ ] AC-4.3: Interactive check buttons function identically to medium widget (AppIntent + PendingCompletion)
- [ ] AC-4.4: Widget updates immediately after a completion (via timeline reload triggered by the AppIntent)
- [ ] AC-4.5: Visual design uses the app's color palette with proper dark mode support via `@Environment(\.colorScheme)`

#### AC-5: StandBy Mode + Live Activities

- [ ] AC-5.1: Small and medium widgets render in StandBy Mode (iOS 17+) when iPhone is in landscape charging orientation -- verified on a physical device
- [ ] AC-5.2: StandBy rendering uses high-contrast colors suitable for nightstand distance viewing
- [ ] AC-5.3: Live Activity configuration added for quest timers: when a user starts a timed quest (e.g., "Meditate 10 minutes"), a Dynamic Island / Lock Screen Live Activity shows elapsed time and a progress ring
- [ ] AC-5.4: Live Activity uses `ActivityKit` framework and `ActivityAttributes` struct defined in the widget extension
- [ ] AC-5.5: Live Activity auto-dismisses when the timer completes or the quest is marked done
- [ ] AC-5.6: If the device does not support Dynamic Island, the Live Activity appears on the Lock Screen only

### Technical Requirements

**Expo config plugin** (CNG-compatible):
- New file: `apps/mobile/plugins/withDYDYDWidgets.js` (or `.ts`) -- Expo config plugin that adds the WidgetKit extension target, App Groups entitlement, and links the `widgets/` Swift source files
- Modify: `apps/mobile/app.json` to register the config plugin
- Ensure `npx expo prebuild --clean --platform ios` generates a buildable Xcode project with the widget target

**Swift widget files** (`apps/mobile/widgets/`):
- Already prototyped: `WidgetData.swift`, `DYDYDWidgetBundle.swift`, `DYDYDTimelineProvider.swift`, `DYDYDSmallWidget.swift`, `DYDYDMediumWidget.swift`, `DYDYDLargeWidget.swift`, `ColorExtension.swift`
- New: `DYDYDAppIntent.swift` for interactive check button handling (iOS 17 App Intents)
- New: `DYDYDLiveActivity.swift` for quest timer Live Activities
- New: `DYDYDStandByModifier.swift` for StandBy-specific rendering adjustments

**React Native service** (`apps/mobile/src/services/`):
- New: `widgetData.ts` -- writes `WidgetData` JSON to App Group UserDefaults via `react-native-shared-group-preferences` or `expo-shared-preferences`
- Modify: `store/slices/questsSlice.ts` -- call `widgetData.update()` after quest completion/activation thunks fulfill
- Modify: `App.tsx` or `RootNavigator.tsx` -- on `AppState` change to 'active', read and process pending widget completions

**Shared package** (`packages/shared/src/types.ts`):
- `WidgetData` and `WidgetQuest` interfaces already exist -- no changes needed unless new fields are required for Live Activities

### Test Plan

**Unit tests (mobile):**
- `widgetData.ts` service: serializes `WidgetData` correctly, handles empty quest list, handles missing user defaults gracefully
- Pending completion processing: reads array, dispatches correct thunks, clears after processing
- Widget data update triggered on quest completion / activation / deactivation

**Unit tests (shared):**
- `WidgetData` / `WidgetQuest` type conformance tests (already covered by existing type tests)

**Manual test cases:**
- MT-80-1: Add small widget to homescreen -- verify streak count and XP ring render correctly
- MT-80-2: Add medium widget -- verify 3 quests displayed with correct names and XP
- MT-80-3: Tap check button on medium widget -- verify quest marked complete, XP updates when app opens
- MT-80-4: Add large widget -- verify full dashboard with 5 quests, date, and progress summary
- MT-80-5: Place iPhone in StandBy Mode -- verify widget renders in landscape, high-contrast
- MT-80-6: Start a timed quest -- verify Live Activity appears on Dynamic Island / Lock Screen
- MT-80-7: Complete all quests -- verify "All done for today!" message in medium/large widget
- MT-80-8: Force-quit the app, complete a quest via widget, re-open app -- verify completion processed
- MT-80-9: Verify widget renders correctly in dark mode
- MT-80-10: Verify widget renders on iPhone SE (smallest) and Pro Max (largest)

### Design Notes

- **"Replace the homescreen" vision:** The large widget IS the product for many users. It should feel like a native iOS dashboard, not an embedded app view. Follow Apple's Human Interface Guidelines for widget density and interaction patterns.
- **Interactive widgets require iOS 17+:** The `AppIntent`-based buttons are only available on iOS 17. On iOS 16, widgets are tap-to-open-app only. The widget should degrade gracefully: same visual layout, but tapping any area opens the app.
- **Timeline refresh limits:** WidgetKit limits timeline refreshes. The 15-minute refresh interval plus completion-triggered reloads should keep data fresh without hitting system limits. Do not request refreshes more frequently.
- **App Group data size:** Keep `WidgetData` JSON minimal. Only the top 5 quests with essential fields. Do not serialize full `UserQuest` objects.

---

## Issue #81: Apple Watch Companion App

**Labels:** `enhancement`, `phase-4a`, `mobile`, `watchos`
**Milestone:** v0.4.0 -- The Vision
**Size:** XL
**Priority:** high
**Agent:** MOBILE
**Blocked by:** CNG migration (#62 -- WatchOS target must be generated via Expo config plugin for EAS Build)

### User Stories

- As a user wearing an Apple Watch, I want to see my quests and complete them from my wrist so that I do not need to pull out my phone
- As a user, I want my streak and progress ring on my watch face so that I can check my status at a glance
- As a user, I want gentle haptic reminders on my wrist for upcoming quests so that I stay on track without phone notifications
- As a user, I want my Watch to automatically log health activities so that walking, workouts, and sleep count toward my quests without manual input

### Acceptance Criteria

#### AC-1: WatchConnectivity Bridge

- [ ] AC-1.1: `react-native-watch-connectivity` package installed and configured via Expo config plugin (bare workflow required for WatchOS target)
- [ ] AC-1.2: Existing `apps/mobile/src/services/wearables/watchConnectivityService.ts` refactored from placeholder `NativeModules` calls to use `react-native-watch-connectivity` API: `getReachability()`, `sendMessage()`, `updateApplicationContext()`, `transferUserInfo()`
- [ ] AC-1.3: `WatchMessageType` enum (already defined in `watchConnectivityService.ts`) used for all bidirectional messages: `SYNC_QUESTS`, `QUEST_COMPLETED`, `SYNC_PROGRESS`, `REQUEST_SYNC`, `UPDATE_COMPLICATIONS`
- [ ] AC-1.4: `updateApplicationContext` used for background sync (quest list, progress) -- survives Watch/phone disconnect
- [ ] AC-1.5: `sendMessage` used for real-time interactions when phone is reachable (quest completion acknowledgment)
- [ ] AC-1.6: Bridge handles graceful degradation: if Watch is not paired/reachable, all send operations return `false` silently (no error toast)

#### AC-2: Watch App -- Quest List + Quick-Complete

- [ ] AC-2.1: WatchOS SwiftUI app displays today's active quests in a `List` view, each showing: quest name (truncated to 2 lines), icon, XP value, completion count (e.g., "1/2"), and a "Complete" button
- [ ] AC-2.2: Tapping "Complete" sends a `QUEST_COMPLETED` message to the phone via `sendMessage` (if reachable) or queues via `transferUserInfo` (if not reachable)
- [ ] AC-2.3: Quest data synced from phone via `updateApplicationContext` -- Watch app works offline with last-synced data
- [ ] AC-2.4: Completed quests show a checkmark and dimmed styling; fully-completed quests (at `maxCompletionsPerPeriod`) are moved to a "Done" section
- [ ] AC-2.5: Pull-to-refresh sends `REQUEST_SYNC` message to phone and updates quest list when response arrives
- [ ] AC-2.6: Watch data shape follows existing `WatchData` and `WatchQuest` interfaces from `packages/shared/src/types.ts`

#### AC-3: Complications (Streak + Progress Ring)

- [ ] AC-3.1: `CLKComplicationDescriptor` registered for `graphicCircular` family: shows daily XP progress ring (dailyXP / dailyGoal) with streak count in the center
- [ ] AC-3.2: `CLKComplicationDescriptor` registered for `graphicCorner` family: shows streak count with flame icon
- [ ] AC-3.3: `CLKComplicationDescriptor` registered for `modularSmall` family: shows streak count number
- [ ] AC-3.4: Complications update when `UPDATE_COMPLICATIONS` message is received from phone, and on a 15-minute background refresh schedule
- [ ] AC-3.5: Complication data sourced from `WatchData` synced via `updateApplicationContext`

#### AC-4: Haptic Reminders

- [ ] AC-4.1: Watch app registers for local notifications at quest `reminderTime` times (synced from `UserQuest.reminderTime`)
- [ ] AC-4.2: Haptic pattern uses `WKInterfaceDevice.current().play(.notification)` for quest reminders -- a gentle single tap, not an alarm
- [ ] AC-4.3: Reminder notification displays quest name and "Tap to complete" action
- [ ] AC-4.4: Tapping the notification action deep-links to the quest in the Watch app's quest list
- [ ] AC-4.5: Haptic reminders respect the user's `notificationsEnabled` and `hapticFeedbackEnabled` settings (synced from phone)
- [ ] AC-4.6: Reminders are re-scheduled whenever quest data syncs from phone (new reminder times, deactivated quests)

#### AC-5: HealthKit Auto-Logging from Watch

- [ ] AC-5.1: Watch app requests HealthKit permissions for: step count, active energy, workout sessions, sleep analysis, mindful minutes
- [ ] AC-5.2: Background delivery configured via `HKObserverQuery` for steps, workouts, and sleep -- triggers auto-completion check without opening the Watch app
- [ ] AC-5.3: When HealthKit data meets a quest's `targetValue` (e.g., steps >= 10,000), the Watch sends a `QUEST_COMPLETED` message with `source: "apple_health"` to the phone
- [ ] AC-5.4: Phone-side `watchConnectivityService` receives the completion, dispatches the existing `completeQuest` thunk with `source: HealthDataSource.APPLE_HEALTH`, and sends an acknowledgment back
- [ ] AC-5.5: Auto-completion respects `maxCompletionsPerPeriod` -- if the quest is already at max for the period, no duplicate completion is created
- [ ] AC-5.6: Health data matching uses the same metric-to-quest matching logic as the existing `apps/backend/src/routes/health.ts` endpoint (match on `healthDataType` field)

### Technical Requirements

**Expo config plugin** (CNG-compatible):
- New file: `apps/mobile/plugins/withDYDYDWatch.js` (or `.ts`) -- Expo config plugin that adds the WatchOS app target, WatchConnectivity framework, HealthKit entitlement (Watch), and App Groups entitlement
- Modify: `apps/mobile/app.json` to register the config plugin
- Ensure `npx expo prebuild --clean --platform ios` generates a buildable Xcode project with both the widget and Watch targets

**WatchOS SwiftUI app** (`apps/mobile/watchos/` -- new directory):
- `DYDYDWatchApp.swift` -- App entry point
- `QuestListView.swift` -- Main quest list
- `QuestRowView.swift` -- Individual quest row with complete button
- `ProgressView.swift` -- Daily progress summary
- `ComplicationController.swift` -- Complication data source
- `HealthKitManager.swift` -- Watch-side HealthKit queries and background delivery
- `ConnectivityManager.swift` -- WatchConnectivity delegate handling

**React Native changes** (`apps/mobile/src/`):
- Modify: `services/wearables/watchConnectivityService.ts` -- replace NativeModules placeholder with `react-native-watch-connectivity`
- Modify: `store/slices/questsSlice.ts` or `store/slices/healthSlice.ts` -- handle incoming `QUEST_COMPLETED` messages from Watch
- New: `services/wearables/watchDataSync.ts` -- orchestrates `updateApplicationContext` calls with current quest/progress data, triggered on quest changes and periodic background task

**Shared package** (`packages/shared/src/types.ts`):
- `WatchSyncPayload`, `WatchData`, `WatchQuest` interfaces already exist -- no changes needed

### Test Plan

**Unit tests (mobile):**
- `watchConnectivityService.ts`: message sending (reachable / not reachable), context updates, handler registration/removal, graceful degradation
- `watchDataSync.ts`: syncs correct data shape, handles empty quest list, respects complication data format

**Unit tests (shared):**
- `WatchData` / `WatchQuest` type conformance tests (already covered by existing type tests)

**Manual test cases (requires macOS + Xcode + Apple Watch):**
- MT-81-1: Open Watch app -- verify quest list matches phone's active quests
- MT-81-2: Tap "Complete" on Watch -- verify completion reflected on phone within 5 seconds (if reachable)
- MT-81-3: Put phone in airplane mode, complete quest on Watch -- verify completion syncs when phone reconnects
- MT-81-4: Add complication to watch face -- verify streak count and progress ring display
- MT-81-5: Walk 10,000 steps with Watch -- verify step-based quest auto-completes
- MT-81-6: Receive haptic reminder at scheduled time -- verify gentle tap and correct quest name
- MT-81-7: Deactivate a quest on phone -- verify Watch quest list updates on next sync
- MT-81-8: Complete all quests -- verify Watch shows "All done" state

### Design Notes

- **Watch app is standalone-lite:** It works with last-synced data when the phone is out of range, but requires the phone for initial setup and backend sync. True standalone (with direct API calls from Watch) is a Phase 5+ consideration.
- **EAS Build is mandatory:** WatchOS targets cannot be built locally on Windows. All Watch builds require EAS Build (cloud) or a macOS machine. The macOS secondary machine handles local testing.
- **HealthKit on Watch vs. Phone:** The Watch gets more accurate real-time health data (step count, heart rate) than the phone. When both are available, Watch data takes priority for auto-completion.
- **Battery consideration:** Background HealthKit delivery and complication refreshes must be throttled. Use `HKObserverQuery` (system-managed cadence) rather than polling. Complication refreshes limited to 4 per hour per Apple guidelines.

---

## Issue #82 (proposed): History Logging MVP

**Labels:** `enhancement`, `phase-4a`, `backend`, `mobile`, `shared`
**Milestone:** v0.4.0 -- The Vision
**Size:** L
**Priority:** high
**Agent:** ARCHITECT + MOBILE
**Blocked by:** None

**PRD Reference:** `specs/phase-1/prd-history-logging.md` (APPROVED)

> **Scope note:** This issue implements the MVP subset of the History Logging PRD. The following PRD user stories are explicitly **out of scope for Phase 4A** and deferred to Phase 5 (Intelligence):
> - US-2: Timing pattern insights ("Completed 1h earlier than your average")
> - US-4: Time-of-day badges (Early Bird, Night Owl, Steady Eddie, Dawn Patrol)
> - US-5: Analytics dashboard (completion heat map, per-category trends)
> - US-6: Widget/Watch pace indicator ("2 ahead of your usual pace")

### User Stories

- As a user, I want every quest completion to silently record the time-of-day bucket so that the app builds a picture of my routines over time (US-1)
- As a user, I want to see a weekly digest when I open the app on Monday so that I know how my week went compared to the previous one (US-3)
- As a user, I want to browse my recent completion history so that I can reflect on what I have accomplished

### Acceptance Criteria

#### AC-1: TimeBucket Enum + Migration

- [ ] AC-1.1: New `TimeBucket` enum in `packages/shared/src/types.ts`: `EARLY_MORNING` (4am--7am), `MORNING` (7am--12pm), `AFTERNOON` (12pm--5pm), `EVENING` (5pm--9pm), `NIGHT` (9pm--4am)
- [ ] AC-1.2: `QuestCompletion` interface in `packages/shared/src/types.ts` gains `timeBucket: TimeBucket` field
- [ ] AC-1.3: Prisma `QuestCompletion` model in `apps/backend/prisma/schema.prisma` gains `timeBucket String?` field (nullable for backward compatibility with existing completions)
- [ ] AC-1.4: New Prisma migration applied: `apps/backend/prisma/migrations/<timestamp>_add_time_bucket/migration.sql`
- [ ] AC-1.5: New utility `getTimeBucket(timestamp: Date, timezone: string): TimeBucket` in `packages/shared/src/utils.ts` that converts a timestamp to the correct bucket in the user's configured timezone (not UTC)

#### AC-2: Silent Completion Logging

- [ ] AC-2.1: Backend `POST /api/quests/:id/complete` (in `apps/backend/src/routes/quests.ts`) auto-populates `timeBucket` on every new `QuestCompletion` record by calling `getTimeBucket(completedAt, userTimezone)` -- no client input required
- [ ] AC-2.2: Backend `POST /api/health/sync` (in `apps/backend/src/routes/health.ts`) auto-populates `timeBucket` on auto-completed quest completions using the health data timestamp (not the sync timestamp)
- [ ] AC-2.3: `timeBucket` is included in the `QuestCompletion` response body for both manual and health-sync completions
- [ ] AC-2.4: Edge case: if `completedAt` is provided by the client (retroactive logging via `CompleteQuestRequest.completedAt`), `timeBucket` is calculated from that timestamp, not `now()`

#### AC-3: Weekly Digest Modal

- [ ] AC-3.1: New component `apps/mobile/src/components/WeeklyDigestModal.tsx` that displays: total completions this week, total XP earned, current streak length, quests completed per day (7-day bar chart or list), and week-over-week comparison
- [ ] AC-3.2: Week-over-week comparison shows absolute change and percentage: "12 quests, up from 9 last week (+33%)" or "7 quests, down from 12 last week (-42%)" -- honest reporting, no hiding of dips
- [ ] AC-3.3: Modal triggers once per week on the first app open on or after Monday (based on user's `weeklyResetDay` setting, default Sunday)
- [ ] AC-3.4: "Shown this week" flag persisted via AsyncStorage to prevent re-showing on subsequent app opens during the same week
- [ ] AC-3.5: Modal has a "Dismiss" button and a "View Details" button that navigates to the Progress screen
- [ ] AC-3.6: If no previous week data exists (user's first week), modal shows absolute stats only with message "Your first week! Here's how it went:"
- [ ] AC-3.7: Backend endpoint `GET /api/progress/weekly` already returns the data needed -- no new endpoint required, but response should include `previousWeekXP` and `previousWeekCompletions` fields for comparison

#### AC-4: Completion History List

- [ ] AC-4.1: New component `apps/mobile/src/components/CompletionHistoryList.tsx` that renders a chronological list of recent completions, each showing: quest name, category color dot, time bucket label (e.g., "Morning"), relative time ("2 hours ago"), and XP earned
- [ ] AC-4.2: List is paginated (20 items per page) with infinite scroll, sourced from a new backend endpoint `GET /api/progress/history?page=1&perPage=20`
- [ ] AC-4.3: Backend `GET /api/progress/history` (new route in `apps/backend/src/routes/progress.ts`) returns `QuestCompletion` records joined with quest name and category, ordered by `completedAt DESC`, with standard pagination meta
- [ ] AC-4.4: Completion history list embedded in the Progress screen (`apps/mobile/src/screens/progress/ProgressScreen.tsx`) as a new tab or section below existing stats
- [ ] AC-4.5: Each history item is tappable and navigates to the quest detail screen for that quest
- [ ] AC-4.6: Empty state: "No completions yet -- complete your first quest to start tracking!"

### Technical Requirements

**Prisma migration:**
- Add `timeBucket String?` to `QuestCompletion` model
- File: `apps/backend/prisma/migrations/<timestamp>_add_time_bucket/migration.sql`
- Nullable to avoid breaking existing completion records that lack a bucket

**Shared package changes** (`packages/shared/src/`):
- `types.ts`: Add `TimeBucket` enum, add `timeBucket` field to `QuestCompletion`
- `utils.ts`: Add `getTimeBucket(timestamp, timezone)` function

**Backend changes** (`apps/backend/src/`):
- Modify: `routes/quests.ts` -- call `getTimeBucket` on completion creation
- Modify: `routes/health.ts` -- call `getTimeBucket` on auto-completion creation
- Modify: `routes/progress.ts` -- add `GET /api/progress/history` endpoint, extend `GET /api/progress/weekly` response with previous-week comparison fields
- Timezone lookup: use `userSettings.timezone` (already stored) to convert UTC timestamps

**Mobile changes** (`apps/mobile/src/`):
- New: `components/WeeklyDigestModal.tsx`
- New: `components/CompletionHistoryList.tsx`
- Modify: `screens/progress/ProgressScreen.tsx` -- embed completion history
- Modify: `App.tsx` or `RootNavigator.tsx` -- weekly digest modal trigger on app foreground
- New: AsyncStorage key `lastWeeklyDigestShown` for deduplication

### Test Plan

**Unit tests (shared):**
- `getTimeBucket`: returns correct bucket for each hour boundary (4am, 7am, 12pm, 5pm, 9pm), handles midnight, handles timezone conversion (UTC+5 at 11pm UTC = EARLY_MORNING in UTC+5), handles DST transitions

**Unit tests (backend):**
- Quest completion route: `timeBucket` auto-populated on creation, correct bucket for given `completedAt`
- Health sync route: `timeBucket` uses health data timestamp, not sync time
- Progress history endpoint: pagination, ordering, empty result set, join includes quest name/category
- Weekly progress: includes previous-week comparison fields

**Mobile tests:**
- `WeeklyDigestModal`: renders stats, shows comparison, handles first-week case, dismiss button works, deduplication flag set
- `CompletionHistoryList`: renders items with correct fields, pagination triggers, empty state, navigation on tap

**Manual test cases:**
- MT-82-1: Complete a quest at 8am -- verify `timeBucket` is `MORNING` in the API response
- MT-82-2: Complete a quest at 3am -- verify `timeBucket` is `NIGHT`
- MT-82-3: Open app on Monday for the first time -- verify weekly digest modal appears
- MT-82-4: Dismiss digest, close and reopen app -- verify modal does NOT reappear
- MT-82-5: Navigate to Progress screen -- verify completion history list with recent items
- MT-82-6: Scroll to bottom of history list -- verify next page loads (infinite scroll)
- MT-82-7: User in UTC+9 completes quest at 6am local -- verify `timeBucket` is `EARLY_MORNING` (not `NIGHT` which it would be in UTC)

### Design Notes

- **Silent logging principle:** The user should never know that time-of-day bucketing is happening. There is no UI to select a bucket. The system infers it from the completion timestamp. This keeps the completion flow frictionless.
- **Honest reporting:** The weekly digest must show dips honestly. "7 quests, down from 12 last week" is correct. Do not add consolation language ("But you still did great!") -- the user is an adult and can handle truth. The compassionate streak design (freezes, comeback quests) provides the encouragement layer; the digest provides the data layer.
- **Timezone correctness is non-negotiable:** A user in Tokyo completing a quest at 6am local time must see `EARLY_MORNING`, not `NIGHT` (which is what UTC would show). All bucket calculations MUST use the user's `timezone` setting. This is the single most important edge case in this issue.
- **Foundation for Phase 5:** Every completion logged with `timeBucket` feeds the Phase 5 timing insights, time-of-day badges, and AI coach. Getting the data capture right now means Phase 5 is purely analytics and UI on top of existing data.

---

## Summary

| # | Issue | Size | Priority | Agent | Blocked by |
|---|-------|------|----------|-------|------------|
| 79 | Compassionate Streak Design | XL | critical | ARCHITECT + MOBILE | None |
| 80 | iOS Interactive Widgets | XL | critical | MOBILE | #62 (CNG migration) |
| 81 | Apple Watch Companion App | XL | high | MOBILE | #62 (CNG migration) |
| 82 | History Logging MVP | L | high | ARCHITECT + MOBILE | None |

**Recommended execution order** (by dependency and priority):

1. **Issue #79** (Compassionate Streak Design) -- no dependencies, unblocks compassionate UX across all surfaces; Prisma migration runs first
2. **Issue #82** (History Logging MVP) -- no dependencies, Prisma migration can run alongside #79; TimeBucket data capture begins immediately
3. **Issue #62** (CNG Migration, from Phase 4B) -- must complete before #80 and #81 can build; pulled forward as a prerequisite
4. **Issue #80** (iOS Widgets) -- depends on #62 for CNG build pipeline; can consume streak freeze data from #79
5. **Issue #81** (Apple Watch) -- depends on #62 for CNG build pipeline; consumes same data as #80; can run in parallel with #80 on Mac

**Cross-cutting concerns:**

- Issues #79 and #82 each require a Prisma migration. These should be separate migrations applied in sequence (compassionate streaks first, then time bucket). Never combine unrelated schema changes into a single migration.
- Issues #80 and #81 both depend on the CNG migration (#62) to generate native targets via Expo config plugins. Without #62, Swift code cannot be compiled via EAS Build.
- Widget data (#80) and Watch data (#81) both consume the same `WidgetData`/`WatchData` types from `@dydyd/shared`. Changes to these types must be coordinated.
- All four issues should set `UserSettings.timezone` consistently for streak freeze timing, bucket calculation, and notification scheduling.
