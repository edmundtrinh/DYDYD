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
