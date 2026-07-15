import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import {
  PREDEFINED_QUESTS,
  CATEGORY_METADATA,
  QuestCategory,
} from '@dydyd/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/Button';
import { CategoryIcon, getCategoryColor } from '../../components/CategoryIcon';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'SelectQuests'>;

type QuestItem = (typeof PREDEFINED_QUESTS)[number];

interface SectionData {
  title: string;
  category: QuestCategory;
  data: QuestItem[];
}

export const SelectQuestsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, typography, spacing, radii } = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<QuestCategory | 'all'>('all');

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const sections: SectionData[] = useMemo(() => {
    const categories = Object.values(QuestCategory);
    return categories
      .map((cat) => ({
        title: CATEGORY_METADATA[cat].name,
        category: cat,
        data:
          activeFilter === 'all' || activeFilter === cat
            ? PREDEFINED_QUESTS.filter((q) => q.category === cat)
            : [],
      }))
      .filter((s) => s.data.length > 0);
  }, [activeFilter]);

  const filterTabs: Array<{ id: QuestCategory | 'all'; label: string; color?: string }> = [
    { id: 'all', label: 'All' },
    ...Object.values(QuestCategory).map((cat) => ({
      id: cat,
      label: CATEGORY_METADATA[cat].name.split(' ')[0],
      color: CATEGORY_METADATA[cat].color,
    })),
  ];

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
          STEP 2 OF 5
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
          Choose your first quests
        </Text>
        <Text
          style={{
            fontSize: typography.sizeBodySm,
            color: colors.textTertiary,
            marginTop: spacing.sm,
            lineHeight: 22,
          }}
        >
          Select at least 3 quests to get started. You can always add more later.
        </Text>
      </View>

      {/* Category filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { marginTop: spacing.base }]}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const tabColor = tab.color || colors.primary;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive ? tabColor + '30' : colors.surface1,
                  borderColor: isActive ? tabColor : colors.border,
                  borderRadius: radii.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? tabColor : colors.textTertiary,
                  fontSize: typography.sizeCaption,
                  fontWeight: typography.weightSemi,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quest list */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { marginTop: spacing.base }]}>
            <View
              style={[
                styles.sectionDot,
                {
                  backgroundColor: getCategoryColor(section.category, colors),
                  borderRadius: radii.pill,
                },
              ]}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizeCaption,
                fontWeight: typography.weightBold,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
              accessibilityRole="header"
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.name);
          const catColor = getCategoryColor(item.category, colors);

          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => toggle(item.name)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${item.name}, ${item.frequency}, ${item.baseXP} XP`}
              style={[
                styles.questCard,
                {
                  backgroundColor: isSelected
                    ? catColor + '15'
                    : colors.surface1,
                  borderColor: isSelected ? catColor : colors.border,
                  borderRadius: radii.md,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <CategoryIcon category={item.category} size={40} />
              <View style={styles.questContent}>
                <Text
                  style={{
                    fontSize: typography.sizeBodySm,
                    fontWeight: typography.weightSemi,
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: typography.sizeMicro,
                    color: colors.textTertiary,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.frequency} {'·'} +{item.baseXP} XP
                  {item.targetValue
                    ? ` · ${item.targetValue} ${item.unit || ''}`
                    : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? catColor : 'transparent',
                    borderColor: isSelected ? catColor : colors.borderStrong,
                    borderRadius: radii.xs,
                  },
                ]}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {isSelected && <Text style={styles.checkText}>{'✓'}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Continue button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.base,
          },
        ]}
      >
        <Button
          title={`${selected.size} selected — Continue`}
          onPress={() => navigation.navigate('HealthPermissions')}
          disabled={selected.size < 3}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {},
  step: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterTab: {
    borderWidth: 1,
  },
  list: {
    flex: 1,
    marginTop: 4,
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
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  questContent: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    paddingBottom: 40,
  },
});
