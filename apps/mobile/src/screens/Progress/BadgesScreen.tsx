import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PREDEFINED_BADGES } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Badge as BadgeComponent } from '../../components/Badge';

type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Placeholder earned badges -- will be wired to Redux
const EARNED_BADGE_NAMES = new Set(['First Steps', 'Week Warrior']);

// Group badges by rarity for display
const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'common'];
const RARITY_LABELS: Record<string, string> = {
  legendary: 'Legendary',
  epic: 'Epic',
  rare: 'Rare',
  common: 'Common',
};

export const BadgesScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();

  const earnedCount = PREDEFINED_BADGES.filter((b) =>
    EARNED_BADGE_NAMES.has(b.name),
  ).length;

  // Group badges by rarity
  const grouped = RARITY_ORDER.map((rarity) => ({
    rarity,
    badges: PREDEFINED_BADGES.filter((b) => b.rarity === rarity),
  })).filter((g) => g.badges.length > 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { gap: spacing.xl }]}
    >
      {/* Header summary */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.earnedPill,
            {
              backgroundColor: colors.surface1,
              borderColor: colors.border,
              borderRadius: radii.pill,
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text
            style={{
              color: colors.xp,
              fontSize: typography.sizeBody,
              fontWeight: typography.weightHeavy,
            }}
          >
            {earnedCount}
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.sizeBodySm,
              marginLeft: spacing.xs,
            }}
          >
            / {PREDEFINED_BADGES.length} earned
          </Text>
        </View>
      </View>

      {/* Badge groups by rarity */}
      {grouped.map((group) => {
        const rarityColorMap: Record<string, string> = {
          common: colors.rarityCommon,
          uncommon: colors.rarityUncommon,
          rare: colors.rarityRare,
          epic: colors.rarityEpic,
          legendary: colors.rarityLegendary,
          mythic: colors.rarityMythic,
        };
        const sectionColor = rarityColorMap[group.rarity] || colors.textTertiary;

        return (
          <View key={group.rarity}>
            {/* Section header */}
            <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
              <View
                style={[
                  styles.sectionDot,
                  {
                    backgroundColor: sectionColor,
                    borderRadius: radii.pill,
                  },
                ]}
              />
              <Text
                style={{
                  color: sectionColor,
                  fontSize: typography.sizeMicro,
                  fontWeight: typography.weightBold,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}
              >
                {RARITY_LABELS[group.rarity] || group.rarity}
              </Text>
              <Text
                style={{
                  color: colors.textDisabled,
                  fontSize: typography.sizeMicro,
                  marginLeft: spacing.xs,
                }}
              >
                ({group.badges.length})
              </Text>
            </View>

            {/* Badge grid */}
            <View style={[styles.grid, { gap: spacing.sm }]}>
              {group.badges.map((badge) => {
                const isEarned = EARNED_BADGE_NAMES.has(badge.name);
                return (
                  <BadgeComponent
                    key={badge.name}
                    name={badge.name}
                    iconName={badge.iconName}
                    rarity={badge.rarity as BadgeRarity}
                    locked={!isEarned}
                    earnedDate={isEarned ? 'Earned' : undefined}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
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
  headerRow: {
    alignItems: 'center',
  },
  earnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
