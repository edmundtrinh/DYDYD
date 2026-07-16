import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { QuestCategory, CATEGORY_METADATA } from '@dydyd/shared';
import { useTheme } from '../theme/ThemeProvider';

const CATEGORY_EMOJIS: Record<QuestCategory, string> = {
  [QuestCategory.PHYSICAL_HEALTH]: '\u{1F4AA}',
  [QuestCategory.MENTAL_WELLNESS]: '\u{1F9E0}',
  [QuestCategory.CAREER_PRODUCTIVITY]: '\u{1F4BC}',
  [QuestCategory.RELATIONSHIPS_SOCIAL]: '\u{2764}\u{FE0F}',
  [QuestCategory.HOME_CHORES]: '\u{1F3E0}',
};

interface CategoryIconProps {
  category: QuestCategory;
  size?: number;
  style?: ViewStyle;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 44,
  style,
}) => {
  const { colors, radii } = useTheme();

  const categoryColorMap: Record<QuestCategory, string> = {
    [QuestCategory.PHYSICAL_HEALTH]: colors.categoryPhysical,
    [QuestCategory.MENTAL_WELLNESS]: colors.categoryMental,
    [QuestCategory.CAREER_PRODUCTIVITY]: colors.categoryCareer,
    [QuestCategory.RELATIONSHIPS_SOCIAL]: colors.categoryRelationships,
    [QuestCategory.HOME_CHORES]: colors.categoryHome,
  };

  const color = categoryColorMap[category] || colors.primary;
  const emoji = CATEGORY_EMOJIS[category] || '\u{1F3AF}';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          backgroundColor: color + '33',
        },
        style,
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ fontSize: size * 0.45 }} accessible={false}>{emoji}</Text>
    </View>
  );
};

export const getCategoryColor = (
  category: QuestCategory,
  colors: { categoryPhysical: string; categoryMental: string; categoryCareer: string; categoryRelationships: string; categoryHome: string },
): string => {
  const map: Record<QuestCategory, string> = {
    [QuestCategory.PHYSICAL_HEALTH]: colors.categoryPhysical,
    [QuestCategory.MENTAL_WELLNESS]: colors.categoryMental,
    [QuestCategory.CAREER_PRODUCTIVITY]: colors.categoryCareer,
    [QuestCategory.RELATIONSHIPS_SOCIAL]: colors.categoryRelationships,
    [QuestCategory.HOME_CHORES]: colors.categoryHome,
  };
  return map[category] || colors.categoryPhysical;
};

export const getCategoryEmoji = (category: QuestCategory): string => {
  return CATEGORY_EMOJIS[category] || '\u{1F3AF}';
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
