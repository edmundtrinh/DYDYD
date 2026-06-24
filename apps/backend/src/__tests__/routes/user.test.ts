import express from 'express';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma';

// Module-level mocks
jest.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
};
jest.mock('bcryptjs', () => ({
  ...mockBcrypt,
  default: mockBcrypt,
}));

import userRouter from '../../routes/user';
import { errorHandler } from '../../middleware/errorHandler';
import { generateAccessToken } from '../../middleware/auth';

// ---------------------------------------------------------------------------
// Test app
// ---------------------------------------------------------------------------
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', userRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_EMAIL = 'user@example.com';

/**
 * Creates a valid Bearer token for the shared test user.
 * The jest.setup.js file sets JWT_SECRET before any module loads, so
 * generateAccessToken uses the same secret as authenticate middleware.
 */
function authHeader() {
  return `Bearer ${generateAccessToken(USER_ID, USER_EMAIL)}`;
}

const mockUser = {
  id: USER_ID,
  email: USER_EMAIL,
  password: 'hashedPassword',
  displayName: 'Test User',
  avatarUrl: null,
  totalXP: 0,
  level: 1,
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    id: 'settings-id',
    userId: USER_ID,
    notificationsEnabled: true,
    weeklyResetDay: 0,
    timezone: 'UTC',
    theme: 'system',
    soundEnabled: true,
    hapticFeedbackEnabled: true,
    dailyReminderTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  categoryPriorities: [],
};

const mockSettings = {
  id: 'settings-id',
  userId: USER_ID,
  notificationsEnabled: true,
  weeklyResetDay: 0,
  timezone: 'UTC',
  theme: 'system',
  soundEnabled: true,
  hapticFeedbackEnabled: true,
  dailyReminderTime: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockBcrypt.compare.mockResolvedValue(true);
  mockPrisma.$transaction.mockResolvedValue([]);
});

// ===========================================================================
// GET /profile
// ===========================================================================
describe('GET /profile', () => {
  it('should return 200 with user profile (password excluded)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/profile')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', USER_ID);
    expect(res.body.data).toHaveProperty('email', USER_EMAIL);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data).toHaveProperty('settings');
  });

  it('should return 404 when the authenticated user does not exist in the DB', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/profile')
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// PUT /profile
// ===========================================================================
describe('PUT /profile', () => {
  it('should return 200 with updated profile when displayName is changed', async () => {
    const updated = { ...mockUser, displayName: 'Updated Name' };
    mockPrisma.user.update.mockResolvedValue(updated);

    const res = await request(app)
      .put('/profile')
      .set('Authorization', authHeader())
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Updated Name');
    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 200 with updated profile when avatarUrl is changed', async () => {
    const updated = { ...mockUser, avatarUrl: 'https://example.com/avatar.png' };
    mockPrisma.user.update.mockResolvedValue(updated);

    const res = await request(app)
      .put('/profile')
      .set('Authorization', authHeader())
      .send({ avatarUrl: 'https://example.com/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should return 200 with unchanged profile when no fields are provided', async () => {
    mockPrisma.user.update.mockResolvedValue(mockUser);

    const res = await request(app)
      .put('/profile')
      .set('Authorization', authHeader())
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it.each([
    ['displayName is too short', { displayName: 'A' }],
    ['displayName is too long', { displayName: 'A'.repeat(51) }],
    ['avatarUrl is not a valid URL', { avatarUrl: 'not-a-url' }],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', authHeader())
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .put('/profile')
      .send({ displayName: 'New Name' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// GET /settings
// ===========================================================================
describe('GET /settings', () => {
  it('should return 200 with settings', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

    const res = await request(app)
      .get('/settings')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('notificationsEnabled');
    expect(res.body.data).toHaveProperty('theme');
  });

  it('should return 404 when settings record does not exist', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/settings')
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/settings');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// PUT /settings
// ===========================================================================
describe('PUT /settings', () => {
  it('should return 200 with updated settings', async () => {
    const updated = { ...mockSettings, theme: 'dark', soundEnabled: false };
    mockPrisma.userSettings.update.mockResolvedValue(updated);

    const res = await request(app)
      .put('/settings')
      .set('Authorization', authHeader())
      .send({ theme: 'dark', soundEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe('dark');
  });

  it.each([
    ['theme is invalid', { theme: 'purple' }],
    ['weeklyResetDay is out of range', { weeklyResetDay: 7 }],
    ['notificationsEnabled is not boolean', { notificationsEnabled: 'yes' }],
    ['dailyReminderTime has wrong format', { dailyReminderTime: '25:00' }],
    ['soundEnabled is not boolean', { soundEnabled: 'maybe' }],
    ['hapticFeedbackEnabled is not boolean', { hapticFeedbackEnabled: 'nope' }],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app)
      .put('/settings')
      .set('Authorization', authHeader())
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).put('/settings').send({ theme: 'dark' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// GET /category-priorities
// ===========================================================================
describe('GET /category-priorities', () => {
  it('should return 200 with an array of category priorities', async () => {
    const priorities = [
      {
        id: 'prio-1',
        userId: USER_ID,
        category: 'physical_health',
        priority: 5,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockPrisma.categoryPriority.findMany.mockResolvedValue(priorities);

    const res = await request(app)
      .get('/category-priorities')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('physical_health');
  });

  it('should return 200 with an empty array when no priorities are set', async () => {
    mockPrisma.categoryPriority.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/category-priorities')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/category-priorities');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// PUT /category-priorities
// ===========================================================================
describe('PUT /category-priorities', () => {
  const validPriorities = [
    { category: 'physical_health', priority: 5, isEnabled: true },
    { category: 'mental_wellness', priority: 4, isEnabled: true },
  ];

  it('should return 200 with updated priorities', async () => {
    const createdRecords = validPriorities.map((p, i) => ({
      id: `prio-${i}`,
      userId: USER_ID,
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.categoryPriority.findMany.mockResolvedValue(createdRecords);

    const res = await request(app)
      .put('/category-priorities')
      .set('Authorization', authHeader())
      .send({ priorities: validPriorities });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it.each([
    [
      'priorities is not an array',
      { priorities: 'not-an-array' },
    ],
    [
      'category is invalid',
      { priorities: [{ category: 'invalid_category', priority: 3, isEnabled: true }] },
    ],
    [
      'priority is out of range',
      { priorities: [{ category: 'physical_health', priority: 0, isEnabled: true }] },
    ],
    [
      'isEnabled is not boolean',
      { priorities: [{ category: 'physical_health', priority: 3, isEnabled: 'yes' }] },
    ],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app)
      .put('/category-priorities')
      .set('Authorization', authHeader())
      .send(body);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .put('/category-priorities')
      .send({ priorities: validPriorities });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ===========================================================================
// DELETE /account
// ===========================================================================
describe('DELETE /account', () => {
  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .delete('/account')
      .send({ password: 'ValidPass1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 and delete the account when password is correct', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.$transaction.mockResolvedValue([]);

    const res = await request(app)
      .delete('/account')
      .set('Authorization', authHeader())
      .send({ password: 'ValidPass1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
  });

  it('should return 401 when the password is incorrect', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .delete('/account')
      .set('Authorization', authHeader())
      .send({ password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 422 when password field is missing', async () => {
    const res = await request(app)
      .delete('/account')
      .set('Authorization', authHeader())
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
