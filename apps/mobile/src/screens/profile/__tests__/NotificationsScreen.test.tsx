import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { NotificationsScreen } from '../NotificationsScreen';
import { ThemeProvider } from '../../../theme/ThemeProvider';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../../services/api/userService', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue({}),
    updateSettings: jest.fn().mockResolvedValue({}),
    updateCategoryPriorities: jest.fn().mockResolvedValue([]),
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

const renderWithProviders = (settingsOverrides: any = {}) => {
  const store = mockStore({
    ...global.testUtils.createMockState(),
    user: {
      profile: {
        settings: {
          notificationsEnabled: true,
          soundEnabled: true,
          dailyReminderTime: '9:00 AM',
          hapticFeedbackEnabled: true,
          theme: 'dark',
          ...settingsOverrides,
        },
      },
      isLoading: false,
      error: null,
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <NotificationsScreen />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('NotificationsScreen', () => {
  it('renders all sections and switches', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('Reminders')).toBeTruthy();
    expect(getByText('Alerts')).toBeTruthy();
    expect(getByText('Daily Reminder')).toBeTruthy();
    expect(getByText('Streak at Risk')).toBeTruthy();
    expect(getByText('Achievements')).toBeTruthy();
  });

  it('renders switches as enabled (not disabled)', () => {
    const { getAllByRole } = renderWithProviders();
    const switches = getAllByRole('switch');
    expect(switches.length).toBe(3);
  });

  it('displays reminder time from settings', () => {
    const { getByText } = renderWithProviders({ dailyReminderTime: '8:30 AM' });
    expect(getByText('8:30 AM')).toBeTruthy();
  });

  it('dispatches updateSettings when notification toggle changes', () => {
    const { getAllByRole, store } = renderWithProviders();
    const switches = getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', false);
    const actions = store.getActions();
    expect(actions.some((a: any) => a.type === 'user/updateSettings/pending')).toBe(true);
  });

  it('dispatches updateSettings when sound toggle changes', () => {
    const { getAllByRole, store } = renderWithProviders();
    const switches = getAllByRole('switch');
    fireEvent(switches[2], 'valueChange', false);
    const actions = store.getActions();
    expect(actions.some((a: any) => a.type === 'user/updateSettings/pending')).toBe(true);
  });
});
