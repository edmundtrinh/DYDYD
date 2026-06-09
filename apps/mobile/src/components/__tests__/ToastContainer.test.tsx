import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { ToastContainer } from '../ToastContainer';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockStore = configureStore([]);

const renderWithProviders = (store: ReturnType<typeof mockStore>) =>
  render(
    <Provider store={store}>
      <ThemeProvider>
        <ToastContainer />
      </ThemeProvider>
    </Provider>,
  );

describe('ToastContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const store = mockStore(global.testUtils.createMockState());
    const { toJSON } = renderWithProviders(store);
    expect(toJSON()).toBeNull();
  });

  it('renders a success toast with title', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            { id: '1', type: 'success', title: 'Quest completed!' },
          ],
        },
      }),
    );
    const { getByText } = renderWithProviders(store);
    expect(getByText('Quest completed!')).toBeTruthy();
  });

  it('renders a toast with title and message', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            {
              id: '1',
              type: 'info',
              title: 'New badge!',
              message: 'You earned Early Riser',
            },
          ],
        },
      }),
    );
    const { getByText } = renderWithProviders(store);
    expect(getByText('New badge!')).toBeTruthy();
    expect(getByText('You earned Early Riser')).toBeTruthy();
  });

  it('renders multiple toasts simultaneously', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            { id: '1', type: 'success', title: 'First toast' },
            { id: '2', type: 'error', title: 'Second toast' },
            { id: '3', type: 'warning', title: 'Third toast' },
          ],
        },
      }),
    );
    const { getByText } = renderWithProviders(store);
    expect(getByText('First toast')).toBeTruthy();
    expect(getByText('Second toast')).toBeTruthy();
    expect(getByText('Third toast')).toBeTruthy();
  });

  it('caps visible toasts at 5, showing the most recent', () => {
    const toasts = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      type: 'info' as const,
      title: `Toast ${i}`,
    }));
    const store = mockStore(
      global.testUtils.createMockState({ ui: { toasts } }),
    );
    const { queryByText } = renderWithProviders(store);
    expect(queryByText('Toast 0')).toBeNull();
    expect(queryByText('Toast 1')).toBeNull();
    expect(queryByText('Toast 2')).toBeTruthy();
    expect(queryByText('Toast 6')).toBeTruthy();
  });

  it('dispatches hideToast after default duration (3000ms)', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            { id: '42', type: 'success', title: 'Auto dismiss me' },
          ],
        },
      }),
    );
    renderWithProviders(store);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const actions = store.getActions();
    expect(actions).toContainEqual({
      type: 'ui/hideToast',
      payload: '42',
    });
  });

  it('dispatches hideToast with custom duration', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            {
              id: '99',
              type: 'error',
              title: 'Custom duration',
              duration: 5000,
            },
          ],
        },
      }),
    );
    renderWithProviders(store);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(store.getActions()).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(store.getActions()).toContainEqual({
      type: 'ui/hideToast',
      payload: '99',
    });
  });

  it('cleans up timer on unmount without dispatching', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            { id: 'unmount-test', type: 'info', title: 'Will unmount' },
          ],
        },
      }),
    );
    const { unmount } = renderWithProviders(store);

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(store.getActions()).toHaveLength(0);
  });

  it('dispatches hideToast when close button is pressed', () => {
    const store = mockStore(
      global.testUtils.createMockState({
        ui: {
          toasts: [
            { id: '7', type: 'warning', title: 'Dismiss me' },
          ],
        },
      }),
    );
    const { getByText, getByLabelText } = renderWithProviders(store);
    expect(getByText('Dismiss me')).toBeTruthy();

    fireEvent.press(getByLabelText('Dismiss: Dismiss me'));

    expect(store.getActions()).toContainEqual({
      type: 'ui/hideToast',
      payload: '7',
    });
  });

  it('renders all four toast types', () => {
    const types = ['success', 'error', 'warning', 'info'] as const;
    types.forEach((type) => {
      const store = mockStore(
        global.testUtils.createMockState({
          ui: {
            toasts: [{ id: `${type}-1`, type, title: `${type} toast` }],
          },
        }),
      );
      const { getByText } = renderWithProviders(store);
      expect(getByText(`${type} toast`)).toBeTruthy();
    });
  });
});
