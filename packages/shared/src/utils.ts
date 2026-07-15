// ============================================
// DYDYD - Shared Utilities
// ============================================

import { QuestFrequency, DailyProgress, QuestCategory, StreakFreezeResult, TimeBucket } from './types';
import {
  calculateXPForLevel,
  getLevelFromXP,
  calculateTotalXPForLevel,
  COMEBACK_CONFIG,
  PROGRESSIVE_ONBOARDING,
} from './constants';

// -------------------- Time Bucket Utilities --------------------

export const getTimeBucket = (date: Date = new Date()): TimeBucket => {
  const hour = date.getHours();
  if (hour >= 4 && hour < 7) return TimeBucket.EARLY_MORNING;
  if (hour >= 7 && hour < 12) return TimeBucket.MORNING;
  if (hour >= 12 && hour < 17) return TimeBucket.AFTERNOON;
  if (hour >= 17 && hour < 21) return TimeBucket.EVENING;
  return TimeBucket.NIGHT; // 9pm - 4am
};

// -------------------- Date Utilities --------------------

export const getStartOfDay = (date: Date = new Date()): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfDay = (date: Date = new Date()): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getStartOfWeek = (
  date: Date = new Date(),
  weekStartDay: number = 0
): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartDay ? 7 : 0) + day - weekStartDay;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (
  date: Date = new Date(),
  weekStartDay: number = 0
): Date => {
  const start = getStartOfWeek(date, weekStartDay);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isSameWeek = (
  date1: Date,
  date2: Date,
  weekStartDay: number = 0
): boolean => {
  const start1 = getStartOfWeek(date1, weekStartDay);
  const start2 = getStartOfWeek(date2, weekStartDay);
  return isSameDay(start1, start2);
};

export const getDaysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  const start1 = getStartOfDay(date1);
  const start2 = getStartOfDay(date2);
  return Math.round(Math.abs((start1.getTime() - start2.getTime()) / oneDay));
};

export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const getPeriodStart = (
  frequency: QuestFrequency,
  date: Date = new Date(),
  weekStartDay: number = 0
): Date => {
  switch (frequency) {
    case QuestFrequency.DAILY:
      return getStartOfDay(date);
    case QuestFrequency.WEEKLY:
      return getStartOfWeek(date, weekStartDay);
    case QuestFrequency.MONTHLY:
      const monthStart = new Date(date);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    default:
      return getStartOfDay(date);
  }
};

export const getPeriodEnd = (
  frequency: QuestFrequency,
  date: Date = new Date(),
  weekStartDay: number = 0
): Date => {
  switch (frequency) {
    case QuestFrequency.DAILY:
      return getEndOfDay(date);
    case QuestFrequency.WEEKLY:
      return getEndOfWeek(date, weekStartDay);
    case QuestFrequency.MONTHLY:
      const monthEnd = new Date(date);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      return monthEnd;
    default:
      return getEndOfDay(date);
  }
};

// -------------------- XP & Level Utilities --------------------

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  totalXPForCurrentLevel: number;
}

export const calculateLevelProgress = (totalXP: number): LevelProgress => {
  const currentLevel = getLevelFromXP(totalXP);
  const totalXPForCurrentLevel = calculateTotalXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel);
  const xpInCurrentLevel = totalXP - totalXPForCurrentLevel;
  const progressPercent = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpForNextLevel) * 100)
  );

  return {
    currentLevel,
    currentXP: totalXP,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent,
    totalXPForCurrentLevel,
  };
};

// -------------------- Streak Utilities --------------------

export const calculateStreak = (
  completionDates: Date[],
  frequency: QuestFrequency,
  currentDate: Date = new Date()
): number => {
  if (completionDates.length === 0) return 0;

  const sortedDates = [...completionDates].sort(
    (a, b) => b.getTime() - a.getTime()
  );

  let streak = 0;
  let checkDate = currentDate;

  for (let i = 0; i < sortedDates.length; i++) {
    const periodStart = getPeriodStart(frequency, checkDate);
    const periodEnd = getPeriodEnd(frequency, checkDate);

    const hasCompletionInPeriod = sortedDates.some(
      (d) => d >= periodStart && d <= periodEnd
    );

    if (hasCompletionInPeriod) {
      streak++;
      // Move to previous period
      if (frequency === QuestFrequency.DAILY) {
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (frequency === QuestFrequency.WEEKLY) {
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 7);
      }
    } else {
      break;
    }
  }

  return streak;
};

