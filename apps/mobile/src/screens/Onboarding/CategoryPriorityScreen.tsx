import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { QuestCategory, CATEGORY_METADATA } from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/Button';
import { CategoryIcon, getCategoryColor } from '../../components/CategoryIcon';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'CategoryPriority'>;

const CATEGORIES = [
  { id: QuestCategory.PHYSICAL_HEALTH, label: 'Physical Health' },
  { id: QuestCategory.MENTAL_WELLNESS, label: 'Mental Wellness' },
  { id: QuestCategory.CAREER_PRODUCTIVITY, label: 'Career & Productivity' },
  { id: QuestCategory.RELATIONSHIPS_SOCIAL, label: 'Relationships & Social' },
  { id: QuestCategory.HOME_CHORES, label: 'Home & Chores' },
];

export const CategoryPriorityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, typography, spacing, radii } = useTheme();
  const [priorities, setPriorities] = useState<QuestCategory[]>([]);
  const [dragging, setDragging] = useState<QuestCategory | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const toggleCategory = (id: QuestCategory) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  // Long-press to reorder in the priority list
  const moveItem = (from: number, to: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPriorities((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { marginTop: spacing['5xl'] }]}>
        <Text
          style={[
            styles.step,
            {
              color: colors.textTertiary,
              fontSize: typography.sizeMicro,
              fontWeight: typography.weightBold,
            },
          ]}
        >
          STEP 1 OF 5
        </Text>
        <Text
          style={{
            fontSize: typography.sizeH2,
            fontWeight: typography.weightHeavy,
            color: colors.text,
            marginTop: spacing.sm,
            letterSpacing: -0.4,
          }}
        >
          What matters most to you?
        </Text>
        <Text
          style={{
            fontSize: typography.sizeBodySm,
            color: colors.textTertiary,
            marginTop: spacing.sm,
            lineHeight: 22,
          }}
        >
          Tap categories in order of importance. Your top priorities will be featured
          prominently.
        </Text>
      </View>

      {/* Category cards */}
      <View style={[styles.list, { gap: spacing.sm }]}>
        {CATEGORIES.map((cat) => {
          const idx = priorities.indexOf(cat.id);
          const selected = idx >= 0;
          const catColor = getCategoryColor(cat.id, colors);

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => toggleCategory(cat.id)}
              onLongPress={() => {
                if (selected && idx > 0) {
                  moveItem(idx, idx - 1);
                }
              }}
              style={[
                styles.card,
                {
                  backgroundColor: selected
                    ? catColor + '18'
                    : colors.surface1,
                  borderColor: selected ? catColor : colors.border,
                  borderRadius: radii.md,
                  padding: spacing.base,
                },
              ]}
            >
              <CategoryIcon category={cat.id} size={44} />
              <View style={styles.cardContent}>
                <Text
                  style={{
                    fontSize: typography.sizeBodySm + 1,
                    fontWeight: typography.weightSemi,
                    color: colors.text,
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    fontSize: typography.sizeMicro,
                    color: colors.textTertiary,
                    marginTop: 2,
                  }}
                >
                  {CATEGORY_METADATA[cat.id].description}
                </Text>
              </View>
              {selected ? (
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor: catColor,
                      borderRadius: radii.pill,
                    },
                  ]}
                >
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.unselectedCircle,
                    {
                      borderColor: colors.borderStrong,
                      borderRadius: radii.pill,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Helper text for reordering */}
      {priorities.length >= 2 && (
        <Text
          style={{
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: typography.sizeMicro,
            marginTop: spacing.sm,
          }}
        >
          Long-press a selected item to move it up
        </Text>
      )}

      {/* Continue button */}
      <View style={{ marginBottom: spacing['5xl'] }}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('SelectQuests')}
          disabled={priorities.length === 0}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {},
  step: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  list: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  unselectedCircle: {
    width: 32,
    height: 32,
    borderWidth: 2,
  },
});
