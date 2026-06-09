import React from 'react';
import { render } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { ProgressScreen } from '../ProgressScreen';
import { ThemeProvider } from '../../../theme/ThemeProvider';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../../services/api/progressService', () => ({
  progressService: {
    getUserStats: jest.fn().mockResolvedValue({}),
    getDailyProgress: jest.fn().mockResolvedValue([]),
    getWeeklyProgress: jest.fn().mockResolvedValue([]),
    getEarnedBadges: jest.fn().mockResolvedValue([]),
    getLeaderboard: jest.fn().mockResolvedValue({ entries: [], userRank: null }),
  },
}));

const thunkMiddleware: any =
  ({ dispatch, getState }: any) =>
  (next: any) =>
  (action: any) => {
    if (typeof action === 'function') return action(dispatch, getState, undefined);
    return next(action);
  };

const mockStore = configureStore([thunkMiddleware]);

const MOCK_STATS = {
  totalXP: 1250,
  level: 8,
  totalQuestsCompleted: 142,
  currentDayStreak: 12,
  longestDayStreak: 42,
  badgesEarned: 4,
  categoryStats: {
    physical_health: { totalXP: 560, totalCompletions: 43, currentStreak: 5, longestStreak: 12 },
    mental_wellness: { totalXP: 212, totalCompletions: 47, currentStreak: 3, longestStreak: 8 },
    career_productivity: { totalXP: 148, totalCompletions: 14, currentStreak: 1, longestStreak: 5 },
    relationships_social: { totalXP: 60, totalCompletions: 8, currentStreak: 0, longestStreak: 3 },
    home_chores: { totalXP: 120, totalCompletions: 30, currentStreak: 2, longestStreak: 7 },
  },
  weeklyAverage: 175,
  monthlyAverage: 700,
};

function getCurrentWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return [0, 1, 2].map((offset) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d.toISOString().split('T')[0];
  });
}

const weekDates = getCurrentWeekDates();

const MOCK_DAILY_PROGRESS = [
  { date: weekDates[0], totalXP: 25, questsCompleted: 4, questsTotal: 6, categoryBreakdown: {} },
  { date: weekDates[1], totalXP: 18, questsCompleted: 3, questsTotal: 6, categoryBreakdown: {} },
  { date: weekDates[2], totalXP: 30, questsCompleted: 5, questsTotal: 6, categoryBreakdown: {} },
];

const renderWithProviders = (storeOverrides = {}) => {
  const store = mockStore({
    ...global.testUtils.createMockState(),
    progress: {
      stats: null,
      dailyProgress: [],
      weeklyProgress: [],
      earnedBadges: [],
      newBadgeIds: [],
      leaderboard: [],
      userRank: null,
      isLoadingStats: false,
      isLoadingProgress: false,
      isLoadingBadges: false,
      isLoadingLeaderboard: false,
      error: null,
      ...storeOverrides,
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <ProgressScreen />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('ProgressScreen', () => {
  it('shows loading indicator when stats are loading and null', () => {
    const { getByTestId, queryByText } = renderWithProviders({
      isLoadingStats: true,
      stats: null,
    });
    expect(queryByText('Level Progress')).toBeNull();
  });

  it('renders stats from Redux state', () => {
    const { getByText } = renderWithProviders({ stats: MOCK_STATS });
    expect(getByText('12')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
    expect(getByText('142')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
  });

  it('renders weekly chart with daily progress data', () => {
    const { getByText } = renderWithProviders({
      stats: MOCK_STATS,
      dailyProgress: MOCK_DAILY_PROGRESS,
    });
    expect(getByText('25')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
    expect(getByText('73 XP')).toBeTruthy();
  });

  it('renders category breakdown from stats', () => {
    const { getByText } = renderWithProviders({ stats: MOCK_STATS });
    expect(getByText('560 XP')).toBeTruthy();
    expect(getByText('212 XP')).toBeTruthy();
    expect(getByText('43 completions')).toBeTruthy();
  });

  it('renders zero state when stats are empty', () => {
    const emptyStats = {
      ...MOCK_STATS,
      totalXP: 0,
      totalQuestsCompleted: 0,
      currentDayStreak: 0,
      longestDayStreak: 0,
      badgesEarned: 0,
      categoryStats: {},
    };
    const { getAllByText, getByText } = renderWithProviders({ stats: emptyStats });
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(1);
    expect(getByText('0 XP')).toBeTruthy();
  });

  it('dispatches fetchUserStats and fetchDailyProgress on mount', () => {
    const { store } = renderWithProviders({ stats: MOCK_STATS });
    const actions = store.getActions();
    const actionTypes = actions.map((a: any) => a.type);
    expect(actionTypes).toContain('progress/fetchStats/pending');
    expect(actionTypes).toContain('progress/fetchDaily/pending');
  });

  it('shows weekly chart with zero data when no daily progress', () => {
    const { getByText } = renderWithProviders({
      stats: MOCK_STATS,
      dailyProgress: [],
    });
    expect(getByText('0 XP')).toBeTruthy();
  });

  it('renders View All Badges link', () => {
    const { getByText } = renderWithProviders({ stats: MOCK_STATS });
    expect(getByText('View All Badges')).toBeTruthy();
  });
});
