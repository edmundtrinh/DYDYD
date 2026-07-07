import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validateBody } from '../middleware/validate';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticate,
} from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { AuthTokens, ApiResponse } from '@dydyd/shared';

type Env = {
  Variables: {
    validatedBody: unknown;
    userId: string;
    user: { id: string; email: string };
  };
};

const app = new Hono<Env>();

// Zod validation schemas
const registerSchema = z.object({
  email: z.string().email('Please provide a valid email').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be between 2 and 50 characters')
    .max(50, 'Display name must be between 2 and 50 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email').toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post('/register', validateBody(registerSchema), async (c) => {
  const { email, password, displayName } = c.get('validatedBody') as z.infer<typeof registerSchema>;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw Errors.conflict('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      displayName,
      settings: {
        create: {
          notificationsEnabled: true,
          weeklyResetDay: 0,
          timezone: 'UTC',
          theme: 'system',
          soundEnabled: true,
          hapticFeedbackEnabled: true,
        },
      },
    },
    include: {
      settings: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const response: ApiResponse<{ user: typeof user; tokens: AuthTokens }> = {
    success: true,
    data: {
      user: {
        ...user,
        password: undefined as any, // Remove password from response
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    },
  };

  return c.json(response, 201);
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
app.post('/login', validateBody(loginSchema), async (c) => {
  const { email, password } = c.get('validatedBody') as z.infer<typeof loginSchema>;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      settings: true,
    },
  });

  if (!user) {
    throw Errors.unauthorized('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw Errors.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const response: ApiResponse<{ user: typeof user; tokens: AuthTokens }> = {
    success: true,
    data: {
      user: {
        ...user,
        password: undefined as any,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    },
  };

  return c.json(response);
});

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
app.post('/refresh-token', validateBody(refreshSchema), async (c) => {
  const { refreshToken: token } = c.get('validatedBody') as z.infer<typeof refreshSchema>;

  // Verify refresh token — inner try/catch is load-bearing business logic
  // to map JWT errors to our UNAUTHORIZED error code
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Errors.unauthorized('Invalid or expired refresh token');
  }

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token,
      userId: payload.userId,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  });

  if (!storedToken) {
    throw Errors.unauthorized('Invalid or expired refresh token');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw Errors.unauthorized('User not found');
  }

  // Generate new tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id, user.email);

  // Revoke old token and create new one
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const response: ApiResponse<AuthTokens> = {
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    },
  };

  return c.json(response);
});

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
app.post('/logout', authenticate, async (c) => {
  const { refreshToken } = await c.req.json().catch(() => ({}));
  const userId = c.get('userId');

  if (refreshToken) {
    // Revoke the specific refresh token
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  return c.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

/**
 * POST /api/auth/forgot-password
 * Generate a password-reset token.
 * NOTE: In production this would send an email. For now we return the token
 * directly so front-end/tests can use it.
 */
app.post('/forgot-password', validateBody(forgotPasswordSchema), async (c) => {
  const { email } = c.get('validatedBody') as z.infer<typeof forgotPasswordSchema>;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to avoid leaking whether the email exists
  if (!user) {
    return c.json({
      success: true,
      data: { message: 'If that email exists, a reset link has been sent.' },
    } as ApiResponse<{ message: string }>);
  }

  // Generate a secure random token and an expiry (1 hour)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Revoke any existing unused reset tokens for this user before creating a new one,
  // so a previously requested (but unused) token cannot be replayed.
  await prisma.refreshToken.updateMany({
    where: {
      userId: user.id,
      token: { startsWith: 'password_reset:' },
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  // Store the hashed token on the user via Prisma's JSON-safe metadata
  // We reuse the RefreshToken table with a special prefix to avoid a
  // schema migration. The token column stores the hash, and we mark
  // the purpose by prefixing.
  await prisma.refreshToken.create({
    data: {
      token: `password_reset:${resetTokenHash}`,
      userId: user.id,
      expiresAt: resetExpiresAt,
    },
  });

  // In production, send resetToken via email. For now, return it.
  const response: ApiResponse<{ message: string; resetToken: string }> = {
    success: true,
    data: {
      message: 'If that email exists, a reset link has been sent.',
      resetToken, // DEV ONLY -- remove when email service is wired up
    },
  };

  return c.json(response);
});

/**
 * POST /api/auth/reset-password
 * Accept a reset token and a new password, then update the user's password.
 */
app.post('/reset-password', validateBody(resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.get('validatedBody') as z.infer<typeof resetPasswordSchema>;

  // Hash the provided token to compare with stored hash
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Look up the reset token
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: `password_reset:${tokenHash}`,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  });

  if (!storedToken) {
    throw Errors.badRequest('Invalid or expired reset token');
  }

  // Hash new password and update user
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: storedToken.userId },
      data: { password: hashedPassword },
    }),
    // Revoke the reset token so it cannot be reused
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),
    // Revoke all existing refresh tokens to force re-login
    prisma.refreshToken.updateMany({
      where: {
        userId: storedToken.userId,
        revokedAt: null,
        token: { not: { startsWith: 'password_reset:' } },
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Password has been reset successfully.' },
  };

  return c.json(response);
});

export default app;
