import { Hono } from 'hono';
import questRoutes from '../../routes/quests';
import { errorHandler } from '../../middleware/errorHandler';

// Hoist constants before mock factory runs
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const USER_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Explicit prisma factory mock — automock cannot discover Prisma's runtime model delegates.
// $transaction executes the callback with the same mock models so tests for transactional
// routes work without any special setup.
jest.mock('../../lib/prisma', () => {
  const models = {
    quest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    userQuest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    questCompletion: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    prisma: {
      ...models,
      // Pass the same model stubs as the tx argument so routes using $transaction
      // still resolve against the same jest.fn() mocks defined above.
      $transaction: jest.fn((cb: (tx: typeof models) => unknown) => cb(models)),
    },
  };
});

// Mock streak functions — called after quest completion but non-critical
jest.mock('../../lib/streaks', () => ({
  checkAndAutoApplyFreeze: jest.fn().mockResolvedValue({ freezeApplied: false, freezesRemaining: 0 }),
  trackActiveDay: jest.fn().mockResolvedValue({ activeDaysCount: 1, freezeAwarded: false }),
}));

// Mock auth middleware — authenticate sets userId via Hono context; optionalAuth is a passthrough
jest.mock('../../middleware/auth', () => ({
  authenticate: async (c: any, next: any) => {
    c.set('userId', USER_UUID);
    await next();
  },
  optionalAuth: async (_c: any, next: any) => {
    await next();
  },
}));

jest.mock('../../lib/streaks', () => ({
  calculateOverallDayStreak: jest.fn().mockResolvedValue({
    currentDayStreak: 5,
    longestDayStreak: 10,
  }),
}));

import { prisma } from '../../lib/prisma';
import { calculateOverallDayStreak } from '../../lib/streaks';

const app = new Hono();
app.route('/api/quests', questRoutes);
app.onError((err, c) => errorHandler(err, c));

// --- Shared mock fixtures ---