// -------------------- Progress Calculation --------------------

export const calculateDailyProgress = (
  completions: Array<{ xpEarned: number; category: QuestCategory }>,
  totalQuests: number
): Omit<DailyProgress, 'date'> => {
  const categoryBreakdown: Record<QuestCategory, number> = {
    [QuestCategory.PHYSICAL_HEALTH]: 0,
    [QuestCategory.MENTAL_WELLNESS]: 0,
    [QuestCategory.CAREER_PRODUCTIVITY]: 0,
    [QuestCategory.RELATIONSHIPS_SOCIAL]: 0,
    [QuestCategory.HOME_CHORES]: 0,
  };

  let totalXP = 0;
  completions.forEach((c) => {
    totalXP += c.xpEarned;
    categoryBreakdown[c.category] += c.xpEarned;
  });

  return {
    totalXP,
    questsCompleted: completions.length,
    questsTotal: totalQuests,
    categoryBreakdown,
  };
};

// -------------------- Validation Utilities --------------------

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

// -------------------- ID Generation --------------------

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// -------------------- Array Utilities --------------------

export const groupBy = <T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce(
    (result, item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    },
    {} as Record<K, T[]>
  );
};

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => number | string,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const valA = keyFn(a);
    const valB = keyFn(b);
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// -------------------- Compassionate Streak Utilities --------------------

export const canUseStreakFreeze = (user: {
  streakFreezes: number;
  streakFreezeUsedAt?: string;
}): boolean => {
  if (user.streakFreezes <= 0) return false;
  if (user.streakFreezeUsedAt) {
    const usedDate = new Date(user.streakFreezeUsedAt);
    const today = new Date();
    if (isSameDay(usedDate, today)) return false;
  }
  return true;
};

export const applyStreakFreeze = (user: {
  streakFreezes: number;
}): StreakFreezeResult => {
  if (user.streakFreezes <= 0) {
    return { used: false, freezesRemaining: 0, streakPreserved: false };
  }
  return { used: true, freezesRemaining: user.streakFreezes - 1, streakPreserved: true };
};

export const shouldOfferComebackQuest = (
  lastActiveDate: string | Date,
  now?: Date
): boolean => {
  const lastActive = lastActiveDate instanceof Date ? lastActiveDate : new Date(lastActiveDate);
  const current = now ?? new Date();
  const daysMissed = getDaysBetween(lastActive, current);
  return daysMissed >= 1 && daysMissed <= COMEBACK_CONFIG.maxMissedDays;
};

export const calculateComebackXP = (baseXP: number): number => {
  return Math.floor(baseXP * COMEBACK_CONFIG.bonusXPMultiplier);
};

export const getOnboardingQuestLimit = (activeDaysCount: number): number => {
  const unlocks = Math.floor(activeDaysCount / PROGRESSIVE_ONBOARDING.daysToUnlockMore);
  return PROGRESSIVE_ONBOARDING.initialQuestLimit + unlocks * PROGRESSIVE_ONBOARDING.maxQuestsPerUnlock;
};

// -------------------- Time-of-Day Badge Utilities --------------------

/**
 * Completion record with the fields needed for time-of-day badge evaluation.
 */
export interface TimeBadgeCompletion {
  completedAt: Date;
  timeBucket: string;
}

/**
 * Group completions by calendar day (local time) and return a sorted array of
 * { date (start-of-day), buckets (set of unique buckets that day) }.
 */
