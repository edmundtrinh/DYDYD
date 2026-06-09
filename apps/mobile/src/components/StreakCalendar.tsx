import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyProgress } from '@dydyd/shared';
import { useTheme } from '../theme/ThemeProvider';

interface StreakCalendarProps {
  dailyProgress: DailyProgress[];
  days?: number;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  dailyProgress,
  days = 28,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  const calendarData = useMemo(() => {
    const progressMap = new Map(
      dailyProgress.map((d) => [d.date.split('T')[0], d.questsCompleted]),
    );

    const today = new Date();
    const cells: Array<{ date: string; count: number; isToday: boolean }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: dateStr,
        count: progressMap.get(dateStr) ?? 0,
        isToday: i === 0,
      });
    }
    return cells;
  }, [dailyProgress, days]);

  const weeks = useMemo(() => {
    const result: typeof calendarData[] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      result.push(calendarData.slice(i, i + 7));
    }
    return result;
  }, [calendarData]);

  const totalActive = calendarData.filter((c) => c.count > 0).length;

  const getCellColor = (count: number, isToday: boolean) => {
    if (count === 0) return isToday ? colors.surface3 : colors.surface2;
    if (count <= 2) return colors.primaryDim;
    if (count <= 4) return colors.primary;
    return colors.primaryBright;
  };

  return (
    <View>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((label, i) => (
          <Text
            key={`label-${i}`}
            style={[styles.dayLabel, { color: colors.textTertiary, fontSize: typography.sizeMicro }]}
          >
            {label}
          </Text>
        ))}
      </View>
      <View style={[styles.grid, { gap: 3 }]}>
        {weeks.map((week, wi) => (
          <View key={`week-${wi}`} style={[styles.weekRow, { gap: 3 }]}>
            {week.map((cell) => (
              <View
                key={cell.date}
                style={[
                  styles.cell,
                  {
                    backgroundColor: getCellColor(cell.count, cell.isToday),
                    borderRadius: radii.xs,
                    borderWidth: cell.isToday ? 1 : 0,
                    borderColor: cell.isToday ? colors.primaryBright : 'transparent',
                  },
                ]}
                accessibilityLabel={`${cell.date}: ${cell.count} quests completed`}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        <Text style={[styles.legendText, { color: colors.textTertiary, fontSize: typography.sizeMicro }]}>
          {totalActive} active days in last {days} days
        </Text>
        <View style={styles.legendScale}>
          <Text style={[styles.legendLabel, { color: colors.textDisabled, fontSize: typography.sizeMicro }]}>Less</Text>
          {[colors.surface2, colors.primaryDim, colors.primary, colors.primaryBright].map((color, i) => (
            <View key={`legend-${i}`} style={[styles.legendCell, { backgroundColor: color, borderRadius: 2 }]} />
          ))}
          <Text style={[styles.legendLabel, { color: colors.textDisabled, fontSize: typography.sizeMicro }]}>More</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {},
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    marginHorizontal: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
  },
});
