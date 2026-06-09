// ============================================
// DYDYD - Home Screen
// ============================================

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useHaptic } from '../../hooks/useHaptic';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { AppDispatch, RootState } from '../../store';
import { fetchUserQuests, completeQuest, selectDailyQuests, selectCompletedQuestIds } from '../../store/slices/questsSlice';
import { fetchUserStats, selectUserStats } from '../../store/slices/progressSlice';
import { selectProfile, selectCategoryPriorities } from '../../store/slices/userSlice';
import { syncHealthData, selectTodayHealthData } from '../../store/slices/healthSlice';
import { CATEGORY_METADATA, calculateLevelProgress, HealthDataSource, QuestCategory } from '@dydyd/shared';
import { wearablesManager } from '../../services/wearables';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Component types
interface QuestCardProps {
  quest: any;
  index: number;
  onComplete: (questId: string) => void;
}

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}

// Progress Ring Component
const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size, strokeWidth, color }) => {
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 15 });
  }, [progress]);
  
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  
  return (
    <View style={{ width: size, height: size }}>
      {/* Background circle */}
      <View style={[styles.ringBackground, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]} />
      {/* Progress indicator (simplified - actual implementation would use SVG) */}
      <View style={[styles.ringProgress, { width: size, height: size }]}>
        <Text style={styles.ringText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

// Quest Card Component
const QuestCard: React.FC<QuestCardProps> = ({ quest, index, onComplete }) => {
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));
  
  const handlePress = useCallback(() => {
    scaleValue.value = withSpring(0.95, {}, () => {
      scaleValue.value = withSpring(1);
    });
    onComplete(quest.id);
  }, [quest.id, onComplete]);
  
  const category = CATEGORY_METADATA[quest.quest?.category as QuestCategory] || CATEGORY_METADATA[QuestCategory.PHYSICAL_HEALTH];
  const progress = quest.quest?.targetValue > 1 
    ? (quest.currentValue || 0) / quest.quest.targetValue 
    : quest.completedToday ? 1 : 0;
  
  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        disabled={quest.completedToday}
        style={({ pressed }) => [
          styles.questCard,
          quest.completedToday && styles.questCardCompleted,
          pressed && styles.questCardPressed,
        ]}
      >
        <View style={[styles.questIcon, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.questIconText}>{category.icon}</Text>
        </View>
        
        <View style={styles.questContent}>
          <Text 
            style={[styles.questName, quest.completedToday && styles.questNameCompleted]}
            numberOfLines={1}
          >
            {quest.quest?.name || 'Quest'}
          </Text>
          
          {quest.quest?.targetValue > 1 && (
            <View style={styles.questProgressBar}>
              <View 
                style={[
                  styles.questProgressFill, 
                  { width: `${progress * 100}%`, backgroundColor: category.color }
                ]} 
              />
            </View>
          )}
          
          <Text style={styles.questCategory}>{category.name}</Text>
        </View>
        
        <View style={styles.questXP}>
          <Text style={[styles.questXPValue, quest.completedToday && styles.questXPCompleted]}>
            +{quest.quest?.baseXP || 0}
          </Text>
          <Text style={styles.questXPLabel}>XP</Text>
        </View>
        
        {quest.completedToday && (
          <View style={styles.questCheckmark}>
            <Text style={styles.questCheckmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <Animated.View entering={FadeInDown.springify()} style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </Animated.View>
);

// Main Home Screen
export const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trigger: haptic } = useHaptic();
  
  const user = useSelector(selectProfile);
  const stats = useSelector(selectUserStats);
  const dailyQuests = useSelector(selectDailyQuests);
  const completedIds = useSelector(selectCompletedQuestIds);
  const healthData = useSelector(selectTodayHealthData);
  const priorities = useSelector(selectCategoryPriorities);
  const isLoading = useSelector((state: RootState) => state.quests.isLoadingUserQuests);

  const todayQuests = useMemo(() =>
    dailyQuests.map(q => ({ ...q, completedToday: completedIds.has(q.id) })),
    [dailyQuests, completedIds]
  );
  
  // Calculate derived values
  const todayXP = useMemo(() => {
    return todayQuests
      .filter(q => q.completedToday)
      .reduce((sum, q) => sum + (q.quest?.baseXP || 0), 0);
  }, [todayQuests]);
  
  const completedCount = useMemo(() => 
    todayQuests.filter(q => q.completedToday).length, 
    [todayQuests]
  );
  
  const totalCount = todayQuests.length;
  const completionProgress = totalCount > 0 ? completedCount / totalCount : 0;
  
  const levelProgress = useMemo(() =>
    calculateLevelProgress(user?.totalXP || 0),
    [user?.totalXP]
  );
  const level = levelProgress.currentLevel;
  const progressToNext = levelProgress.progressPercent / 100;
  
  // Load data
  useEffect(() => {
    dispatch(fetchUserQuests());
    dispatch(fetchUserStats());
    dispatch(syncHealthData());
  }, [dispatch]);
  
  // Sync to wearables when quests change
  useEffect(() => {
    wearablesManager.syncQuests(todayQuests);
    wearablesManager.syncProgress({
      todayXP,
      totalXP: user?.totalXP || 0,
      level,
      completedCount,
      totalCount,
      currentStreak: stats?.currentDayStreak || 0,
    });
  }, [todayQuests, todayXP, user?.totalXP, level, completedCount, totalCount, stats?.currentDayStreak]);
  
  // Refresh handler
  const handleRefresh = useCallback(() => {
    dispatch(fetchUserQuests());
    dispatch(fetchUserStats());
    dispatch(syncHealthData());
  }, [dispatch]);
  
  // Complete quest handler
  const handleCompleteQuest = useCallback((questId: string) => {
    haptic('notificationSuccess');
    dispatch(completeQuest({ userQuestId: questId, value: 1, source: HealthDataSource.MANUAL }));
  }, [dispatch, haptic]);
  
  // Sort quests by priority
  const sortedQuests = useMemo(() => {
    const priorityMap = new Map((priorities || []).map((p: any) => [p.category, p.priority]));
    return [...todayQuests].sort((a: any, b: any) => {
      // Incomplete first
      if (a.completedToday !== b.completedToday) {
        return a.completedToday ? 1 : -1;
      }
      // Then by priority
      const aPriority = priorityMap.get(a.quest?.category || '') || 0;
      const bPriority = priorityMap.get(b.quest?.category || '') || 0;
      return bPriority - aPriority;
    });
  }, [todayQuests, priorities]);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Adventurer'}!
            </Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          
          <Pressable 
            style={styles.levelBadge}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Text style={styles.levelIcon}>🔥</Text>
            <Text style={styles.levelText}>Lv {level}</Text>
          </Pressable>
        </View>
        
        {/* Progress Overview */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <ProgressRing 
              progress={completionProgress} 
              size={80} 
              strokeWidth={8} 
              color="#4CAF50" 
            />
          </View>
          
          <View style={styles.progressRight}>
            <Text style={styles.xpValue}>{todayXP} XP</Text>
            <Text style={styles.xpLabel}>earned today</Text>
            
            <View style={styles.levelProgress}>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${progressToNext * 100}%` }]} />
              </View>
              <Text style={styles.levelProgressText}>
                {Math.round(progressToNext * 100)}% to Level {level + 1}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard 
            title="Streak" 
            value={stats?.currentDayStreak || 0} 
            subtitle="days"
            icon="🔥" 
            color="#FF9800" 
          />
          <StatCard 
            title="Completed" 
            value={`${completedCount}/${totalCount}`} 
            subtitle="quests"
            icon="✓" 
            color="#4CAF50" 
          />
          <StatCard 
            title="Total XP" 
            value={formatNumber(user?.totalXP || 0)} 
            icon="⭐" 
            color="#9C27B0" 
          />
        </View>
        
        {/* Health Data (if available) */}
        {healthData && (healthData.steps || healthData.sleep_hours) && (
          <View style={styles.healthSection}>
            <Text style={styles.sectionTitle}>📱 Today's Activity</Text>
            <View style={styles.healthRow}>
              {healthData.steps && (
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{formatNumber(healthData.steps.value)}</Text>
                  <Text style={styles.healthLabel}>steps</Text>
                </View>
              )}
              {healthData.sleep_hours && (
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{healthData.sleep_hours.value.toFixed(1)}</Text>
                  <Text style={styles.healthLabel}>hours sleep</Text>
                </View>
              )}
              {healthData.workout_minutes && (
                <View style={styles.healthItem}>
                  <Text style={styles.healthValue}>{healthData.workout_minutes.value}</Text>
                  <Text style={styles.healthLabel}>min workout</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Quest List */}
        <View style={styles.questsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Quests</Text>
            <Pressable onPress={() => navigation.navigate('Quests' as never)}>
              <Text style={styles.seeAllText}>See All →</Text>
            </Pressable>
          </View>
          
          {sortedQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No quests yet!</Text>
              <Text style={styles.emptySubtitle}>Add some quests to start your journey</Text>
              <Pressable 
                style={styles.addQuestButton}
                onPress={() => navigation.navigate('Quests' as never)}
              >
                <Text style={styles.addQuestButtonText}>+ Add Quests</Text>
              </Pressable>
            </View>
          ) : (
            sortedQuests.map((quest, index) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                index={index}
                onComplete={handleCompleteQuest}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Helper functions
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  levelText: {
    color: '#FFB74D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressLeft: {
    marginRight: 16,
  },
  progressRight: {
    flex: 1,
    justifyContent: 'center',
  },
  xpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  xpLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
  },
  levelProgress: {
    marginTop: 8,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: '#2A2A3E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },
  ringBackground: {
    position: 'absolute',
    borderColor: '#2A2A3E',
  },
  ringProgress: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statTitle: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#666666',
  },
  healthSection: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  healthItem: {
    alignItems: 'center',
  },
  healthValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  healthLabel: {
    fontSize: 12,
    color: '#888888',
  },
  questsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questCardCompleted: {
    opacity: 0.6,
  },
  questCardPressed: {
    backgroundColor: '#252538',
  },
  questIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questIconText: {
    fontSize: 20,
  },
  questContent: {
    flex: 1,
  },
  questName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  questNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  questProgressBar: {
    height: 4,
    backgroundColor: '#2A2A3E',
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  questCategory: {
    fontSize: 12,
    color: '#888888',
  },
  questXP: {
    alignItems: 'center',
    marginLeft: 12,
  },
  questXPValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB74D',
  },
  questXPCompleted: {
    color: '#4CAF50',
  },
  questXPLabel: {
    fontSize: 10,
    color: '#888888',
  },
  questCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  addQuestButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addQuestButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default HomeScreen;
