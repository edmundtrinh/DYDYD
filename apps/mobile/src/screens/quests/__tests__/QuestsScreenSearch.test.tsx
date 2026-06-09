import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../../services/api/questsService', () => ({
  questsService: {
    getQuestLibrary: jest.fn().mockResolvedValue([]),
    getUserQuests: jest.fn().mockResolvedValue([]),
    activateQuest: jest.fn().mockResolvedValue({}),
    completeQuest: jest.fn().mockResolvedValue({}),
    deactivateQuest: jest.fn().mockResolvedValue({}),
    createCustomQuest: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../../services/api/userService', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue({}),
    updateSettings: jest.fn().mockResolvedValue({}),
    updateCategoryPriorities: jest.fn().mockResolvedValue([]),
  },
}));

import { ThemeProvider } from '../../../theme/ThemeProvider';

const thunkMiddleware: any =
  ({ dispatch, getState }: any) =>
  (next: any) =>
  (action: any) => {
    if (typeof action === 'function') return action(dispatch, getState, undefined);
    return next(action);
  };

const mockStore = configureStore([thunkMiddleware]);

const MOCK_QUESTS = [
  { id: 'q1', name: 'Morning Run', description: 'Run for 30 minutes', category: 'physical_health', frequency: 'daily', baseXP: 5, maxCompletionsPerPeriod: 1, isDefault: true, isCustom: false, iconName: 'run' },
  { id: 'q2', name: 'Meditation', description: 'Mindful breathing', category: 'mental_wellness', frequency: 'daily', baseXP: 5, maxCompletionsPerPeriod: 1, isDefault: true, isCustom: false, iconName: 'meditation' },
  { id: 'q3', name: 'Read a Book', description: 'Read for 20 minutes', category: 'mental_wellness', frequency: 'daily', baseXP: 5, maxCompletionsPerPeriod: 1, isDefault: true, isCustom: false, iconName: 'book' },
];

const renderScreen = (questOverrides: any = {}) => {
  // Lazy-require to ensure mocks are applied first
  const { QuestsScreen } = require('../QuestsScreen');

  const store = mockStore({
    ...global.testUtils.createMockState(),
    quests: {
      questLibrary: MOCK_QUESTS,
      userQuests: [],
      todayCompletions: [],
      isLoadingLibrary: false,
      isLoadingUserQuests: false,
      isCompleting: {},
      error: null,
      ...questOverrides,
    },
    user: {
      profile: { settings: { hapticFeedbackEnabled: false } },
      isLoading: false,
      error: null,
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <QuestsScreen />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('QuestsScreen Search', () => {
  it('renders search input', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('quest-search-input')).toBeTruthy();
  });

  it('filters quests by name when typing', () => {
    const { getByTestId, queryByText } = renderScreen();
    const input = getByTestId('quest-search-input');

    fireEvent.changeText(input, 'Meditation');

    expect(queryByText('Meditation')).toBeTruthy();
    expect(queryByText('Morning Run')).toBeNull();
    expect(queryByText('Read a Book')).toBeNull();
  });

  it('filters are case-insensitive', () => {
    const { getByTestId, queryByText } = renderScreen();
    const input = getByTestId('quest-search-input');

    fireEvent.changeText(input, 'morning');

    expect(queryByText('Morning Run')).toBeTruthy();
    expect(queryByText('Meditation')).toBeNull();
  });

  it('shows clear button when search has text', () => {
    const { getByTestId, getByLabelText } = renderScreen();
    const input = getByTestId('quest-search-input');

    fireEvent.changeText(input, 'test');
    expect(getByLabelText('Clear search')).toBeTruthy();
  });

  it('clears search when clear button is pressed', () => {
    const { getByTestId, getByLabelText, queryByText } = renderScreen();
    const input = getByTestId('quest-search-input');

    fireEvent.changeText(input, 'Meditation');
    expect(queryByText('Morning Run')).toBeNull();

    fireEvent.press(getByLabelText('Clear search'));
    expect(queryByText('Morning Run')).toBeTruthy();
  });

  it('searches description text too', () => {
    const { getByTestId, queryByText } = renderScreen();
    const input = getByTestId('quest-search-input');

    fireEvent.changeText(input, 'breathing');

    expect(queryByText('Meditation')).toBeTruthy();
    expect(queryByText('Morning Run')).toBeNull();
  });
});
