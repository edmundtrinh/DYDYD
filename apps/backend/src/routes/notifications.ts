import { Hono } from 'hono';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { authenticate, AuthEnv } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, DevicePlatform } from '@dydyd/shared';

type Env = {
  Variables: AuthEnv['Variables'] & {
    validatedBody: unknown;
  };
};

const app = new Hono<Env>();

const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'watchos', 'wear_os', 'tizen', 'garmin']),
  deviceName: z.string().optional(),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/notifications/device-token
 * Register a device push token
 */
app.post(
  '/device-token',
  authenticate,
  validateBody(deviceTokenSchema),
  async (c) => {
    const { token, platform, deviceName } = c.get('validatedBody') as z.infer<typeof deviceTokenSchema>;
    const userId = c.get('userId');

    // Upsert -- if this token already exists, update it; otherwise create
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceName,
        lastActive: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceName,
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: deviceToken,
    };

    return c.json(response, 201);
  }
);

/**
 * GET /api/notifications
 * Get notification history for the authenticated user
 */
app.get(
  '/',
  authenticate,
  async (c) => {
    const page = Math.max(1, parseInt(c.req.query('page') || '') || 1);
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(c.req.query('perPage') || '') || 20)
    );
    const skip = (page - 1) * perPage;

    const userId = c.get('userId');
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.notification.count({
        where: { userId },
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

    return c.json(response);
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
app.put(
  '/:id/read',
  authenticate,
  async (c) => {
    const id = c.req.param('id')!;

    // Validate UUID inline
    if (!UUID_REGEX.test(id)) {
      throw Errors.validationError({ id: ['Valid notification ID is required'] });
    }

    // Ensure the notification belongs to this user
    const userId = c.get('userId');
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw Errors.notFound('Notification');
    }

    if (notification.readAt) {
      // Already read -- return as-is
      return c.json({
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

    return c.json(response);
  }
);

export default app;
