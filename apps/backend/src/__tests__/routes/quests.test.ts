import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import questRoutes from '../../routes/quests';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
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
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/quests', questRoutes);
app.use(errorHandler);

const QUEST_UUID = '00000000-0000-4000-a000-000000000001';
const UQ_UUID = '00000000-0000-4000-a000-000000000010';
const USER_UUID = '00000000-0000-4000-a000-000000000100';
const NONEXISTENT_UUID = '00000000-0000-4000-a000-ffffffffffff';

const mockQuest = {
  id: QUEST_UUID,
  name: 'Morning Run',
  description: 'Run for 30 minutes',
  category: 'physical_health',
  frequency: 'daily',
  baseXP: 5,
  maxCompletionsPerPeriod: 1,
  isDefault: true,
  isCustom: false,
  iconName: 'run',
  healthDataType: null,
  targetValue: null,
  unit: null,
  createdById: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockUserQuest = {
  id: UQ_UUID,
  userId: USER_UUID,
  questId: QUEST_UUID,
  isActive: true,
  customName: null,
  customXP: null,
  reminderTime: null,
  reminderEnabled: false,
  currentStreak: 3,
  longestStreak: 5,
  totalCompletions: 10,
  lastCompletedAt: new Date('2024-06-17'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-17'),
  quest: mockQuest,
  completions: [],
};

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/quests/library', () => {
  it('should return all default quests', async () => {
    const quests = [mockQuest, { ...mockQuest, id: 'quest-002', name: 'Meditation' }];
    (prisma.quest.findMany as jest.Mock).mockResolvedValue(quests);

    const res = await request(app).get('/api/quests/library');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(prisma.quest.findMany).toHaveBeenCalledWith({
      where: { isDefault: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  });

  it('should return empty array when no default quests exist', async () => {
    (prisma.quest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/quests/library');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should work without authentication', async () => {
    (prisma.quest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/api/quests/library');

    expect(res.status).toBe(200);
  });
});

describe('GET /api/quests/user', () => {
  it('should return active quests for authenticated user', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockUserQuest]);

    const res = await request(app)
      .get('/api/quests/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(prisma.userQuest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_UUID, isActive: true },
      })
    );
  });

  it('should return empty array when user has no active quests', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/quests/user')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/quests/user');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/quests/activate', () => {
  it('should activate a quest for the user', async () => {
    (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.userQuest.create as jest.Mock).mockResolvedValue(mockUserQuest);

    const res = await request(app)
      .post('/api/quests/activate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ questId: QUEST_UUID });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(prisma.userQuest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_UUID,
          questId: QUEST_UUID,
          isActive: true,
        }),
      })
    );
  });

  it('should reactivate a deactivated quest', async () => {
    const deactivatedQuest = { ...mockUserQuest, isActive: false };
    (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(deactivatedQuest);
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({
      ...deactivatedQuest,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/quests/activate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ questId: QUEST_UUID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.userQuest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: UQ_UUID },
        data: { isActive: true },
      })
    );
  });

  it('should return 409 when quest is already active', async () => {
    (prisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);

    const res = await request(app)
      .post('/api/quests/activate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ questId: QUEST_UUID });

    expect(res.status).toBe(409);
  });

  it('should return 404 when quest does not exist', async () => {
    (prisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/quests/activate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ questId: NONEXISTENT_UUID });

    expect(res.status).toBe(404);
  });

  it('should return 422 when questId is not a valid UUID', async () => {
    const res = await request(app)
      .post('/api/quests/activate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ questId: 'not-a-uuid' });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/quests/activate')
      .send({ questId: QUEST_UUID });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/quests/:id/complete', () => {
  const mockCompletion = {
    id: 'comp-001',
    userQuestId: UQ_UUID,
    completedAt: new Date(),
    xpEarned: 5,
    value: null,
    source: 'manual',
    periodStart: new Date(),
    notes: null,
    createdAt: new Date(),
  };

  it('should complete a quest and award XP', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue(mockCompletion);
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({
      ...mockUserQuest,
      totalCompletions: 11,
      currentStreak: 4,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xpEarned).toBe(5);
    expect(prisma.questCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userQuestId: UQ_UUID,
          xpEarned: 5,
          source: 'manual',
        }),
      })
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: { totalXP: { increment: 5 } },
    });
  });

  it('should use customXP when set on userQuest', async () => {
    const customXPQuest = { ...mockUserQuest, customXP: 8 };
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(customXPQuest);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue({
      ...mockCompletion,
      xpEarned: 8,
    });
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(prisma.questCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 8 }),
      })
    );
  });

  it('should accept optional value, source, and notes', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue(mockCompletion);
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ value: 5000, source: 'apple_health', notes: 'Morning jog' });

    expect(res.status).toBe(201);
    expect(prisma.questCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          value: 5000,
          source: 'apple_health',
          notes: 'Morning jog',
        }),
      })
    );
  });

  it('should return 400 when max completions reached', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 404 when user quest not found', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it('should return 422 when id is not a valid UUID', async () => {
    const res = await request(app)
      .post('/api/quests/not-a-uuid/complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post(`/api/quests/${UQ_UUID}/complete`)
      .send({});

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/quests/:id', () => {
  it('should deactivate a user quest', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(mockUserQuest);
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({
      ...mockUserQuest,
      isActive: false,
    });

    const res = await request(app)
      .delete(`/api/quests/${UQ_UUID}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.userQuest.update).toHaveBeenCalledWith({
      where: { id: UQ_UUID },
      data: { isActive: false },
    });
  });

  it('should return 404 when user quest not found', async () => {
    (prisma.userQuest.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/quests/${UQ_UUID}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 422 when id is not a valid UUID', async () => {
    const res = await request(app)
      .delete('/api/quests/not-valid')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).delete(`/api/quests/${UQ_UUID}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/quests/custom', () => {
  const validCustomQuest = {
    name: 'Read a Book',
    description: 'Read for 30 minutes',
    category: 'mental_wellness',
    frequency: 'daily',
    baseXP: 3,
  };

  const mockUser = {
    id: USER_UUID,
    isPremium: false,
  };

  const mockCreatedQuest = {
    id: '00000000-0000-4000-a000-000000000099',
    ...validCustomQuest,
    description: 'Read for 30 minutes',
    maxCompletionsPerPeriod: 1,
    isDefault: false,
    isCustom: true,
    iconName: 'star',
    createdById: USER_UUID,
    healthDataType: null,
    targetValue: null,
    unit: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should create a custom quest and auto-activate it', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.quest.count as jest.Mock).mockResolvedValue(0);
    (prisma.quest.create as jest.Mock).mockResolvedValue(mockCreatedQuest);
    (prisma.userQuest.create as jest.Mock).mockResolvedValue({
      ...mockUserQuest,
      quest: mockCreatedQuest,
    });

    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCustomQuest);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(prisma.quest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Read a Book',
          isCustom: true,
          isDefault: false,
          createdById: USER_UUID,
        }),
      })
    );
    expect(prisma.userQuest.create).toHaveBeenCalled();
  });

  it('should return 400 when free user exceeds custom quest limit', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.quest.count as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCustomQuest);

    expect(res.status).toBe(400);
  });

  it('should allow premium user more custom quests', async () => {
    const premiumUser = { ...mockUser, isPremium: true };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(premiumUser);
    (prisma.quest.count as jest.Mock).mockResolvedValue(3);
    (prisma.quest.create as jest.Mock).mockResolvedValue(mockCreatedQuest);
    (prisma.userQuest.create as jest.Mock).mockResolvedValue({
      ...mockUserQuest,
      quest: mockCreatedQuest,
    });

    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCustomQuest);

    expect(res.status).toBe(201);
  });

  it('should return 400 when premium user exceeds 50 custom quests', async () => {
    const premiumUser = { ...mockUser, isPremium: true };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(premiumUser);
    (prisma.quest.count as jest.Mock).mockResolvedValue(50);

    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validCustomQuest);

    expect(res.status).toBe(400);
  });

  it('should return 422 when name is too short', async () => {
    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...validCustomQuest, name: 'A' });

    expect(res.status).toBe(422);
  });

  it('should return 422 when category is invalid', async () => {
    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...validCustomQuest, category: 'invalid_category' });

    expect(res.status).toBe(422);
  });

  it('should return 422 when frequency is invalid', async () => {
    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...validCustomQuest, frequency: 'hourly' });

    expect(res.status).toBe(422);
  });

  it('should return 422 when baseXP is out of range', async () => {
    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...validCustomQuest, baseXP: 100 });

    expect(res.status).toBe(422);
  });

  it('should return 422 when name is missing', async () => {
    const { name, ...noName } = validCustomQuest;
    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send(noName);

    expect(res.status).toBe(422);
  });

  it('should accept optional fields', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.quest.count as jest.Mock).mockResolvedValue(0);
    (prisma.quest.create as jest.Mock).mockResolvedValue(mockCreatedQuest);
    (prisma.userQuest.create as jest.Mock).mockResolvedValue({
      ...mockUserQuest,
      quest: mockCreatedQuest,
    });

    const res = await request(app)
      .post('/api/quests/custom')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        ...validCustomQuest,
        maxCompletionsPerPeriod: 3,
        iconName: 'book',
      });

    expect(res.status).toBe(201);
    expect(prisma.quest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          maxCompletionsPerPeriod: 3,
          iconName: 'book',
        }),
      })
    );
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/quests/custom')
      .send(validCustomQuest);

    expect(res.status).toBe(401);
  });
});
