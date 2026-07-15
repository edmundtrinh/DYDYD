/**
 * Integration tests for /api/quests routes.
 *
 * Exercises quest CRUD, activation, completion with XP/streak updates
 * against a real Postgres database.
 */
import {
  buildQuestsApp,
  registerUser,
  seedQuest,
  authHeader,
} from './helpers';
import { prisma } from '../../lib/prisma';

const app = buildQuestsApp();

// ===========================================================================
// GET /api/quests/library
// ===========================================================================
describe('GET /api/quests/library', () => {
  it('should return an empty library when no quests are seeded', async () => {
    const res = await app.request('/api/quests/library');
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('should return seeded default quests', async () => {
    await seedQuest({ name: 'Morning Walk', category: 'physical_health' });
    await seedQuest({ name: 'Read 20 Pages', category: 'mental_wellness' });

    const res = await app.request('/api/quests/library');
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
    expect(body.data.map((q: any) => q.name)).toContain('Morning Walk');
    expect(body.data.map((q: any) => q.name)).toContain('Read 20 Pages');
  });
});

// ===========================================================================
// POST /api/quests/activate
// ===========================================================================
describe('POST /api/quests/activate', () => {
  it('should activate a quest for the authenticated user', async () => {
    const user = await registerUser(app, { email: 'activate@example.com' });
    const quest = await seedQuest({ name: 'Activate Quest' });

    const res = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.questId).toBe(quest.id);
    expect(body.data.isActive).toBe(true);

    // Verify in DB
    const userQuest = await prisma.userQuest.findFirst({
      where: { userId: user.userId, questId: quest.id },
    });
    expect(userQuest).not.toBeNull();
    expect(userQuest!.isActive).toBe(true);
  });

  it('should return 409 when quest is already activated', async () => {
    const user = await registerUser(app, { email: 'dupactivate@example.com' });
    const quest = await seedQuest({ name: 'Dup Activate Quest' });

    // First activation
    await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });

    // Second activation should conflict
    const res = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('CONFLICT');
  });

  it('should return 404 when quest does not exist', async () => {
    const user = await registerUser(app, { email: 'noquest@example.com' });

    const res = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should reactivate a previously deactivated quest', async () => {
    const user = await registerUser(app, { email: 'reactivate@example.com' });
    const quest = await seedQuest({ name: 'Reactivate Quest' });

    // Activate
    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    // Deactivate
    await app.request(`/api/quests/${userQuestId}`, {
      method: 'DELETE',
      headers: authHeader(user.accessToken),
    });

    // Reactivate
    const reactivateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const reactivateBody = (await reactivateRes.json()) as any;

    expect(reactivateRes.status).toBe(200);
    expect(reactivateBody.data.isActive).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const quest = await seedQuest();

    const res = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: quest.id }),
    });

    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// POST /api/quests/:id/complete
// ===========================================================================
describe('POST /api/quests/:id/complete', () => {
  it('should complete a quest and award XP', async () => {
    const user = await registerUser(app, { email: 'complete@example.com' });
    const quest = await seedQuest({ name: 'Complete Quest', baseXP: 5 });

    // Activate
    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    // Complete
    const completeRes = await app.request(`/api/quests/${userQuestId}/complete`, {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ source: 'manual' }),
    });
    const completeBody = (await completeRes.json()) as any;

    expect(completeRes.status).toBe(201);
    expect(completeBody.success).toBe(true);
    expect(completeBody.data.xpEarned).toBe(5);
    expect(completeBody.data.userQuest.totalCompletions).toBe(1);

    // Verify user XP updated in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    expect(dbUser!.totalXP).toBe(5);
  });

  it('should increment streak on completion', async () => {
    const user = await registerUser(app, { email: 'streak@example.com' });
    const quest = await seedQuest({ name: 'Streak Quest', baseXP: 3 });

    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    // Complete
    const completeRes = await app.request(`/api/quests/${userQuestId}/complete`, {
      method: 'POST',
      headers: authHeader(user.accessToken),
    });
    const completeBody = (await completeRes.json()) as any;

    expect(completeBody.data.userQuest.currentStreak).toBe(1);
    expect(completeBody.data.userQuest.longestStreak).toBe(1);
  });

  it('should reject completion beyond maxCompletionsPerPeriod', async () => {
    const user = await registerUser(app, { email: 'maxcomplete@example.com' });
    const quest = await seedQuest({ name: 'Once-a-day Quest', baseXP: 2 });

    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    // First completion
    await app.request(`/api/quests/${userQuestId}/complete`, {
      method: 'POST',
      headers: authHeader(user.accessToken),
    });

    // Second completion should fail (maxCompletionsPerPeriod defaults to 1)
    const secondRes = await app.request(`/api/quests/${userQuestId}/complete`, {
      method: 'POST',
      headers: authHeader(user.accessToken),
    });
    const secondBody = (await secondRes.json()) as any;

    expect(secondRes.status).toBe(400);
    expect(secondBody.error.code).toBe('BAD_REQUEST');
  });

  it('should return 404 for a non-existent user quest', async () => {
    const user = await registerUser(app, { email: 'noquest2@example.com' });

    const res = await app.request(
      '/api/quests/550e8400-e29b-41d4-a716-446655440000/complete',
      {
        method: 'POST',
        headers: authHeader(user.accessToken),
      }
    );
    const body = (await res.json()) as any;

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should record completion with optional value and notes', async () => {
    const user = await registerUser(app, { email: 'notes@example.com' });
    const quest = await seedQuest({ name: 'Notes Quest' });

    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    const completeRes = await app.request(`/api/quests/${userQuestId}/complete`, {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        value: 10000,
        source: 'apple_health',
        notes: 'Great walk today!',
      }),
    });
    const completeBody = (await completeRes.json()) as any;

    expect(completeRes.status).toBe(201);

    // Verify in DB
    const completion = await prisma.questCompletion.findFirst({
      where: { userQuestId },
    });
    expect(completion!.value).toBe(10000);
    expect(completion!.source).toBe('apple_health');
    expect(completion!.notes).toBe('Great walk today!');
  });
});

