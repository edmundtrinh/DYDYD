import { Hono } from 'hono';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { calculateOverallDayStreak, calculateUserQuestStreak } from '../lib/streaks';
import {
  ApiResponse,
  UserStats,
  DailyProgress,
  WeeklyProgress,
  QuestCategory,
  TimeBucket,
  TimingInsights,
  QuestTimingAverage,
} from '@dydyd/shared';

type Env = {
  Variables: {
    validatedQuery: unknown;
    userId: string;
    user: { id: string; email: string };
  };
};

const app = new Hono<Env>();

/**
 * GET /api/progress/stats
 * Get user's overall statistics
 */
app.get(
  '/stats',
  authenticate,
  async (c) => {
    const userId = c.get('userId');
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    // Get completion stats
    const completionStats = await prisma.questCompletion.aggregate({
      where: {
        userQuest: {
          userId,
        },
      },
      _count: true,
      _sum: {
        xpEarned: true,
      },
    });

    // Get badge count
    const badgeCount = await prisma.userBadge.count({
      where: { userId },
    });

    // Get category stats
    const categoryCompletions = await prisma.questCompletion.groupBy({
      by: ['userQuestId'],
      where: {
        userQuest: {
          userId,
        },
      },
      _count: true,
      _sum: {
        xpEarned: true,
      },
    });

    // Get streak info from user quests
    const userQuests: any[] = await prisma.userQuest.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        quest: true,
      },
    });

    // Calculate real day-over-day streak from completion data
    const { currentDayStreak, longestDayStreak } =
      await calculateOverallDayStreak(userId);

    // Build category stats with real per-quest streak calculations
    const categoryStats: Record<QuestCategory, { totalXP: number; totalCompletions: number; currentStreak: number; longestStreak: number }> = {
      [QuestCategory.PHYSICAL_HEALTH]: { totalXP: 0, totalCompletions: 0, currentStreak: 0, longestStreak: 0 },
      [QuestCategory.MENTAL_WELLNESS]: { totalXP: 0, totalCompletions: 0, currentStreak: 0, longestStreak: 0 },
      [QuestCategory.CAREER_PRODUCTIVITY]: { totalXP: 0, totalCompletions: 0, currentStreak: 0, longestStreak: 0 },
      [QuestCategory.RELATIONSHIPS_SOCIAL]: { totalXP: 0, totalCompletions: 0, currentStreak: 0, longestStreak: 0 },
      [QuestCategory.HOME_CHORES]: { totalXP: 0, totalCompletions: 0, currentStreak: 0, longestStreak: 0 },
    };

    for (const userQuest of userQuests) {
      const category = userQuest.quest.category as QuestCategory;
      if (categoryStats[category]) {
        const streakInfo = await calculateUserQuestStreak(
          userQuest.id,
          userQuest.quest.frequency
        );
        categoryStats[category].currentStreak = Math.max(
          categoryStats[category].currentStreak,
          streakInfo.currentStreak
        );
        categoryStats[category].longestStreak = Math.max(
          categoryStats[category].longestStreak,
          streakInfo.longestStreak
        );
        categoryStats[category].totalCompletions += userQuest.totalCompletions;
      }
    }

    const stats: UserStats = {
      totalXP: user.totalXP,
      level: user.level,
      totalQuestsCompleted: completionStats._count,
      currentDayStreak,
      longestDayStreak,
      badgesEarned: badgeCount,
      categoryStats,
      weeklyAverage: 0, // Would calculate from historical data
      monthlyAverage: 0,
    };

    const response: ApiResponse<UserStats> = {
      success: true,
      data: stats,
    };

    return c.json(response);
  }
);

/**
 * GET /api/progress/daily
 * Get today's progress
 */
