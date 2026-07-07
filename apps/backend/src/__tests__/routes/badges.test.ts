import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import badgeRoutes from '../../routes/badges';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    badge: {
      findMany: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userQuest: {
      findMany: jest.fn(),
    },
    questCompletion: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/badges', badgeRoutes);
app.use(errorHandler);

const USER_UUID = '00000000-0000-4000-a000-000000000100';
const BADGE_1_UUID = '00000000-0000-4000-a000-000000000b01';
const BADGE_2_UUID = '00000000-0000-4000-a000-000000000b02';

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

const mockBadge1 = {
  id: BADGE_1_UUID,
  name: 'First Steps',
  description: 'Complete your first quest',
  iconName: 'trophy',
  type: 'milestone',
  requirementType: 'total_completions',
  requirementValue: 1,
  requirementCategory: null,
  requirementQuestId: null,
  xpBonus: 10,
  rarity: 'common',
  createdAt: new Date('2024-01-01'),
};

const mockBadge2 = {
  id: BADGE_2_UUID,
  name: 'XP Master',
  description: 'Earn 1000 XP',
  iconName: 'star',
  type: 'milestone',
  requirementType: 'xp_threshold',
  requirementValue: 1000,
  requirementCategory: null,
  requirementQuestId: null,
  xpBonus: 50,
  rarity: 'rare',
  createdAt: new Date('2024-01-01'),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/badges', () => {
  it('should return all badges ordered by rarity and name', async () => {
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge1, mockBadge2]);

    const res = await request(app).get('/api/badges');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(prisma.badge.findMany).toHaveBeenCalledWith({
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
    });
  });

  it('should return empty array when no badges exist', async () => {
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/badges');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should work without authentication', async () => {
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/badges');

    expect(res.status).toBe(200);
  });
});

describe('GET /api/badges/user', () => {
  it('should return user earned badges', async () => {
    const mockUserBadges = [{
      id: 'ub-1',
      userId: USER_UUID,
      badgeId: BADGE_1_UUID,
      earnedAt: new Date('2024-06-15'),
      badge: mockBadge1,
    }];
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue(mockUserBadges);

    const res = await request(app)
      .get('/api/badges/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(prisma.userBadge.findMany).toHaveBeenCalledWith({
      where: { userId: USER_UUID },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  });

  it('should return empty array when user has no badges', async () => {
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/badges/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/badges/user');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/badges/check', () => {
  const mockUser = { id: USER_UUID, totalXP: 500 };

  it('should award badges when requirements are met (total_completions)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge1]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(5);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(1);
    expect(res.body.data.awarded[0].name).toBe('First Steps');
    expect(res.body.data.xpBonusTotal).toBe(10);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should award badges when xp_threshold met', async () => {
    const highXPUser = { ...mockUser, totalXP: 1500 };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(highXPUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge2]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(1);
    expect(res.body.data.awarded[0].name).toBe('XP Master');
  });

  it('should award badges when streak requirement met', async () => {
    const streakBadge = {
      ...mockBadge1,
      id: '00000000-0000-4000-a000-000000000b03',
      name: 'Streak King',
      requirementType: 'streak',
      requirementValue: 7,
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([streakBadge]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([
      { quest: { category: 'physical_health' }, currentStreak: 10, totalCompletions: 20 },
    ]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(20);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(1);
    expect(res.body.data.awarded[0].name).toBe('Streak King');
  });

  it('should award badges when category_completions met', async () => {
    const categoryBadge = {
      ...mockBadge1,
      id: '00000000-0000-4000-a000-000000000b04',
      name: 'Fitness Pro',
      requirementType: 'category_completions',
      requirementValue: 10,
      requirementCategory: 'physical_health',
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([categoryBadge]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([
      { quest: { category: 'physical_health' }, currentStreak: 0, totalCompletions: 15 },
    ]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(15);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(1);
  });

  it('should not award badges already earned', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([
      { badgeId: BADGE_1_UUID },
    ]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge1]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(100);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(0);
    expect(res.body.data.xpBonusTotal).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should not award when requirements not met', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([mockBadge2]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should skip special badges', async () => {
    const specialBadge = {
      ...mockBadge1,
      requirementType: 'special',
      requirementValue: 0,
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userBadge.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.badge.findMany as jest.Mock).mockResolvedValue([specialBadge]);
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(100);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.awarded).toHaveLength(0);
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/badges/check')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).post('/api/badges/check');
    expect(res.status).toBe(401);
  });
});
