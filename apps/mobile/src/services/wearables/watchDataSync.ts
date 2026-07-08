// ============================================
// DYDYD - Watch Data Sync Service
// ============================================
// Orchestrates data synchronization between the mobile app
// and the Apple Watch companion app via WatchConnectivity

import { WatchData, WatchQuest, WatchSyncPayload, UserQuest } from '@dydyd/shared';
import { watchConnectivityService, WatchMessageType, WatchMessage } from './watchConnectivityService';

export type WatchCompletionDispatcher = (questId: string, value?: number) => void;

function transformToWatchQuests(
  userQuests: UserQuest[],
  completionsToday: Record<string, number>
): WatchQuest[] {
  return userQuests
    .filter((uq) => uq.isActive && uq.quest?.frequency === 'daily')
    .map((uq) => {
      const completionCount = completionsToday[uq.id] ?? 0;
      const maxCompletions = uq.quest?.maxCompletionsPerPeriod ?? 1;
      return {
        id: uq.id,
        name: uq.customName || uq.quest?.name || 'Quest',
        iconName: uq.quest?.iconName || 'star',
        xp: uq.customXP || uq.quest?.baseXP || 0,
        isCompleted: completionCount >= maxCompletions,
        completionsToday: completionCount,
        maxCompletions,
      };
    });
}

export async function syncQuestsToWatch(
  activeQuests: UserQuest[],
  completionsToday: Record<string, number>,
  todayXP: number,
  level: number,
  currentStreak: number
): Promise<boolean> {
  const dailyQuests = transformToWatchQuests(activeQuests, completionsToday);

  const watchData: WatchData = {
    dailyQuests,
    todayXP,
    level,
    currentStreak,
  };

  return watchConnectivityService.updateApplicationContext({
    type: 'full_sync',
    timestamp: new Date(),
    data: watchData,
  } as WatchSyncPayload);
}

export async function syncProgressToWatch(
  todayXP: number,
  level: number,
  currentStreak: number,
  dailyQuests: WatchQuest[]
): Promise<boolean> {
  const watchData: WatchData = {
    dailyQuests,
    todayXP,
    level,
    currentStreak,
  };

  return watchConnectivityService.updateApplicationContext({
    type: 'stats_update',
    timestamp: new Date(),
    data: watchData,
  } as WatchSyncPayload);
}

export function handleWatchMessage(
  message: WatchMessage,
  onQuestCompleted: WatchCompletionDispatcher
): void {
  switch (message.type) {
    case WatchMessageType.QUEST_COMPLETED: {
      const { questId, value } = message.payload ?? {};
      if (questId) {
        onQuestCompleted(questId, value);
      }
      break;
    }
    case WatchMessageType.REQUEST_SYNC:
      break;
    default:
      break;
  }
}

export function registerWatchMessageHandler(
  onQuestCompleted: WatchCompletionDispatcher,
  onSyncRequested?: () => void
): () => void {
  return watchConnectivityService.onMessage((message: WatchMessage) => {
    if (message.type === WatchMessageType.QUEST_COMPLETED) {
      const { questId, value } = message.payload ?? {};
      if (questId) {
        onQuestCompleted(questId, value);
      }
    } else if (message.type === WatchMessageType.REQUEST_SYNC) {
      onSyncRequested?.();
    }
  });
}
