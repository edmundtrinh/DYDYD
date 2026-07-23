import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import aiRoutes from '../../routes/ai';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userQuest: { findMany: jest.fn() },
    questCompletion: { findMany: jest.fn() },
  },
}));

jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Keep going, brave hero! Your streak grows stronger.' }],
  });
  const MockAnthropic = jest.fn().mockImplementation(() => ({ messages: { create } }));
  (MockAnthropic as any).__mockCreate = create;
  return { __esModule: true, default: MockAnthropic };
});

function getMockCreate(): jest.Mock {
  const { default: MockAnthropic } = jest.requireMock('@anthropic-ai/sdk');
  return (MockAnthropic as any).__mockCreate;
}

const app = new Hono();
app.route('/api/ai', aiRoutes);
app.onError((err, c) => errorHandler(err, c));

const USER_UUID = '00000000-0000-4000-a000-000000000200';

const validToken = jwt.sign(
  { userId: USER_UUID, email: 'test@example.com' },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

const mockUser = {
  totalXP: 450,
  level: 3,
  streakDays: 7,
  streakFreezes: 2,
};

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  (prisma.userQuest.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.questCompletion.findMany as jest.Mock).mockResolvedValue([]);
  getMockCreate().mockResolvedValue({
    content: [{ type: 'text', text: 'Keep going, brave hero! Your streak grows stronger.' }],
  });
});

describe('POST /api/ai/sprite', () => {
  it('returns a reply for a valid authenticated request', async () => {
    const res = await app.request('/api/ai/sprite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: 'How am I doing?' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(typeof body.data.reply).toBe('string');
    expect(body.data.reply.length).toBeGreaterThan(0);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/ai/sprite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    expect(res.status).toBe(401);
  });

  it.each([
    ['missing message', {}],
    ['empty message', { message: '' }],
    ['message too long', { message: 'x'.repeat(1001) }],
  ])('returns 422 for %s', async (_label, reqBody) => {
    const res = await app.request('/api/ai/sprite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(reqBody),
    });

    expect(res.status).toBe(422);
  });

  it('returns 404 when user does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await app.request('/api/ai/sprite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    expect(res.status).toBe(404);
  });

  it('parses SUGGESTED_QUESTS from Sprite response', async () => {
    getMockCreate().mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Great work!\nSUGGESTED_QUESTS:["quest-001","quest-002"]',
        },
      ],
    });

    const res = await app.request('/api/ai/sprite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ message: 'What should I do next?' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.suggestedQuestIds).toEqual(['quest-001', 'quest-002']);
    expect(body.data.reply).not.toContain('SUGGESTED_QUESTS');
  });
});
