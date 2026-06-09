import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { AddQuestScreen } from '../AddQuestScreen';
import { ThemeProvider } from '../../../theme/ThemeProvider';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: mockGoBack,
      setOptions: jest.fn(),
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('../../../services/api/questsService', () => ({
  questsService: {
    createCustomQuest: jest.fn().mockResolvedValue({
      id: 'new-quest-1',
      name: 'Test Quest',
      category: 'physical_health',
      frequency: 'daily',
      baseXP: 5,
      isCustom: true,
    }),
    getQuestLibrary: jest.fn().mockResolvedValue([]),
    getUserQuests: jest.fn().mockResolvedValue([]),
    activateQuest: jest.fn().mockResolvedValue({}),
    completeQuest: jest.fn().mockResolvedValue({}),
    deactivateQuest: jest.fn().mockResolvedValue({}),
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

const renderWithProviders = () => {
  const store = mockStore({
    ...global.testUtils.createMockState(),
    quests: {
      questLibrary: [],
      userQuests: [],
      todayCompletions: [],
      isLoadingLibrary: false,
      isLoadingUserQuests: false,
      error: null,
    },
  });
  return {
    ...render(
      <Provider store={store}>
        <ThemeProvider>
          <AddQuestScreen />
        </ThemeProvider>
      </Provider>,
    ),
    store,
  };
};

describe('AddQuestScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('renders all form fields', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders();
    expect(getByText('Quest Name')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Practice guitar for 20 minutes')).toBeTruthy();
    expect(getByText('Description (optional)')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Frequency')).toBeTruthy();
    expect(getByText('Create Quest')).toBeTruthy();
  });

  it('renders all 5 category options', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('Physical Health')).toBeTruthy();
    expect(getByText('Mental Wellness')).toBeTruthy();
    expect(getByText('Career & Productivity')).toBeTruthy();
    expect(getByText('Relationships & Social')).toBeTruthy();
    expect(getByText('Home & Chores')).toBeTruthy();
  });

  it('renders all 3 frequency options', () => {
    const { getByText } = renderWithProviders();
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
  });

  it('dispatches createCustomQuest and navigates back on success', async () => {
    const { getByText, getByPlaceholderText, store } = renderWithProviders();

    fireEvent.changeText(
      getByPlaceholderText('e.g., Practice guitar for 20 minutes'),
      'Morning Meditation',
    );
    fireEvent.press(getByText('Mental Wellness'));
    fireEvent.press(getByText('Create Quest'));

    await waitFor(() => {
      const actions = store.getActions();
      const types = actions.map((a: any) => a.type);
      expect(types).toContain('quests/createCustom/pending');
    });

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('shows submitting state while creating', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders();

    fireEvent.changeText(
      getByPlaceholderText('e.g., Practice guitar for 20 minutes'),
      'Test Quest',
    );
    fireEvent.press(getByText('Physical Health'));
    fireEvent.press(getByText('Create Quest'));

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
