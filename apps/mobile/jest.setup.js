// Jest setup for React Native mobile tests
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-health (iOS HealthKit)
jest.mock('react-native-health', () => ({
  AppleHealthKit: {
    initHealthKit: jest.fn((options, callback) => callback(null)),
    getStepCount: jest.fn((options, callback) => callback(null, { value: 5000 })),
    getSleepSamples: jest.fn((options, callback) => callback(null, [])),
    isAvailable: jest.fn((callback) => callback(null, true)),
  },
}));

// Mock react-native-google-fit (Android)
jest.mock('react-native-google-fit', () => ({
  default: {
    authorize: jest.fn(() => Promise.resolve({ success: true })),
    getDailyStepCountSamples: jest.fn(() => Promise.resolve([])),
    isAuthorized: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock react-native-watch-connectivity
jest.mock('react-native-watch-connectivity', () => ({
  watchEvents: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  getReachability: jest.fn(() => Promise.resolve(false)),
  getIsPaired: jest.fn(() => Promise.resolve(false)),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

// Mock expo-notifications (virtual: true since package may not be installed)
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}), { virtual: true });

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Global test utilities for mobile
global.testUtils = {
  // Helper to create a mock Redux store state
  createMockState: (overrides = {}) => ({
    auth: {
      isAuthenticated: false,
      isOnboarded: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      ...overrides.auth,
    },
    user: {
      profile: null,
      settings: null,
      categoryPriorities: [],
      isLoading: false,
      error: null,
      ...overrides.user,
    },
    quests: {
      questLibrary: [],
      userQuests: [],
      todayCompletions: [],
      isLoading: false,
      error: null,
      ...overrides.quests,
    },
    progress: {
      stats: null,
      dailyProgress: null,
      weeklyProgress: null,
      earnedBadges: [],
      leaderboard: [],
      isLoading: false,
      error: null,
      ...overrides.progress,
    },
    health: {
      isAvailable: false,
      hasPermission: false,
      connectedSources: [],
      todayData: {},
      isLoading: false,
      error: null,
      ...overrides.health,
    },
    notifications: {
      hasPermission: false,
      pushToken: null,
      notifications: [],
      scheduledReminders: [],
      ...overrides.notifications,
    },
    ui: {
      theme: 'system',
      toasts: [],
      activeModal: null,
      isKeyboardVisible: false,
      networkStatus: 'online',
      ...overrides.ui,
    },
  }),

  // Helper to create a mock quest
  createMockQuest: (overrides = {}) => ({
    id: 'test-quest-id',
    name: 'Test Quest',
    description: 'A test quest',
    category: 'physical_health',
    frequency: 'daily',
    baseXP: 5,
    maxCompletionsPerPeriod: 1,
    isDefault: true,
    isCustom: false,
    iconName: 'star',
    createdAt: new Date(),
    ...overrides,
  }),

  // Helper to create a mock user quest
  createMockUserQuest: (overrides = {}) => ({
    id: 'test-user-quest-id',
    odatabaseId: 'test-db-id',
    questId: 'test-quest-id',
    quest: global.testUtils.createMockQuest(),
    isActive: true,
    reminderEnabled: false,
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    createdAt: new Date(),
    ...overrides,
  }),
};
