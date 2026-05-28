import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface BadgeProps {
  name: string;
  iconName: string;
  rarity: BadgeRarity;
  earnedDate?: string;
  locked?: boolean;
}

const BADGE_ICONS: Record<string, string> = {
  footprints: '\u{1F97E}',
  flame: '\u{1F525}',
  fire: '\u{1F525}',
  trophy: '\u{1F3C6}',
  crown: '\u{1F451}',
  'heart-pulse': '\u{2764}\u{FE0F}',
  brain: '\u{1F9E0}',
  'trending-up': '\u{1F4C8}',
  briefcase: '\u{1F4BC}',
  users: '\u{1F465}',
  home: '\u{1F3E0}',
  'home-heart': '\u{1F3E0}',
  star: '\u{2B50}',
  gem: '\u{1F48E}',
  diamond: '\u{1F48E}',
  sun: '\u{2600}\u{FE0F}',
  droplet: '\u{1F4A7}',
  default: '\u{1F3C5}',
};

export const Badge: React.FC<BadgeProps> = ({
  name,
  iconName,
  rarity,
  earnedDate,
  locked = false,
}) => {
  const { colors, radii, typography, spacing } = useTheme();

  const rarityColorMap: Record<BadgeRarity, string> = {
    common: colors.rarityCommon,
    uncommon: colors.rarityUncommon,
    rare: colors.rarityRare,
    epic: colors.rarityEpic,
    legendary: colors.rarityLegendary,
    mythic: colors.rarityMythic,
  };

  const borderColor = rarityColorMap[rarity] || colors.rarityCommon;
  const icon = BADGE_ICONS[iconName] || BADGE_ICONS.default;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderColor,
          borderRadius: radii.md,
          padding: spacing.md,
          opacity: locked ? 0.4 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: borderColor + '33',
            borderRadius: radii.pill,
          },
        ]}
      >
        <Text style={styles.iconText}>{locked ? '\u{1F512}' : icon}</Text>
      </View>
      <Text
        style={[
          styles.name,
          {
            color: colors.text,
            fontSize: typography.sizeMicro,
            fontWeight: typography.weightBold,
          },
        ]}
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text
        style={{
          color: borderColor,
          fontSize: 9,
          fontWeight: typography.weightBold,
          textTransform: 'capitalize',
        }}
      >
        {rarity}
      </Text>
      {earnedDate && !locked && (
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: 9,
            marginTop: 2,
          }}
        >
          {earnedDate}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 104,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  name: {
    textAlign: 'center',
  },
});
