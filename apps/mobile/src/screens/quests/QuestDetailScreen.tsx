// ============================================
// DYDYD - Quest Detail Screen
// ============================================

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectQuestLibrary,
  selectUserQuests,
  selectTodayCompletions,
  completeQuest,
  activateQuest,
  deactivateQuest,
} from '../../store/slices/questsSlice';
import {
  QuestCategory,
  QuestFrequency,
  HealthDataSource,
} from '@dydyd/shared';

// Navigation types
type QuestsStackParamList = {
  QuestsList: undefined;
  QuestDetail: { questId: string; userQuestId?: string };
  AddQuest: { category?: string };
};

type QuestDetailRouteProp = RouteProp<QuestsStackParamList, 'QuestDetail'>;
type NavigationProp = NativeStackNavigationProp<QuestsStackParamList, 'QuestDetail'>;

// Category metadata
const CATEGORY_DATA: Record<QuestCategory, { name: string; icon: string; color: string }> = {
  [QuestCategory.PHYSICAL_HEALTH]: { name: 'Physical Health', icon: '💪', color: '#4CAF50' },
  [QuestCategory.MENTAL_WELLNESS]: { name: 'Mental Wellness', icon: '🧠', color: '#9C27B0' },
  [QuestCategory.CAREER_PRODUCTIVITY]: { name: 'Career & Productivity', icon: '💼', color: '#2196F3' },
  [QuestCategory.RELATIONSHIPS_SOCIAL]: { name: 'Relationships', icon: '❤️', color: '#E91E63' },
  [QuestCategory.HOME_CHORES]: { name: 'Home & Chores', icon: '🏠', color: '#FF9800' },
};

// Frequency labels
const FREQUENCY_LABELS: Record<QuestFrequency, string> = {
  [QuestFrequency.DAILY]: 'Daily',
  [QuestFrequency.WEEKLY]: 'Weekly',
  [QuestFrequency.MONTHLY]: 'Monthly',
};

const QuestDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuestDetailRouteProp>();
  const dispatch = useAppDispatch();

  const { questId, userQuestId } = route.params;

  const questLibrary = useAppSelector(selectQuestLibrary);
  const userQuests = useAppSelector(selectUserQuests);
  const todayCompletions = useAppSelector(selectTodayCompletions);
  const isCompleting = useAppSelector((state) => state.quests.isCompleting);

  const [notes, setNotes] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Find quest and user quest data
  const quest = useMemo(() =>
    questLibrary.find(q => q.id === questId),
    [questLibrary, questId]
  );

  const userQuest = useMemo(() =>
    userQuests.find(uq => uq.id === userQuestId || uq.questId === questId),
    [userQuests, userQuestId, questId]
  );

  const isActive = !!userQuest?.isActive;

  // Check if already completed today
  const todayCompletion = useMemo(() =>
    todayCompletions.find(c => c.userQuestId === userQuest?.id),
    [todayCompletions, userQuest]
  );

  const isCompletedToday = !!todayCompletion;
  const isLoading = userQuest ? isCompleting[userQuest.id] : false;

  // Get category data
  const categoryData = quest ? CATEGORY_DATA[quest.category as QuestCategory] : null;

  // Animation values
  const completeButtonScale = useSharedValue(1);
  const xpBounce = useSharedValue(0);

  const completeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeButtonScale.value }],
  }));

  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: xpBounce.value }],
  }));

  // Handle quest completion
  const handleComplete = useCallback(async () => {
    if (!userQuest || isCompletedToday || isLoading) return;

    // Button press animation
    completeButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1)
    );

    try {
      await dispatch(completeQuest({
        userQuestId: userQuest.id,
        value: customValue ? parseFloat(customValue) : 1,
        source: HealthDataSource.MANUAL,
        notes: notes || undefined,
      })).unwrap();

      // XP bounce animation
      xpBounce.value = withSequence(
        withTiming(-10, { duration: 150 }),
        withSpring(0)
      );

      // Reset form
      setNotes('');
      setCustomValue('');
      setShowNotes(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete quest. Please try again.');
    }
  }, [userQuest, isCompletedToday, isLoading, customValue, notes, dispatch]);

  // Handle activate/deactivate
  const handleToggleActive = useCallback(async () => {
    if (isActive && userQuest) {
      Alert.alert(
        'Deactivate Quest',
        'Are you sure you want to deactivate this quest? Your progress will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: async () => {
              await dispatch(deactivateQuest(userQuest.id));
            },
          },
        ]
      );
    } else if (quest) {
      await dispatch(activateQuest(quest.id));
    }
  }, [isActive, userQuest, quest, dispatch]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!quest) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Quest not found</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quest Details</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quest Header Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[styles.questHeader, { borderColor: categoryData?.color }]}
        >
          <View style={[styles.questIconLarge, { backgroundColor: categoryData?.color + '20' }]}>
            <Text style={styles.questIconText}>{categoryData?.icon}</Text>
          </View>

          <Text style={styles.questName}>{quest.name}</Text>
          <Text style={styles.questDescription}>{quest.description}</Text>

          <View style={styles.questBadges}>
            <View style={[styles.badge, { backgroundColor: categoryData?.color + '20' }]}>
              <Text style={[styles.badgeText, { color: categoryData?.color }]}>
                {categoryData?.name}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {FREQUENCY_LABELS[quest.frequency as QuestFrequency]}
              </Text>
            </View>
            {quest.healthDataType && (
              <View style={[styles.badge, styles.autoBadge]}>
                <Text style={[styles.badgeText, styles.autoBadgeText]}>Auto-Track</Text>
              </View>
            )}
          </View>

          <Animated.View style={[styles.xpContainer, xpStyle]}>
            <Text style={styles.xpValue}>+{quest.baseXP}</Text>
            <Text style={styles.xpLabel}>XP per completion</Text>
          </Animated.View>
        </Animated.View>

        {/* Target Value (if applicable) */}
        {quest.targetValue && quest.unit && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.targetCard}>
            <Text style={styles.sectionTitle}>Target</Text>
            <View style={styles.targetContent}>
              <Text style={styles.targetValue}>{quest.targetValue}</Text>
              <Text style={styles.targetUnit}>{quest.unit}</Text>
            </View>
          </Animated.View>
        )}

        {/* User Quest Stats */}
        {userQuest && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Your Progress</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userQuest.currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.streakFire}>🔥</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userQuest.longestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
                <Text style={styles.streakFire}>🏆</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userQuest.totalCompletions}</Text>
                <Text style={styles.statLabel}>Total Done</Text>
                <Text style={styles.streakFire}>✓</Text>
              </View>
            </View>

            {userQuest.lastCompletedAt && (
              <View style={styles.lastCompleted}>
                <Text style={styles.lastCompletedLabel}>Last completed:</Text>
                <Text style={styles.lastCompletedValue}>
                  {formatDate(new Date(userQuest.lastCompletedAt))}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Completion Section */}
        {isActive && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.completionCard}>
            <Text style={styles.sectionTitle}>
              {isCompletedToday ? 'Completed Today!' : 'Mark as Complete'}
            </Text>

            {isCompletedToday ? (
              <View style={styles.completedContent}>
                <Text style={styles.completedIcon}>🎉</Text>
                <Text style={styles.completedText}>
                  Great job! You earned +{todayCompletion?.xpEarned || quest.baseXP} XP
                </Text>
                {todayCompletion?.notes && (
                  <Text style={styles.completedNotes}>"{todayCompletion.notes}"</Text>
                )}
              </View>
            ) : (
              <View style={styles.completionForm}>
                {/* Custom Value Input (for quests with targets) */}
                {quest.targetValue && quest.unit && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Value ({quest.unit})</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customValue}
                      onChangeText={setCustomValue}
                      placeholder={`e.g., ${quest.targetValue}`}
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {/* Notes Toggle */}
                <TouchableOpacity
                  style={styles.notesToggle}
                  onPress={() => setShowNotes(!showNotes)}
                >
                  <Text style={styles.notesToggleText}>
                    {showNotes ? '- Hide notes' : '+ Add notes'}
                  </Text>
                </TouchableOpacity>

                {/* Notes Input */}
                {showNotes && (
                  <Animated.View entering={FadeInUp}>
                    <TextInput
                      style={[styles.textInput, styles.notesInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="How did it go? (optional)"
                      placeholderTextColor="#666666"
                      multiline
                      numberOfLines={3}
                    />
                  </Animated.View>
                )}

                {/* Complete Button */}
                <Animated.View style={completeButtonStyle}>
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      { backgroundColor: categoryData?.color },
                      isLoading && styles.completeButtonDisabled,
                    ]}
                    onPress={handleComplete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.completeButtonText}>Complete Quest</Text>
                        <Text style={styles.completeButtonXP}>+{quest.baseXP} XP</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Activate/Deactivate Button */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isActive ? styles.deactivateButton : styles.activateButton,
            ]}
            onPress={handleToggleActive}
          >
            <Text style={[
              styles.actionButtonText,
              isActive ? styles.deactivateButtonText : styles.activateButtonText,
            ]}>
              {isActive ? 'Deactivate Quest' : 'Activate Quest'}
            </Text>
          </TouchableOpacity>

          {!isActive && (
            <Text style={styles.activateHint}>
              Activate this quest to start tracking your progress
            </Text>
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// Helper functions
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 18,
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  questHeader: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  questIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  questIconText: {
    fontSize: 40,
  },
  questName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  questBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  autoBadge: {
    backgroundColor: '#2196F3' + '30',
  },
  autoBadgeText: {
    color: '#2196F3',
  },
  xpContainer: {
    alignItems: 'center',
  },
  xpValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  xpLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  targetCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  targetContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  targetValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  targetUnit: {
    fontSize: 20,
    color: '#888888',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
    textAlign: 'center',
  },
  streakFire: {
    position: 'absolute',
    top: -8,
    right: 8,
    fontSize: 16,
  },
  lastCompleted: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  lastCompletedLabel: {
    fontSize: 13,
    color: '#666666',
  },
  lastCompletedValue: {
    fontSize: 13,
    color: '#CCCCCC',
    marginLeft: 4,
  },
  completionCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  completedContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  completedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  completedNotes: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  completionForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesToggle: {
    alignSelf: 'flex-start',
  },
  notesToggleText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeButtonXP: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  actionSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  activateButtonText: {
    color: '#FFFFFF',
  },
  deactivateButtonText: {
    color: '#FF5252',
  },
  activateHint: {
    fontSize: 13,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QuestDetailScreen;
