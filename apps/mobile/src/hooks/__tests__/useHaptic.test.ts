import { renderHook } from '@testing-library/react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import React from 'react';

import { useHaptic } from '../useHaptic';

const mockStore = configureStore([]);

const createWrapper = (hapticEnabled: boolean) => {
  const store = mockStore({
    ...global.testUtils.createMockState(),
    user: {
      profile: {
        settings: { hapticFeedbackEnabled: hapticEnabled },
      },
      isLoading: false,
      error: null,
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store } as any, children);
};

describe('useHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers haptic feedback when enabled', () => {
    const { result } = renderHook(() => useHaptic(), {
      wrapper: createWrapper(true),
    });
    result.current.trigger('impactLight');
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'impactLight',
      expect.objectContaining({ enableVibrateFallback: true }),
    );
  });

  it('does not trigger haptic when disabled', () => {
    const { result } = renderHook(() => useHaptic(), {
      wrapper: createWrapper(false),
    });
    result.current.trigger('impactLight');
    expect(ReactNativeHapticFeedback.trigger).not.toHaveBeenCalled();
  });

  it('defaults to impactLight when no type specified', () => {
    const { result } = renderHook(() => useHaptic(), {
      wrapper: createWrapper(true),
    });
    result.current.trigger();
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'impactLight',
      expect.any(Object),
    );
  });

  it('supports different haptic types', () => {
    const { result } = renderHook(() => useHaptic(), {
      wrapper: createWrapper(true),
    });
    result.current.trigger('notificationSuccess');
    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'notificationSuccess',
      expect.any(Object),
    );
  });
});
