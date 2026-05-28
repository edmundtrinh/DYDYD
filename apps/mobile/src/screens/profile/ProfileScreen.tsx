// ============================================
// DYDYD - Profile Screen
// ============================================

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProfile,
  selectProfile,
  selectTotalXP,
  selectUserLevel,
  selectIsPremium,
} from '../../store/slices/userSlice';
import {
  fetchUserStats,
  fetchEarnedBadges,
  selectUserStats,
  selectEarnedBadges,
} from '../../store/slices/progressSlice';
import { selectUserQuests } from '../../store/slices/questsSlice';
import {
  QuestCategory,
  calculateLevelProgress,
  getLevelTitle,
  CATEGORY_METADATA,
} from '@dydyd/shared';

// Category display data
const CATEGORY_ICONS: Record<QuestCategory, string> = {
  [QuestCategory.PHYSICAL_HEALTH]: '💪',
  [QuestCategory.MENTAL_WELLNESS]: '🧠',
  [QuestCategory.CAREER_PRODUCTIVITY]: '💼',
  [QuestCategory.RELATIONSHIPS_SOCIAL]: '❤️',
  [QuestCategory.HOME_CHORES]: '🏠',
};

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const profile = useAppSelector(selectProfile);
  const totalXP = useAppSelector(selectTotalXP);
  const userLevel = useAppSelector(selectUserLevel);
  const isPremium = useAppSelector(selectIsPremium);
  const stats = useAppSelector(selectUserStats);
  const badges = useAppSelector(selectEarnedBadges);
  const userQuests = useAppSelector(selectUserQuests);
  const isLoading = useAppSelector((state) => state.user.isLoading || state.progress.isLoadingStats);

  const [refreshing, setRefreshing] = React.useState(false);

  // Calculate level progress
  const levelProgress = useMemo(() => calculateLevelProgress(totalXP), [totalXP]);
  const levelTitle = useMemo(() => getLevelTitle(userLevel), [userLevel]);

  // Animation value for XP bar
  const xpBarWidth = useSharedValue(0);

  useEffect(() => {
    xpBarWidth.value = withSpring(levelProgress.progressPercent / 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [levelProgress.progressPercent]);

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpBarWidth.value * 100}%`,
  }));

  // Load data
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchUserStats());
    dispatch(fetchEarnedBadges());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchProfile()),
      dispatch(fetchUserStats()),
      dispatch(fetchEarnedBadges()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Navigation handlers
  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings' as never);
  }, [navigation]);

  const handleBadgesPress = useCallback(() => {
    navigation.navigate('Badges' as never);
  }, [navigation]);

  // Count active quests per category
  const questsByCategory = useMemo(() => {
    const counts: Record<QuestCategory, number> = {
      [QuestCategory.PHYSICAL_HEALTH]: 0,
      [QuestCategory.MENTAL_WELLNESS]: 0,
      [QuestCategory.CAREER_PRODUCTIVITY]: 0,
      [QuestCategory.RELATIONSHIPS_SOCIAL]: 0,
      [QuestCategory.HOME_CHORES]: 0,
    };
    userQuests.filter(q => q.isActive).forEach(q => {
      const category = q.quest?.category as QuestCategory;
      if (category && counts[category] !== undefined) {
        counts[category]++;
      }
    });
    return counts;
  }, [userQuests]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Header with Settings */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumIcon}>👑</Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <Text style={styles.displayName}>{profile?.displayName || 'Adventurer'}</Text>
          <Text style={styles.levelTitle}>{levelTitle}</Text>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Level {userLevel}</Text>
          </View>

          {/* XP Progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpCurrent}>{formatNumber(levelProgress.xpInCurrentLevel)} XP</Text>
              <Text style={styles.xpTarget}>{formatNumber(levelProgress.xpForNextLevel)} XP</Text>
            </View>
            <View style={styles.xpBarBackground}>
              <Animated.View style={[styles.xpBarFill, xpBarStyle]} />
            </View>
            <Text style={styles.xpToNext}>
              {formatNumber(levelProgress.xpForNextLevel - levelProgress.xpInCurrentLevel)} XP to Level {userLevel + 1}
            </Text>
          </View>

          {/* Total XP */}
          <View style={styles.totalXPContainer}>
            <Text style={styles.totalXPLabel}>Total XP Earned</Text>
            <Text style={styles.totalXPValue}>{formatNumber(totalXP)}</Text>
          </View>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="🔥"
              value={stats?.currentDayStreak || 0}
              label="Current Streak"
              color="#FF9800"
              delay={350}
            />
            <StatCard
              icon="🏆"
              value={stats?.longestDayStreak || 0}
              label="Best Streak"
              color="#FFD700"
              delay={400}
            />
            <StatCard
              icon="✓"
              value={stats?.totalQuestsCompleted || 0}
              label="Quests Done"
              color="#4CAF50"
              delay={450}
            />
            <StatCard
              icon="🏅"
              value={badges.length}
              label="Badges"
              color="#9C27B0"
              delay={500}
              onPress={handleBadgesPress}
            />
          </View>
        </Animated.View>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Badges</Text>
              <TouchableOpacity onPress={handleBadgesPress}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesScroll}
            >
              {badges.slice(0, 5).map((userBadge, index) => (
                <Animated.View
                  key={userBadge.id}
                  entering={FadeInRight.delay(500 + index * 100)}
                >
                  <BadgeCard badge={userBadge.badge} earnedAt={userBadge.earnedAt} />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Category Breakdown */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Active Quests by Category</Text>
          <View style={styles.categoryList}>
            {Object.entries(CATEGORY_METADATA).map(([category, meta], index) => {
              const questCount = questsByCategory[category as QuestCategory];
              const categoryStats = stats?.categoryStats?.[category as QuestCategory];
              return (
                <Animated.View
                  key={category}
                  entering={FadeInRight.delay(550 + index * 50)}
                >
                  <CategoryRow
                    icon={CATEGORY_ICONS[category as QuestCategory]}
                    name={meta.name}
                    color={meta.color}
                    questCount={questCount}
                    totalXP={categoryStats?.totalXP || 0}
                    completions={categoryStats?.totalCompletions || 0}
                  />
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Account Info */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{profile?.email || '—'}</Text>
            </View>
            <View style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Member Since</Text>
              <Text style={styles.accountValue}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </Text>
            </View>
            <View style={styles.accountDivider} />
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Subscription</Text>
              <View style={styles.subscriptionBadge}>
                <Text style={[styles.subscriptionText, isPremium && styles.premiumText]}>
                  {isPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  delay: number;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, delay, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1);
  };

  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay)}
      style={[styles.statCard, animatedStyle, { borderTopColor: color }]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{formatNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Badge Card Component
interface BadgeCardProps {
  badge: any;
  earnedAt: Date;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earnedAt }) => {
  const rarityColors: Record<string, string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FFD700',
  };

  return (
    <View style={[styles.badgeCard, { borderColor: rarityColors[badge.rarity] || '#9E9E9E' }]}>
      <View style={[styles.badgeIconContainer, { backgroundColor: (rarityColors[badge.rarity] || '#9E9E9E') + '20' }]}>
        <Text style={styles.badgeIcon}>🏅</Text>
      </View>
      <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
      <Text style={styles.badgeRarity}>{badge.rarity}</Text>
    </View>
  );
};

// Category Row Component
interface CategoryRowProps {
  icon: string;
  name: string;
  color: string;
  questCount: number;
  totalXP: number;
  completions: number;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  icon,
  name,
  color,
  questCount,
  totalXP,
  completions,
}) => {
  return (
    <View style={styles.categoryRow}>
      <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.categoryIconText}>{icon}</Text>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{name}</Text>
        <Text style={styles.categoryMeta}>
          {questCount} active • {completions} completions
        </Text>
      </View>
      <View style={styles.categoryXP}>
        <Text style={[styles.categoryXPValue, { color }]}>{formatNumber(totalXP)}</Text>
        <Text style={styles.categoryXPLabel}>XP</Text>
      </View>
    </View>
  );
};

// Helper function
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  profileCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  premiumIcon: {
    fontSize: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: '500',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  xpSection: {
    width: '100%',
    marginBottom: 20,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpCurrent: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  xpTarget: {
    fontSize: 12,
    color: '#888888',
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
  totalXPContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    width: '100%',
  },
  totalXPLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  totalXPValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderTopWidth: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    textAlign: 'center',
  },
  badgesScroll: {
    paddingRight: 20,
  },
  badgeCard: {
    width: 100,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeRarity: {
    fontSize: 10,
    color: '#888888',
    textTransform: 'capitalize',
  },
  categoryList: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryMeta: {
    fontSize: 12,
    color: '#888888',
  },
  categoryXP: {
    alignItems: 'flex-end',
  },
  categoryXPValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryXPLabel: {
    fontSize: 10,
    color: '#888888',
  },
  accountCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  accountLabel: {
    fontSize: 14,
    color: '#888888',
  },
  accountValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#2A2A3E',
    marginVertical: 4,
  },
  subscriptionBadge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subscriptionText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  premiumText: {
    color: '#FFD700',
  },
});

export { ProfileScreen };
export default ProfileScreen;
