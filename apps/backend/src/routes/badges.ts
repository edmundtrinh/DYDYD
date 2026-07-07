import { Hono } from 'hono';
import { authenticate, optionalAuth, AuthEnv } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, Badge, QuestCategory } from '@dydyd/shared';

const app = new Hono<AuthEnv>();

/**
 * GET /api/badges
 * List all badges (public library)
 */
app.get(
  '/',
  optionalAuth,
  async (c) => {
    const badges = await prisma.badge.findMany({
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' },
      ],
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: badges,
    };

    return c.json(response);
  }
);

/**
 * GET /api/badges/user
 * List user's earned badges (authenticated)
 */
app.get(
  '/user',
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
 * POST /api/badges/check
 * Check and award any newly earned badges (authenticated)
 */
app.post(
  '/check',
  authenticate,
  async (c) => {
    const userId = c.get('userId');

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    // Get all badges the user does NOT yet have
    const earnedBadgeIds = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedSet = new Set(earnedBadgeIds.map((ub: { badgeId: string }) => ub.badgeId));

    const allBadges = await prisma.badge.findMany();
    const unearnedBadges = allBadges.filter((b: { id: string }) => !earnedSet.has(b.id));

    if (unearnedBadges.length === 0) {
      return c.json({
        success: true,
        data: { awarded: [], xpBonusTotal: 0 },
      } as ApiResponse<{ awarded: any[]; xpBonusTotal: number }>);
    }

    // Gather stats needed for badge evaluation
    const userQuests: any[] = await prisma.userQuest.findMany({
      where: { userId, isActive: true },
      include: { quest: true },
    });

    const totalCompletions = await prisma.questCompletion.count({
      where: { userQuest: { userId } },
    });

    // Category completions
    const categoryCompletionCounts: Record<string, number> = {};
    for (const uq of userQuests) {
      const cat = uq.quest.category;
      categoryCompletionCounts[cat] =
        (categoryCompletionCounts[cat] || 0) + uq.totalCompletions;
    }

    // Max streak across all quests
    const maxStreak = Math.max(
      ...userQuests.map((q: { currentStreak: number }) => q.currentStreak),
      0
    );

    // Evaluate each unearned badge
    const newlyAwarded: typeof allBadges = [];

    for (const badge of unearnedBadges) {
      let earned = false;

      switch (badge.requirementType) {
        case 'total_completions':
          earned = totalCompletions >= badge.requirementValue;
          break;

        case 'xp_threshold':
          earned = user.totalXP >= badge.requirementValue;
          break;

        case 'streak':
          earned = maxStreak >= badge.requirementValue;
          break;

        case 'category_completions':
          if (badge.requirementCategory) {
            const count =
              categoryCompletionCounts[badge.requirementCategory] || 0;
            earned = count >= badge.requirementValue;
          }
          break;

        case 'special':
          // Special badges require custom logic that depends on their
          // specific definition. Skip automatic awarding for now.
          break;
      }

      if (earned) {
        newlyAwarded.push(badge);
      }
    }

    // Award all newly earned badges in a transaction
    let xpBonusTotal = 0;

    if (newlyAwarded.length > 0) {
      const createOps = newlyAwarded.map((badge: { id: string }) =>
        prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        })
      );

      xpBonusTotal = newlyAwarded.reduce((sum: number, b: { xpBonus: number }) => sum + b.xpBonus, 0);

      await prisma.$transaction([
        ...createOps,
        prisma.user.update({
          where: { id: userId },
          data: { totalXP: { increment: xpBonusTotal } },
        }),
      ]);
    }

    const response: ApiResponse<{ awarded: typeof newlyAwarded; xpBonusTotal: number }> = {
      success: true,
      data: {
        awarded: newlyAwarded,
        xpBonusTotal,
      },
    };

    return c.json(response);
  }
);

export default app;
