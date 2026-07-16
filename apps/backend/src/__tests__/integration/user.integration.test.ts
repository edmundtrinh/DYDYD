/**
 * Integration tests for /api/user routes.
 *
 * Exercises profile CRUD, settings, category priorities, and account
 * deletion cascade against a real Postgres database.
 */
import {
  buildUserApp,
  buildFullApp,
  registerUser,
  seedQuest,
  authHeader,
} from './helpers';
import { prisma } from '../../lib/prisma';

const app = buildUserApp();

// ===========================================================================
// GET /api/user/profile
// ===========================================================================
describe('GET /api/user/profile', () => {
  it('should return the authenticated user profile without password', async () => {
    const user = await registerUser(app, {
      email: 'profile@example.com',
      displayName: 'Profile User',
    });

    const res = await app.request('/api/user/profile', {
      headers: authHeader(user.accessToken),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('profile@example.com');
    expect(body.data.displayName).toBe('Profile User');
    expect(body.data.password).toBeUndefined();
    expect(body.data.settings).not.toBeNull();
  });

  it('should return 401 without auth', async () => {
    const res = await app.request('/api/user/profile');
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// PUT /api/user/profile
// ===========================================================================
describe('PUT /api/user/profile', () => {
  it('should update displayName', async () => {
    const user = await registerUser(app, { email: 'update@example.com' });

    const res = await app.request('/api/user/profile', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ displayName: 'Updated Name' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.displayName).toBe('Updated Name');

    // Verify in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    expect(dbUser!.displayName).toBe('Updated Name');
  });

  it('should reject displayName shorter than 2 characters', async () => {
    const user = await registerUser(app, { email: 'shortname@example.com' });

    const res = await app.request('/api/user/profile', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ displayName: 'A' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// GET /api/user/settings
// ===========================================================================
describe('GET /api/user/settings', () => {
  it('should return the user settings created during registration', async () => {
    const user = await registerUser(app, { email: 'getsettings@example.com' });

    const res = await app.request('/api/user/settings', {
      headers: authHeader(user.accessToken),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.notificationsEnabled).toBe(true);
    expect(body.data.timezone).toBe('UTC');
    expect(body.data.theme).toBe('system');
  });
});

// ===========================================================================
// PUT /api/user/settings
// ===========================================================================
describe('PUT /api/user/settings', () => {
  it('should update settings and persist to the database', async () => {
    const user = await registerUser(app, { email: 'putsettings@example.com' });

    const res = await app.request('/api/user/settings', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        theme: 'dark',
        timezone: 'America/New_York',
        notificationsEnabled: false,
        dailyReminderTime: '08:30',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.theme).toBe('dark');
    expect(body.data.timezone).toBe('America/New_York');
    expect(body.data.notificationsEnabled).toBe(false);
    expect(body.data.dailyReminderTime).toBe('08:30');

    // Verify in DB
    const dbSettings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    });
    expect(dbSettings!.theme).toBe('dark');
  });

  it.each([
    ['invalid theme', { theme: 'rainbow' }],
    ['invalid dailyReminderTime', { dailyReminderTime: '25:00' }],
    ['invalid weeklyResetDay', { weeklyResetDay: 7 }],
  ])('should return 422 when %s', async (_label, payload) => {
    const user = await registerUser(app, {
      email: `settings-${_label.replace(/\s/g, '')}@example.com`,
    });

    const res = await app.request('/api/user/settings', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// Category Priorities
// ===========================================================================
describe('Category Priorities', () => {
  it('should set and retrieve category priorities', async () => {
    const user = await registerUser(app, { email: 'priorities@example.com' });

    const priorities = [
      { category: 'physical_health', priority: 5, isEnabled: true },
      { category: 'mental_wellness', priority: 4, isEnabled: true },
      { category: 'career_productivity', priority: 3, isEnabled: true },
      { category: 'relationships_social', priority: 2, isEnabled: false },
      { category: 'home_chores', priority: 1, isEnabled: true },
    ];

    // PUT
    const putRes = await app.request('/api/user/category-priorities', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ priorities }),
    });
    const putBody = (await putRes.json()) as any;

    expect(putRes.status).toBe(200);
    expect(putBody.data.length).toBe(5);

    // GET
    const getRes = await app.request('/api/user/category-priorities', {
      headers: authHeader(user.accessToken),
    });
    const getBody = (await getRes.json()) as any;

    expect(getRes.status).toBe(200);
    expect(getBody.data.length).toBe(5);
    // Ordered by priority desc
    expect(getBody.data[0].category).toBe('physical_health');
  });

  it('should replace all priorities on a second PUT', async () => {
    const user = await registerUser(app, { email: 'replace@example.com' });

    // First set
    await app.request('/api/user/category-priorities', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        priorities: [
          { category: 'physical_health', priority: 5, isEnabled: true },
          { category: 'mental_wellness', priority: 3, isEnabled: true },
        ],
      }),
    });

    // Second set — completely replaces the first
    const res = await app.request('/api/user/category-priorities', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        priorities: [
          { category: 'home_chores', priority: 1, isEnabled: false },
        ],
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.data[0].category).toBe('home_chores');

    // Verify old priorities are gone
    const dbPriorities = await prisma.categoryPriority.findMany({
      where: { userId: user.userId },
    });
    expect(dbPriorities.length).toBe(1);
  });
});

// ===========================================================================
// DELETE /api/user/account
// ===========================================================================
describe('DELETE /api/user/account', () => {
  it('should delete the user and all associated data', async () => {
    // Use a combined app since we need both quest and user routes
    const combinedApp = buildFullApp();

    const user = await registerUser(combinedApp, {
      email: 'delete@example.com',
      password: 'ValidPass1',
    });

    // Create some associated data
    const quest = await seedQuest({ name: 'Delete Test Quest' });

    // Activate quest
    await combinedApp.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });

    // Set category priorities
    await combinedApp.request('/api/user/category-priorities', {
      method: 'PUT',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        priorities: [
          { category: 'physical_health', priority: 5, isEnabled: true },
        ],
      }),
    });

    // Delete account
    const res = await combinedApp.request('/api/user/account', {
      method: 'DELETE',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ password: 'ValidPass1' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.deleted).toBe(true);

    // Verify cascade — user and all related records gone
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    expect(dbUser).toBeNull();

    const dbSettings = await prisma.userSettings.findFirst({
      where: { userId: user.userId },
    });
    expect(dbSettings).toBeNull();

    const dbPriorities = await prisma.categoryPriority.findMany({
      where: { userId: user.userId },
    });
    expect(dbPriorities.length).toBe(0);

    const dbUserQuests = await prisma.userQuest.findMany({
      where: { userId: user.userId },
    });
    expect(dbUserQuests.length).toBe(0);

    const dbTokens = await prisma.refreshToken.findMany({
      where: { userId: user.userId },
    });
    expect(dbTokens.length).toBe(0);
  });

  it('should return 401 when password is wrong', async () => {
    const user = await registerUser(app, {
      email: 'wrongdel@example.com',
      password: 'ValidPass1',
    });

    const res = await app.request('/api/user/account', {
      method: 'DELETE',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ password: 'WrongPassword1' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
