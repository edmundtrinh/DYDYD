import React from 'react';
import { render } from '@testing-library/react-native';

import { StreakCalendar } from '../StreakCalendar';
import { ThemeProvider } from '../../theme/ThemeProvider';

const renderCalendar = (props: Partial<React.ComponentProps<typeof StreakCalendar>> = {}) =>
  render(
    <ThemeProvider>
      <StreakCalendar dailyProgress={[]} days={28} {...props} />
    </ThemeProvider>,
  );

describe('StreakCalendar', () => {
  it('renders 28 cells for 28 days', () => {
    const { getAllByLabelText } = renderCalendar();
    const cells = getAllByLabelText(/quests completed/);
    expect(cells.length).toBe(28);
  });

  it('renders day labels', () => {
    const { getByText } = renderCalendar();
    expect(getByText('M')).toBeTruthy();
    expect(getByText('F')).toBeTruthy();
  });

  it('shows 0 active days with no progress data', () => {
    const { getByText } = renderCalendar();
    expect(getByText(/0 active days/)).toBeTruthy();
  });

  it('counts active days from progress data', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const progress = [
      {
        date: today.toISOString().split('T')[0],
        totalXP: 25,
        questsCompleted: 3,
        questsTotal: 5,
        categoryBreakdown: {
          physical_health: 0,
          mental_wellness: 0,
          career_productivity: 0,
          relationships_social: 0,
          home_chores: 0,
        },
      },
      {
        date: yesterday.toISOString().split('T')[0],
        totalXP: 15,
        questsCompleted: 2,
        questsTotal: 5,
        categoryBreakdown: {
          physical_health: 0,
          mental_wellness: 0,
          career_productivity: 0,
          relationships_social: 0,
          home_chores: 0,
        },
      },
    ];

    const { getByText } = renderCalendar({ dailyProgress: progress });
    expect(getByText(/2 active days/)).toBeTruthy();
  });

  it('renders legend with Less and More labels', () => {
    const { getByText } = renderCalendar();
    expect(getByText('Less')).toBeTruthy();
    expect(getByText('More')).toBeTruthy();
  });

  it('renders custom number of days', () => {
    const { getAllByLabelText } = renderCalendar({ days: 14 });
    const cells = getAllByLabelText(/quests completed/);
    expect(cells.length).toBe(14);
  });
});
