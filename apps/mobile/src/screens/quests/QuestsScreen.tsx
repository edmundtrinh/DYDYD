import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useHaptic } from '../../hooks/useHaptic';
import {
  fetchQuestLibrary,
  fetchUserQuests,
  activateQuest,
  deactivateQuest,
  selectQuestLibrary,
  selectUserQuests,
} from '../../store/slices/questsSlice';
import { QuestCategory, Quest, UserQuest } from '@dydyd/shared';

// Navigation types
type QuestsStackParamList = {
  QuestsList: undefined;
  QuestDetail: { questId: string; userQuestId?: string };
  AddQuest: { category?: string };
};

type NavigationProp = NativeStackNavigationProp<QuestsStackParamList, 'QuestsList'>;

// Category metadata
const CATEGORY_DATA: Record<QuestCategory, { name: string; icon: string; color: string }> = {
  [QuestCategory.PHYSICAL_HEALTH]: { name: 'Physical Health', icon: '💪', color: '#4CAF50' },
  [QuestCategory.MENTAL_WELLNESS]: { name: 'Mental Wellness', icon: '🧠', color: '#9C27B0' },
  [QuestCategory.CAREER_PRODUCTIVITY]: { name: 'Career & Productivity', icon: '💼', color: '#2196F3' },
  [QuestCategory.RELATIONSHIPS_SOCIAL]: { name: 'Relationships', icon: '❤️', color: '#E91E63' },
  [QuestCategory.HOME_CHORES]: { name: 'Home & Chores', icon: '🏠', color: '#FF9800' },
};

// Filter tabs
type FilterTab = 'all' | 'active' | QuestCategory;

const QuestsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { trigger: haptic } = useHaptic();

  const questLibrary = useAppSelector(selectQuestLibrary);
  const userQuests = useAppSelector(selectUserQuests);
  const isLoading = useAppSelector((state) => state.quests.isLoadingLibrary || state.quests.isLoadingUserQuests);

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get active quest IDs for quick lookup
  const activeQuestIds = new Set(userQuests.filter(uq => uq.isActive).map(uq => uq.questId));

  useEffect(() => {
    dispatch(fetchQuestLibrary());
    dispatch(fetchUserQuests());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchQuestLibrary()),
      dispatch(fetchUserQuests()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const handleActivateQuest = async (questId: string) => {
    haptic('impactMedium');
    await dispatch(activateQuest(questId));
  };

  const handleDeactivateQuest = async (userQuestId: string) => {
    haptic('impactMedium');
    await dispatch(deactivateQuest(userQuestId));
  };

  const handleQuestPress = (quest: Quest, userQuest?: UserQuest) => {
    haptic('impactLight');
    navigation.navigate('QuestDetail', {
      questId: quest.id,
      userQuestId: userQuest?.id,
    });
  };

  const handleAddCustomQuest = () => {
    navigation.navigate('AddQuest', {});
  };

  // Filter quests based on active filter and search term
  const filteredQuests = questLibrary.filter((quest) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!quest.name.toLowerCase().includes(term) &&
          !quest.description?.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return activeQuestIds.has(quest.id);
    return quest.category === activeFilter;
  });

  // Group quests by category for display
  const questsByCategory = filteredQuests.reduce((acc, quest) => {
    const category = quest.category as QuestCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(quest);
    return acc;
  }, {} as Record<QuestCategory, Quest[]>);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.headerTitle}>Quest Library</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomQuest} accessibilityRole="button" accessibilityLabel="Create custom quest">
          <Text style={styles.addButtonText}>+ Custom</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(150)} style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quests..."
          placeholderTextColor="#5A5A6E"
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCorrect={false}
          clearButtonMode="while-editing"
          testID="quest-search-input"
          accessibilityLabel="Search quests"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchTerm('')}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearButtonText}>{'\u{2715}'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <FilterTab
            label="All"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterTab
            label="Active"
            isActive={activeFilter === 'active'}
            onPress={() => setActiveFilter('active')}
            count={userQuests.filter(uq => uq.isActive).length}
          />
          {Object.entries(CATEGORY_DATA).map(([category, data]) => (
            <FilterTab
              key={category}
              label={data.icon}
              isActive={activeFilter === category}
              onPress={() => setActiveFilter(category as QuestCategory)}
              color={data.color}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Quest List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading quests...</Text>
          </View>
        ) : filteredQuests.length === 0 ? (
          <EmptyState filter={activeFilter} onAddQuest={handleAddCustomQuest} />
        ) : activeFilter === 'all' || activeFilter === 'active' ? (
          // Show grouped by category
          Object.entries(questsByCategory).map(([category, quests], categoryIndex) => (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(300 + categoryIndex * 100)}
              style={styles.categorySection}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon} accessible={false}>
                  {CATEGORY_DATA[category as QuestCategory].icon}
                </Text>
                <Text style={styles.categoryName}>
                  {CATEGORY_DATA[category as QuestCategory].name}
                </Text>
                <Text style={styles.categoryCount}>{quests.length}</Text>
              </View>
              {quests.map((quest, index) => {
                const userQuest = userQuests.find(uq => uq.questId === quest.id && uq.isActive);
                return (
                  <QuestLibraryCard
                    key={quest.id}
                    quest={quest}
                    userQuest={userQuest}
                    isActive={activeQuestIds.has(quest.id)}
                    index={index}
                    onPress={() => handleQuestPress(quest, userQuest)}
                    onActivate={() => handleActivateQuest(quest.id)}
                    onDeactivate={() => userQuest && handleDeactivateQuest(userQuest.id)}
                  />
                );
              })}
            </Animated.View>
          ))
        ) : (
          // Show flat list for single category
          filteredQuests.map((quest, index) => {
            const userQuest = userQuests.find(uq => uq.questId === quest.id && uq.isActive);
            return (
              <QuestLibraryCard
                key={quest.id}
                quest={quest}
                userQuest={userQuest}
                isActive={activeQuestIds.has(quest.id)}
                index={index}
                onPress={() => handleQuestPress(quest, userQuest)}
                onActivate={() => handleActivateQuest(quest.id)}
                onDeactivate={() => userQuest && handleDeactivateQuest(userQuest.id)}
              />
            );
          })
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// Filter Tab Component
interface FilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
  color?: string;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, isActive, onPress, count, color }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const accessibleLabel = count !== undefined ? `${label}, ${count} quests` : label;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={accessibleLabel}
        hitSlop={{ top: 6, bottom: 6 }}
        style={[
          styles.filterTab,
          isActive && styles.filterTabActive,
          color && isActive ? { backgroundColor: color + '30', borderColor: color } : undefined,
        ]}
      >
        <Text
          style={[
            styles.filterTabText,
            isActive && styles.filterTabTextActive,
            color && isActive ? { color } : undefined,
          ]}
        >
          {label}
        </Text>
        {count !== undefined && (
          <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
            <Text style={styles.filterBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Quest Card Component
interface QuestLibraryCardProps {
  quest: Quest;
  userQuest?: UserQuest;
  isActive: boolean;
  index: number;
  onPress: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

const QuestLibraryCard: React.FC<QuestLibraryCardProps> = ({
  quest,
  userQuest,
  isActive,
  index,
  onPress,
  onActivate,
  onDeactivate,
}) => {
  const scale = useSharedValue(1);
  const categoryData = CATEGORY_DATA[quest.category as QuestCategory];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.questCard}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${quest.name}, ${categoryData.name}, ${quest.baseXP} XP, ${isActive ? 'active' : 'inactive'}`}
      >
        {/* Left color indicator */}
        <View style={[styles.questColorBar, { backgroundColor: categoryData.color }]} />

        {/* Quest icon */}
        <View style={[styles.questIcon, { backgroundColor: categoryData.color + '20' }]} accessible={false}>
          <Text style={styles.questIconText} accessible={false}>{categoryData.icon}</Text>
        </View>

        {/* Quest info */}
        <View style={styles.questInfo}>
          <Text style={styles.questName} numberOfLines={1}>
            {quest.name}
          </Text>
          <View style={styles.questMeta}>
            <Text style={styles.questFrequency}>
              {quest.frequency.charAt(0).toUpperCase() + quest.frequency.slice(1)}
            </Text>
            <Text style={styles.questXP}>+{quest.baseXP} XP</Text>
            {quest.healthDataType && (
              <View style={styles.autoTrackBadge}>
                <Text style={styles.autoTrackText}>Auto</Text>
              </View>
            )}
          </View>
          {userQuest && (
            <View style={styles.streakInfo}>
              <Text style={styles.streakText}>
                🔥 {userQuest.currentStreak} day streak
              </Text>
              <Text style={styles.completionsText}>
                {userQuest.totalCompletions} completions
              </Text>
            </View>
          )}
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            isActive ? onDeactivate() : onActivate();
          }}
          style={[
            styles.actionButton,
            isActive ? styles.actionButtonActive : styles.actionButtonInactive,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Deactivate quest' : 'Activate quest'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[
            styles.actionButtonText,
            isActive ? styles.actionButtonTextActive : styles.actionButtonTextInactive,
          ]}>
            {isActive ? '✓' : '+'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty State Component
interface EmptyStateProps {
  filter: FilterTab;
  onAddQuest: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ filter, onAddQuest }) => {
  const getMessage = () => {
    if (filter === 'active') {
      return {
        icon: '📋',
        title: 'No Active Quests',
        subtitle: 'Activate quests from the library to start tracking your habits',
      };
    }
    return {
      icon: '🔍',
      title: 'No Quests Found',
      subtitle: 'Try a different filter or create a custom quest',
    };
  };

  const { icon, title, subtitle } = getMessage();

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddQuest} accessibilityRole="button">
        <Text style={styles.emptyButtonText}>Create Custom Quest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#888899',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#4CAF50' + '30',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#4CAF50',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#888888',
    marginTop: 12,
    fontSize: 14,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  categoryCount: {
    color: '#888888',
    fontSize: 14,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  questColorBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  questIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginVertical: 12,
  },
  questIconText: {
    fontSize: 20,
  },
  questInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  questName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questFrequency: {
    fontSize: 12,
    color: '#888888',
  },
  questXP: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  autoTrackBadge: {
    backgroundColor: '#2196F3' + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoTrackText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  streakText: {
    fontSize: 11,
    color: '#FFB74D',
  },
  completionsText: {
    fontSize: 11,
    color: '#888888',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonActive: {
    backgroundColor: '#4CAF50',
  },
  actionButtonInactive: {
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtonTextInactive: {
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export { QuestsScreen };
export default QuestsScreen;
