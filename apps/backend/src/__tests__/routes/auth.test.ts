import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../middleware/auth';
import authRoutes from '../../routes/auth';
import { errorHandler } from '../../middleware/errorHandler';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../middleware/auth', () => {
  const actual = jest.requireActual('../../middleware/auth');
  return {
    ...actual,
    generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    verifyRefreshToken: jest.fn(),
  };
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: 'hashed-password',
  displayName: 'Test User',
  totalXP: 0,
  level: 1,
  isPremium: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  settings: {
    id: 'settings-123',
    userId: 'user-123',
    notificationsEnabled: true,
    weeklyResetDay: 0,
    timezone: 'UTC',
    theme: 'system',
    soundEnabled: true,
    hapticFeedbackEnabled: true,
  },
};

const validRegisterPayload = {
  email: 'test@example.com',
  password: 'Password1',
  displayName: 'Test User',
};

const validLoginPayload = {
  email: 'test@example.com',
  password: 'Password1',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('should create a new user and return tokens', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBe('mock-access-token');
    expect(res.body.data.tokens.refreshToken).toBe('mock-refresh-token');
    expect(res.body.data.tokens.expiresIn).toBe(900);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('should return 409 when email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should return 422 for an invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterPayload, email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('email');
  });

  it('should return 422 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterPayload, password: 'Ab1' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('password');
  });

  it('should return 422 when password lacks uppercase, lowercase, or digit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterPayload, password: 'alllowercase' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('password');
  });

  it('should return 422 when displayName is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('displayName');
  });

  it('should return 422 when all fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('email');
    expect(res.body.error.details).toHaveProperty('password');
    expect(res.body.error.details).toHaveProperty('displayName');
  });
});

describe('POST /api/auth/login', () => {
  it('should authenticate and return user with tokens', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBe('mock-access-token');
    expect(res.body.data.tokens.refreshToken).toBe('mock-refresh-token');
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 401 for a non-existent email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginPayload);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 401 for an incorrect password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginPayload);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password1' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('email');
  });

  it('should return 422 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('password');
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should issue new token pair for a valid refresh token', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
      id: 'rt-1',
      token: 'old-refresh-token',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'old-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('mock-access-token');
    expect(res.body.data.refreshToken).toBe('mock-refresh-token');
    expect(res.body.data.expiresIn).toBe(900);
  });

  it('should return 401 when the refresh token is cryptographically invalid', async () => {
    (verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'bad-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid or expired refresh token');
  });

  it('should return 401 when the refresh token is not found in the database', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'revoked-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid or expired refresh token');
  });

  it('should return 401 when the user no longer exists', async () => {
    (verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
      id: 'rt-1',
      token: 'some-token',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'some-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('User not found');
  });

  it('should return 422 when refreshToken field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('refreshToken');
  });
});

describe('POST /api/auth/logout', () => {
  const validAccessToken = jwt.sign(
    { userId: 'user-123', email: 'test@example.com' },
    process.env.JWT_SECRET!,
    { expiresIn: 900 }
  );

  it('should revoke a specific refresh token when provided', async () => {
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .send({ refreshToken: 'some-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Logged out successfully');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token: 'some-refresh-token',
        }),
      })
    );
  });

  it('should revoke all refresh tokens when no specific token is provided', async () => {
    (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validAccessToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          revokedAt: null,
        }),
      })
    );
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'some-token' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should return a reset token for an existing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resetToken).toBeDefined();
    expect(typeof res.body.data.resetToken).toBe('string');
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: expect.stringContaining('password_reset:'),
          userId: 'user-123',
        }),
      })
    );
  });

  it('should return success even when the email does not exist', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('reset link has been sent');
    expect(res.body.data.resetToken).toBeUndefined();
  });

  it('should return 422 for an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-valid' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('email');
  });
});

describe('POST /api/auth/reset-password', () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  it('should reset the password and revoke all tokens', async () => {
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
      id: 'rt-reset-1',
      token: `password_reset:${tokenHash}`,
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 3600000),
      revokedAt: null,
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'NewPassword1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Password has been reset successfully.');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when the reset token is invalid or expired', async () => {
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'NewPassword1' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid or expired reset token');
  });

  it('should return 422 when the token field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'NewPassword1' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('token');
  });

  it('should return 422 when newPassword does not meet complexity requirements', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'weak' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveProperty('newPassword');
  });
});