app.get(
  '/daily',
  authenticate,
  async (c) => {
    const dateParam = c.req.query('date');

    // Validate optional date param inline
    if (dateParam && isNaN(Date.parse(dateParam))) {
      throw Errors.validationError({ date: ['Date must be in ISO 8601 format'] });
    }

    const date = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const userId = c.get('userId');
    // Get completions for the day
    const completions: any[] = await prisma.questCompletion.findMany({
      where: {
        userQuest: {
          userId,
        },
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        userQuest: {
          include: {
            quest: true,
          },
        },
      },
    });

    // Calculate category breakdown
    const categoryBreakdown: Record<QuestCategory, number> = {
      [QuestCategory.PHYSICAL_HEALTH]: 0,
      [QuestCategory.MENTAL_WELLNESS]: 0,
      [QuestCategory.CAREER_PRODUCTIVITY]: 0,
      [QuestCategory.RELATIONSHIPS_SOCIAL]: 0,
      [QuestCategory.HOME_CHORES]: 0,
    };

    let totalXP = 0;
    for (const completion of completions) {
      const category = completion.userQuest.quest.category as QuestCategory;
      categoryBreakdown[category] += completion.xpEarned;
      totalXP += completion.xpEarned;
    }

    // Get total quest count for user
    const totalQuests = await prisma.userQuest.count({
      where: {
        userId,
        isActive: true,
      },
    });

    const dailyProgress: DailyProgress = {
      date: startOfDay.toISOString(),
      totalXP,
      questsCompleted: completions.length,
      questsTotal: totalQuests,
      categoryBreakdown,
    };

    const response: ApiResponse<DailyProgress> = {
      success: true,
      data: dailyProgress,
    };

    return c.json(response);
  }
);

/**
 * GET /api/progress/weekly
 * Get weekly progress
 */
app.get(
  '/weekly',
  authenticate,
  async (c) => {
    const weekStartParam = c.req.query('weekStart');

    // Validate optional weekStart param inline
    if (weekStartParam && isNaN(Date.parse(weekStartParam))) {
      throw Errors.validationError({ weekStart: ['Week start must be in ISO 8601 format'] });
    }

    const now = new Date();
    let weekStart: Date;

    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
    } else {
      // Default to current week (Sunday start)
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
    }
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get daily progress for each day of the week
    const dailyProgress: DailyProgress[] = [];
    let totalWeekXP = 0;
    const categoryTotals: Record<QuestCategory, number> = {
      [QuestCategory.PHYSICAL_HEALTH]: 0,
      [QuestCategory.MENTAL_WELLNESS]: 0,
      [QuestCategory.CAREER_PRODUCTIVITY]: 0,
      [QuestCategory.RELATIONSHIPS_SOCIAL]: 0,
      [QuestCategory.HOME_CHORES]: 0,
    };

    const userId = c.get('userId');
    // Fetch active quest count once -- it's the same for all 7 days
    const totalQuests = await prisma.userQuest.count({
      where: { userId, isActive: true },
    });

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const completions: any[] = await prisma.questCompletion.findMany({
        where: {
          userQuest: {
            userId,
          },
          completedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          userQuest: {
            include: {
              quest: true,
            },
          },
        },
      });

      const categoryBreakdown: Record<QuestCategory, number> = {
        [QuestCategory.PHYSICAL_HEALTH]: 0,
        [QuestCategory.MENTAL_WELLNESS]: 0,
        [QuestCategory.CAREER_PRODUCTIVITY]: 0,
        [QuestCategory.RELATIONSHIPS_SOCIAL]: 0,
        [QuestCategory.HOME_CHORES]: 0,
      };

      let dayXP = 0;
      for (const completion of completions) {
        const category = completion.userQuest.quest.category as QuestCategory;
        categoryBreakdown[category] += completion.xpEarned;
        categoryTotals[category] += completion.xpEarned;
        dayXP += completion.xpEarned;
      }
      totalWeekXP += dayXP;

      dailyProgress.push({
        date: dayStart.toISOString(),
        totalXP: dayXP,
        questsCompleted: completions.length,
        questsTotal: totalQuests,
        categoryBreakdown,
      });
    }

    // Find top category
    let topCategory = QuestCategory.PHYSICAL_HEALTH;
    let maxCategoryXP = 0;
    for (const [category, xp] of Object.entries(categoryTotals)) {
      if (xp > maxCategoryXP) {
        maxCategoryXP = xp;
        topCategory = category as QuestCategory;
      }
    }

    const weeklyProgress: WeeklyProgress = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalXP: totalWeekXP,
      dailyProgress,
      topCategory,
      streaksContinued: 0, // Would calculate from streak data
      streaksBroken: 0,
    };

    const response: ApiResponse<WeeklyProgress> = {
      success: true,
      data: weeklyProgress,
    };

    return c.json(response);
  }
);

/**
 * GET /api/progress/badges
 * Get user's earned badges
 */
app.get(
  '/badges',
  authenticate,
  async (c) => {
    const userId = c.get('userId');
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: userBadges,
    };

    return c.json(response);
  }
);

