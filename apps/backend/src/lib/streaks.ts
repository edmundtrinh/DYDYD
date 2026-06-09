import { prisma } from './prisma';
import {
  calculateStreak,
  QuestFrequency,
  getStartOfDay,
  getDaysBetween,
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
  const periodSet = new Set<string>();
  for (const d of completionDates) {
    const start = getStartOfDay(d);
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
