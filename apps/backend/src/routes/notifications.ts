import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, DevicePlatform } from '@dydyd/shared';

const router: IRouter = Router();

/**
 * POST /api/notifications/device-token
 * Register a device push token
 */
router.post(
  '/device-token',
  authenticate,
  validate([
    body('token')
      .notEmpty()
      .withMessage('Device token is required')
      .isString()
      .withMessage('Device token must be a string'),
    body('platform')
      .isIn(['ios', 'android', 'watchos', 'wear_os', 'tizen', 'garmin'])
      .withMessage('Invalid platform'),
    body('deviceName')
      .optional()
      .trim()
      .isString()
      .withMessage('Device name must be a string'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, platform, deviceName } = req.body;

      // Upsert — if this token already exists, update it; otherwise create
      const deviceToken = await prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId: req.userId!,
          platform,
          deviceName,
          lastActive: new Date(),
        },
        create: {
          userId: req.userId!,
          token,
          platform,
          deviceName,
        },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: deviceToken,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/notifications
 * Get notification history for the authenticated user
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage = Math.min(
        100,
        Math.max(1, parseInt(req.query.perPage as string) || 20)
      );
      const skip = (page - 1) * perPage;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.userId! },
          orderBy: { createdAt: 'desc' },
          skip,
          take: perPage,
        }),
        prisma.notification.count({
          where: { userId: req.userId! },
        }),
      ]);

      const response: ApiResponse<any[]> = {
        success: true,
        data: notifications,
        meta: {
          page,
          perPage,
          total,
          hasMore: skip + perPage < total,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put(
  '/:id/read',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid notification ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Ensure the notification belongs to this user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId: req.userId!,
        },
      });

      if (!notification) {
        throw Errors.notFound('Notification');
      }

      if (notification.readAt) {
        // Already read — return as-is
        return res.json({
          success: true,
          data: notification,
        } as ApiResponse<any>);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: updated,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
