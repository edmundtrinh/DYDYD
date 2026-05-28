import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from '../../navigation/MainTabNavigator';
import { QuestCategory, CATEGORY_METADATA } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { XPBar } from '../../components/XPBar';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { CategoryIcon, getCategoryColor } from '../../components/CategoryIcon';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'ProgressMain'>;

// Placeholder data -- will be wired to Redux slices
const PLACEHOLDER_STATS = {
  totalXP: 1100,
  level: 7,
  currentLevelXP: 62,
  requiredLevelXP: 166,
  streak: 12,
  bestStreak: 42,
  questsDone: 142,
  badgesEarned: 4,
};

const CATEGORY_DATA: Array<{
  category: QuestCategory;
  completions: number;
  totalXP: number;
  activeCount: number;
}> = [
  { category: QuestCategory.PHYSICAL_HEALTH, completions: 43, totalXP: 560, activeCount: 2 },
  { category: QuestCategory.MENTAL_WELLNESS, completions: 47, totalXP: 212, activeCount: 1 },
  { category: QuestCategory.CAREER_PRODUCTIVITY, completions: 14, totalXP: 148, activeCount: 1 },
  { category: QuestCategory.RELATIONSHIPS_SOCIAL, completions: 8, totalXP: 60, activeCount: 1 },
  { category: QuestCategory.HOME_CHORES, completions: 30, totalXP: 120, activeCount: 1 },
];

const WEEKLY_DATA = [
  { day: 'M', xp: 25, completed: 4 },
  { day: 'T', xp: 18, completed: 3 },
  { day: 'W', xp: 30, completed: 5 },
  { day: 'T', xp: 12, completed: 2 },
  { day: 'F', xp: 22, completed: 3 },
  { day: 'S', xp: 8, completed: 1 },
  { day: 'S', xp: 0, completed: 0 },
];

const maxWeeklyXP = Math.max(...WEEKLY_DATA.map((d) => d.xp), 1);

export const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, typography, spacing, radii } = useTheme();

  const maxCatXP = Math.max(...CATEGORY_DATA.map((c) => c.totalXP), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { gap: spacing.lg }]}
    >
      {/* XP Progress */}
      <Card header="Level Progress">
        <XPBar
          currentXP={PLACEHOLDER_STATS.currentLevelXP}
          requiredXP={PLACEHOLDER_STATS.requiredLevelXP}
          level={PLACEHOLDER_STATS.level}
          height={8}
        />
      </Card>

      {/* Statistics grid */}
      <View style={[styles.statsGrid, { gap: spacing.sm }]}>
        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <StatCard
            icon={'\u{1F525}'}
            value={PLACEHOLDER_STATS.streak}
            label="Streak"
            sublabel="days"
            color={colors.orange}
          />
          <StatCard
            icon={'\u{1F3C6}'}
            value={PLACEHOLDER_STATS.bestStreak}
            label="Best Streak"
            sublabel="days"
            color={colors.gold}
          />
        </View>
        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <StatCard
            icon={'\u{2713}'}
            value={PLACEHOLDER_STATS.questsDone}
            label="Quests Done"
            color={colors.primary}
          />
          <StatCard
            icon={'\u{1F3C5}'}
            value={PLACEHOLDER_STATS.badgesEarned}
            label="Badges"
            color={colors.purple}
          />
        </View>
      </View>

      {/* Weekly chart */}
      <Card header="This Week">
        <View style={[styles.weekChart, { marginTop: spacing.sm }]}>
          {WEEKLY_DATA.map((day, i) => {
            const barHeight = day.xp > 0 ? Math.max((day.xp / maxWeeklyXP) * 80, 8) : 8;
            const isToday = i === new Date().getDay() - 1; // Rough approximation

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
            {WEEKLY_DATA.reduce((s, d) => s + d.xp, 0)} XP
          </Text>
        </View>
      </Card>

      {/* Category breakdown */}
      <Card header="By Category">
        {CATEGORY_DATA.map((cat) => {
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
                  {cat.activeCount} active {'·'} {cat.completions} completions
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

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
