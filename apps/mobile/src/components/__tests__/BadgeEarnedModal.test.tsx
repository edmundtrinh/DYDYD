import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { BadgeEarnedModal } from '../BadgeEarnedModal';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../services/api/progressService', () => ({
  progressService: {
    getUserStats: jest.fn().mockResolvedValue({}),
    getDailyProgress: jest.fn().mockResolvedValue([]),
    getWeeklyProgress: jest.fn().mockResolvedValue([]),
    getEarnedBadges: jest.fn().mockResolvedValue([]),
    getLeaderboard: jest.fn().mockResolvedValue({ entries: [], userRank: null }),
    checkBadges: jest.fn().mockResolvedValue([]),
  },
}));

const mockStore = configureStore([]);

const renderWithProviders = (progressOverrides = {}) => {
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
      ...progressOverrides,
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <BadgeEarnedModal />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('BadgeEarnedModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when no new badges', () => {
    const { toJSON } = renderWithProviders();
    expect(toJSON()).toBeNull();
  });

  it('renders badge info when a new badge is earned', () => {
    const { getByText } = renderWithProviders({
      newBadgeIds: ['ub1'],
      earnedBadges: [
        { id: 'ub1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-09' },
      ],
    });
    expect(getByText('First Steps')).toBeTruthy();
    expect(getByText('BADGE EARNED')).toBeTruthy();
  });

  it('shows rarity label', () => {
    const { getByText } = renderWithProviders({
      newBadgeIds: ['ub1'],
      earnedBadges: [
        { id: 'ub1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-09' },
      ],
    });
    expect(getByText('COMMON')).toBeTruthy();
  });

  it('shows tap to dismiss hint', () => {
    const { getByText } = renderWithProviders({
      newBadgeIds: ['ub1'],
      earnedBadges: [
        { id: 'ub1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-09' },
      ],
    });
    expect(getByText('Tap to dismiss')).toBeTruthy();
  });

  it('dispatches clearNewBadges when tapped', () => {
    const { getByText, store } = renderWithProviders({
      newBadgeIds: ['ub1'],
      earnedBadges: [
        { id: 'ub1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-09' },
      ],
    });
    fireEvent.press(getByText('Tap to dismiss'));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const actions = store.getActions();
    expect(actions).toContainEqual({ type: 'progress/clearNewBadges' });
  });
});
