import { Hono } from 'hono';
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

import userRoutes from '../../routes/user';
import { errorHandler } from '../../middleware/errorHandler';
import { generateAccessToken } from '../../middleware/auth';

// ---------------------------------------------------------------------------
// Test app
// ---------------------------------------------------------------------------
function buildApp() {
  const app = new Hono();
  app.route('/', userRoutes);
  app.onError((err, c) => errorHandler(err, c));
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

    const res = await app.request('/profile', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id', USER_ID);
    expect(body.data).toHaveProperty('email', USER_EMAIL);
    expect(body.data.password).toBeUndefined();
    expect(body.data).toHaveProperty('settings');
  });

  it('should return 404 when the authenticated user does not exist in the DB', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await app.request('/profile', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/profile');
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// PUT /profile
// ===========================================================================
describe('PUT /profile', () => {
  it('should return 200 with updated profile when displayName is changed', async () => {
    const updated = { ...mockUser, displayName: 'Updated Name' };
    mockPrisma.user.update.mockResolvedValue(updated);

    const res = await app.request('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ displayName: 'Updated Name' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe('Updated Name');
    expect(body.data.password).toBeUndefined();
  });

  it('should return 200 with updated profile when avatarUrl is changed', async () => {
    const updated = { ...mockUser, avatarUrl: 'https://example.com/avatar.png' };
    mockPrisma.user.update.mockResolvedValue(updated);

    const res = await app.request('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ avatarUrl: 'https://example.com/avatar.png' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should return 200 with unchanged profile when no fields are provided', async () => {
    mockPrisma.user.update.mockResolvedValue(mockUser);

    const res = await app.request('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({}),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it.each([
    ['displayName is too short', { displayName: 'A' }],
    ['displayName is too long', { displayName: 'A'.repeat(51) }],
    ['avatarUrl is not a valid URL', { avatarUrl: 'not-a-url' }],
  ])('should return 422 when %s', async (_label, reqBody) => {
    const res = await app.request('/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify(reqBody),
    });
    const body: any = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'New Name' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

// ===========================================================================
// GET /settings
// ===========================================================================
describe('GET /settings', () => {
  it('should return 200 with settings', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

    const res = await app.request('/settings', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('notificationsEnabled');
    expect(body.data).toHaveProperty('theme');
  });

  it('should return 404 when settings record does not exist', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValue(null);

    const res = await app.request('/settings', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/settings');
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

// ===========================================================================
// PUT /settings
// ===========================================================================
describe('PUT /settings', () => {
  it('should return 200 with updated settings', async () => {
    const updated = { ...mockSettings, theme: 'dark', soundEnabled: false };
    mockPrisma.userSettings.update.mockResolvedValue(updated);

    const res = await app.request('/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ theme: 'dark', soundEnabled: false }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.theme).toBe('dark');
  });

  it.each([
    ['theme is invalid', { theme: 'purple' }],
    ['weeklyResetDay is out of range', { weeklyResetDay: 7 }],
    ['notificationsEnabled is not boolean', { notificationsEnabled: 'yes' }],
    ['dailyReminderTime has wrong format', { dailyReminderTime: '25:00' }],
    ['soundEnabled is not boolean', { soundEnabled: 'maybe' }],
    ['hapticFeedbackEnabled is not boolean', { hapticFeedbackEnabled: 'nope' }],
  ])('should return 422 when %s', async (_label, reqBody) => {
    const res = await app.request('/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify(reqBody),
    });
    const body: any = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'dark' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
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

    const res = await app.request('/category-priorities', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].category).toBe('physical_health');
  });

  it('should return 200 with an empty array when no priorities are set', async () => {
    mockPrisma.categoryPriority.findMany.mockResolvedValue([]);

    const res = await app.request('/category-priorities', {
      headers: { Authorization: authHeader() },
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/category-priorities');
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
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

    const res = await app.request('/category-priorities', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ priorities: validPriorities }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
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
  ])('should return 422 when %s', async (_label, reqBody) => {
    const res = await app.request('/category-priorities', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify(reqBody),
    });
    const body: any = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/category-priorities', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priorities: validPriorities }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

// ===========================================================================
// DELETE /account
// ===========================================================================
describe('DELETE /account', () => {
  it('should return 401 when no Authorization header is provided', async () => {
    const res = await app.request('/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'ValidPass1' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 and delete the account when password is correct', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.$transaction.mockResolvedValue([]);

    const res = await app.request('/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ password: 'ValidPass1' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });

  it('should return 401 when the password is incorrect', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await app.request('/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({ password: 'WrongPassword' }),
    });
    const body: any = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 422 when password field is missing', async () => {
    const res = await app.request('/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify({}),
    });
    const body: any = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
