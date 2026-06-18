import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import userRoutes from '../../routes/user';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    categoryPriority: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    userQuest: { deleteMany: jest.fn() },
    userBadge: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
    deviceToken: { deleteMany: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);
app.use(errorHandler);

const mockSettings = {
  id: 'settings-123',
  userId: 'user-123',
  notificationsEnabled: true,
  weeklyResetDay: 0,
  timezone: 'UTC',
  theme: 'system',
  soundEnabled: true,
  hapticFeedbackEnabled: true,
  dailyReminderTime: null,
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: 'hashed-password',
  displayName: 'Test User',
  avatarUrl: null,
  totalXP: 0,
  level: 1,
  isPremium: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  settings: mockSettings,
  categoryPriorities: [],
};

const mockPriorities = [
  { id: 'p-1', userId: 'user-123', category: 'physical_health', priority: 5, isEnabled: true },
  { id: 'p-2', userId: 'user-123', category: 'mental_wellness', priority: 4, isEnabled: true },
];

function makeToken(userId = 'user-123') {
  return jwt.sign({ userId, email: 'test@example.com' }, process.env.JWT_SECRET!, { expiresIn: 900 });
}

const validToken = makeToken();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/user/profile', () => {
  it('should return the user profile without password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.settings).toBeDefined();
  });

  it('should return 404 when user does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/profile', () => {
  it('should update display name', async () => {
    const updated = { ...mockUser, displayName: 'New Name' };
    (prisma.user.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ displayName: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('New Name');
    expect(res.body.data.password).toBeUndefined();
  });

  it('should update avatar URL', async () => {
    const updated = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' };
    (prisma.user.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ avatarUrl: 'https://example.com/avatar.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('should return 422 when displayName is too short', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ displayName: 'X' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('displayName');
  });

  it('should return 422 when avatarUrl is not a valid URL', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ avatarUrl: 'not-a-url' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('avatarUrl');
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app).put('/api/user/profile').send({ displayName: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user/settings', () => {
  it('should return user settings', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

    const res = await request(app)
      .get('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('system');
    expect(res.body.data.notificationsEnabled).toBe(true);
  });

  it('should return 404 when settings do not exist', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/user/settings');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/settings', () => {
  it('should update theme and notifications settings', async () => {
    const updated = { ...mockSettings, theme: 'dark', notificationsEnabled: false };
    (prisma.userSettings.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ theme: 'dark', notificationsEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('dark');
    expect(res.body.data.notificationsEnabled).toBe(false);
  });

  it('should return 422 for invalid theme value', async () => {
    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ theme: 'rainbow' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('theme');
  });

  it('should return 422 for invalid weeklyResetDay', async () => {
    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ weeklyResetDay: 7 });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('weeklyResetDay');
  });

  it('should return 422 for invalid dailyReminderTime format', async () => {
    const res = await request(app)
      .put('/api/user/settings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ dailyReminderTime: '25:00' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('dailyReminderTime');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).put('/api/user/settings').send({ theme: 'dark' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user/category-priorities', () => {
  it('should return category priorities ordered by priority desc', async () => {
    (prisma.categoryPriority.findMany as jest.Mock).mockResolvedValue(mockPriorities);

    const res = await request(app)
      .get('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(prisma.categoryPriority.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { priority: 'desc' },
      })
    );
  });

  it('should return an empty array when no priorities are set', async () => {
    (prisma.categoryPriority.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/user/category-priorities');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/category-priorities', () => {
  const validPriorities = [
    { category: 'physical_health', priority: 5, isEnabled: true },
    { category: 'mental_wellness', priority: 4, isEnabled: false },
  ];

  it('should replace all category priorities', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
    (prisma.categoryPriority.findMany as jest.Mock).mockResolvedValue(mockPriorities);

    const res = await request(app)
      .put('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ priorities: validPriorities });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return 422 when priorities field is missing', async () => {
    const res = await request(app)
      .put('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('priorities');
  });

  it('should return 422 for an invalid category value', async () => {
    const res = await request(app)
      .put('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ priorities: [{ category: 'invalid_category', priority: 3, isEnabled: true }] });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toMatchObject({ 'priorities[0].category': expect.any(Array) });
  });

  it('should return 422 when priority is out of range', async () => {
    const res = await request(app)
      .put('/api/user/category-priorities')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ priorities: [{ category: 'physical_health', priority: 6, isEnabled: true }] });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toMatchObject({ 'priorities[0].priority': expect.any(Array) });
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).put('/api/user/category-priorities').send({ priorities: [] });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/user/account', () => {
  it('should delete the account when password is correct', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when password is incorrect', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ password: 'WrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Incorrect password');
  });

  it('should return 404 when user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ password: 'Password1' });

    expect(res.status).toBe(404);
  });

  it('should return 422 when password field is missing', async () => {
    const res = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('password');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .delete('/api/user/account')
      .send({ password: 'Password1' });

    expect(res.status).toBe(401);
  });
});
