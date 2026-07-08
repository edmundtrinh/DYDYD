// ============================================
// DYDYD - Watch Connectivity Service Tests
// ============================================

import { WatchMessageType } from '../watchConnectivityService';

// Mock react-native-watch-connectivity as unavailable by default
jest.mock('react-native-watch-connectivity', () => {
  throw new Error('Module not found');
});

// Re-import after mock setup to get the module-not-available path
let watchConnectivityService: typeof import('../watchConnectivityService').watchConnectivityService;

beforeAll(() => {
  // Clear module cache so the mock takes effect
  jest.resetModules();
  const mod = require('../watchConnectivityService');
  watchConnectivityService = mod.watchConnectivityService;
});

describe('WatchConnectivityService', () => {
  beforeEach(() => {
    watchConnectivityService.cleanup();
  });

  describe('when native module is not available', () => {
    it('initialize returns default disconnected state', async () => {
      const state = await watchConnectivityService.initialize();
      expect(state).toEqual({
        isPaired: false,
        isReachable: false,
        isWatchAppInstalled: false,
      });
    });

    it('sendMessage returns false silently', async () => {
      const result = await watchConnectivityService.sendMessage(
        WatchMessageType.SYNC_QUESTS,
        { quests: [] }
      );
      expect(result).toBe(false);
    });

    it('updateApplicationContext returns false silently', async () => {
      const result = await watchConnectivityService.updateApplicationContext({
        type: 'full_sync',
        timestamp: new Date(),
        data: { dailyQuests: [], todayXP: 0, level: 1, currentStreak: 0 },
      });
      expect(result).toBe(false);
    });

    it('getReachability returns false', async () => {
      const result = await watchConnectivityService.getReachability();
      expect(result).toBe(false);
    });

    it('syncQuests returns false', async () => {
      const result = await watchConnectivityService.syncQuests([]);
      expect(result).toBe(false);
    });

    it('syncProgress returns false', async () => {
      const result = await watchConnectivityService.syncProgress({
        todayXP: 0,
        totalXP: 0,
        level: 1,
        completedCount: 0,
        totalCount: 0,
      });
      expect(result).toBe(false);
    });

    it('isAvailable returns false', () => {
      expect(watchConnectivityService.isAvailable()).toBe(false);
    });

    it('getState returns disconnected state', () => {
      const state = watchConnectivityService.getState();
      expect(state.isPaired).toBe(false);
      expect(state.isReachable).toBe(false);
    });
  });

  describe('message handler registration', () => {
    it('addMessageListener registers and removeMessageListener clears all', () => {
      const handler = jest.fn();
      watchConnectivityService.addMessageListener(handler);
      // After removeMessageListener, handlers should be cleared
      watchConnectivityService.removeMessageListener();
      // No way to test internally, but cleanup should not throw
    });

    it('onMessage returns an unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = watchConnectivityService.onMessage(handler);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('cleanup resets initialization state', async () => {
      await watchConnectivityService.initialize();
      watchConnectivityService.cleanup();
      const state = watchConnectivityService.getState();
      expect(state.isPaired).toBe(false);
    });
  });
});