/**
 * GET /api/progress/leaderboard
 * Get leaderboard (weekly or all-time)
 */
app.get(
  '/leaderboard',
  authenticate,
  async (c) => {
    const typeParam = c.req.query('type');
    const limitParam = c.req.query('limit');

    // Validate type inline
    if (typeParam && typeParam !== 'weekly' && typeParam !== 'all-time') {
      throw Errors.validationError({ type: ['Type must be weekly or all-time'] });
    }

    // Validate limit inline
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw Errors.validationError({ limit: ['Limit must be between 1 and 100'] });
      }
    }

    const type = typeParam || 'weekly';
    const limit = parseInt(limitParam || '') || 10;

    let users;

    if (type === 'weekly') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      // Aggregate weekly XP per userQuest, then join to users
      const weeklyStats = await prisma.questCompletion.groupBy({
        by: ['userQuestId'],
        where: { completedAt: { gte: weekStart } },
        _sum: { xpEarned: true },
      });

      // Map userQuestId -> weekly XP, then resolve to userId
      const userQuestIds = weeklyStats.map((s: { userQuestId: string }) => s.userQuestId);
      const userQuestMap = await prisma.userQuest.findMany({
        where: { id: { in: userQuestIds } },
        select: { id: true, userId: true },
      });

      const weeklyXPByUser = new Map<string, number>();
      for (const stat of weeklyStats) {
        const uq = userQuestMap.find((u: { id: string; userId: string }) => u.id === stat.userQuestId);
        if (uq) {
          weeklyXPByUser.set(uq.userId, (weeklyXPByUser.get(uq.userId) ?? 0) + (stat._sum.xpEarned ?? 0));
        }
      }

      const topUserIds = [...weeklyXPByUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      const userRecords = await prisma.user.findMany({
        where: { id: { in: topUserIds } },
        select: { id: true, displayName: true, avatarUrl: true, totalXP: true, level: true },
      });

      users = topUserIds
        .map((id) => userRecords.find((u: { id: string }) => u.id === id))
        .filter(Boolean);

      const leaderboard = users.map((user: any, index: number) => ({
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        totalXP: user.totalXP,
        level: user.level,
        rank: index + 1,
        weeklyXP: weeklyXPByUser.get(user.id) ?? 0,
      }));

      return c.json({ success: true, data: leaderboard } as ApiResponse<typeof leaderboard>);
    } else {
      users = await prisma.user.findMany({
        orderBy: { totalXP: 'desc' },
        take: limit,
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          totalXP: true,
          level: true,
        },
      });
    }

    const leaderboard = users.map((user: any, index: number) => ({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      totalXP: user.totalXP,
      level: user.level,
      rank: index + 1,
      weeklyXP: 0,
    }));

    const response: ApiResponse<typeof leaderboard> = {
      success: true,
      data: leaderboard,
    };

    return c.json(response);
  }
);

/**
 * GET /api/progress/timing-insights
 * Get timing pattern insights for the authenticated user
 */
