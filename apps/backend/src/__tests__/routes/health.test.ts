import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import healthRoutes from '../../routes/health';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    userQuest: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    questCompletion: {
      count: jest.fn(),
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use(errorHandler);

const USER_UUID = '00000000-0000-4000-a000-000000000100';
const UQ_STEPS_UUID = '00000000-0000-4000-a000-000000000010';
const UQ_SLEEP_UUID = '00000000-0000-4000-a000-000000000020';
const QUEST_STEPS_UUID = '00000000-0000-4000-a000-000000000001';
const QUEST_SLEEP_UUID = '00000000-0000-4000-a000-000000000002';

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

const mockStepsQuest = {
  id: QUEST_STEPS_UUID,
  name: '10K Steps',
  category: 'physical_health',
  frequency: 'daily',
  baseXP: 5,
  maxCompletionsPerPeriod: 1,
  healthDataType: 'steps',
  targetValue: 10000,
  isDefault: true,
  isCustom: false,
};

const mockSleepQuest = {
  id: QUEST_SLEEP_UUID,
  name: 'Sleep 7 Hours',
  category: 'physical_health',
  frequency: 'daily',
  baseXP: 3,
  maxCompletionsPerPeriod: 1,
  healthDataType: 'sleep_hours',
  targetValue: 7,
  isDefault: true,
  isCustom: false,
};

const mockStepsUserQuest = {
  id: UQ_STEPS_UUID,
  userId: USER_UUID,
  questId: QUEST_STEPS_UUID,
  isActive: true,
  customXP: null,
  currentStreak: 2,
  longestStreak: 5,
  totalCompletions: 10,
  quest: mockStepsQuest,
};

const mockSleepUserQuest = {
  id: UQ_SLEEP_UUID,
  userId: USER_UUID,
  questId: QUEST_SLEEP_UUID,
  isActive: true,
  customXP: null,
  currentStreak: 1,
  longestStreak: 3,
  totalCompletions: 5,
  quest: mockSleepQuest,
};

const validMetric = {
  type: 'steps',
  value: 12000,
  source: 'apple_health',
  timestamp: '2024-06-18T12:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/health/sync', () => {
  it('should auto-complete a quest when target is met', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockStepsUserQuest]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue({});
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questsAutoCompleted).toContain(UQ_STEPS_UUID);
    expect(res.body.data.xpEarned).toBe(5);
    expect(prisma.questCompletion.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_UUID },
      data: { totalXP: { increment: 5 } },
    });
  });

  it('should not complete quest when target value is not met', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockStepsUserQuest]);

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [{ ...validMetric, value: 5000 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.questsAutoCompleted).toHaveLength(0);
    expect(res.body.data.xpEarned).toBe(0);
    expect(prisma.questCompletion.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should skip quest when max completions for period already reached', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockStepsUserQuest]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(200);
    expect(res.body.data.questsAutoCompleted).toHaveLength(0);
    expect(prisma.questCompletion.create).not.toHaveBeenCalled();
  });

  it('should process multiple metrics and match to different quests', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([
      mockStepsUserQuest,
      mockSleepUserQuest,
    ]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue({});
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [
          validMetric,
          {
            type: 'sleep_hours',
            value: 8,
            source: 'apple_health',
            timestamp: '2024-06-18T08:00:00.000Z',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.questsAutoCompleted).toHaveLength(2);
    expect(res.body.data.xpEarned).toBe(8);
    expect(prisma.questCompletion.create).toHaveBeenCalledTimes(2);
  });

  it('should use customXP when set on user quest', async () => {
    const customXPQuest = { ...mockStepsUserQuest, customXP: 10 };
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([customXPQuest]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue({});
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(200);
    expect(res.body.data.xpEarned).toBe(10);
    expect(prisma.questCompletion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ xpEarned: 10 }),
      })
    );
  });

  it('should return empty results when no quests match metrics', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockSleepUserQuest]);

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(200);
    expect(res.body.data.questsAutoCompleted).toHaveLength(0);
    expect(res.body.data.xpEarned).toBe(0);
  });

  it('should return empty results when user has no health-linked quests', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(200);
    expect(res.body.data.questsAutoCompleted).toHaveLength(0);
  });

  it('should update streak and totalCompletions on user quest', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([mockStepsUserQuest]);
    (prisma.questCompletion.count as jest.Mock).mockResolvedValue(0);
    (prisma.questCompletion.create as jest.Mock).mockResolvedValue({});
    (prisma.userQuest.update as jest.Mock).mockResolvedValue({});
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(prisma.userQuest.update).toHaveBeenCalledWith({
      where: { id: UQ_STEPS_UUID },
      data: expect.objectContaining({
        totalCompletions: { increment: 1 },
        currentStreak: { increment: 1 },
      }),
    });
  });

  it('should include metric data points in response', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [validMetric] });

    expect(res.body.data.dataPoints).toHaveLength(1);
    expect(res.body.data.dataPoints[0].type).toBe('steps');
    expect(res.body.data.dataPoints[0].value).toBe(12000);
    expect(res.body.data.dataPoints[0].source).toBe('apple_health');
  });

  // Validation tests
  it('should return 422 when metrics array is empty', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: [] });

    expect(res.status).toBe(422);
  });

  it('should return 422 when metrics is not an array', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ metrics: 'not-array' });

    expect(res.status).toBe(422);
  });

  it('should return 422 when metric type is invalid', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [{ ...validMetric, type: 'invalid_type' }],
      });

    expect(res.status).toBe(422);
  });

  it('should return 422 when metric value is not numeric', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [{ ...validMetric, value: 'not-a-number' }],
      });

    expect(res.status).toBe(422);
  });

  it('should return 422 when metric source is invalid', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [{ ...validMetric, source: 'fitbit' }],
      });

    expect(res.status).toBe(422);
  });

  it('should return 422 when timestamp is not ISO 8601', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        metrics: [{ ...validMetric, timestamp: 'yesterday' }],
      });

    expect(res.status).toBe(422);
  });

  it('should return 422 when metrics field is missing', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('should accept all valid health data types', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);

    const validTypes = [
      'steps', 'distance', 'active_calories', 'sleep_hours',
      'water_cups', 'workout_minutes', 'heart_rate',
      'mindful_minutes', 'stand_hours',
    ];

    for (const type of validTypes) {
      const res = await request(app)
        .post('/api/health/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metrics: [{
            type,
            value: 100,
            source: 'manual',
            timestamp: '2024-06-18T12:00:00.000Z',
          }],
        });

      expect(res.status).toBe(200);
    }
  });

  it('should accept all valid health data sources', async () => {
    (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);

    const validSources = [
      'apple_health', 'google_fit', 'garmin',
      'samsung_health', 'manual',
    ];

    for (const source of validSources) {
      const res = await request(app)
        .post('/api/health/sync')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          metrics: [{
            type: 'steps',
            value: 100,
            source,
            timestamp: '2024-06-18T12:00:00.000Z',
          }],
        });

      expect(res.status).toBe(200);
    }
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/health/sync')
      .send({ metrics: [validMetric] });

    expect(res.status).toBe(401);
  });
});
