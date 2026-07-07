import { Hono } from 'hono';
import { authenticate, AuthEnv } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { calculateOverallDayStreak, calculateUserQuestStreak } from '../lib/streaks';
import {
  ApiResponse,
  UserStats,
  DailyProgress,
  WeeklyProgress,
  QuestCategory,
} from '@dydyd/shared';

const app = new Hono<AuthEnv>();

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

export default app;
