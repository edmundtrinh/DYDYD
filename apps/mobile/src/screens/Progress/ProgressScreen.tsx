import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from '../../navigation/MainTabNavigator';
import { QuestCategory, CATEGORY_METADATA, calculateLevelProgress } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  fetchUserStats,
  fetchDailyProgress,
  selectUserStats,
  selectDailyProgress,
  selectIsLoadingProgress,
} from '../../store/slices/progressSlice';
import { XPBar } from '../../components/XPBar';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { CategoryIcon, getCategoryColor } from '../../components/CategoryIcon';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'ProgressMain'>;

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors, typography, spacing, radii } = useTheme();

  const stats = useAppSelector(selectUserStats);
  const dailyProgress = useAppSelector(selectDailyProgress);
  const isLoading = useAppSelector(selectIsLoadingProgress);

  useEffect(() => {
    dispatch(fetchUserStats());
    dispatch(fetchDailyProgress(7));
  }, [dispatch]);

  const levelProgress = useMemo(
    () => (stats ? calculateLevelProgress(stats.totalXP) : null),
    [stats],
  );

  const weeklyData = useMemo(() => {
    if (dailyProgress.length === 0) {
      return DAY_LABELS.map((day) => ({ day, xp: 0, completed: 0 }));
    }
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    return DAY_LABELS.map((day, i) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const progress = dailyProgress.find((d) => d.date.startsWith(dateStr));
      return {
        day,
        xp: progress?.totalXP ?? 0,
        completed: progress?.questsCompleted ?? 0,
      };
    });
  }, [dailyProgress]);

  const maxWeeklyXP = Math.max(...weeklyData.map((d) => d.xp), 1);
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.xp, 0);

  const categoryData = useMemo(() => {
    if (!stats?.categoryStats) return [];
    const categories = Object.values(QuestCategory);
    return categories
      .map((category) => {
        const catStats = stats.categoryStats[category];
        return {
          category,
          completions: catStats?.totalCompletions ?? 0,
          totalXP: catStats?.totalXP ?? 0,
        };
      })
      .filter((c) => c.totalXP > 0 || c.completions > 0);
  }, [stats]);

  const maxCatXP = Math.max(...categoryData.map((c) => c.totalXP), 1);

  if (isLoading && !stats) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { gap: spacing.lg }]}
    >
      {/* XP Progress */}
      <Card header="Level Progress">
        <XPBar
          currentXP={levelProgress?.xpInCurrentLevel ?? 0}
          requiredXP={levelProgress?.xpForNextLevel ?? 100}
          level={levelProgress?.currentLevel ?? 1}
          height={8}
        />
      </Card>

      {/* Statistics grid */}
      <View style={[styles.statsGrid, { gap: spacing.sm }]}>
        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <StatCard
            icon={'\u{1F525}'}
            value={stats?.currentDayStreak ?? 0}
            label="Streak"
            sublabel="days"
            color={colors.orange}
          />
          <StatCard
            icon={'\u{1F3C6}'}
            value={stats?.longestDayStreak ?? 0}
            label="Best Streak"
            sublabel="days"
            color={colors.gold}
          />
        </View>
        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <StatCard
            icon={'\u{2713}'}
            value={stats?.totalQuestsCompleted ?? 0}
            label="Quests Done"
            color={colors.primary}
          />
          <StatCard
            icon={'\u{1F3C5}'}
            value={stats?.badgesEarned ?? 0}
            label="Badges"
            color={colors.purple}
          />
        </View>
      </View>

      {/* Weekly chart */}
      <Card header="This Week">
        <View style={[styles.weekChart, { marginTop: spacing.sm }]}>
          {weeklyData.map((day, i) => {
            const barHeight = day.xp > 0 ? Math.max((day.xp / maxWeeklyXP) * 80, 8) : 8;
            const isToday = i === ((new Date().getDay() + 6) % 7);

            return (
              <View key={`${day.day}-${i}`} style={styles.dayColumn}>
                <Text
                  style={{
                    color: day.xp > 0 ? colors.primaryBright : colors.textTertiary,
                    fontSize: 10,
                    fontWeight: typography.weightBold,
                    marginBottom: 4,
                  }}
                >
                  {day.xp > 0 ? `${day.xp}` : ''}
                </Text>
                <View
                  style={[
                    styles.dayBar,
                    {
                      height: barHeight,
                      backgroundColor:
                        day.xp > 0 ? colors.primary : colors.surface3,
                      borderRadius: radii.xs,
                      borderWidth: isToday ? 1 : 0,
                      borderColor: isToday ? colors.primaryBright : 'transparent',
                    },
                  ]}
                />
                <Text
                  style={{
                    color: isToday ? colors.text : colors.textTertiary,
                    fontSize: typography.sizeCaption,
                    fontWeight: isToday
                      ? typography.weightBold
                      : typography.weightRegular,
                    marginTop: 6,
                  }}
                >
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
        <View
          style={[
            styles.weekSummary,
            {
              borderTopColor: colors.divider,
              marginTop: spacing.md,
              paddingTop: spacing.md,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizeCaption,
            }}
          >
            Weekly Total
          </Text>
          <Text
            style={{
              color: colors.primaryBright,
              fontSize: typography.sizeBody,
              fontWeight: typography.weightHeavy,
            }}
          >
            {weeklyTotal} XP
          </Text>
        </View>
      </Card>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <Card header="By Category">
          {categoryData.map((cat) => {
            const catColor = getCategoryColor(cat.category, colors);
            const meta = CATEGORY_METADATA[cat.category];
            const barWidth = `${Math.max((cat.totalXP / maxCatXP) * 100, 3)}%` as `${number}%`;

            return (
              <View
                key={cat.category}
                style={[
                  styles.categoryRow,
                  {
                    borderBottomColor: colors.divider,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <CategoryIcon category={cat.category} size={36} />
                <View style={styles.categoryContent}>
                  <View style={styles.categoryTop}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: typography.sizeBodySm,
                        fontWeight: typography.weightSemi,
                      }}
                    >
                      {meta.name}
                    </Text>
                    <Text
                      style={{
                        color: catColor,
                        fontSize: typography.sizeBodySm,
                        fontWeight: typography.weightHeavy,
                      }}
                    >
                      {cat.totalXP} XP
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.catBar,
                      {
                        backgroundColor: colors.surface3,
                        borderRadius: 3,
                        marginTop: 6,
                      },
                    ]}
                  >
                    <View
                      style={{
                        height: 6,
                        width: barWidth,
                        backgroundColor: catColor,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: typography.sizeMicro,
                      marginTop: 4,
                    }}
                  >
                    {cat.completions} completions
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Badges link */}
      <TouchableOpacity
        style={[
          styles.badgesLink,
          {
            backgroundColor: colors.surface1,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.base,
          },
        ]}
        onPress={() => navigation.navigate('Badges')}
      >
        <Text style={styles.badgesEmoji}>{'\u{1F3C6}'}</Text>
        <Text
          style={{
            color: colors.xp,
            fontSize: typography.sizeBody,
            fontWeight: typography.weightSemi,
          }}
        >
          View All Badges
        </Text>
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: typography.sizeBody,
            marginLeft: 'auto',
          }}
        >
          {'\u{2192}'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {},
  statsRow: {
    flexDirection: 'row',
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 100,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayBar: {
    width: 24,
  },
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBar: {
    height: 6,
    overflow: 'hidden',
  },
  badgesLink: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgesEmoji: {
    fontSize: 24,
  },
});