const groupCompletionsByDay = (
  completions: TimeBadgeCompletion[]
): Array<{ date: Date; buckets: Set<string> }> => {
  const dayMap = new Map<string, { date: Date; buckets: Set<string> }>();

  for (const c of completions) {
    const d = new Date(c.completedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayMap.has(key)) {
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      dayMap.set(key, { date: startOfDay, buckets: new Set() });
    }
    dayMap.get(key)!.buckets.add(c.timeBucket);
  }

  return [...dayMap.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
};

/**
 * Count consecutive days (from most recent backward) where the predicate holds.
 * Days must be adjacent calendar days with no gaps.
 */
const countConsecutiveDays = (
  days: Array<{ date: Date; buckets: Set<string> }>,
  predicate: (buckets: Set<string>) => boolean
): number => {
  if (days.length === 0) return 0;

  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    // Check adjacency: each day must be exactly 1 day after the next in the array
    if (i > 0) {
      const diffMs = days[i - 1].date.getTime() - days[i].date.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays !== 1) break;
    }

    if (predicate(days[i].buckets)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Early Riser: 5+ completions in EARLY_MORNING bucket on consecutive days.
 * A day qualifies if it has at least one completion with timeBucket = EARLY_MORNING.
 */
export const checkEarlyRiserBadge = (completions: TimeBadgeCompletion[]): boolean => {
  const earlyOnly = completions.filter(
    (c) => c.timeBucket === TimeBucket.EARLY_MORNING
  );
  const days = groupCompletionsByDay(earlyOnly);
  return countConsecutiveDays(days, () => true) >= 5;
};

/**
 * Night Owl: 5+ completions in EVENING or NIGHT bucket on consecutive days.
 * A day qualifies if it has at least one completion in EVENING or NIGHT.
 */
export const checkNightOwlBadge = (completions: TimeBadgeCompletion[]): boolean => {
  const nightOnly = completions.filter(
    (c) =>
      c.timeBucket === TimeBucket.EVENING || c.timeBucket === TimeBucket.NIGHT
  );
  const days = groupCompletionsByDay(nightOnly);
  return countConsecutiveDays(days, () => true) >= 5;
};

/**
 * Steady Eddie: Same time bucket for 7+ consecutive days.
 * A day qualifies if ALL completions that day fall in a single bucket.
 * We check for any bucket that achieves a 7-day consecutive streak.
 */
export const checkSteadyEddieBadge = (completions: TimeBadgeCompletion[]): boolean => {
  const days = groupCompletionsByDay(completions);
  if (days.length < 7) return false;

  // Try each bucket as the "steady" bucket
  const allBuckets = [
    TimeBucket.EARLY_MORNING,
    TimeBucket.MORNING,
    TimeBucket.AFTERNOON,
    TimeBucket.EVENING,
    TimeBucket.NIGHT,
  ];

  for (const bucket of allBuckets) {
    // Filter to days that have at least one completion in this bucket
    // AND no completions in any other bucket
    const streak = countConsecutiveDays(
      days,
      (buckets) => buckets.size === 1 && buckets.has(bucket)
    );
    if (streak >= 7) return true;
  }

  return false;
};

/**
 * Dawn Patrol: Complete all active daily quests before 9am for 5 consecutive days.
 * Uses completedAt hour (local time), NOT timeBucket, since 9am falls within the
 * MORNING bucket (7-12) and the bucket boundary doesn't match.
 *
 * @param completions - All completions (any time) for the user's daily quests
 * @param activeDailyQuestCount - Number of currently active daily-frequency quests
 */
export const checkDawnPatrolBadge = (
  completions: TimeBadgeCompletion[],
  activeDailyQuestCount: number
): boolean => {
  if (activeDailyQuestCount <= 0) return false;

  // Group all completions by day
  const dayMap = new Map<string, { date: Date; before9amCount: number }>();

  for (const c of completions) {
    const d = new Date(c.completedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayMap.has(key)) {
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      dayMap.set(key, { date: startOfDay, before9amCount: 0 });
    }
    if (d.getHours() < 9) {
      dayMap.get(key)!.before9amCount++;
    }
  }

  const days = [...dayMap.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Count consecutive days where before-9am completions >= active daily quest count
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (i > 0) {
      const diffMs = days[i - 1].date.getTime() - days[i].date.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays !== 1) break;
    }

    if (days[i].before9amCount >= activeDailyQuestCount) {
      streak++;
    } else {
      break;
    }
  }

  return streak >= 5;
};
