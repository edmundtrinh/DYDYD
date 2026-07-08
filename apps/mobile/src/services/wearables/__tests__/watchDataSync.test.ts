// ============================================
// DYDYD - Watch Data Sync Tests
// ============================================

import { UserQuest, QuestCategory, QuestFrequency } from '@dydyd/shared';
import { WatchMessageType, WatchMessage } from '../watchConnectivityService';

// Mock the watch connectivity service
const mockUpdateApplicationContext = jest.fn().mockResolvedValue(true);
const mockOnMessage = jest.fn().mockReturnValue(() => {});

jest.mock('../watchConnectivityService', () => ({
  watchConnectivityService: {
    updateApplicationContext: mockUpdateApplicationContext,
    onMessage: mockOnMessage,
  },
  WatchMessageType: {
    SYNC_QUESTS: 'SYNC_QUESTS',
    QUEST_COMPLETED: 'QUEST_COMPLETED',
    SYNC_PROGRESS: 'SYNC_PROGRESS',
    REQUEST_SYNC: 'REQUEST_SYNC',
    UPDATE_COMPLICATIONS: 'UPDATE_COMPLICATIONS',
  },
}));

import {
  syncQuestsToWatch,
  syncProgressToWatch,
  handleWatchMessage,
  registerWatchMessageHandler,
} from '../watchDataSync';

// --- Shared fixtures ---

const mockQuest = {
  id: 'quest-1',
  name: 'Morning Run',
  description: 'Run every morning',
  category: QuestCategory.PHYSICAL_HEALTH,
  frequency: QuestFrequency.DAILY,
  baseXP: 5,
  maxCompletionsPerPeriod: 1,
  isDefault: true,
  isCustom: false,
  iconName: 'run',
  createdAt: new Date(),
};

const mockUserQuest: UserQuest = {
  id: 'uq-1',
  odatabaseId: 'user-1',
  questId: 'quest-1',
  quest: mockQuest,
  isActive: true,
  reminderEnabled: false,
  currentStreak: 3,
  longestStreak: 10,
  totalCompletions: 50,
  createdAt: new Date(),
};

describe('watchDataSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncQuestsToWatch', () => {
    it('sends WatchData with transformed quests via updateApplicationContext', async () => {
      const completionsToday: Record<string, number> = { 'uq-1': 1 };

      const result = await syncQuestsToWatch(
        [mockUserQuest],
        completionsToday,
        15,
        3,
        5
      );

      expect(result).toBe(true);
      expect(mockUpdateApplicationContext).toHaveBeenCalledTimes(1);

      const payload = mockUpdateApplicationContext.mock.calls[0][0];
      expect(payload.type).toBe('full_sync');
      expect(payload.data.dailyQuests).toHaveLength(1);
      expect(payload.data.dailyQuests[0]).toEqual({
        id: 'uq-1',
        questId: 'quest-1',
        name: 'Morning Run',
        iconName: 'run',
        xp: 5,
        isCompleted: true,
        completionsToday: 1,
        maxCompletions: 1,
      });
      expect(payload.data.todayXP).toBe(15);
      expect(payload.data.level).toBe(3);
      expect(payload.data.currentStreak).toBe(5);
    });

    it('handles empty quest list', async () => {
      const result = await syncQuestsToWatch([], {}, 0, 1, 0);

      expect(result).toBe(true);
      const payload = mockUpdateApplicationContext.mock.calls[0][0];
      expect(payload.data.dailyQuests).toEqual([]);
      expect(payload.data.todayXP).toBe(0);
    });

    it('filters out non-daily quests', async () => {
      const weeklyQuest: UserQuest = {
        ...mockUserQuest,
        id: 'uq-2',
        quest: { ...mockQuest, frequency: QuestFrequency.WEEKLY },
      };

      await syncQuestsToWatch(
        [mockUserQuest, weeklyQuest],
        { 'uq-1': 0 },
        0,
        1,
        0
      );

      const payload = mockUpdateApplicationContext.mock.calls[0][0];
      expect(payload.data.dailyQuests).toHaveLength(1);
      expect(payload.data.dailyQuests[0].id).toBe('uq-1');
    });

    it('filters out inactive quests', async () => {
      const inactiveQuest: UserQuest = {
        ...mockUserQuest,
        id: 'uq-3',
        isActive: false,
      };

      await syncQuestsToWatch([inactiveQuest], {}, 0, 1, 0);

      const payload = mockUpdateApplicationContext.mock.calls[0][0];
      expect(payload.data.dailyQuests).toEqual([]);
    });
  });

  describe('syncProgressToWatch', () => {
    it('sends stats_update via updateApplicationContext', async () => {
      const dailyQuests = [
        { id: 'q1', questId: 'quest-1', name: 'Run', iconName: 'run', xp: 5, isCompleted: true, completionsToday: 1, maxCompletions: 1 },
      ];

      const result = await syncProgressToWatch(25, 4, 7, dailyQuests);

      expect(result).toBe(true);
      const payload = mockUpdateApplicationContext.mock.calls[0][0];
      expect(payload.type).toBe('stats_update');
      expect(payload.data.todayXP).toBe(25);
      expect(payload.data.level).toBe(4);
      expect(payload.data.currentStreak).toBe(7);
    });
  });

  describe('handleWatchMessage', () => {
    it('dispatches quest completion for QUEST_COMPLETED messages', () => {
      const onComplete = jest.fn();
      const message: WatchMessage = {
        type: WatchMessageType.QUEST_COMPLETED,
        payload: { questId: 'quest-1', value: 10 },
        timestamp: Date.now(),
      };

      handleWatchMessage(message, onComplete);

      expect(onComplete).toHaveBeenCalledWith('quest-1', 10);
    });

    it('does not dispatch when questId is missing', () => {
      const onComplete = jest.fn();
      const message: WatchMessage = {
        type: WatchMessageType.QUEST_COMPLETED,
        payload: {},
        timestamp: Date.now(),
      };

      handleWatchMessage(message, onComplete);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('handles REQUEST_SYNC without error', () => {
      const onComplete = jest.fn();
      const message: WatchMessage = {
        type: WatchMessageType.REQUEST_SYNC,
        payload: {},
        timestamp: Date.now(),
      };

      // Should not throw
      handleWatchMessage(message, onComplete);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('handles unknown message types without error', () => {
      const onComplete = jest.fn();
      const message: WatchMessage = {
        type: WatchMessageType.SYNC_PROGRESS,
        payload: {},
        timestamp: Date.now(),
      };

      handleWatchMessage(message, onComplete);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('registerWatchMessageHandler', () => {
    it('registers a message listener via watchConnectivityService', () => {
      const onComplete = jest.fn();
      const onSync = jest.fn();

      registerWatchMessageHandler(onComplete, onSync);

      expect(mockOnMessage).toHaveBeenCalledTimes(1);
      expect(typeof mockOnMessage.mock.calls[0][0]).toBe('function');
    });

    it('returns an unsubscribe function', () => {
      const unsubscribe = registerWatchMessageHandler(jest.fn());
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