const mockQuest = {
  id: VALID_UUID,
  name: 'Morning Run',
  description: 'Run every morning',
  category: 'physical_health',
  frequency: 'daily',
  baseXP: 5,
  maxCompletionsPerPeriod: 1,
  iconName: 'run',
  isDefault: true,
  isCustom: false,
  createdById: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUserQuest = {
  id: VALID_UUID,
  userId: USER_UUID,
  questId: VALID_UUID,
  isActive: true,
  reminderEnabled: false,
  currentStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  lastCompletedAt: null,
  customXP: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  quest: mockQuest,
};

const mockCompletion = {
  id: 'completion-uuid-1234-5678-abcd-ef1234567890',
  userQuestId: VALID_UUID,
  xpEarned: 5,
  value: null,
  source: 'manual',
  notes: null,
  periodStart: new Date().toISOString(),
  completedAt: new Date().toISOString(),
};

describe('Quest Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // GET /api/quests/library
  // ---------------------------------------------------------------------------
  describe('GET /api/quests/library', () => {
    it('returns 200 with array of quests', async () => {
      (prisma.quest.findMany as jest.Mock).mockResolvedValue([mockQuest]);

      const res = await app.request('/api/quests/library');
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(VALID_UUID);
    });

    it('returns 200 with empty array when no quests exist', async () => {
      (prisma.quest.findMany as jest.Mock).mockResolvedValue([]);

      const res = await app.request('/api/quests/library');
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns 500 on DB error', async () => {
      (prisma.quest.findMany as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

      const res = await app.request('/api/quests/library');
      const body: any = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/quests/user
  // ---------------------------------------------------------------------------
  describe('GET /api/quests/user', () => {
    it('returns 200 with user quests when authenticated', async () => {
      (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockUserQuest]);

      const res = await app.request('/api/quests/user');
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data[0].userId).toBe(USER_UUID);
    });

    it('returns 401 when no authorization header is provided (real middleware)', async () => {
      // Build a separate app with the real authenticate middleware — our top-level mock
      // cannot produce 401 since it always passes. We use requireActual here to get the
      // real JWT-checking middleware for this specific test.
      const { authenticate: realAuthenticate } = jest.requireActual('../../middleware/auth');

      const protectedApp = new Hono();
      protectedApp.get('/api/quests/user', realAuthenticate, (c: any) => {
        return c.json({ success: true, data: [] });
      });
      protectedApp.onError((err: any, c: any) => errorHandler(err, c));

      const res = await protectedApp.request('/api/quests/user');
      const body: any = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/quests/activate
  // ---------------------------------------------------------------------------
  describe('POST /api/quests/activate', () => {
    it('returns 201 when activating a new quest', async () => {
      (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userQuest.create as jest.Mock).mockResolvedValue(mockUserQuest);

      const res = await app.request('/api/quests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: VALID_UUID }),
      });
      const body: any = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.questId).toBe(VALID_UUID);
    });

    it('returns 200 when reactivating a previously deactivated quest', async () => {
      const deactivatedUserQuest = { ...mockUserQuest, isActive: false };
      const reactivatedUserQuest = { ...mockUserQuest, isActive: true };

      (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(deactivatedUserQuest);
      (prisma.userQuest.update as jest.Mock).mockResolvedValue(reactivatedUserQuest);

      const res = await app.request('/api/quests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: VALID_UUID }),
      });
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isActive).toBe(true);
    });

    it('returns 409 when quest is already active', async () => {
      (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest); // already active

      const res = await app.request('/api/quests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: VALID_UUID }),
      });
      const body: any = await res.json();

      expect(res.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CONFLICT');
    });

    it('returns 404 when quest does not exist', async () => {
      (prisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await app.request('/api/quests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: VALID_UUID }),
      });
      const body: any = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it.each([
      ['invalid UUID value', { questId: 'not-a-uuid' }],
      ['missing questId', {}],
    ])('returns 422 for validation error: %s', async (_label, reqBody) => {
      const res = await app.request('/api/quests/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/quests/:id/complete
  // ---------------------------------------------------------------------------
  describe('POST /api/quests/:id/complete', () => {
    const userQuestWithQuest = {
      ...mockUserQuest,
      quest: {
        ...mockQuest,
        frequency: 'daily',
        maxCompletionsPerPeriod: 1,
        baseXP: 5,
      },
      currentStreak: 0,
      longestStreak: 0,
      customXP: null,
    };

    it('returns 201 with completion data and xpEarned', async () => {
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(userQuestWithQuest);
      (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
      (prisma.questCompletion.create as jest.Mock).mockResolvedValue(mockCompletion);
      (prisma.userQuest.update as jest.Mock).mockResolvedValue({ ...userQuestWithQuest, totalCompletions: 1 });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const res = await app.request(`/api/quests/${VALID_UUID}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: any = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('completion');
      expect(body.data).toHaveProperty('userQuest');
      expect(body.data).toHaveProperty('xpEarned');
      expect(body.data.xpEarned).toBe(5);
    });

    it('returns 404 when userQuest not found', async () => {
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await app.request(`/api/quests/${VALID_UUID}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: any = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when max completions for period are reached', async () => {
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(userQuestWithQuest);
      (prisma.questCompletion.count as jest.Mock).mockResolvedValue(1); // already at max (1)

      const res = await app.request(`/api/quests/${VALID_UUID}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: any = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it.each([
      ['invalid UUID param', 'not-a-uuid', {}],
      ['non-numeric value field', VALID_UUID, { value: 'not-a-number' }],
    ])('returns 422 for validation error: %s', async (_label, id, reqBody) => {
      const res = await app.request(`/api/quests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/quests/:id
  // ---------------------------------------------------------------------------
  describe('DELETE /api/quests/:id', () => {
    it('returns 200 with success message when quest deactivated', async () => {
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);
      (prisma.userQuest.update as jest.Mock).mockResolvedValue({ ...mockUserQuest, isActive: false });

      const res = await app.request(`/api/quests/${VALID_UUID}`, {
        method: 'DELETE',
      });
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.message).toMatch(/deactivated/i);
    });

    it('returns 404 when userQuest not found', async () => {
      (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await app.request(`/api/quests/${VALID_UUID}`, {
        method: 'DELETE',
      });
      const body: any = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for invalid UUID param', async () => {
      const res = await app.request('/api/quests/not-a-valid-uuid', {
        method: 'DELETE',
      });
      const body: any = await res.json();

      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/quests/custom
  // ---------------------------------------------------------------------------
  describe('POST /api/quests/custom', () => {
    const validCustomQuestBody = {
      name: 'My Custom Quest',
      description: 'A personal habit',
      category: 'mental_wellness',
      frequency: 'daily',
      baseXP: 3,
    };

    const mockCreatedQuest = {
      ...mockQuest,
      id: 'custom-quest-uuid-1234-5678-abcd-ef123456',
      name: 'My Custom Quest',
      isDefault: false,
      isCustom: true,
      createdById: USER_UUID,
    };

    const mockCustomUserQuest = {
      ...mockUserQuest,
      id: 'custom-uq-uuid-1234-5678-abcd-ef12345678',
      questId: mockCreatedQuest.id,
      quest: mockCreatedQuest,
    };

    it('returns 201 with new userQuest when custom quest is created', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_UUID, isPremium: false });
      (prisma.quest.count as jest.Mock).mockResolvedValue(0); // under limit
      (prisma.quest.create as jest.Mock).mockResolvedValue(mockCreatedQuest);
      (prisma.userQuest.create as jest.Mock).mockResolvedValue(mockCustomUserQuest);

      const res = await app.request('/api/quests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCustomQuestBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.quest.isCustom).toBe(true);
    });

    it('returns 400 when free user has reached 3 custom quest limit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_UUID, isPremium: false });
      (prisma.quest.count as jest.Mock).mockResolvedValue(3); // at free limit

      const res = await app.request('/api/quests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCustomQuestBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toMatch(/3/);
    });

    it('returns 400 when premium user has reached 50 custom quest limit', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: USER_UUID, isPremium: true });
      (prisma.quest.count as jest.Mock).mockResolvedValue(50); // at premium limit

      const res = await app.request('/api/quests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCustomQuestBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toMatch(/50/);
    });

    it.each([
      ['name too short (1 char)', { ...validCustomQuestBody, name: 'X' }],
      ['invalid category', { ...validCustomQuestBody, category: 'not_a_category' }],
      ['invalid frequency', { ...validCustomQuestBody, frequency: 'hourly' }],
      ['baseXP below range (0)', { ...validCustomQuestBody, baseXP: 0 }],
      ['baseXP above range (11)', { ...validCustomQuestBody, baseXP: 11 }],
    ])('returns 422 for validation error: %s', async (_label, reqBody) => {
      const res = await app.request('/api/quests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const body: any = await res.json();

      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/quests/watch-sync
  // ---------------------------------------------------------------------------
  describe('GET /api/quests/watch-sync', () => {
    const mockUserQuestWithCompletions = {
      ...mockUserQuest,
      quest: { ...mockQuest, frequency: 'daily', maxCompletionsPerPeriod: 1 },
      completions: [{ ...mockCompletion, xpEarned: 5 }],
      customName: null,
      customXP: null,
    };

    it('returns 200 with WatchData containing daily quests', async () => {
      (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockUserQuestWithCompletions]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ totalXP: 150, level: 2 });

      const res = await app.request('/api/quests/watch-sync');
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('dailyQuests');
      expect(body.data).toHaveProperty('todayXP');
      expect(body.data).toHaveProperty('level');
      expect(body.data).toHaveProperty('currentStreak');
      expect(body.data.dailyQuests).toHaveLength(1);
      expect(body.data.dailyQuests[0]).toEqual({
        id: VALID_UUID,
        name: 'Morning Run',
        iconName: 'run',
        xp: 5,
        isCompleted: true,
        completionsToday: 1,
        maxCompletions: 1,
      });
      expect(body.data.todayXP).toBe(5);
      expect(body.data.level).toBe(2);
      expect(body.data.currentStreak).toBe(5);
    });

    it('returns 200 with empty dailyQuests when user has no active daily quests', async () => {
      (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ totalXP: 0, level: 1 });

      const res = await app.request('/api/quests/watch-sync');
      const body: any = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.dailyQuests).toEqual([]);
      expect(body.data.todayXP).toBe(0);
    });

    it('returns 404 when user not found', async () => {
      (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await app.request('/api/quests/watch-sync');
      const body: any = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
