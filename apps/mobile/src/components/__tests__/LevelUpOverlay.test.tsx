import React from 'react';
import { render, act } from '@testing-library/react-native';

import { LevelUpOverlay } from '../LevelUpOverlay';
import { ThemeProvider } from '../../theme/ThemeProvider';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: any) => fn(),
    withTiming: (v: any) => v,
    withSequence: (...args: any[]) => args[args.length - 1],
    withDelay: (_: any, v: any) => v,
    withSpring: (v: any) => v,
    runOnJS: (fn: any) => fn,
  };
});

const renderOverlay = (props: Partial<React.ComponentProps<typeof LevelUpOverlay>> = {}) =>
  render(
    <ThemeProvider>
      <LevelUpOverlay
        visible={true}
        newLevel={5}
        onDismiss={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('LevelUpOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when not visible', () => {
    const { toJSON } = renderOverlay({ visible: false });
    expect(toJSON()).toBeNull();
  });

  it('renders level number when visible', () => {
    const { getByText } = renderOverlay({ newLevel: 5 });
    expect(getByText('5')).toBeTruthy();
  });

  it('renders LEVEL UP label', () => {
    const { getByText } = renderOverlay();
    expect(getByText('LEVEL UP!')).toBeTruthy();
  });

  it('renders level title from shared package', () => {
    const { getByText } = renderOverlay({ newLevel: 5 });
    expect(getByText('Apprentice Hero')).toBeTruthy();
  });

  it('renders sparkle emoji', () => {
    const { getByText } = renderOverlay();
    expect(getByText('\u{2728}')).toBeTruthy();
  });

  it('calls onDismiss after animation duration', () => {
    const onDismiss = jest.fn();
    renderOverlay({ onDismiss });

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders tap to continue hint', () => {
    const { getByText } = renderOverlay();
    expect(getByText('Tap to continue')).toBeTruthy();
  });

  it('renders different level numbers', () => {
    const { getByText } = renderOverlay({ newLevel: 42 });
    expect(getByText('42')).toBeTruthy();
  });
});
