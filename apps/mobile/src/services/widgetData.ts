// ============================================
// DYDYD - Widget Data Service
// ============================================
// Manages serialization of app state to App Group
// UserDefaults so the iOS widget extension can
// read it. Uses react-native-widgetkit for the
// bridge (UserDefaults read/write + timeline reload).
// ============================================

import { Platform } from 'react-native';
import { QuestFrequency, QuestCompletion, UserQuest } from '@dydyd/shared';
import type { RootState } from '@store/index';

// --------------- Constants ---------------

/**
 * App Group identifier. Must be byte-identical in:
 *  1. app.json → ios.entitlements → com.apple.security.application-groups
 *  2. Widget extension entitlements (injected by config plugin)
 *  3. Both UserDefaults suite inits (RN + Swift)
 */
export const APP_GROUP_ID = 'group.com.dydyd.app';

/** UserDefaults key the widget reads */
export const WIDGET_DATA_KEY = 'widgetData';

/** UserDefaults key for pending widget completions (widget -> app) */
export const WIDGET_PENDING_COMPLETIONS_KEY = 'widgetPendingCompletions';

/** Default daily XP goal shown in the widget ring */
const DEFAULT_DAILY_XP_GOAL = 500;

// --------------- Lazy imports ---------------
// react-native-widgetkit is iOS-only and may not be linked yet.
// We lazy-import to avoid crashing Android or test environments.

interface WidgetKitModule {
  reloadAllTimelines: () => void;
  reloadTimelines: (ofKind: string) => void;
  setItem: (key: string, value: string, appGroup: string) => Promise<void>;
  getItem: (key: string, appGroup: string) => Promise<string | null>;
}

let widgetKitModule: WidgetKitModule | null = null;

async function getWidgetKit(): Promise<WidgetKitModule | null> {
  if (Platform.OS !== 'ios') return null;

  if (!widgetKitModule) {
    try {
      const mod = await import('react-native-widgetkit');
      widgetKitModule = (mod.default ?? mod) as WidgetKitModule;
    } catch {
      // Package not linked -- silently degrade
      return null;
    }
  }
  return widgetKitModule;
}

// --------------- Types ---------------

/** JSON-serializable shape written to UserDefaults */
export interface SerializedWidgetData {
  dailyXP: number;
  dailyGoal: number;
  questsRemaining: number;
  topQuests: SerializedWidgetQuest[];
  currentStreak: number;
  lastUpdated: string; // ISO 8601
}

export interface SerializedWidgetQuest {
  id: string;
  name: string;
  iconName: string;
  xp: number;
  isCompleted: boolean;
  progress: number; // 0-1
}

/**
 * Represents a quest completion initiated from the widget.
 * The main app drains these into the offline queue on foreground.
 */
export interface WidgetPendingCompletion {
  userQuestId: string;
  timestamp: string; // ISO 8601
}

// --------------- Core functions ---------------

/**
 * Derive the widget data payload from the current Redux state.
 * Pure function -- no side effects.
 */
export function deriveWidgetData(state: RootState): SerializedWidgetData {
  const userQuests = state.quests.userQuests;
  const completions = state.quests.todayCompletions;
  const completedIds = new Set(completions.map((c: QuestCompletion) => c.userQuestId));

  // Filter to today's active daily quests
  const dailyQuests = userQuests.filter(
    (uq: UserQuest) => uq.quest.frequency === QuestFrequency.DAILY && uq.isActive,
  );

  // Calculate today's XP from completions
  const dailyXP = completions.reduce((sum: number, c: QuestCompletion) => sum + c.xpEarned, 0);

  // Count remaining (not yet completed) daily quests
  const questsRemaining = dailyQuests.filter((uq: UserQuest) => !completedIds.has(uq.id)).length;

  // Build top 3 quests: incomplete first, then by XP descending
  const sortedQuests = [...dailyQuests].sort((a, b) => {
    const aCompleted = completedIds.has(a.id);
    const bCompleted = completedIds.has(b.id);
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    return (b.customXP ?? b.quest.baseXP) - (a.customXP ?? a.quest.baseXP);
  });

  const topQuests: SerializedWidgetQuest[] = sortedQuests.slice(0, 3).map((uq) => ({
    id: uq.id,
    name: uq.customName ?? uq.quest.name,
    iconName: uq.quest.iconName,
    xp: uq.customXP ?? uq.quest.baseXP,
    isCompleted: completedIds.has(uq.id),
    progress: completedIds.has(uq.id) ? 1 : 0,
  }));

  // Current streak from user stats or user profile
  const currentStreak = state.progress.stats?.currentDayStreak ?? 0;

  return {
    dailyXP,
    dailyGoal: DEFAULT_DAILY_XP_GOAL,
    questsRemaining,
    topQuests,
    currentStreak,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Write widget data to the App Group UserDefaults.
 * Values are string-only in react-native-widgetkit,
 * so we JSON.stringify the payload.
 */
export async function writeWidgetData(data: SerializedWidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const wk = await getWidgetKit();
    if (!wk) return;

    await wk.setItem(WIDGET_DATA_KEY, JSON.stringify(data), APP_GROUP_ID);
  } catch {
    // Silently degrade -- widget update is best-effort
  }
}

/**
 * Request WidgetKit to reload all widget timelines.
 * Call after writing new data to UserDefaults.
 */
export async function reloadWidgetTimelines(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const wk = await getWidgetKit();
    if (!wk) return;

    wk.reloadAllTimelines();
  } catch {
    // Silently degrade
  }
}

/**
 * Combined convenience: derive state, write, and reload.
 */
export async function syncWidgetData(state: RootState): Promise<void> {
  if (Platform.OS !== 'ios') return;

  const data = deriveWidgetData(state);
  await writeWidgetData(data);
  await reloadWidgetTimelines();
}

/**
 * Read pending completions that were initiated from the widget.
 * After processing, call clearPendingCompletions().
 */
export async function readPendingCompletions(): Promise<WidgetPendingCompletion[]> {
  if (Platform.OS !== 'ios') return [];

  try {
    const wk = await getWidgetKit();
    if (!wk) return [];

    const raw = await wk.getItem(WIDGET_PENDING_COMPLETIONS_KEY, APP_GROUP_ID);
    if (!raw) return [];

    return JSON.parse(raw) as WidgetPendingCompletion[];
  } catch {
    return [];
  }
}

/**
 * Clear pending completions after the main app has processed them.
 */
export async function clearPendingCompletions(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const wk = await getWidgetKit();
    if (!wk) return;

    await wk.setItem(WIDGET_PENDING_COMPLETIONS_KEY, JSON.stringify([]), APP_GROUP_ID);
  } catch {
    // Silently degrade
  }
}
