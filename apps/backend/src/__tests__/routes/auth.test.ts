import express from 'express';
import request from 'supertest';
import { mockPrisma } from '../helpers/prisma';

// Module-level mocks — must be declared before any imports that consume them.
// Jest hoists jest.mock() calls, so the `mockPrisma` reference is safe.
jest.mock('../../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock bcryptjs. The route uses `import bcrypt from 'bcryptjs'` (default import),
// so we expose both a default export and top-level keys for interop safety.
const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
};
jest.mock('bcryptjs', () => ({
  ...mockBcrypt,
  default: mockBcrypt,
}));

// Import after mocks are registered so the route module picks up mocked deps.
import authRouter from '../../routes/auth';
import { errorHandler } from '../../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken } from '../../middleware/auth';

// ---------------------------------------------------------------------------
// Test app — one isolated Express instance per suite, only the route under
// test + the error handler (mirrors the CLAUDE.md testing pattern).
// ---------------------------------------------------------------------------
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', authRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_EMAIL = 'test@example.com';

const mockUser = {
  id: USER_ID,
  email: USER_EMAIL,
  password: 'hashedPassword',
  displayName: 'Test User',
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
  },
};

const mockRefreshTokenRecord = {
  id: 'token-record-id',
  userId: USER_ID,
  token: 'stored-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Re-apply default mock behaviour after clearAllMocks wipes implementations.
  mockBcrypt.hash.mockResolvedValue('hashedPassword');
  mockBcrypt.compare.mockResolvedValue(true);
  mockPrisma.$transaction.mockResolvedValue([]);
});

// ===========================================================================
// POST /register
// ===========================================================================
describe('POST /register', () => {
  it('should register a new user and return 201 with tokens', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);

    const res = await request(app).post('/register').send({
      email: 'new@example.com',
      password: 'ValidPass1',
      displayName: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('tokens');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.tokens.expiresIn).toBe(900);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 409 when email is already registered', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post('/register').send({
      email: 'existing@example.com',
      password: 'ValidPass1',
      displayName: 'Existing User',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    [
      'email is invalid',
      { email: 'not-an-email', password: 'ValidPass1', displayName: 'Test' },
    ],
    [
      'password is too short',
      { email: 'test@example.com', password: 'Short1', displayName: 'Test' },
    ],
    [
      'password has no uppercase letter',
      { email: 'test@example.com', password: 'alllower1', displayName: 'Test' },
    ],
    [
      'password has no digit',
      { email: 'test@example.com', password: 'NoDigitPass', displayName: 'Test' },
    ],
    [
      'displayName is too short',
      { email: 'test@example.com', password: 'ValidPass1', displayName: 'A' },
    ],
    [
      'displayName is missing',
      { email: 'test@example.com', password: 'ValidPass1' },
    ],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app).post('/register').send(body);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// POST /login
// ===========================================================================
describe('POST /login', () => {
  it('should return 200 with tokens on valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);

    const res = await request(app).post('/login').send({
      email: USER_EMAIL,
      password: 'ValidPass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 401 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/login').send({
      email: 'unknown@example.com',
      password: 'ValidPass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when password is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await request(app).post('/login').send({
      email: USER_EMAIL,
      password: 'WrongPassword1',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each([
    ['email is invalid', { email: 'bad-email', password: 'somepass' }],
    ['email is missing', { password: 'somepass' }],
    ['password is missing', { email: USER_EMAIL }],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app).post('/login').send(body);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// POST /refresh-token
// ===========================================================================
describe('POST /refresh-token', () => {
  it('should return 200 with new tokens when refresh token is valid', async () => {
    const realRefreshToken = generateRefreshToken(USER_ID, USER_EMAIL);

    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      ...mockRefreshTokenRecord,
      token: realRefreshToken,
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.$transaction.mockResolvedValue([]);

    const res = await request(app).post('/refresh-token').send({
      refreshToken: realRefreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.expiresIn).toBe(900);
  });

  it('should return 401 when the refresh token is an invalid string', async () => {
    const res = await request(app).post('/refresh-token').send({
      refreshToken: 'this.is.not.a.valid.jwt',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when the refresh token is not in the database', async () => {
    const realRefreshToken = generateRefreshToken(USER_ID, USER_EMAIL);
    mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/refresh-token').send({
      refreshToken: realRefreshToken,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when the user referenced in the token no longer exists', async () => {
    const realRefreshToken = generateRefreshToken(USER_ID, USER_EMAIL);

    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      ...mockRefreshTokenRecord,
      token: realRefreshToken,
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/refresh-token').send({
      refreshToken: realRefreshToken,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 422 when refreshToken field is missing', async () => {
    const res = await request(app).post('/refresh-token').send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// POST /logout
// ===========================================================================
describe('POST /logout', () => {
  it('should return 200 and revoke a specific refresh token', async () => {
    const accessToken = generateAccessToken(USER_ID, USER_EMAIL);
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: 'some-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Logged out successfully');
  });

  it('should return 200 and revoke all refresh tokens when none is specified', async () => {
    const accessToken = generateAccessToken(USER_ID, USER_EMAIL);
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post('/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/logout').send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when an invalid Bearer token is provided', async () => {
    const res = await request(app)
      .post('/logout')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// POST /forgot-password
// ===========================================================================
describe('POST /forgot-password', () => {
  it('should return 200 with a reset token when the email exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);

    const res = await request(app).post('/forgot-password').send({
      email: USER_EMAIL,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('reset');
    // Dev-mode: token is returned directly
    expect(res.body.data).toHaveProperty('resetToken');
  });

  it('should return 200 with the same message even when the email does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/forgot-password').send({
      email: 'unknown@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('reset');
    // Ensure we don't leak whether the email exists
    expect(res.body.data.resetToken).toBeUndefined();
  });

  it.each([
    ['email is invalid', { email: 'not-an-email' }],
    ['email is missing', {}],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app).post('/forgot-password').send(body);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// POST /reset-password
// ===========================================================================
describe('POST /reset-password', () => {
  it('should return 200 and update the password when token is valid', async () => {
    const rawToken = 'a'.repeat(64); // 32 bytes hex = 64 chars
    // Simulate a stored record (the route hashes the raw token before lookup)
    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      ...mockRefreshTokenRecord,
      token: `password_reset:somehash`,
    });
    mockBcrypt.hash.mockResolvedValue('newHashedPassword');
    mockPrisma.$transaction.mockResolvedValue([]);

    const res = await request(app).post('/reset-password').send({
      token: rawToken,
      newPassword: 'NewValidPass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('reset');
  });

  it('should return 400 when the token is not found in the database', async () => {
    mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/reset-password').send({
      token: 'a'.repeat(64),
      newPassword: 'NewValidPass1',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it.each([
    [
      'token field is missing',
      { newPassword: 'NewValidPass1' },
    ],
    [
      'newPassword is too short',
      { token: 'a'.repeat(64), newPassword: 'Short1' },
    ],
    [
      'newPassword has no uppercase letter',
      { token: 'a'.repeat(64), newPassword: 'nouppercase1' },
    ],
    [
      'newPassword has no digit',
      { token: 'a'.repeat(64), newPassword: 'NoDigitPass' },
    ],
  ])('should return 422 when %s', async (_label, body) => {
    const res = await request(app).post('/reset-password').send(body);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
