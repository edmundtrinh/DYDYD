import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { calculateFreezeAwareDayStreak } from '../../lib/streaks';
import streakRoutes from '../../routes/streaks';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../lib/streaks', () => ({
  calculateFreezeAwareDayStreak: jest.fn(),
  checkAndAutoApplyFreeze: jest.fn(),
  trackActiveDay: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/streaks', streakRoutes);
app.use(errorHandler);

const USER_UUID = '00000000-0000-4000-a000-000000000200';

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

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
    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      currentDayStreak: 5,
      longestDayStreak: 12,
      streakFreezes: 2,
      maxStreakFreezes: 3,
      freezeAvailable: true,
      activeDaysCount: 10,
    });
    expect(res.body.data).toHaveProperty('comebackEligible');
    expect(res.body.data).toHaveProperty('nextFreezeIn');
  });

  it('should indicate freeze unavailable when none remaining', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 0 })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.freezeAvailable).toBe(false);
  });

  it('should indicate freeze unavailable when already used today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezeUsedAt: new Date() })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.freezeAvailable).toBe(false);
  });

  it('should indicate comeback eligible when last active 3 days ago', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: threeDaysAgo })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comebackEligible).toBe(true);
  });

  it('should indicate comeback ineligible when active today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: new Date() })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comebackEligible).toBe(false);
  });

  it('should handle null lastActiveDate for comeback eligibility', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: null })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comebackEligible).toBe(false);
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/streaks/status');
    expect(res.status).toBe(401);
  });

  it('should calculate nextFreezeIn correctly', async () => {
    // activeDaysCount = 10, freezeEarnInterval = 7
    // 10 % 7 = 3, so nextFreezeIn = 7 - 3 = 4
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ activeDaysCount: 10 })
    );

    const res = await request(app)
      .get('/api/streaks/status')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.nextFreezeIn).toBe(4);
  });
});

// ==================== POST /api/streaks/freeze ====================

describe('POST /api/streaks/freeze', () => {
  it('should successfully use a streak freeze', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
    (prisma.user.update as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezes: 1 })
    );

    const res = await request(app)
      .post('/api/streaks/freeze')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
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

    const res = await request(app)
      .post('/api/streaks/freeze')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('No streak freezes available');
  });

  it('should return 400 when freeze already used today', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ streakFreezeUsedAt: new Date() })
    );

    const res = await request(app)
      .post('/api/streaks/freeze')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
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

    const res = await request(app)
      .post('/api/streaks/freeze')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.used).toBe(true);
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/streaks/freeze')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).post('/api/streaks/freeze');
    expect(res.status).toBe(401);
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

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('bonusXPMultiplier', 1.5);
    expect(res.body.data).toHaveProperty('isComeback', true);
    expect(res.body.data).toHaveProperty('name');
    expect(res.body.data).toHaveProperty('baseXP');
    expect(res.body.data.id).toMatch(/^comeback-/);
  });

  it('should return 400 when not eligible (active today)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: new Date() })
    );

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Not eligible');
  });

  it('should return 400 when no activity history', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: null })
    );

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('No activity history');
  });

  it('should return 400 when missed too many days', async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: tenDaysAgo })
    );

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Not eligible');
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/streaks/comeback');
    expect(res.status).toBe(401);
  });

  it('should return comeback quest at boundary (1 day ago)', async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: oneDayAgo })
    );

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isComeback).toBe(true);
  });

  it('should return comeback quest at boundary (7 days ago)', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(
      createMockUser({ lastActiveDate: sevenDaysAgo })
    );

    const res = await request(app)
      .get('/api/streaks/comeback')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isComeback).toBe(true);
  });
});
