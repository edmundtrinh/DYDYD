import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { calculateOverallDayStreak, calculateUserQuestStreak } from '../../lib/streaks';
import progressRoutes from '../../routes/progress';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    questCompletion: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    userBadge: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userQuest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../lib/streaks', () => ({
  calculateOverallDayStreak: jest.fn(),
  calculateUserQuestStreak: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/progress', progressRoutes);
app.use(errorHandler);

const USER_UUID = '00000000-0000-4000-a000-000000000100';
const UQ_UUID = '00000000-0000-4000-a000-000000000010';

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

const mockUser = {
  id: USER_UUID,
  totalXP: 500,
  level: 5,
  displayName: 'Test User',
  avatarUrl: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/progress/stats', () => {
  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.questCompletion.aggregate as jest.Mock).mockResolvedValue({
      _count: 42,
      _sum: { xpEarned: 500 },
    });
    (prisma.userBadge.count as jest.Mock).mockResolvedValue(3);
    (prisma.questCompletion.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (calculateOverallDayStreak as jest.Mock).mockResolvedValue({
      currentDayStreak: 5,
      longestDayStreak: 12,
    });
  });

  it('should return user stats', async () => {
    const res = await request(app)
      .get('/api/progress/stats')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalXP).toBe(500);
    expect(res.body.data.level).toBe(5);
    expect(res.body.data.totalQuestsCompleted).toBe(42);
    expect(res.body.data.currentDayStreak).toBe(5);
    expect(res.body.data.longestDayStreak).toBe(12);
    expect(res.body.data.badgesEarned).toBe(3);
  });

  it('should include category stats with streak data', async () => {
    const mockUserQuests = [{
      id: UQ_UUID,
      quest: { category: 'physical_health', frequency: 'daily' },
      totalCompletions: 15,
    }];
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue(mockUserQuests);
    (calculateUserQuestStreak as jest.Mock).mockResolvedValue({
      currentStreak: 3,
      longestStreak: 7,
    });

    const res = await request(app)
      .get('/api/progress/stats')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.categoryStats.physical_health.totalCompletions).toBe(15);
    expect(res.body.data.categoryStats.physical_health.currentStreak).toBe(3);
    expect(res.body.data.categoryStats.physical_health.longestStreak).toBe(7);
    expect(calculateUserQuestStreak).toHaveBeenCalledWith(UQ_UUID, 'daily');
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/progress/stats')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/progress/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/daily', () => {
  beforeEach(() => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(5);
  });

  it('should return daily progress for today', async () => {
    const res = await request(app)
      .get('/api/progress/daily')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('date');
    expect(res.body.data).toHaveProperty('totalXP');
    expect(res.body.data).toHaveProperty('questsCompleted');
    expect(res.body.data).toHaveProperty('questsTotal');
    expect(res.body.data).toHaveProperty('categoryBreakdown');
    expect(res.body.data.questsTotal).toBe(5);
  });

  it('should return daily progress for a specific date', async () => {
    const res = await request(app)
      .get('/api/progress/daily?date=2024-06-15T00:00:00.000Z')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(prisma.questCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completedAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('should aggregate XP by category', async () => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([
      {
        xpEarned: 5,
        userQuest: { quest: { category: 'physical_health' } },
      },
      {
        xpEarned: 3,
        userQuest: { quest: { category: 'physical_health' } },
      },
      {
        xpEarned: 4,
        userQuest: { quest: { category: 'mental_wellness' } },
      },
    ]);

    const res = await request(app)
      .get('/api/progress/daily')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalXP).toBe(12);
    expect(res.body.data.questsCompleted).toBe(3);
    expect(res.body.data.categoryBreakdown.physical_health).toBe(8);
    expect(res.body.data.categoryBreakdown.mental_wellness).toBe(4);
  });

  it('should return 422 for invalid date format', async () => {
    const res = await request(app)
      .get('/api/progress/daily?date=not-a-date')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/progress/daily');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/weekly', () => {
  beforeEach(() => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(5);
  });

  it('should return weekly progress for current week', async () => {
    const res = await request(app)
      .get('/api/progress/weekly')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('weekStart');
    expect(res.body.data).toHaveProperty('weekEnd');
    expect(res.body.data).toHaveProperty('totalXP');
    expect(res.body.data).toHaveProperty('dailyProgress');
    expect(res.body.data.dailyProgress).toHaveLength(7);
    expect(res.body.data).toHaveProperty('topCategory');
  });

  it('should return weekly progress for a specific week', async () => {
    const res = await request(app)
      .get('/api/progress/weekly?weekStart=2024-06-09T00:00:00.000Z')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.dailyProgress).toHaveLength(7);
  });

  it('should return 422 for invalid weekStart format', async () => {
    const res = await request(app)
      .get('/api/progress/weekly?weekStart=not-a-date')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/progress/weekly');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/badges', () => {
  it('should return user badges ordered by earned date', async () => {
    const mockBadges = [
      {
        id: 'ub-1',
        userId: USER_UUID,
        badgeId: 'badge-1',
        earnedAt: new Date('2024-06-15'),
        badge: {
          id: 'badge-1',
          name: 'First Quest',
          description: 'Complete your first quest',
          iconName: 'trophy',
          rarity: 'common',
        },
      },
    ];
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue(mockBadges);

    const res = await request(app)
      .get('/api/progress/badges')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].badge.name).toBe('First Quest');
    expect(prisma.userBadge.findMany).toHaveBeenCalledWith({
      where: { userId: USER_UUID },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  });

  it('should return empty array when user has no badges', async () => {
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/progress/badges')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/progress/badges');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/leaderboard', () => {
  const mockLeaderboardUsers = [
    { id: 'u-1', displayName: 'Alice', avatarUrl: null, totalXP: 1000, level: 10 },
    { id: 'u-2', displayName: 'Bob', avatarUrl: null, totalXP: 800, level: 8 },
  ];

  it('should return leaderboard with default weekly type', async () => {
    (prisma.questCompletion.groupBy as jest.Mock).mockResolvedValue([
      { userQuestId: 'uq-1', _sum: { xpEarned: 500 } },
      { userQuestId: 'uq-2', _sum: { xpEarned: 300 } },
    ]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([
      { id: 'uq-1', userId: 'u-1' },
      { id: 'uq-2', userId: 'u-2' },
    ]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaderboardUsers);

    const res = await request(app)
      .get('/api/progress/leaderboard')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].displayName).toBe('Alice');
    expect(res.body.data[1].rank).toBe(2);
  });

  it('should return all-time leaderboard', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaderboardUsers);

    const res = await request(app)
      .get('/api/progress/leaderboard?type=all-time')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should respect custom limit', async () => {
    (prisma.questCompletion.groupBy as jest.Mock).mockResolvedValue([
      { userQuestId: 'uq-1', _sum: { xpEarned: 500 } },
      { userQuestId: 'uq-2', _sum: { xpEarned: 300 } },
    ]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([
      { id: 'uq-1', userId: 'u-1' },
      { id: 'uq-2', userId: 'u-2' },
    ]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockLeaderboardUsers[0]]);

    const res = await request(app)
      .get('/api/progress/leaderboard?limit=1')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 422 for invalid type', async () => {
    const res = await request(app)
      .get('/api/progress/leaderboard?type=monthly')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(422);
  });

  it('should return 422 for invalid limit', async () => {
    const res = await request(app)
      .get('/api/progress/leaderboard?limit=0')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/progress/leaderboard');
    expect(res.status).toBe(401);
  });
});
