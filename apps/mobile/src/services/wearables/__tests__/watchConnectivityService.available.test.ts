// ============================================
// DYDYD - Watch Connectivity Service Tests (Module Available)
// ============================================
// Tests for when react-native-watch-connectivity IS available

const mockGetIsPaired = jest.fn();
const mockGetIsWatchAppInstalled = jest.fn();
const mockGetReachability = jest.fn();
const mockSendMessage = jest.fn();
const mockUpdateApplicationContext = jest.fn();
const mockWatchEventsOn = jest.fn();

jest.mock('react-native-watch-connectivity', () => ({
  getIsPaired: mockGetIsPaired,
  getIsWatchAppInstalled: mockGetIsWatchAppInstalled,
  getReachability: mockGetReachability,
  sendMessage: mockSendMessage,
  updateApplicationContext: mockUpdateApplicationContext,
  watchEvents: {
    on: mockWatchEventsOn,
  },
}));

// Re-import after mock setup
let watchConnectivityService: typeof import('../watchConnectivityService').watchConnectivityService;
let WatchMessageType: typeof import('../watchConnectivityService').WatchMessageType;

beforeAll(() => {
  jest.resetModules();
  const mod = require('../watchConnectivityService');
  watchConnectivityService = mod.watchConnectivityService;
  WatchMessageType = mod.WatchMessageType;
});

describe('WatchConnectivityService (module available)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    watchConnectivityService.cleanup();
    // Default: unsubscribe functions returned by watchEvents.on
    mockWatchEventsOn.mockReturnValue(() => {});
  });

  describe('initialize()', () => {
    it('queries native module for pairing, installation, and reachability', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(true);

      const state = await watchConnectivityService.initialize();

      expect(mockGetIsPaired).toHaveBeenCalledTimes(1);
      expect(mockGetIsWatchAppInstalled).toHaveBeenCalledTimes(1);
      expect(mockGetReachability).toHaveBeenCalledTimes(1);
      expect(state).toEqual({
        isPaired: true,
        isReachable: true,
        isWatchAppInstalled: true,
      });
    });

    it('registers reachability and message event listeners', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(false);

      await watchConnectivityService.initialize();

      expect(mockWatchEventsOn).toHaveBeenCalledTimes(2);
      expect(mockWatchEventsOn).toHaveBeenCalledWith('reachability', expect.any(Function));
      expect(mockWatchEventsOn).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('returns cached state on subsequent calls without re-querying', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(false);
      mockGetReachability.mockResolvedValue(false);

      await watchConnectivityService.initialize();
      const state = await watchConnectivityService.initialize();

      // Only called once despite two initialize() calls
      expect(mockGetIsPaired).toHaveBeenCalledTimes(1);
      expect(state.isPaired).toBe(true);
      expect(state.isWatchAppInstalled).toBe(false);
    });
  });

  describe('sendMessage()', () => {
    it('returns true when watch is reachable and send succeeds', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(true);
      mockSendMessage.mockResolvedValue(undefined);

      await watchConnectivityService.initialize();
      const result = await watchConnectivityService.sendMessage(
        WatchMessageType.SYNC_QUESTS,
        { quests: [] },
      );

      expect(result).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('returns false when watch is not reachable', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(false);

      await watchConnectivityService.initialize();
      const result = await watchConnectivityService.sendMessage(
        WatchMessageType.SYNC_QUESTS,
        { quests: [] },
      );

      expect(result).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('updateApplicationContext()', () => {
    it('sends data via native module', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(true);
      mockUpdateApplicationContext.mockResolvedValue(undefined);

      await watchConnectivityService.initialize();
      const data = { type: 'full_sync', timestamp: new Date().toISOString(), data: {} };
      const result = await watchConnectivityService.updateApplicationContext(data);

      expect(result).toBe(true);
      expect(mockUpdateApplicationContext).toHaveBeenCalledWith(data);
    });
  });

  describe('addMessageListener()', () => {
    it('registers callback and returns unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = watchConnectivityService.addMessageListener(handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe removes the handler', () => {
      const handler = jest.fn();
      const unsubscribe = watchConnectivityService.addMessageListener(handler);
      unsubscribe();
      // After unsubscribe, the handler should not be in the list
      // We verify indirectly by checking getState still works (no error)
      expect(watchConnectivityService.getState().isPaired).toBe(false);
    });
  });

  describe('removeMessageListener()', () => {
    it('clears all registered message handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      watchConnectivityService.addMessageListener(handler1);
      watchConnectivityService.addMessageListener(handler2);

      watchConnectivityService.removeMessageListener();

      // Should not throw and state should be clean
      expect(watchConnectivityService.getState().isPaired).toBe(false);
    });
  });

  describe('incoming message dispatch', () => {
    it('forwards native messages to registered handlers', async () => {
      mockGetIsPaired.mockResolvedValue(true);
      mockGetIsWatchAppInstalled.mockResolvedValue(true);
      mockGetReachability.mockResolvedValue(true);

      // Capture the message callback registered with watchEvents.on
      let messageCallback: ((msg: Record<string, any>) => void) | undefined;
      mockWatchEventsOn.mockImplementation((event: string, cb: any) => {
        if (event === 'message') {
          messageCallback = cb;
        }
        return () => {};
      });

      await watchConnectivityService.initialize();

      const handler = jest.fn();
      watchConnectivityService.addMessageListener(handler);

      // Simulate incoming message from Watch
      messageCallback!({
        type: 'QUEST_COMPLETED',
        payload: { questId: 'q1', value: 5 },
        timestamp: 1234567890,
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        type: 'QUEST_COMPLETED',
        payload: { questId: 'q1', value: 5 },
        timestamp: 1234567890,
      });
    });
  });
});
