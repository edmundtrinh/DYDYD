import React from 'react';
import { render, act } from '@testing-library/react-native';

import { QuestCompletionOverlay } from '../QuestCompletionOverlay';
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
    Easing: { out: () => () => 0, quad: () => 0 },
  };
});

const renderOverlay = (props: Partial<React.ComponentProps<typeof QuestCompletionOverlay>> = {}) =>
  render(
    <ThemeProvider>
      <QuestCompletionOverlay
        visible={true}
        xpEarned={25}
        questName="Morning Meditation"
        onDismiss={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('QuestCompletionOverlay', () => {
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

  it('renders XP earned text when visible', () => {
    const { getByText } = renderOverlay({ xpEarned: 25 });
    expect(getByText('+25 XP')).toBeTruthy();
  });

  it('renders quest name', () => {
    const { getByText } = renderOverlay({ questName: 'Morning Meditation' });
    expect(getByText('Morning Meditation')).toBeTruthy();
  });

  it('renders checkmark', () => {
    const { getByText } = renderOverlay();
    expect(getByText('\u{2713}')).toBeTruthy();
  });

  it('calls onDismiss after animation duration', () => {
    const onDismiss = jest.fn();
    renderOverlay({ onDismiss });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders different XP amounts', () => {
    const { getByText } = renderOverlay({ xpEarned: 100 });
    expect(getByText('+100 XP')).toBeTruthy();
  });
});
