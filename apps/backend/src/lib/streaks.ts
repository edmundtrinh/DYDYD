import { prisma } from './prisma';
import {
  calculateStreak,
  QuestFrequency,
  getStartOfDay,
  getDaysBetween,
  canUseStreakFreeze,
  STREAK_FREEZE_CONFIG,
  isSameDay,
} from '@dydyd/shared';

/**
 * Calculate the real current streak for a single UserQuest by looking at
 * day-over-day (or period-over-period) completions in the database.
 *
 * Uses the shared package's `calculateStreak` helper which walks backwards
 * from today checking each period for at least one completion.
 */
export async function calculateUserQuestStreak(
  userQuestId: string,
  frequency: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  const completions = await prisma.questCompletion.findMany({
    where: { userQuestId },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
  });

  const completionDates = completions.map((c: { completedAt: Date }) => c.completedAt);
  const freq = frequency as QuestFrequency;

  const currentStreak = calculateStreak(completionDates, freq);

  // For longest streak, walk through all dates chronologically and find the
  // longest consecutive run.
  const longestStreak = calculateLongestStreak(completionDates, freq);

  return { currentStreak, longestStreak };
}

/**
 * Walk through completion dates to find the longest consecutive period streak.
 */
function calculateLongestStreak(
  completionDates: Date[],
  frequency: QuestFrequency
): number {
  if (completionDates.length === 0) return 0;

  // Deduplicate by period — group completions into their period-start date
  // For weekly/monthly, bucket by week/month start, not day start, so that
  // consecutive periods are separated by exactly getExpectedGap() days.
  const periodSet = new Set<string>();
  for (const d of completionDates) {
    const start = getPeriodStart(d, frequency);
    periodSet.add(start.toISOString());
  }

  // Sort ascending
  const uniquePeriods = Array.from(periodSet)
    .map((iso) => new Date(iso))
    .sort((a, b) => a.getTime() - b.getTime());

  if (uniquePeriods.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniquePeriods.length; i++) {
    const gap = getExpectedGap(frequency);
    const actualGap = getDaysBetween(uniquePeriods[i - 1], uniquePeriods[i]);

    if (actualGap === gap) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

function getPeriodStart(date: Date, frequency: QuestFrequency): Date {
  switch (frequency) {
    case QuestFrequency.WEEKLY: {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay()); // Sunday of that week
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case QuestFrequency.MONTHLY: {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    default:
      return getStartOfDay(date);
  }
}

function getExpectedGap(frequency: QuestFrequency): number {
  switch (frequency) {
    case QuestFrequency.DAILY:
      return 1;
    case QuestFrequency.WEEKLY:
      return 7;
    case QuestFrequency.MONTHLY:
      return 30; // Approximation
    default:
      return 1;
  }
}

/**
 * Calculate the overall "day streak" for a user — the number of consecutive
 * days (counting backwards from today) on which the user completed at least
 * one quest of any kind.
 */
export async function calculateOverallDayStreak(
  userId: string
): Promise<{ currentDayStreak: number; longestDayStreak: number }> {
  const completions = await prisma.questCompletion.findMany({
    where: {
      userQuest: { userId },
    },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
  });

  if (completions.length === 0) {
    return { currentDayStreak: 0, longestDayStreak: 0 };
  }

  // Deduplicate by day
  const daySet = new Set<string>();
  for (const c of completions) {
    const day = getStartOfDay(c.completedAt).toISOString();
    daySet.add(day);
  }

  const uniqueDays = Array.from(daySet)
    .map((iso) => new Date(iso))
    .sort((a, b) => b.getTime() - a.getTime()); // newest first

  // Current streak: walk backwards from today
  const today = getStartOfDay(new Date());
  let currentDayStreak = 0;
  let checkDate = today;

  for (const day of uniqueDays) {
    const dayStart = getStartOfDay(day);
    const gap = getDaysBetween(checkDate, dayStart);

    if (gap === 0) {
      currentDayStreak++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (gap === 1 && currentDayStreak === 0) {
      // Allow yesterday if nothing today yet
      currentDayStreak++;
      checkDate = new Date(dayStart);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak: walk chronologically
  const sortedAsc = [...uniqueDays].sort(
    (a, b) => a.getTime() - b.getTime()
  );
  let longestDayStreak = 1;
  let runLength = 1;

  for (let i = 1; i < sortedAsc.length; i++) {
    const gap = getDaysBetween(sortedAsc[i - 1], sortedAsc[i]);
    if (gap === 1) {
      runLength++;
      if (runLength > longestDayStreak) longestDayStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  return { currentDayStreak, longestDayStreak };
}

/**
 * Calculate a freeze-aware day streak for a user. This wraps
 * calculateOverallDayStreak and adds +1 to the current streak if:
 * - The raw streak would otherwise be 0 (no completion today/yesterday), AND
 * - A freeze was used today (streakFreezeUsedAt matches today).
 *
 * This ensures the streak status endpoint reflects the freeze without
 * modifying the core calculateOverallDayStreak signature used by progress.
 */
export async function calculateFreezeAwareDayStreak(
  userId: string,
  streakFreezeUsedAt: Date | null
): Promise<{ currentDayStreak: number; longestDayStreak: number }> {
  const result = await calculateOverallDayStreak(userId);

  // If a freeze was used today and there's a gap in the raw streak,
  // the freeze bridges that gap — preserve the streak that existed
  // before the missed day, not just bump to 1.
  if (streakFreezeUsedAt && isSameDay(streakFreezeUsedAt, new Date())) {
    if (result.currentDayStreak === 0) {
      // Freeze bridges the gap — calculate what streak existed before the miss
      const completions = await prisma.questCompletion.findMany({
        where: { userQuest: { userId } },
        select: { completedAt: true },
        orderBy: { completedAt: 'desc' },
      });

      if (completions.length > 0) {
        const daySet = new Set<string>();
        for (const c of completions) {
          daySet.add(getStartOfDay(c.completedAt).toISOString());
        }
        const uniqueDays = Array.from(daySet)
          .map((iso) => new Date(iso))
          .sort((a, b) => b.getTime() - a.getTime());

        // Count backwards from 2 days ago (the last day before the gap)
        const twoDaysAgo = getStartOfDay(new Date());
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        let streakBeforeGap = 0;
        let checkDate = twoDaysAgo;

        for (const day of uniqueDays) {
          const dayStart = getStartOfDay(day);
          const gap = getDaysBetween(checkDate, dayStart);
          if (gap === 0) {
            streakBeforeGap++;
            checkDate = new Date(checkDate);
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        // Freeze preserves the streak: historic streak + 1 for the freeze day
        result.currentDayStreak = streakBeforeGap + 1;
      } else {
        // No completions at all — freeze still covers 1 day
        result.currentDayStreak = 1;
      }
    }
  }

  return result;
}

/**
 * Check if the user missed exactly 1 day and auto-apply a streak freeze.
 * Returns whether a freeze was applied. This is called during streak
 * recalculation or when a user completes a quest.
 *
 * This function is idempotent within a single day -- if a freeze was
 * already used today (streakFreezeUsedAt matches today), it will not
 * consume another freeze.
 */
export async function checkAndAutoApplyFreeze(
  userId: string
): Promise<{ freezeApplied: boolean; freezesRemaining: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { freezeApplied: false, freezesRemaining: 0 };
  }

  // If user has no last active date, nothing to freeze
  if (!user.lastActiveDate) {
    return { freezeApplied: false, freezesRemaining: user.streakFreezes };
  }

  const today = getStartOfDay(new Date());
  const lastActive = getStartOfDay(user.lastActiveDate);
  const gap = getDaysBetween(lastActive, today);

  // Only auto-freeze if exactly 1 day was missed (gap of 2 means yesterday was skipped)
  if (gap !== 2) {
    return { freezeApplied: false, freezesRemaining: user.streakFreezes };
  }

  const available = canUseStreakFreeze({
    streakFreezes: user.streakFreezes,
    streakFreezeUsedAt: user.streakFreezeUsedAt?.toISOString(),
  });

  if (!available) {
    return { freezeApplied: false, freezesRemaining: user.streakFreezes };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      streakFreezes: user.streakFreezes - 1,
      streakFreezeUsedAt: new Date(),
    },
  });

  return { freezeApplied: true, freezesRemaining: updatedUser.streakFreezes };
}

/**
 * Track an active day for the user and potentially award a new streak freeze.
 * Should be called when the user completes a quest. Idempotent within a day.
 */
export async function trackActiveDay(
  userId: string
): Promise<{ activeDaysCount: number; freezeAwarded: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { activeDaysCount: 0, freezeAwarded: false };
  }

  const today = new Date();

  // If already tracked today, skip
  if (user.lastActiveDate && isSameDay(user.lastActiveDate, today)) {
    return { activeDaysCount: user.activeDaysCount, freezeAwarded: false };
  }

  const newActiveDays = user.activeDaysCount + 1;
  let freezeAwarded = false;

  // Award a freeze every freezeEarnInterval active days, up to maxFreezes
  const shouldAwardFreeze =
    newActiveDays % STREAK_FREEZE_CONFIG.freezeEarnInterval === 0 &&
    user.streakFreezes < user.maxStreakFreezes;

  if (shouldAwardFreeze) {
    freezeAwarded = true;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeDaysCount: newActiveDays,
      lastActiveDate: today,
      ...(shouldAwardFreeze ? { streakFreezes: user.streakFreezes + 1 } : {}),
    },
  });

  return { activeDaysCount: newActiveDays, freezeAwarded };
}