app.get(
  '/timing-insights',
  authenticate,
  async (c) => {
    const userId = c.get('userId');

    // Fetch all completions with timeBucket data (last 90 days for meaningful patterns)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const completions = await prisma.questCompletion.findMany({
      where: {
        userQuest: { userId },
        completedAt: { gte: ninetyDaysAgo },
        timeBucket: { not: null },
      },
      select: {
        completedAt: true,
        timeBucket: true,
        userQuest: {
          select: {
            questId: true,
            quest: { select: { name: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (completions.length === 0) {
      const emptyInsights: TimingInsights = {
        bucketDistribution: {},
        mostProductiveBucket: null,
        currentBucketStreak: { bucket: null, days: 0 },
        averageCompletionHour: null,
        averageCompletionHourByQuest: [],
        recentCompletionComparison: null,
      };
      return c.json({ success: true, data: emptyInsights } as ApiResponse<TimingInsights>);
    }

    // Bucket distribution: count per bucket
    const bucketDistribution: Record<string, number> = {};
    for (const c2 of completions) {
      const bucket = c2.timeBucket!;
      bucketDistribution[bucket] = (bucketDistribution[bucket] || 0) + 1;
    }

    // Most productive bucket
    let mostProductiveBucket: string | null = null;
    let maxCount = 0;
    for (const [bucket, count] of Object.entries(bucketDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveBucket = bucket;
      }
    }

    // Global average completion hour
    const totalHours = completions.reduce(
      (sum: number, c2: { completedAt: Date }) =>
        sum + c2.completedAt.getHours() + c2.completedAt.getMinutes() / 60,
      0
    );
    const averageCompletionHour = Math.round((totalHours / completions.length) * 10) / 10;

    // Per-quest average completion hour
    const questHourAccum = new Map<string, { name: string; totalHours: number; count: number }>();
    for (const c2 of completions) {
      const qId = c2.userQuest.questId;
      const qName = c2.userQuest.quest.name;
      const hour = c2.completedAt.getHours() + c2.completedAt.getMinutes() / 60;
      const existing = questHourAccum.get(qId);
      if (existing) {
        existing.totalHours += hour;
        existing.count += 1;
      } else {
        questHourAccum.set(qId, { name: qName, totalHours: hour, count: 1 });
      }
    }
    const averageCompletionHourByQuest: QuestTimingAverage[] = [...questHourAccum.entries()]
      .map(([questId, data]) => ({
        questId,
        questName: data.name,
        averageHour: Math.round((data.totalHours / data.count) * 10) / 10,
        completionCount: data.count,
      }))
      .sort((a, b) => b.completionCount - a.completionCount);

    // Recent completion comparison: compare to the same quest's average, not global
    let recentCompletionComparison: string | null = null;
    if (completions.length > 1) {
      const mostRecent = completions[0];
      const recentHour = mostRecent.completedAt.getHours() + mostRecent.completedAt.getMinutes() / 60;
      const questAvg = questHourAccum.get(mostRecent.userQuest.questId);
      // Compare against this quest's average if it has more than 1 completion; otherwise use global
      const comparisonAvg = (questAvg && questAvg.count > 1)
        ? questAvg.totalHours / questAvg.count
        : averageCompletionHour;
      const diffHours = Math.round((recentHour - comparisonAvg) * 10) / 10;

      if (Math.abs(diffHours) < 0.5) {
        recentCompletionComparison = 'About the same as your average';
      } else if (diffHours < 0) {
        recentCompletionComparison = `${Math.abs(diffHours).toFixed(1)}h earlier than average`;
      } else {
        recentCompletionComparison = `${diffHours.toFixed(1)}h later than average`;
      }
    }

    // Current bucket streak: consecutive days with completions in the same bucket
    const dayBuckets = new Map<string, Set<string>>();
    for (const c2 of completions) {
      const d = c2.completedAt;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!dayBuckets.has(key)) {
        dayBuckets.set(key, new Set());
      }
      dayBuckets.get(key)!.add(c2.timeBucket!);
    }

    // Convert to sorted array of { date, buckets }
    const sortedDays = [...dayBuckets.entries()]
      .map(([key, buckets]) => {
        const [y, m, d] = key.split('-').map(Number);
        return { date: new Date(y, m, d, 0, 0, 0), buckets };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let currentBucketStreak = { bucket: null as string | null, days: 0 };
    if (sortedDays.length > 0 && sortedDays[0].buckets.size === 1) {
      const streakBucket = [...sortedDays[0].buckets][0];
      let streakDays = 1;

      for (let i = 1; i < sortedDays.length; i++) {
        const diffMs = sortedDays[i - 1].date.getTime() - sortedDays[i].date.getTime();
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays !== 1) break;
        if (sortedDays[i].buckets.size !== 1 || !sortedDays[i].buckets.has(streakBucket)) break;
        streakDays++;
      }

      currentBucketStreak = { bucket: streakBucket, days: streakDays };
    }

    const insights: TimingInsights = {
      bucketDistribution,
      mostProductiveBucket,
      currentBucketStreak,
      averageCompletionHour,
      averageCompletionHourByQuest,
      recentCompletionComparison,
    };

    return c.json({ success: true, data: insights } as ApiResponse<TimingInsights>);
  }
);

// --- Zod schemas for query validation ---

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  questId: z.string().uuid().optional(),
  category: z.nativeEnum(QuestCategory).optional(),
});

/**
 * GET /api/progress/weekly-digest
 * Get a comparison of current vs previous week completions and XP
 */
app.get(
  '/weekly-digest',
  authenticate,
  async (c) => {
    const userId = c.get('userId');

    // Use Sunday-start convention consistent with existing /weekly endpoint
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setMilliseconds(-1); // 1ms before current week

    // Get current week stats
    const [currentCompletions, currentXP, activeQuests] = await Promise.all([
      prisma.questCompletion.count({
        where: {
          userQuest: { userId },
          completedAt: { gte: currentWeekStart, lte: currentWeekEnd },
        },
      }),
      prisma.questCompletion.aggregate({
        where: {
          userQuest: { userId },
          completedAt: { gte: currentWeekStart, lte: currentWeekEnd },
        },
        _sum: { xpEarned: true },
      }),
      prisma.userQuest.count({
        where: { userId, isActive: true },
      }),
    ]);

    const currentTotalXP = currentXP._sum.xpEarned ?? 0;

    // Get current streak
    const { currentDayStreak } = await calculateOverallDayStreak(userId);

    // Determine if user had a previous week (check if user existed before current week)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    const isFirstWeek = !user || user.createdAt >= currentWeekStart;

    let previousWeek: {
      weekStart: string;
      weekEnd: string;
      totalCompletions: number;
      totalXP: number;
    } | null = null;

    let comparison: {
      completionsDelta: number;
      completionsPercent: number;
      xpDelta: number;
      xpPercent: number;
    } | null = null;

    if (!isFirstWeek) {
      const [prevCompletions, prevXP] = await Promise.all([
        prisma.questCompletion.count({
          where: {
            userQuest: { userId },
            completedAt: { gte: previousWeekStart, lte: previousWeekEnd },
          },
        }),
        prisma.questCompletion.aggregate({
          where: {
            userQuest: { userId },
            completedAt: { gte: previousWeekStart, lte: previousWeekEnd },
          },
          _sum: { xpEarned: true },
        }),
      ]);

      const prevTotalXP = prevXP._sum.xpEarned ?? 0;

      previousWeek = {
        weekStart: previousWeekStart.toISOString(),
        weekEnd: previousWeekEnd.toISOString(),
        totalCompletions: prevCompletions,
        totalXP: prevTotalXP,
      };

      const completionsDelta = currentCompletions - prevCompletions;
      const xpDelta = currentTotalXP - prevTotalXP;

      comparison = {
        completionsDelta,
        completionsPercent:
          prevCompletions === 0
            ? currentCompletions > 0
              ? 100
              : 0
            : Math.round((completionsDelta / prevCompletions) * 100),
        xpDelta,
        xpPercent:
          prevTotalXP === 0
            ? currentTotalXP > 0
              ? 100
              : 0
            : Math.round((xpDelta / prevTotalXP) * 100),
      };
    }

    return c.json({
      success: true,
      data: {
        currentWeek: {
          weekStart: currentWeekStart.toISOString(),
          weekEnd: currentWeekEnd.toISOString(),
          totalCompletions: currentCompletions,
          totalXP: currentTotalXP,
          activeQuests,
          streakLength: currentDayStreak,
        },
        previousWeek,
        comparison,
      },
    });
  }
);

/**
 * GET /api/progress/history
 * Get paginated completion history with optional filters
 */
app.get(
  '/history',
  authenticate,
  validateQuery(historyQuerySchema),
  async (c) => {
    const userId = c.get('userId');

    // Use validated/coerced values stored by validateQuery middleware
    const { page, perPage, questId, category } = c.get('validatedQuery') as z.infer<typeof historyQuerySchema>;

    // Build where clause
    const where: Prisma.QuestCompletionWhereInput = {
      userQuest: {
        userId,
        ...(questId ? { questId } : {}),
        ...(category
          ? {
              quest: { category },
            }
          : {}),
      },
    };

    // Get total count and paginated results in parallel
    const [total, completions] = await Promise.all([
      prisma.questCompletion.count({ where }),
      prisma.questCompletion.findMany({
        where,
        include: {
          userQuest: {
            include: {
              quest: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const data = completions.map((completion) => ({
      id: completion.id,
      questName: completion.userQuest.quest.name,
      questCategory: completion.userQuest.quest.category,
      completedAt: completion.completedAt.toISOString(),
      timeBucket: completion.timeBucket ?? null,
      xpEarned: completion.xpEarned,
      value: completion.value ?? null,
      source: completion.source,
      notes: completion.notes ?? null,
    }));

    return c.json({
      success: true,
      data,
      meta: {
        page,
        perPage,
        total,
        hasMore: page * perPage < total,
      },
    });
  }
);

export default app;
