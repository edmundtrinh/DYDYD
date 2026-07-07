import { Router, Request, Response, NextFunction, IRouter } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, CategoryPriority, UserSettings } from '@dydyd/shared';

const router: IRouter = Router();

/**
 * GET /api/user/profile
 * Get current user's profile
 */
router.get(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const user = await prisma.user.findUnique({
        where: { id: authedReq.userId },
        include: {
          settings: true,
          categoryPriorities: true,
        },
      });

      if (!user) {
        throw Errors.notFound('User');
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      const response: ApiResponse<Omit<typeof user, 'password'>> = {
        success: true,
        data: userWithoutPassword,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
router.put(
  '/profile',
  authenticate,
  validate([
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters'),
    body('avatarUrl')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { displayName, avatarUrl } = req.body;

      const updateData: Record<string, any> = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      const authedReq = req as AuthenticatedRequest;
      const user = await prisma.user.update({
        where: { id: authedReq.userId },
        data: updateData,
        include: {
          settings: true,
          categoryPriorities: true,
        },
      });

      const { password, ...userWithoutPassword } = user;

      const response: ApiResponse<Omit<typeof user, 'password'>> = {
        success: true,
        data: userWithoutPassword,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/user/settings
 * Get current user's settings
 */
router.get(
  '/settings',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const settings = await prisma.userSettings.findUnique({
        where: { userId: authedReq.userId },
      });

      if (!settings) {
        throw Errors.notFound('Settings');
      }

      const response: ApiResponse<UserSettings> = {
        success: true,
        data: settings as unknown as UserSettings,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user/settings
 * Update current user's settings
 */
router.put(
  '/settings',
  authenticate,
  validate([
    body('notificationsEnabled')
      .optional()
      .isBoolean()
      .withMessage('notificationsEnabled must be a boolean'),
    body('dailyReminderTime')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Daily reminder time must be in HH:mm format'),
    body('weeklyResetDay')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Weekly reset day must be between 0 (Sunday) and 6 (Saturday)'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a string'),
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Theme must be light, dark, or system'),
    body('soundEnabled')
      .optional()
      .isBoolean()
      .withMessage('soundEnabled must be a boolean'),
    body('hapticFeedbackEnabled')
      .optional()
      .isBoolean()
      .withMessage('hapticFeedbackEnabled must be a boolean'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        notificationsEnabled,
        dailyReminderTime,
        weeklyResetDay,
        timezone,
        theme,
        soundEnabled,
        hapticFeedbackEnabled,
      } = req.body;

      const updateData: Record<string, any> = {};
      if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
      if (dailyReminderTime !== undefined) updateData.dailyReminderTime = dailyReminderTime;
      if (weeklyResetDay !== undefined) updateData.weeklyResetDay = weeklyResetDay;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (theme !== undefined) updateData.theme = theme;
      if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
      if (hapticFeedbackEnabled !== undefined) updateData.hapticFeedbackEnabled = hapticFeedbackEnabled;

      const authedReq = req as AuthenticatedRequest;
      const settings = await prisma.userSettings.update({
        where: { userId: authedReq.userId },
        data: updateData,
      });

      const response: ApiResponse<UserSettings> = {
        success: true,
        data: settings as unknown as UserSettings,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/user/category-priorities
 * Get user's category priorities
 */
router.get(
  '/category-priorities',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const priorities = await prisma.categoryPriority.findMany({
        where: { userId: authedReq.userId },
        orderBy: { priority: 'desc' },
      });

      const response: ApiResponse<CategoryPriority[]> = {
        success: true,
        data: priorities as CategoryPriority[],
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user/category-priorities
 * Update user's category priorities
 */
router.put(
  '/category-priorities',
  authenticate,
  validate([
    body('priorities')
      .isArray()
      .withMessage('Priorities must be an array'),
    body('priorities.*.category')
      .isIn(['physical_health', 'mental_wellness', 'career_productivity', 'relationships_social', 'home_chores'])
      .withMessage('Invalid category'),
    body('priorities.*.priority')
      .isInt({ min: 1, max: 5 })
      .withMessage('Priority must be between 1 and 5'),
    body('priorities.*.isEnabled')
      .isBoolean()
      .withMessage('isEnabled must be a boolean'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { priorities } = req.body;

      const authedReq = req as AuthenticatedRequest;
      // Delete existing priorities and create new ones
      await prisma.$transaction([
        prisma.categoryPriority.deleteMany({
          where: { userId: authedReq.userId },
        }),
        prisma.categoryPriority.createMany({
          data: priorities.map((p: CategoryPriority) => ({
            userId: authedReq.userId,
            category: p.category,
            priority: p.priority,
            isEnabled: p.isEnabled,
          })),
        }),
      ]);

      const updatedPriorities = await prisma.categoryPriority.findMany({
        where: { userId: authedReq.userId },
        orderBy: { priority: 'desc' },
      });

      const response: ApiResponse<CategoryPriority[]> = {
        success: true,
        data: updatedPriorities as CategoryPriority[],
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/user/account
 * Delete user account and all associated data
 */
router.delete(
  '/account',
  authenticate,
  validate([
    body('password').notEmpty().withMessage('Password confirmation required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const userId = authedReq.userId;
      const { password } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw Errors.notFound('User not found');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw Errors.unauthorized('Incorrect password');
      }

      await prisma.$transaction([
        // QuestCompletion links to UserQuest, not User directly — delete via userQuest relation
        prisma.questCompletion.deleteMany({
          where: { userQuest: { userId } },
        }),
        prisma.userQuest.deleteMany({ where: { userId } }),
        prisma.userBadge.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.deviceToken.deleteMany({ where: { userId } }),
        prisma.refreshToken.deleteMany({ where: { userId } }),
        prisma.categoryPriority.deleteMany({ where: { userId } }),
        prisma.userSettings.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);

      const response: ApiResponse<{ deleted: true }> = {
        success: true,
        data: { deleted: true },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