// ===========================================================================
// DELETE /api/quests/:id
// ===========================================================================
describe('DELETE /api/quests/:id', () => {
  it('should deactivate a user quest', async () => {
    const user = await registerUser(app, { email: 'deactivate@example.com' });
    const quest = await seedQuest({ name: 'Deactivate Quest' });

    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;
    const userQuestId = activateBody.data.id;

    const deleteRes = await app.request(`/api/quests/${userQuestId}`, {
      method: 'DELETE',
      headers: authHeader(user.accessToken),
    });
    const deleteBody = (await deleteRes.json()) as any;

    expect(deleteRes.status).toBe(200);
    expect(deleteBody.success).toBe(true);

    // Verify in DB
    const userQuest = await prisma.userQuest.findUnique({
      where: { id: userQuestId },
    });
    expect(userQuest!.isActive).toBe(false);
  });

  it('should return 404 for non-existent user quest', async () => {
    const user = await registerUser(app, { email: 'delmissing@example.com' });

    const res = await app.request(
      '/api/quests/550e8400-e29b-41d4-a716-446655440000',
      {
        method: 'DELETE',
        headers: authHeader(user.accessToken),
      }
    );
    const body = (await res.json()) as any;

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// POST /api/quests/custom
// ===========================================================================
describe('POST /api/quests/custom', () => {
  it('should create a custom quest and auto-activate it', async () => {
    const user = await registerUser(app, { email: 'custom@example.com' });

    const res = await app.request('/api/quests/custom', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        name: 'My Custom Quest',
        description: 'Test custom quest',
        category: 'mental_wellness',
        frequency: 'daily',
        baseXP: 3,
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.quest.name).toBe('My Custom Quest');
    expect(body.data.quest.isCustom).toBe(true);
    expect(body.data.quest.createdById).toBe(user.userId);
    expect(body.data.isActive).toBe(true);
  });

  it('should enforce the free-tier custom quest limit (3)', async () => {
    const user = await registerUser(app, { email: 'limit@example.com' });

    // Create 3 custom quests
    for (let i = 1; i <= 3; i++) {
      const res = await app.request('/api/quests/custom', {
        method: 'POST',
        headers: authHeader(user.accessToken),
        body: JSON.stringify({
          name: `Custom Quest ${i}`,
          category: 'physical_health',
          frequency: 'daily',
          baseXP: 1,
        }),
      });
      expect(res.status).toBe(201);
    }

    // 4th should fail
    const res = await app.request('/api/quests/custom', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({
        name: 'Custom Quest 4',
        category: 'physical_health',
        frequency: 'daily',
        baseXP: 1,
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toContain('Maximum custom quests');
  });
});

// ===========================================================================
// GET /api/quests/user
// ===========================================================================
describe('GET /api/quests/user', () => {
  it('should return only the authenticated user active quests', async () => {
    const user = await registerUser(app, { email: 'myquests@example.com' });
    const quest1 = await seedQuest({ name: 'Active Quest 1' });
    const quest2 = await seedQuest({ name: 'Active Quest 2' });

    // Activate both
    await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest1.id }),
    });
    await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest2.id }),
    });

    const res = await app.request('/api/quests/user', {
      headers: authHeader(user.accessToken),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(2);
  });

  it('should not include deactivated quests', async () => {
    const user = await registerUser(app, { email: 'inactive@example.com' });
    const quest = await seedQuest({ name: 'Will Deactivate' });

    const activateRes = await app.request('/api/quests/activate', {
      method: 'POST',
      headers: authHeader(user.accessToken),
      body: JSON.stringify({ questId: quest.id }),
    });
    const activateBody = (await activateRes.json()) as any;

    // Deactivate
    await app.request(`/api/quests/${activateBody.data.id}`, {
      method: 'DELETE',
      headers: authHeader(user.accessToken),
    });

    const res = await app.request('/api/quests/user', {
      headers: authHeader(user.accessToken),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.length).toBe(0);
  });
});
