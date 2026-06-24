import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
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

const router: IRouter = Router();

/**
 * GET /api/progress/stats
 * Get user's overall statistics
 */
router.get(
  '/stats',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        throw Errors.notFound('User');
      }

      // Get completion stats
      const completionStats = await prisma.questCompletion.aggregate({
        where: {
          userQuest: {
            userId: req.userId!,
          },
        },
        _count: true,
        _sum: {
          xpEarned: true,
        },
      });

      // Get badge count
      const badgeCount = await prisma.userBadge.count({
        where: { userId: req.userId! },
      });

      // Get category stats
      const categoryCompletions = await prisma.questCompletion.groupBy({
        by: ['userQuestId'],
        where: {
          userQuest: {
            userId: req.userId!,
          },
        },
        _count: true,
        _sum: {
          xpEarned: true,
        },
      });

      // Get streak info from user quests
      const userQuests = await prisma.userQuest.findMany({
        where: {
          userId: req.userId!,
          isActive: true,
        },
        include: {
          quest: true,
        },
      });

      // Calculate real day-over-day streak from completion data
      const { currentDayStreak, longestDayStreak } =
        await calculateOverallDayStreak(req.userId!);

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

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/progress/daily
 * Get today's progress
 */
router.get(
  '/daily',
  authenticate,
  validate([
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in ISO 8601 format'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.query.date
        ? new Date(req.query.date as string)
        : new Date();

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get completions for the day
      const completions = await prisma.questCompletion.findMany({
        where: {
          userQuest: {
            userId: req.userId!,
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
          userId: req.userId!,
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

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/progress/weekly
 * Get weekly progress
 */
router.get(
  '/weekly',
  authenticate,
  validate([
    query('weekStart')
      .optional()
      .isISO8601()
      .withMessage('Week start must be in ISO 8601 format'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      let weekStart: Date;

      if (req.query.weekStart) {
        weekStart = new Date(req.query.weekStart as string);
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

      // Fetch active quest count once — it's the same for all 7 days
      const totalQuests = await prisma.userQuest.count({
        where: { userId: req.userId!, isActive: true },
      });

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const completions = await prisma.questCompletion.findMany({
          where: {
            userQuest: {
              userId: req.userId!,
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

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/progress/badges
 * Get user's earned badges
 */
router.get(
  '/badges',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userBadges = await prisma.userBadge.findMany({
        where: { userId: req.userId! },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });

      const response: ApiResponse<any[]> = {
        success: true,
        data: userBadges,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/progress/leaderboard
 * Get leaderboard (weekly or all-time)
 */
router.get(
  '/leaderboard',
  authenticate,
  validate([
    query('type')
      .optional()
      .isIn(['weekly', 'all-time'])
      .withMessage('Type must be weekly or all-time'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = (req.query.type as string) || 'weekly';
      const limit = parseInt(req.query.limit as string) || 10;

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

        // Map userQuestId → weekly XP, then resolve to userId
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

        return res.json({ success: true, data: leaderboard } as ApiResponse<typeof leaderboard>);
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

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
