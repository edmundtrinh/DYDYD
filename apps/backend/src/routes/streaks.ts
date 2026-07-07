import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { calculateFreezeAwareDayStreak } from '../lib/streaks';
import {
  ApiResponse,
  canUseStreakFreeze,
  shouldOfferComebackQuest,
  calculateComebackXP,
  STREAK_FREEZE_CONFIG,
  COMEBACK_CONFIG,
  PREDEFINED_QUESTS,
  QuestCategory,
  QuestFrequency,
} from '@dydyd/shared';

const router: IRouter = Router();

/**
 * GET /api/streaks/status
 * Returns current streak, freezes available, and comeback quest eligibility.
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        throw Errors.notFound('User');
      }

      const { currentDayStreak, longestDayStreak } =
        await calculateFreezeAwareDayStreak(req.userId!, user.streakFreezeUsedAt);

      const freezeAvailable = canUseStreakFreeze({
        streakFreezes: user.streakFreezes,
        streakFreezeUsedAt: user.streakFreezeUsedAt?.toISOString(),
      });

      const comebackEligible = user.lastActiveDate
        ? shouldOfferComebackQuest(user.lastActiveDate)
        : false;

      const response: ApiResponse<{
        currentDayStreak: number;
        longestDayStreak: number;
        streakFreezes: number;
        maxStreakFreezes: number;
        freezeAvailable: boolean;
        comebackEligible: boolean;
        activeDaysCount: number;
        nextFreezeIn: number;
      }> = {
        success: true,
        data: {
          currentDayStreak,
          longestDayStreak,
          streakFreezes: user.streakFreezes,
          maxStreakFreezes: user.maxStreakFreezes,
          freezeAvailable,
          comebackEligible,
          activeDaysCount: user.activeDaysCount,
          nextFreezeIn:
            STREAK_FREEZE_CONFIG.freezeEarnInterval -
            (user.activeDaysCount % STREAK_FREEZE_CONFIG.freezeEarnInterval),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/streaks/freeze
 * Manually use a streak freeze for today.
 */
router.post(
  '/freeze',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        throw Errors.notFound('User');
      }

      const available = canUseStreakFreeze({
        streakFreezes: user.streakFreezes,
        streakFreezeUsedAt: user.streakFreezeUsedAt?.toISOString(),
      });

      if (!available) {
        throw Errors.badRequest('No streak freezes available or already used today');
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          streakFreezes: user.streakFreezes - 1,
          streakFreezeUsedAt: new Date(),
        },
      });

      const response: ApiResponse<{
        used: boolean;
        freezesRemaining: number;
        streakPreserved: boolean;
      }> = {
        success: true,
        data: {
          used: true,
          freezesRemaining: updatedUser.streakFreezes,
          streakPreserved: true,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/streaks/comeback
 * Get a comeback quest if eligible.
 */
router.get(
  '/comeback',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        throw Errors.notFound('User');
      }

      if (!user.lastActiveDate) {
        throw Errors.badRequest('No activity history found');
      }

      const eligible = shouldOfferComebackQuest(user.lastActiveDate);

      if (!eligible) {
        throw Errors.badRequest('Not eligible for a comeback quest');
      }

      // Select a simple comeback quest from predefined quests
      const simpleQuest = PREDEFINED_QUESTS.find(
        (q) =>
          q.category === QuestCategory.MENTAL_WELLNESS &&
          q.frequency === QuestFrequency.DAILY &&
          q.baseXP <= 3
      ) ?? PREDEFINED_QUESTS[0];

      const comebackQuest = {
        ...simpleQuest,
        id: 'comeback-' + Date.now(),
        createdAt: new Date(),
        bonusXPMultiplier: COMEBACK_CONFIG.bonusXPMultiplier,
        isComeback: true as const,
        baseXP: calculateComebackXP(simpleQuest.baseXP),
      };

      const response: ApiResponse<typeof comebackQuest> = {
        success: true,
        data: comebackQuest,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
