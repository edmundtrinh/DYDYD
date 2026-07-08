import { Hono } from 'hono';
import streakRoutes from '../../routes/streaks';
import { errorHandler } from '../../middleware/errorHandler';

const USER_UUID = '00000000-0000-4000-a000-000000000200';

jest.mock('../../lib/prisma', () => {
  const models = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    prisma: {
      ...models,
      $transaction: jest.fn((cb: (tx: typeof models) => unknown) => cb(models)),
    },
  };
});

jest.mock('../../lib/streaks', () => ({
  calculateFreezeAwareDayStreak: jest.fn(),
  checkAndAutoApplyFreeze: jest.fn(),
  trackActiveDay: jest.fn(),
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: async (c: any, next: any) => {
    c.set('userId', USER_UUID);
    await next();
  },
}));

import { prisma } from '../../lib/prisma';
import { calculateFreezeAwareDayStreak } from '../../lib/streaks';

const app = new Hono();
app.route('/api/streaks', streakRoutes);
app.onError((err, c) => errorHandler(err, c));

const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: USER_UUID,
  email: 'test@example.com',
  displayName: 'Test User',
  totalXP: 500,
  level: 5,
  isPremium: false,
  streakFreezes: 2,
  maxStreakFreezes: 3,
  streakFreezeUsedAt: null,
  activeDaysCount: 10,
  lastActiveDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ==================== GET /api/streaks/status ====================

describe('GET /api/streaks/status', () => {
  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
    (calculateFreezeAwareDayStreak as jest.Mock).mockResolvedValue({
      currentDayStreak: 5,
      longestDayStreak: 12,
    });
  });

  it('should return streak status with all fields', async () => {
    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      currentDayStreak: 5,
      longestDayStreak: 12,
      streakFreezes: 2,
      maxStreakFreezes: 3,
      freezeAvailable: true,
      activeDaysCount: 10,
    });
    expect(body.data).toHaveProperty('comebackEligible');
    expect(body.data).toHaveProperty('nextFreezeIn');
  });

  it('should indicate freeze unavailable when none remaining', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 0 })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.freezeAvailable).toBe(false);
  });

  it('should indicate freeze unavailable when already used today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezeUsedAt: new Date() })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.freezeAvailable).toBe(false);
  });

  it('should indicate comeback eligible when last active 3 days ago', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: threeDaysAgo })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.comebackEligible).toBe(true);
  });

  it('should indicate comeback ineligible when active today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: new Date() })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.comebackEligible).toBe(false);
  });

  it('should handle null lastActiveDate for comeback eligibility', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: null })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.comebackEligible).toBe(false);
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(404);
  });

  it('should calculate nextFreezeIn correctly', async () => {
    // activeDaysCount = 10, freezeEarnInterval = 7
    // 10 % 7 = 3, so nextFreezeIn = 7 - 3 = 4
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ activeDaysCount: 10 })
    );

    const res = await app.request('/api/streaks/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.nextFreezeIn).toBe(4);
  });
});

// ==================== POST /api/streaks/freeze ====================

describe('POST /api/streaks/freeze', () => {
  it('should successfully use a streak freeze', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
    (prisma.user.update as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 1 })
    );

    const res = await app.request('/api/streaks/freeze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      used: true,
      freezesRemaining: 1,
      streakPreserved: true,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: {
        streakFreezes: 1,
        streakFreezeUsedAt: expect.any(Date),
      },
    });
  });

  it('should return 400 when no freezes available', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 0 })
    );

    const res = await app.request('/api/streaks/freeze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('No streak freezes available');
  });

  it('should return 400 when freeze already used today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezeUsedAt: new Date() })
    );

    const res = await app.request('/api/streaks/freeze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it('should allow freeze when last used yesterday', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezeUsedAt: yesterday })
    );
    (prisma.user.update as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 1 })
    );

    const res = await app.request('/api/streaks/freeze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.used).toBe(true);
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await app.request('/api/streaks/freeze', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(404);
  });
});

// ==================== GET /api/streaks/comeback ====================

describe('GET /api/streaks/comeback', () => {
  it('should return a comeback quest when eligible', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: threeDaysAgo })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('bonusXPMultiplier', 1.5);
    expect(body.data).toHaveProperty('isComeback', true);
    expect(body.data).toHaveProperty('name');
    expect(body.data).toHaveProperty('baseXP');
    expect(body.data).toHaveProperty('comebackXP');
    expect(body.data.comebackXP).toBeGreaterThan(body.data.baseXP);
    expect(body.data.id).toMatch(/^comeback-/);
  });

  it('should return 400 when not eligible (active today)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: new Date() })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Not eligible');
  });

  it('should return 400 when no activity history', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: null })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.message).toContain('No activity history');
  });

  it('should return 400 when missed too many days', async () => {
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: twentyDaysAgo })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error.message).toContain('Not eligible');
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(404);
  });

  it('should return comeback quest at boundary (1 day ago)', async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: oneDayAgo })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.isComeback).toBe(true);
  });

  it('should return comeback quest at boundary (14 days ago)', async () => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: fourteenDaysAgo })
    );

    const res = await app.request('/api/streaks/comeback', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.data.isComeback).toBe(true);
  });
});
