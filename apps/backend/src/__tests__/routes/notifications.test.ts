import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import notificationRoutes from '../../routes/notifications';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    deviceToken: {
      upsert: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const app = new Hono();
app.route('/api/notifications', notificationRoutes);
app.onError((err, c) => errorHandler(err, c));

const USER_UUID = '00000000-0000-4000-a000-000000000100';
const NOTIF_UUID = '00000000-0000-4000-a000-000000000a01';

const validToken = jwt.sign(
  { userId: USER_UUID },
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/notifications/device-token', () => {
  const validBody = {
    token: 'ExponentPushToken[xxxxxxx]',
    platform: 'ios',
    deviceName: 'iPhone 15 Pro',
  };

  it('should register a device token', async () => {
    const mockDeviceToken = {
      id: 'dt-1',
      userId: USER_UUID,
      ...validBody,
      lastActive: new Date(),
      createdAt: new Date(),
    };
    (prisma.deviceToken.upsert as jest.Mock).mockResolvedValue(mockDeviceToken);

    const res = await app.request('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validBody),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
      where: { token: validBody.token },
      update: expect.objectContaining({
        userId: USER_UUID,
        platform: 'ios',
        deviceName: 'iPhone 15 Pro',
      }),
      create: expect.objectContaining({
        userId: USER_UUID,
        token: validBody.token,
        platform: 'ios',
        deviceName: 'iPhone 15 Pro',
      }),
    });
  });

  it('should register without optional deviceName', async () => {
    (prisma.deviceToken.upsert as jest.Mock).mockResolvedValue({});

    const res = await app.request('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'some-token', platform: 'android' }),
    });

    expect(res.status).toBe(201);
  });

  it('should accept all valid platforms', async () => {
    const platforms = ['ios', 'android', 'watchos', 'wear_os', 'tizen', 'garmin'];

    for (const platform of platforms) {
      (prisma.deviceToken.upsert as jest.Mock).mockResolvedValue({});

      const res = await app.request('/api/notifications/device-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: `token-${platform}`, platform }),
      });

      expect(res.status).toBe(201);
    }
  });

  it('should return 422 when token is missing', async () => {
    const res = await app.request('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform: 'ios' }),
    });

    expect(res.status).toBe(422);
  });

  it('should return 422 when platform is invalid', async () => {
    const res = await app.request('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'some-token', platform: 'windows' }),
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/notifications', () => {
  const mockNotifications = [
    {
      id: NOTIF_UUID,
      userId: USER_UUID,
      type: 'badge_earned',
      title: 'Badge Earned!',
      body: 'You earned First Steps',
      data: { badgeId: 'badge-1' },
      scheduledFor: null,
      sentAt: new Date(),
      readAt: null,
      createdAt: new Date(),
    },
  ];

  it('should return paginated notifications', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
    (prisma.notification.count as jest.Mock).mockResolvedValue(1);

    const res = await app.request('/api/notifications', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta).toEqual({
      page: 1,
      perPage: 20,
      total: 1,
      hasMore: false,
    });
  });

  it('should respect page and perPage params', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(50);

    const res = await app.request('/api/notifications?page=2&perPage=10', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.meta.page).toBe(2);
    expect(body.meta.perPage).toBe(10);
    expect(body.meta.hasMore).toBe(true);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('should clamp perPage to max 100', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(0);

    const res = await app.request('/api/notifications?perPage=500', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.meta.perPage).toBe(100);
  });

  it('should default to page 1 and perPage 20', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(0);

    const res = await app.request('/api/notifications', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.meta.page).toBe(1);
    expect(body.meta.perPage).toBe(20);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  const unreadNotification = {
    id: NOTIF_UUID,
    userId: USER_UUID,
    type: 'badge_earned',
    title: 'Badge Earned!',
    body: 'You earned First Steps',
    readAt: null,
    createdAt: new Date(),
  };

  it('should mark notification as read', async () => {
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(unreadNotification);
    (prisma.notification.update as jest.Mock).mockResolvedValue({
      ...unreadNotification,
      readAt: new Date(),
    });

    const res = await app.request(`/api/notifications/${NOTIF_UUID}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: NOTIF_UUID },
      data: { readAt: expect.any(Date) },
    });
  });

  it('should return already-read notification without updating', async () => {
    const alreadyRead = { ...unreadNotification, readAt: new Date() };
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(alreadyRead);

    const res = await app.request(`/api/notifications/${NOTIF_UUID}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(200);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('should return 404 when notification not found', async () => {
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await app.request(`/api/notifications/${NOTIF_UUID}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(404);
  });

  it('should return 422 when id is not a valid UUID', async () => {
    const res = await app.request('/api/notifications/not-a-uuid/read', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });

    expect(res.status).toBe(422);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await app.request(`/api/notifications/${NOTIF_UUID}/read`, {
      method: 'PUT',
    });

    expect(res.status).toBe(401);
  });
});
