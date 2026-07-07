import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { validateBody } from '../middleware/validate';
import { authenticate, AuthEnv } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, CategoryPriority, UserSettings } from '@dydyd/shared';

const app = new Hono<AuthEnv>();

// --- Zod schemas ---

const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

const settingsUpdateSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  dailyReminderTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Daily reminder time must be in HH:mm format')
    .optional(),
  weeklyResetDay: z.number().int().min(0).max(6).optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  soundEnabled: z.boolean().optional(),
  hapticFeedbackEnabled: z.boolean().optional(),
});

const categoryPrioritiesSchema = z.object({
  priorities: z.array(
    z.object({
      category: z.enum([
        'physical_health',
        'mental_wellness',
        'career_productivity',
        'relationships_social',
        'home_chores',
      ]),
      priority: z.number().int().min(1).max(5),
      isEnabled: z.boolean(),
    }),
  ),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

/**
 * GET /api/user/profile
 * Get current user's profile
 */
app.get('/profile', authenticate, async (c) => {
  const userId = c.get('userId');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      categoryPriorities: true,
    },
  });

  if (!user) {
    throw Errors.notFound('User');
  }

  // Remove password from response
  const { password: _password, ...userWithoutPassword } = user;

  const response: ApiResponse<Omit<typeof user, 'password'>> = {
    success: true,
    data: userWithoutPassword,
  };

  return c.json(response);
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
app.put('/profile', authenticate, validateBody(profileUpdateSchema), async (c) => {
  const { displayName, avatarUrl } = await c.req.json();

  const updateData: Record<string, any> = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const userId = c.get('userId');
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      settings: true,
      categoryPriorities: true,
    },
  });

  const { password: _password2, ...userWithoutPassword } = user;

  const response: ApiResponse<Omit<typeof user, 'password'>> = {
    success: true,
    data: userWithoutPassword,
  };

  return c.json(response);
});

/**
 * GET /api/user/settings
 * Get current user's settings
 */
app.get('/settings', authenticate, async (c) => {
  const userId = c.get('userId');
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    throw Errors.notFound('Settings');
  }

  const response: ApiResponse<UserSettings> = {
    success: true,
    data: settings as unknown as UserSettings,
  };

  return c.json(response);
});

/**
 * PUT /api/user/settings
 * Update current user's settings
 */
app.put('/settings', authenticate, validateBody(settingsUpdateSchema), async (c) => {
  const {
    notificationsEnabled,
    dailyReminderTime,
    weeklyResetDay,
    timezone,
    theme,
    soundEnabled,
    hapticFeedbackEnabled,
  } = await c.req.json();

  const updateData: Record<string, any> = {};
  if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
  if (dailyReminderTime !== undefined) updateData.dailyReminderTime = dailyReminderTime;
  if (weeklyResetDay !== undefined) updateData.weeklyResetDay = weeklyResetDay;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (theme !== undefined) updateData.theme = theme;
  if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
  if (hapticFeedbackEnabled !== undefined) updateData.hapticFeedbackEnabled = hapticFeedbackEnabled;

  const userId = c.get('userId');
  const settings = await prisma.userSettings.update({
    where: { userId },
    data: updateData,
  });

  const response: ApiResponse<UserSettings> = {
    success: true,
    data: settings as unknown as UserSettings,
  };

  return c.json(response);
});

/**
 * GET /api/user/category-priorities
 * Get user's category priorities
 */
app.get('/category-priorities', authenticate, async (c) => {
  const userId = c.get('userId');
  const priorities = await prisma.categoryPriority.findMany({
    where: { userId },
    orderBy: { priority: 'desc' },
  });

  const response: ApiResponse<CategoryPriority[]> = {
    success: true,
    data: priorities as CategoryPriority[],
  };

  return c.json(response);
});

/**
 * PUT /api/user/category-priorities
 * Update user's category priorities
 */
app.put('/category-priorities', authenticate, validateBody(categoryPrioritiesSchema), async (c) => {
  const { priorities } = await c.req.json();

  const userId = c.get('userId');
  // Delete existing priorities and create new ones
  await prisma.$transaction([
    prisma.categoryPriority.deleteMany({
      where: { userId },
    }),
    prisma.categoryPriority.createMany({
      data: priorities.map((p: CategoryPriority) => ({
        userId,
        category: p.category,
        priority: p.priority,
        isEnabled: p.isEnabled,
      })),
    }),
  ]);

  const updatedPriorities = await prisma.categoryPriority.findMany({
    where: { userId },
    orderBy: { priority: 'desc' },
  });

  const response: ApiResponse<CategoryPriority[]> = {
    success: true,
    data: updatedPriorities as CategoryPriority[],
  };

  return c.json(response);
});

/**
 * DELETE /api/user/account
 * Delete user account and all associated data
 */
app.delete('/account', authenticate, validateBody(deleteAccountSchema), async (c) => {
  const userId = c.get('userId');
  const { password } = await c.req.json();

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

  return c.json(response);
});

export default app;
