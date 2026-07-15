/**
 * Integration tests for /api/auth routes.
 *
 * Exercises the full request -> Hono route -> Prisma -> Postgres -> response
 * cycle with a real database (Docker Postgres on port 5433).
 */
import { buildAuthApp, registerUser, authHeader } from './helpers';
import { generateRefreshToken } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';

const app = buildAuthApp();

// ===========================================================================
// POST /api/auth/register
// ===========================================================================
describe('POST /api/auth/register', () => {
  it('should register a new user and return 201 with tokens', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'ValidPass1',
        displayName: 'New User',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.tokens).toHaveProperty('accessToken');
    expect(body.data.tokens).toHaveProperty('refreshToken');
    expect(body.data.tokens.expiresIn).toBe(900);
    expect(body.data.user.email).toBe('newuser@example.com');
    expect(body.data.user.password).toBeUndefined();

    // Verify user exists in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: 'newuser@example.com' },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.displayName).toBe('New User');
  });

  it('should create UserSettings alongside the user', async () => {
    await registerUser(app, { email: 'settings@example.com' });

    const user = await prisma.user.findUnique({
      where: { email: 'settings@example.com' },
      include: { settings: true },
    });

    expect(user!.settings).not.toBeNull();
    expect(user!.settings!.timezone).toBe('UTC');
    expect(user!.settings!.theme).toBe('system');
  });

  it('should return 409 when email is already registered', async () => {
    await registerUser(app, { email: 'duplicate@example.com' });

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'ValidPass1',
        displayName: 'Duplicate User',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CONFLICT');
  });

  it('should store the refresh token in the database', async () => {
    const registered = await registerUser(app, { email: 'tokencheck@example.com' });

    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: registered.userId },
    });

    expect(storedTokens.length).toBe(1);
    expect(storedTokens[0].token).toBe(registered.refreshToken);
    expect(storedTokens[0].revokedAt).toBeNull();
  });

  it.each([
    ['email is invalid', { email: 'not-an-email', password: 'ValidPass1', displayName: 'Test' }],
    ['password is too short', { email: 'a@b.com', password: 'Short1', displayName: 'Test' }],
    ['password has no uppercase', { email: 'a@b.com', password: 'alllower1', displayName: 'Test' }],
    ['password has no digit', { email: 'a@b.com', password: 'NoDigitPass', displayName: 'Test' }],
    ['displayName is too short', { email: 'a@b.com', password: 'ValidPass1', displayName: 'A' }],
    ['displayName is missing', { email: 'a@b.com', password: 'ValidPass1' }],
  ])('should return 422 when %s', async (_label, payload) => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// POST /api/auth/login
// ===========================================================================
describe('POST /api/auth/login', () => {
  it('should return 200 with tokens on valid credentials', async () => {
    await registerUser(app, {
      email: 'login@example.com',
      password: 'ValidPass1',
    });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'ValidPass1',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tokens).toHaveProperty('accessToken');
    expect(body.data.tokens).toHaveProperty('refreshToken');
    expect(body.data.user.email).toBe('login@example.com');
    expect(body.data.user.password).toBeUndefined();
  });

  it('should return 401 when user does not exist', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'ValidPass1',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when password is wrong', async () => {
    await registerUser(app, {
      email: 'wrongpass@example.com',
      password: 'ValidPass1',
    });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrongpass@example.com',
        password: 'WrongPassword1',
      }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// POST /api/auth/refresh-token
// ===========================================================================
describe('POST /api/auth/refresh-token', () => {
  it('should return 200 with new tokens when refresh token is valid', async () => {
    const registered = await registerUser(app, { email: 'refresh@example.com' });

    const res = await app.request('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: registered.refreshToken }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');
    expect(body.data.expiresIn).toBe(900);
    // New refresh token should differ from the old one
    expect(body.data.refreshToken).not.toBe(registered.refreshToken);
  });

  it('should revoke the old refresh token after rotation', async () => {
    const registered = await registerUser(app, { email: 'rotate@example.com' });

    await app.request('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: registered.refreshToken }),
    });

    // Old token should be revoked
    const oldToken = await prisma.refreshToken.findFirst({
      where: { token: registered.refreshToken },
    });
    expect(oldToken!.revokedAt).not.toBeNull();
  });

  it('should return 401 for an invalid JWT string', async () => {
    const res = await app.request('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'not.a.valid.jwt' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when token is not in the database', async () => {
    // Forge a valid JWT that isn't stored in the DB
    const fakeToken = generateRefreshToken(
      '550e8400-e29b-41d4-a716-446655440000',
      'fake@example.com'
    );

    const res = await app.request('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: fakeToken }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// POST /api/auth/logout
// ===========================================================================
describe('POST /api/auth/logout', () => {
  it('should revoke a specific refresh token', async () => {
    const registered = await registerUser(app, { email: 'logout@example.com' });

    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: authHeader(registered.accessToken),
      body: JSON.stringify({ refreshToken: registered.refreshToken }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify in DB
    const token = await prisma.refreshToken.findFirst({
      where: { token: registered.refreshToken },
    });
    expect(token!.revokedAt).not.toBeNull();
  });

  it('should revoke all refresh tokens when none specified', async () => {
    const registered = await registerUser(app, { email: 'logoutall@example.com' });

    // Create a second token via login
    await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logoutall@example.com', password: 'ValidPass1' }),
    });

    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: authHeader(registered.accessToken),
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);

    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: registered.userId, revokedAt: null },
    });
    expect(activeTokens.length).toBe(0);
  });

  it('should return 401 without Authorization header', async () => {
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ===========================================================================
// Full auth flow: register -> login -> refresh -> logout
// ===========================================================================
describe('Full auth flow', () => {
  it('should complete register -> login -> refresh -> logout cycle', async () => {
    // 1. Register
    const registerRes = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'fullflow@example.com',
        password: 'ValidPass1',
        displayName: 'Full Flow',
      }),
    });
    const registerBody = (await registerRes.json()) as any;
    expect(registerRes.status).toBe(201);

    // 2. Login
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'fullflow@example.com',
        password: 'ValidPass1',
      }),
    });
    const loginBody = (await loginRes.json()) as any;
    expect(loginRes.status).toBe(200);

    // 3. Refresh
    const refreshRes = await app.request('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: loginBody.data.tokens.refreshToken }),
    });
    const refreshBody = (await refreshRes.json()) as any;
    expect(refreshRes.status).toBe(200);

    // 4. Logout with the new access token
    const logoutRes = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: authHeader(registerBody.data.tokens.accessToken),
      body: JSON.stringify({ refreshToken: refreshBody.data.refreshToken }),
    });
    expect(logoutRes.status).toBe(200);

    // Verify all tokens are revoked
    const activeTokens = await prisma.refreshToken.findMany({
      where: {
        userId: registerBody.data.user.id,
        revokedAt: null,
        // Exclude the register token which was not targeted by specific logout
        token: { not: { startsWith: 'password_reset:' } },
      },
    });
    // Only the registration refresh token should remain un-revoked
    // (the logout targeted the refreshed token specifically)
    expect(activeTokens.length).toBe(1);
  });
});

