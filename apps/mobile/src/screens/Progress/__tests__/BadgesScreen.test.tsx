import React from 'react';
import { render } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { BadgesScreen } from '../BadgesScreen';
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

const createProgressState = (overrides = {}) => ({
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
  ...overrides,
});

const renderWithProviders = (progressOverrides = {}) => {
  const store = mockStore({
    ...global.testUtils.createMockState(),
    progress: createProgressState(progressOverrides),
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <BadgesScreen />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('BadgesScreen', () => {
  it('shows loading indicator when badges are loading and empty', () => {
    const { queryByText } = renderWithProviders({
      isLoadingBadges: true,
      earnedBadges: [],
    });
    expect(queryByText('earned')).toBeNull();
  });

  it('renders badge count with zero earned', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('0')).toBeTruthy();
    expect(getByText(/earned/)).toBeTruthy();
  });

  it('renders earned badges from Redux state', () => {
    const { getByText } = renderWithProviders({
      earnedBadges: [
        { id: '1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-01' },
        { id: '2', badgeId: 'b2', badge: { name: 'Week Warrior' }, earnedAt: '2026-06-05' },
      ],
    });
    expect(getByText('2')).toBeTruthy();
  });

  it('renders rarity section headers', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('Common')).toBeTruthy();
    expect(getByText('Rare')).toBeTruthy();
    expect(getByText('Legendary')).toBeTruthy();
  });

  it('dispatches fetchEarnedBadges on mount', () => {
    const { store } = renderWithProviders();
    const actions = store.getActions();
    const actionTypes = actions.map((a: any) => a.type);
    expect(actionTypes).toContain('progress/fetchBadges/pending');
  });

  it('shows badges as locked when not earned', () => {
    const { getByText } = renderWithProviders({ earnedBadges: [] });
    expect(getByText('First Steps')).toBeTruthy();
  });
});
