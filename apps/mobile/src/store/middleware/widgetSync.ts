// ============================================
// DYDYD - Widget Sync Middleware
// ============================================
// Redux middleware that syncs relevant state
// changes to the iOS widget via App Group
// UserDefaults. Listens for quest completions,
// streak updates, and XP changes, then writes
// the derived widget payload with debouncing.
// ============================================

import { Middleware, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { Platform, AppState, AppStateStatus } from 'react-native';
import {
  syncWidgetData,
  readPendingCompletions,
  clearPendingCompletions,
} from '@services/widgetData';
import { completeQuest } from '@store/slices/questsSlice';
import { HealthDataSource, UserQuest, QuestCompletion } from '@dydyd/shared';

// --------------- Constants ---------------

/** Minimum interval (ms) between widget data writes to avoid thrashing */
const DEBOUNCE_MS = 2000;

/**
 * Action type patterns that should trigger a widget sync.
 * We match on the action type string to catch both fulfilled
 * thunks and synchronous reducers.
 */
const SYNC_TRIGGER_PATTERNS = [
  // Quest completion (the most important trigger)
  'quests/complete/fulfilled',
  'quests/optimisticComplete',

  // Quest list changes
  'quests/fetchUserQuests/fulfilled',
  'quests/fetchTodayCompletions/fulfilled',
  'quests/activate/fulfilled',
  'quests/deactivate/fulfilled',

  // User stats changes (streak, XP)
  'progress/fetchStats/fulfilled',
  'user/addXPToProfile',
  'user/levelUp',

  // Redux Persist rehydration (sync widget on app launch)
  'persist/REHYDRATE',
] as const;

// --------------- Debounce state ---------------

let syncTimer: ReturnType<typeof setTimeout> | null = null;

// --------------- Middleware ---------------

/**
 * Middleware that watches for state changes relevant to the widget
 * and syncs the derived data to App Group UserDefaults.
 *
 * Also processes pending completions from the widget on app foreground.
 *
 * Note: We use Middleware (without RootState generic) to avoid a circular
 * type reference: RootState -> store -> middleware -> RootState. The state
 * is cast inside where needed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const widgetSyncMiddleware: Middleware = ((store: any) => {
  // Only install on iOS
  if (Platform.OS !== 'ios') {
    return (next: Dispatch<UnknownAction>) => (action: UnknownAction) => next(action);
  }

  // Listen for app state changes to drain widget completions
  const handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === 'active') {
      drainPendingCompletions(store.dispatch, store.getState);
    }
  };

  // Subscribe to app state changes
  AppState.addEventListener('change', handleAppStateChange);

  // Initial drain on middleware setup (app launch)
  setTimeout(() => {
    drainPendingCompletions(store.dispatch, store.getState);
  }, 3000); // Delay to let rehydration complete

  return (next: Dispatch<UnknownAction>) => (action: UnknownAction) => {
    const result = next(action);

    // Check if this action should trigger a widget sync
    const actionType = typeof action === 'object' && action !== null && 'type' in action
      ? (action as { type: string }).type
      : '';

    if (shouldTriggerSync(actionType)) {
      debouncedSync(store.getState);
    }

    return result;
  };
}) as Middleware;

// --------------- Helpers ---------------

function shouldTriggerSync(actionType: string): boolean {
  return SYNC_TRIGGER_PATTERNS.some((pattern) => actionType === pattern);
}

/**
 * Debounced sync to avoid writing to UserDefaults on every rapid action.
 * For example, if multiple quest completions are processed in quick
 * succession, we only write once after the burst.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debouncedSync(getState: () => any): void {
  if (syncTimer !== null) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    syncTimer = null;
    const state = getState();
    // Fire and forget -- widget sync is best-effort
    syncWidgetData(state).catch(() => {
      // Silently swallow errors; widget sync must never crash the app
    });
  }, DEBOUNCE_MS);
}

/**
 * Drain pending completions that were initiated from the widget.
 *
 * Design: The widget's AppIntent writes a pending completion entry
 * into the shared App Group UserDefaults. When the main app
 * foregrounds, we read those entries and dispatch completeQuest
 * thunks. This avoids putting auth tokens in the widget extension.
 */
async function drainPendingCompletions(
  dispatch: Dispatch<UnknownAction>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any,
): Promise<void> {
  try {
    const pending = await readPendingCompletions();
    if (pending.length === 0) return;

    // Process each pending completion
    for (const entry of pending) {
      const state = getState();
      const userQuest = (state.quests.userQuests as UserQuest[]).find(
        (uq: UserQuest) => uq.id === entry.userQuestId,
      );

      if (userQuest) {
        // Check if already completed today (avoid double-completion)
        const alreadyCompleted = (state.quests.todayCompletions as QuestCompletion[]).some(
          (c: QuestCompletion) => c.userQuestId === entry.userQuestId,
        );

        if (!alreadyCompleted) {
          // Cast dispatch to accept thunk actions -- the actual store.dispatch
          // supports thunks, but the Middleware generic type only exposes
          // Dispatch<UnknownAction>. This is safe because the store is
          // configured with the thunk middleware.
          const thunkDispatch = dispatch as unknown as (action: unknown) => unknown;
          thunkDispatch(
            completeQuest({
              userQuestId: entry.userQuestId,
              source: HealthDataSource.MANUAL,
              completedAt: new Date(entry.timestamp),
            }),
          );
        }
      }
    }

    // Clear processed completions
    await clearPendingCompletions();

    // Sync updated state back to widget
    const updatedState = getState();
    await syncWidgetData(updatedState);
  } catch {
    // Best-effort: if drain fails, completions stay pending for next foreground
  }
}

/**
 * Force an immediate widget sync. Useful for calling from
 * specific UI actions (e.g., manual refresh) without waiting
 * for the debounce.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function forceWidgetSync(getState: () => any): Promise<void> {
  if (Platform.OS !== 'ios') return;

  if (syncTimer !== null) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  await syncWidgetData(getState());
}

export default widgetSyncMiddleware;
