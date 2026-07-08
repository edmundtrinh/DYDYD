// ============================================
// DYDYD - Shared Types and Interfaces
// ============================================

// -------------------- Enums --------------------

export enum QuestCategory {
  PHYSICAL_HEALTH = 'physical_health',
  MENTAL_WELLNESS = 'mental_wellness',
  CAREER_PRODUCTIVITY = 'career_productivity',
  RELATIONSHIPS_SOCIAL = 'relationships_social',
  HOME_CHORES = 'home_chores',
}

export enum QuestFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum QuestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum BadgeType {
  STREAK = 'streak',
  MILESTONE = 'milestone',
  CATEGORY = 'category',
  SPECIAL = 'special',
}

export enum NotificationType {
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
  WEEKLY_RESET = 'weekly_reset',
  MOTIVATION = 'motivation',
}

export enum HealthDataSource {
  APPLE_HEALTH = 'apple_health',
  GOOGLE_FIT = 'google_fit',
  GARMIN = 'garmin',
  SAMSUNG_HEALTH = 'samsung_health',
  MANUAL = 'manual',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WATCHOS = 'watchos',
  WEAR_OS = 'wear_os',
  TIZEN = 'tizen', // Samsung
  GARMIN = 'garmin',
}

export enum TimeBucket {
  EARLY_MORNING = 'early_morning', // 4am - 7am
  MORNING = 'morning',             // 7am - 12pm
  AFTERNOON = 'afternoon',         // 12pm - 5pm
  EVENING = 'evening',             // 5pm - 9pm
  NIGHT = 'night',                 // 9pm - 4am
}

// -------------------- Core Types --------------------

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  totalXP: number;
  level: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  streakFreezes: number;
  maxStreakFreezes: number;
  streakFreezeUsedAt?: string;
  settings: UserSettings;
  categoryPriorities: CategoryPriority[];
}

export interface UserSettings {
  notificationsEnabled: boolean;
  dailyReminderTime?: string; // HH:mm format
  weeklyResetDay: number; // 0 = Sunday, 6 = Saturday
  timezone: string;
  healthDataSources: HealthDataSource[];
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
}

export interface CategoryPriority {
  category: QuestCategory;
  priority: number; // 1-5, higher = more important
  isEnabled: boolean;
}

// -------------------- Quest Types --------------------

export interface Quest {
  id: string;
  name: string;
  description: string;
  category: QuestCategory;
  frequency: QuestFrequency;
  baseXP: number;
  maxCompletionsPerPeriod: number; // e.g., 2 for brushing teeth twice daily
  isDefault: boolean; // Part of predefined library
  isCustom: boolean;
  iconName: string;
  healthDataType?: HealthDataType; // For auto-tracking
  targetValue?: number; // e.g., 10000 for steps
  unit?: string; // e.g., "steps", "cups", "minutes"
  createdAt: Date;
}

export interface UserQuest {
  id: string;
  odatabaseId: string;
  questId: string;
  quest: Quest;
  isActive: boolean;
  customName?: string;
  customXP?: number;
  reminderTime?: string;
  reminderEnabled: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedAt?: Date;
  createdAt: Date;
}

export interface QuestCompletion {
  id: string;
  userQuestId: string;
  completedAt: Date;
  xpEarned: number;
  value?: number; // e.g., actual steps taken
  source: HealthDataSource;
  periodStart: Date; // Start of the day/week this completion belongs to
  notes?: string;
}

// -------------------- Compassionate Streak Types --------------------

export interface ComebackQuest extends Quest {
  bonusXPMultiplier: number;
  isComeback: true;
  comebackXP: number;
}

export interface StreakFreezeResult {
  used: boolean;
  freezesRemaining: number;
  streakPreserved: boolean;
}

// -------------------- Gamification Types --------------------

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  type: BadgeType;
  requirement: BadgeRequirement;
  xpBonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface BadgeRequirement {
  type: 'streak' | 'total_completions' | 'xp_threshold' | 'category_completions' | 'special';
  value: number;
  category?: QuestCategory;
  questId?: string;
}

export interface UserBadge {
  id: string;
  odatabaseId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
}

export interface LevelInfo {
  level: number;
  minXP: number;
  maxXP: number;
  title: string;
  rewards?: string[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  rank: number;
  weeklyXP: number;
}

// -------------------- Health Integration Types --------------------

export type HealthDataType =
  | 'steps'
  | 'distance'
  | 'active_calories'
  | 'sleep_hours'
  | 'water_cups'
  | 'workout_minutes'
  | 'heart_rate'
  | 'mindful_minutes'
  | 'stand_hours';

export interface HealthData {
  type: HealthDataType;
  value: number;
  unit: string;
  source: HealthDataSource;
  timestamp: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface HealthSyncResult {
  success: boolean;
  dataPoints: HealthData[];
  questsAutoCompleted: string[];
  xpEarned: number;
  error?: string;
}

// -------------------- Progress & Analytics Types --------------------

export interface DailyProgress {
  date: string; // ISO date string
  totalXP: number;
  questsCompleted: number;
  questsTotal: number;
  categoryBreakdown: Record<QuestCategory, number>;
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  totalXP: number;
  dailyProgress: DailyProgress[];
  topCategory: QuestCategory;
  streaksContinued: number;
  streaksBroken: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  totalQuestsCompleted: number;
  currentDayStreak: number;
  longestDayStreak: number;
  badgesEarned: number;
  categoryStats: Record<QuestCategory, CategoryStats>;
  weeklyAverage: number;
  monthlyAverage: number;
}

export interface CategoryStats {
  totalXP: number;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
}

// -------------------- Notification Types --------------------

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
}

export interface DeviceToken {
  id: string;
  odatabaseId: string;
  token: string;
  platform: DevicePlatform;
  deviceName?: string;
  lastActive: Date;
  createdAt: Date;
}

// -------------------- API Types --------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  hasMore?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface CompleteQuestRequest {
  userQuestId: string;
  value?: number;
  source: HealthDataSource;
  notes?: string;
  completedAt?: Date; // For retroactive logging
}

// -------------------- Widget Types --------------------

export interface WidgetData {
  dailyXP: number;
  dailyGoal: number;
  questsRemaining: number;
  topQuests: WidgetQuest[];
  currentStreak: number;
  lastUpdated: Date;
}

export interface WidgetQuest {
  id: string;
  name: string;
  iconName: string;
  xp: number;
  isCompleted: boolean;
  progress?: number; // 0-1 for partial completion
}

// -------------------- Watch Types --------------------

export interface WatchSyncPayload {
  type: 'full_sync' | 'quest_update' | 'completion' | 'stats_update';
  /** ISO 8601 string — always serialized explicitly to avoid bridge format ambiguity */
  timestamp: string;
  data: WatchData;
}

export interface WatchData {
  dailyQuests: WatchQuest[];
  todayXP: number;
  level: number;
  currentStreak: number;
}

export interface WatchQuest {
  /** UserQuest ID — used for completion dispatch via POST /api/quests/:id/complete */
  id: string;
  /** Quest catalog ID — for informational reference only */
  questId: string;
  name: string;
  iconName: string;
  xp: number;
  isCompleted: boolean;
  completionsToday: number;
  maxCompletions: number;
}

// -------------------- Utility Types --------------------

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
