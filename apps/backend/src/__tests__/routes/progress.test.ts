import { Hono } from 'hono';
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
      count: jest.fn(),
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

const app = new Hono();
app.route('/api/progress', progressRoutes);
app.onError((err, c) => errorHandler(err, c));

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
    const res = await app.request('/api/progress/stats', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalXP).toBe(500);
    expect(body.data.level).toBe(5);
    expect(body.data.totalQuestsCompleted).toBe(42);
    expect(body.data.currentDayStreak).toBe(5);
    expect(body.data.longestDayStreak).toBe(12);
    expect(body.data.badgesEarned).toBe(3);
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

    const res = await app.request('/api/progress/stats', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.categoryStats.physical_health.totalCompletions).toBe(15);
    expect(body.data.categoryStats.physical_health.currentStreak).toBe(3);
    expect(body.data.categoryStats.physical_health.longestStreak).toBe(7);
    expect(calculateUserQuestStreak).toHaveBeenCalledWith(UQ_UUID, 'daily');
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await app.request('/api/progress/stats', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/daily', () => {
  beforeEach(() => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(5);
  });

  it('should return daily progress for today', async () => {
    const res = await app.request('/api/progress/daily', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('date');
    expect(body.data).toHaveProperty('totalXP');
    expect(body.data).toHaveProperty('questsCompleted');
    expect(body.data).toHaveProperty('questsTotal');
    expect(body.data).toHaveProperty('categoryBreakdown');
    expect(body.data.questsTotal).toBe(5);
  });

  it('should return daily progress for a specific date', async () => {
    const res = await app.request('/api/progress/daily?date=2024-06-15T00:00:00.000Z', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

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

    const res = await app.request('/api/progress/daily', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.totalXP).toBe(12);
    expect(body.data.questsCompleted).toBe(3);
    expect(body.data.categoryBreakdown.physical_health).toBe(8);
    expect(body.data.categoryBreakdown.mental_wellness).toBe(4);
  });

  it('should return 422 for invalid date format', async () => {
    const res = await app.request('/api/progress/daily?date=not-a-date', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/daily');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/weekly', () => {
  beforeEach(() => {
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(5);
  });

  it('should return weekly progress for current week', async () => {
    const res = await app.request('/api/progress/weekly', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('weekStart');
    expect(body.data).toHaveProperty('weekEnd');
    expect(body.data).toHaveProperty('totalXP');
    expect(body.data).toHaveProperty('dailyProgress');
    expect(body.data.dailyProgress).toHaveLength(7);
    expect(body.data).toHaveProperty('topCategory');
  });

  it('should return weekly progress for a specific week', async () => {
    const res = await app.request('/api/progress/weekly?weekStart=2024-06-09T00:00:00.000Z', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.dailyProgress).toHaveLength(7);
  });

  it('should return 422 for invalid weekStart format', async () => {
    const res = await app.request('/api/progress/weekly?weekStart=not-a-date', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/weekly');
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

    const res = await app.request('/api/progress/badges', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].badge.name).toBe('First Quest');
    expect(prisma.userBadge.findMany).toHaveBeenCalledWith({
      where: { userId: USER_UUID },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  });

  it('should return empty array when user has no badges', async () => {
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);

    const res = await app.request('/api/progress/badges', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/badges');
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

    const res = await app.request('/api/progress/leaderboard', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].rank).toBe(1);
    expect(body.data[0].displayName).toBe('Alice');
    expect(body.data[1].rank).toBe(2);
  });

  it('should return all-time leaderboard', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockLeaderboardUsers);

    const res = await app.request('/api/progress/leaderboard?type=all-time', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
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

    const res = await app.request('/api/progress/leaderboard?limit=1', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('should return 422 for invalid type', async () => {
    const res = await app.request('/api/progress/leaderboard?type=monthly', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 422 for invalid limit', async () => {
    const res = await app.request('/api/progress/leaderboard?limit=0', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/leaderboard');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/weekly-digest', () => {
  it('should return digest with current and previous week data', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValueOnce(10); // current week
    (prisma.questCompletion.aggregate as jest.Mock).mockResolvedValueOnce({
      _sum: { xpEarned: 150 },
    });
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(5);
    (calculateOverallDayStreak as jest.Mock).mockResolvedValue({
      currentDayStreak: 3,
      longestDayStreak: 10,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_UUID,
      createdAt: new Date('2025-01-01'),
    });
    // Previous week
    (prisma.questCompletion.count as jest.Mock).mockResolvedValueOnce(8);
    (prisma.questCompletion.aggregate as jest.Mock).mockResolvedValueOnce({
      _sum: { xpEarned: 100 },
    });

    const res = await app.request('/api/progress/weekly-digest', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.currentWeek).toEqual(
      expect.objectContaining({
        totalCompletions: 10,
        totalXP: 150,
        activeQuests: 5,
        streakLength: 3,
      })
    );
    expect(body.data.previousWeek).not.toBeNull();
    expect(body.data.previousWeek.totalCompletions).toBe(8);
    expect(body.data.previousWeek.totalXP).toBe(100);
    expect(body.data.comparison).not.toBeNull();
    expect(body.data.comparison.completionsDelta).toBe(2);
    expect(body.data.comparison.xpDelta).toBe(50);
  });

  it('should return null previousWeek and comparison for first-week users', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(3);
    (prisma.questCompletion.aggregate as jest.Mock).mockResolvedValue({
      _sum: { xpEarned: 30 },
    });
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(2);
    (calculateOverallDayStreak as jest.Mock).mockResolvedValue({
      currentDayStreak: 1,
      longestDayStreak: 1,
    });
    // User created this week
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_UUID,
      createdAt: new Date(), // today
    });

    const res = await app.request('/api/progress/weekly-digest', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.previousWeek).toBeNull();
    expect(body.data.comparison).toBeNull();
  });

  it('should handle zero previous completions without division by zero', async () => {
    (prisma.questCompletion.count as jest.Mock)
      .mockResolvedValueOnce(5) // current
      .mockResolvedValueOnce(0); // previous
    (prisma.questCompletion.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { xpEarned: 50 } }) // current
      .mockResolvedValueOnce({ _sum: { xpEarned: 0 } }); // previous
    (prisma.userQuest.count as jest.Mock).mockResolvedValue(3);
    (calculateOverallDayStreak as jest.Mock).mockResolvedValue({
      currentDayStreak: 2,
      longestDayStreak: 5,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_UUID,
      createdAt: new Date('2025-01-01'),
    });

    const res = await app.request('/api/progress/weekly-digest', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.comparison.completionsPercent).toBe(100);
    expect(body.data.comparison.xpPercent).toBe(100);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/weekly-digest');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/history', () => {
  const QUEST_UUID = '00000000-0000-4000-a000-000000000020';

  const mockCompletions = [
    {
      id: 'comp-1',
      userQuestId: UQ_UUID,
      completedAt: new Date('2026-07-08T10:00:00Z'),
      timeBucket: 'morning',
      xpEarned: 5,
      value: null,
      source: 'manual',
      notes: null,
      userQuest: {
        quest: {
          name: 'Morning Run',
          category: 'physical_health',
        },
      },
    },
    {
      id: 'comp-2',
      userQuestId: UQ_UUID,
      completedAt: new Date('2026-07-07T15:00:00Z'),
      timeBucket: 'afternoon',
      xpEarned: 3,
      value: 5000,
      source: 'apple_health',
      notes: 'Good run',
      userQuest: {
        quest: {
          name: 'Step Counter',
          category: 'physical_health',
        },
      },
    },
  ];

  it('should return paginated completion history', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(2);
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue(mockCompletions);

    const res = await app.request('/api/progress/history', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].questName).toBe('Morning Run');
    expect(body.data[0].timeBucket).toBe('morning');
    expect(body.data[1].questCategory).toBe('physical_health');
    expect(body.meta).toEqual({
      page: 1,
      perPage: 20,
      total: 2,
      hasMore: false,
    });
  });

  it('should filter by questId', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(1);
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([mockCompletions[0]]);

    const res = await app.request(
      `/api/progress/history?questId=${QUEST_UUID}`,
      { headers: { Authorization: `Bearer ${validToken}` } }
    );
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(prisma.questCompletion.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userQuest: expect.objectContaining({
            questId: QUEST_UUID,
          }),
        }),
      })
    );
  });

  it('should filter by category', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(1);
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([mockCompletions[0]]);

    const res = await app.request('/api/progress/history?category=physical_health', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(prisma.questCompletion.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userQuest: expect.objectContaining({
            quest: { category: 'physical_health' },
          }),
        }),
      })
    );
  });

  it('should respect pagination parameters', async () => {
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(50);
    (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([mockCompletions[0]]);

    const res = await app.request('/api/progress/history?page=2&perPage=10', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.meta.page).toBe(2);
    expect(body.meta.perPage).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.hasMore).toBe(true);
    expect(prisma.questCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('should return 422 for invalid category', async () => {
    const res = await app.request('/api/progress/history?category=invalid_cat', {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 422 for invalid questId format', async () => {
    const res = await app.request('/api/progress/history?questId=not-a-uuid', {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/progress/history');
    expect(res.status).toBe(401);
  });
});
