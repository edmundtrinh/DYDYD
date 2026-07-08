import { Hono } from 'hono';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { validateBody } from '../middleware/validate';
import { authenticate, optionalAuth, AuthEnv } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { ApiResponse, Quest, HealthDataSource, WatchData, WatchQuest, getTimeBucket } from '@dydyd/shared';
import { checkAndAutoApplyFreeze, trackActiveDay, calculateOverallDayStreak } from '../lib/streaks';

const app = new Hono<AuthEnv>();

// --- Zod schemas ---

const activateSchema = z.object({
  questId: z.string().uuid(),
});

const completeSchema = z.object({
  value: z.number().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const customQuestSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'physical_health',
    'mental_wellness',
    'career_productivity',
    'relationships_social',
    'home_chores',
  ]),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  baseXP: z.number().int().min(1).max(10),
  maxCompletionsPerPeriod: z.number().int().min(1).max(10).optional(),
  iconName: z.string().optional(),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/quests/library
 * Get all predefined quests (public)
 */
app.get('/library', optionalAuth, async (c) => {
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

  return c.json(response);
});

/**
 * GET /api/quests/user
 * Get user's active quests
 */
app.get('/user', authenticate, async (c) => {
  const userId = c.get('userId');
  const userQuests = await prisma.userQuest.findMany({
    where: {
      userId,
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

  return c.json(response);
});

/**
 * POST /api/quests/activate
 * Activate a quest for the user
 */
app.post('/activate', authenticate, validateBody(activateSchema), async (c) => {
  const { questId } = await c.req.json();

  // Check if quest exists
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
  });

  if (!quest) {
    throw Errors.notFound('Quest');
  }

  const userId = c.get('userId');
  // Check if already activated
  const existingUserQuest = await prisma.userQuest.findFirst({
    where: {
      userId,
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

      return c.json({
        success: true,
        data: updatedUserQuest,
      });
    }

    throw Errors.conflict('Quest already activated');
  }

  // Create new user quest
  const userQuest = await prisma.userQuest.create({
    data: {
      userId,
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

  return c.json(response, 201);
});

/**
 * POST /api/quests/:id/complete
 * Mark a quest as completed
 */
app.post('/:id/complete', authenticate, async (c) => {
  const userQuestId = c.req.param('id') as string;

  // Validate UUID param inline
  if (!UUID_REGEX.test(userQuestId)) {
    throw Errors.validationError({ id: ['Valid quest ID is required'] });
  }

  // Parse optional body fields — may have no body at all
  let value: number | undefined;
  let source = 'manual';
  let notes: string | undefined;

  try {
    const body = await c.req.json();
    // Validate body with Zod
    const parsed = completeSchema.parse(body);
    value = parsed.value;
    if (parsed.source !== undefined) source = parsed.source;
    notes = parsed.notes;
  } catch (err) {
    // If JSON parsing fails (empty body), that's fine — use defaults
    // But if Zod validation fails, re-throw as validation error
    if (err instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      err.errors.forEach((e) => {
        const field = e.path.join('.');
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(e.message);
      });
      throw Errors.validationError(formattedErrors);
    }
    // SyntaxError from empty body — use defaults, which is fine
  }

  const userId = c.get('userId');
  // Get user quest
  const userQuest = await prisma.userQuest.findFirst({
    where: {
      id: userQuestId,
      userId,
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
    case 'weekly': {
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
      periodStart.setHours(0, 0, 0, 0);
      break;
    }
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
        timeBucket: getTimeBucket(new Date()),
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
      where: { id: userId },
      data: { totalXP: { increment: xpEarned } },
    });

    return [newCompletion, updatedQuest];
  });

  // Track active day and check for auto-freeze after successful completion.
  // Order matters: checkAndAutoApplyFreeze reads lastActiveDate to detect a gap,
  // so it must run before trackActiveDay updates lastActiveDate to today.
  try {
    await checkAndAutoApplyFreeze(userId);
  } catch {
    // Non-critical — log but don't fail the completion response
    console.error('Failed to check/auto-apply freeze for user', userId);
  }
  try {
    await trackActiveDay(userId);
  } catch {
    // Non-critical — log but don't fail the completion response
    console.error('Failed to track active day for user', userId);
  }

  const response: ApiResponse<{ completion: any; userQuest: any; xpEarned: number }> = {
    success: true,
    data: {
      completion,
      userQuest: updatedUserQuest,
      xpEarned,
    },
  };

  return c.json(response, 201);
});

/**
 * DELETE /api/quests/:id
 * Deactivate a user quest
 */
app.delete('/:id', authenticate, async (c) => {
  const userQuestId = c.req.param('id') as string;

  // Validate UUID param inline
  if (!UUID_REGEX.test(userQuestId)) {
    throw Errors.validationError({ id: ['Valid quest ID is required'] });
  }

  const userId = c.get('userId');
  const userQuest = await prisma.userQuest.findFirst({
    where: {
      id: userQuestId,
      userId,
    },
  });

  if (!userQuest) {
    throw Errors.notFound('User quest');
  }

  await prisma.userQuest.update({
    where: { id: userQuestId },
    data: { isActive: false },
  });

  return c.json({
    success: true,
    data: { message: 'Quest deactivated successfully' },
  });
});

/**
 * POST /api/quests/custom
 * Create a custom quest
 */
app.post('/custom', authenticate, validateBody(customQuestSchema), async (c) => {
  const {
    name,
    description,
    category,
    frequency,
    baseXP,
    maxCompletionsPerPeriod = 1,
    iconName = 'star',
  } = await c.req.json();

  const userId = c.get('userId');
  // Check user's custom quest limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const customQuestCount = await prisma.quest.count({
    where: {
      createdById: userId,
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
      createdById: userId,
    },
  });

  // Automatically activate for user
  const userQuest = await prisma.userQuest.create({
    data: {
      userId,
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

  return c.json(response, 201);
});

/**
 * GET /api/quests/watch-sync
 * Get today's active quests formatted for Watch display
 */
app.get('/watch-sync', authenticate, async (c) => {
  const userId = c.get('userId');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [userQuests, user, streakData] = await Promise.all([
    prisma.userQuest.findMany({
      where: {
        userId,
        isActive: true,
        quest: { frequency: 'daily' },
      },
      include: {
        quest: true,
        completions: {
          where: {
            completedAt: { gte: todayStart },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, level: true },
    }),
    calculateOverallDayStreak(userId),
  ]);

  if (!user) {
    throw Errors.notFound('User');
  }

  const todayXP = userQuests.reduce(
    (sum, uq) => sum + (uq.completions?.reduce((s: number, c: any) => s + c.xpEarned, 0) ?? 0),
    0
  );

  const dailyQuests: WatchQuest[] = userQuests.map((uq) => ({
    id: uq.id,
    name: uq.customName || uq.quest.name,
    iconName: uq.quest.iconName,
    xp: uq.customXP || uq.quest.baseXP,
    isCompleted: (uq.completions?.length ?? 0) >= uq.quest.maxCompletionsPerPeriod,
    completionsToday: uq.completions?.length ?? 0,
    maxCompletions: uq.quest.maxCompletionsPerPeriod,
  }));

  const watchData: WatchData = {
    dailyQuests,
    todayXP,
    level: user.level,
    currentStreak: streakData.currentDayStreak,
  };

  const response: ApiResponse<WatchData> = {
    success: true,
    data: watchData,
  };

  return c.json(response);
});

export default app;