// ===========================================================================
// POST /api/auth/forgot-password + reset-password
// ===========================================================================
describe('Password reset flow', () => {
  it('should complete forgot-password -> reset-password cycle', async () => {
    await registerUser(app, {
      email: 'reset@example.com',
      password: 'OldPassword1',
    });

    // 1. Forgot password
    const forgotRes = await app.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reset@example.com' }),
    });
    const forgotBody = (await forgotRes.json()) as any;
    expect(forgotRes.status).toBe(200);
    expect(forgotBody.data).toHaveProperty('resetToken');

    // 2. Reset password
    const resetRes = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotBody.data.resetToken,
        newPassword: 'NewPassword1',
      }),
    });
    const resetBody = (await resetRes.json()) as any;
    expect(resetRes.status).toBe(200);
    expect(resetBody.success).toBe(true);

    // 3. Login with new password should succeed
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reset@example.com',
        password: 'NewPassword1',
      }),
    });
    expect(loginRes.status).toBe(200);

    // 4. Login with old password should fail
    const oldLoginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reset@example.com',
        password: 'OldPassword1',
      }),
    });
    expect(oldLoginRes.status).toBe(401);
  });

  it('should return 200 for forgot-password on non-existent email (no leak)', async () => {
    const res = await app.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // No resetToken should be returned for non-existent email
    expect(body.data.resetToken).toBeUndefined();
  });
});
