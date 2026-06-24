import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { body, param } from 'express-validator';
import { Prisma } from '@prisma/client';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, Quest, HealthDataSource } from '@dydyd/shared';

const router: IRouter = Router();

/**
 * GET /api/quests/library
 * Get all predefined quests (public)
 */
router.get(
  '/library',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get quests from database (seeded from PREDEFINED_QUESTS)
      const quests = await prisma.quest.findMany({
        where: { isDefault: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      });

      const response: ApiResponse<Quest[]> = {
        success: true,
        data: quests as Quest[],
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/quests/user
 * Get user's active quests
 */
router.get(
  '/user',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userQuests = await prisma.userQuest.findMany({
        where: {
          userId: req.userId!,
          isActive: true,
        },
        include: {
          quest: true,
          completions: {
            where: {
              completedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
              },
            },
            orderBy: { completedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const response: ApiResponse<any[]> = {
        success: true,
        data: userQuests,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/quests/activate
 * Activate a quest for the user
 */
router.post(
  '/activate',
  authenticate,
  validate([
    body('questId').isUUID().withMessage('Valid quest ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questId } = req.body;

      // Check if quest exists
      const quest = await prisma.quest.findUnique({
        where: { id: questId },
      });

      if (!quest) {
        throw Errors.notFound('Quest');
      }

      // Check if already activated
      const existingUserQuest = await prisma.userQuest.findFirst({
        where: {
          userId: req.userId!,
          questId,
        },
      });

      if (existingUserQuest) {
        // Reactivate if it was deactivated
        if (!existingUserQuest.isActive) {
          const updatedUserQuest = await prisma.userQuest.update({
            where: { id: existingUserQuest.id },
            data: { isActive: true },
            include: { quest: true },
          });

          return res.json({
            success: true,
            data: updatedUserQuest,
          });
        }

        throw Errors.conflict('Quest already activated');
      }

      // Create new user quest
      const userQuest = await prisma.userQuest.create({
        data: {
          userId: req.userId!,
          questId,
          isActive: true,
          reminderEnabled: false,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
        },
        include: { quest: true },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: userQuest,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/quests/:id/complete
 * Mark a quest as completed
 */
router.post(
  '/:id/complete',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid quest ID is required'),
    body('value').optional().isNumeric().withMessage('Value must be a number'),
    body('source').optional().isString().withMessage('Source must be a string'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userQuestId } = req.params;
      const { value, source = 'manual', notes } = req.body;

      // Get user quest
      const userQuest = await prisma.userQuest.findFirst({
        where: {
          id: userQuestId,
          userId: req.userId!,
          isActive: true,
        },
        include: { quest: true },
      });

      if (!userQuest) {
        throw Errors.notFound('User quest');
      }

      // Calculate period start based on frequency
      const now = new Date();
      let periodStart: Date;

      switch (userQuest.quest.frequency) {
        case 'weekly':
          const day = now.getDay();
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - day);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default: // daily
          periodStart = new Date(now);
          periodStart.setHours(0, 0, 0, 0);
      }

      // Check max completions for period
      const completionsInPeriod = await prisma.questCompletion.count({
        where: {
          userQuestId,
          periodStart,
        },
      });

      if (completionsInPeriod >= userQuest.quest.maxCompletionsPerPeriod) {
        throw Errors.badRequest('Maximum completions for this period reached');
      }

      // Calculate XP earned
      const xpEarned = userQuest.customXP || userQuest.quest.baseXP;

      // Atomically create completion and update all stats in a single transaction
      const [completion, updatedUserQuest] = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newCompletion = await tx.questCompletion.create({
          data: {
            userQuestId,
            xpEarned,
            value,
            source: source as HealthDataSource,
            notes,
            periodStart,
          },
        });

        const updatedQuest = await tx.userQuest.update({
          where: { id: userQuestId },
          data: {
            totalCompletions: { increment: 1 },
            lastCompletedAt: now,
            currentStreak: { increment: 1 },
            longestStreak: {
              set: Math.max(userQuest.longestStreak, userQuest.currentStreak + 1),
            },
          },
          include: { quest: true },
        });

        await tx.user.update({
          where: { id: req.userId! },
          data: { totalXP: { increment: xpEarned } },
        });

        return [newCompletion, updatedQuest];
      });

      const response: ApiResponse<{ completion: any; userQuest: any; xpEarned: number }> = {
        success: true,
        data: {
          completion,
          userQuest: updatedUserQuest,
          xpEarned,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/quests/:id
 * Deactivate a user quest
 */
router.delete(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid quest ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userQuestId } = req.params;

      const userQuest = await prisma.userQuest.findFirst({
        where: {
          id: userQuestId,
          userId: req.userId!,
        },
      });

      if (!userQuest) {
        throw Errors.notFound('User quest');
      }

      await prisma.userQuest.update({
        where: { id: userQuestId },
        data: { isActive: false },
      });

      res.json({
        success: true,
        data: { message: 'Quest deactivated successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/quests/custom
 * Create a custom quest
 */
router.post(
  '/custom',
  authenticate,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('category').isIn(['physical_health', 'mental_wellness', 'career_productivity', 'relationships_social', 'home_chores']).withMessage('Invalid category'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
    body('baseXP').isInt({ min: 1, max: 10 }).withMessage('XP must be between 1 and 10'),
    body('maxCompletionsPerPeriod').optional().isInt({ min: 1, max: 10 }).withMessage('Max completions must be between 1 and 10'),
    body('iconName').optional().trim().isString(),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        category,
        frequency,
        baseXP,
        maxCompletionsPerPeriod = 1,
        iconName = 'star',
      } = req.body;

      // Check user's custom quest limit
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      const customQuestCount = await prisma.quest.count({
        where: {
          createdById: req.userId!,
          isCustom: true,
        },
      });

      const maxCustomQuests = user?.isPremium ? 50 : 3;
      if (customQuestCount >= maxCustomQuests) {
        throw Errors.badRequest(`Maximum custom quests reached (${maxCustomQuests})`);
      }

      // Create custom quest
      const quest = await prisma.quest.create({
        data: {
          name,
          description: description || '',
          category,
          frequency,
          baseXP,
          maxCompletionsPerPeriod,
          iconName,
          isDefault: false,
          isCustom: true,
          createdById: req.userId!,
        },
      });

      // Automatically activate for user
      const userQuest = await prisma.userQuest.create({
        data: {
          userId: req.userId!,
          questId: quest.id,
          isActive: true,
          reminderEnabled: false,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
        },
        include: { quest: true },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: userQuest,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
