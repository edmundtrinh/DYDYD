import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export type AuthEnv = {
  Variables: {
    userId: string;
    user: { id: string; email: string };
  };
};

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
    : 'your-secret-key-change-in-production'
);

export const authenticate = async (c: Context, next: Next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    throw new AppError('No authorization header provided', 401, 'UNAUTHORIZED');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Invalid authorization header format', 401, 'UNAUTHORIZED');
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    c.set('userId', decoded.userId);
    c.set('user', { id: decoded.userId, email: decoded.email });

    await next();
  } catch (jwtError) {
    if (jwtError instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401, 'UNAUTHORIZED');
    }
    if (jwtError instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
    }
    throw jwtError;
  }
};

export const optionalAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    await next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    await next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    c.set('userId', decoded.userId);
    c.set('user', { id: decoded.userId, email: decoded.email });
  } catch {
    // Token invalid or expired, continue without user
  }

  await next();
};

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: 900 }
  );
};

export const generateRefreshToken = (userId: string, email: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || (
    process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('JWT_REFRESH_SECRET must be set in production'); })()
      : 'your-refresh-secret-change-in-production'
  );
  return jwt.sign(
    { userId, email, jti: randomUUID() },
    refreshSecret,
    { expiresIn: 604800 }
  );
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || (
    process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('JWT_REFRESH_SECRET must be set in production'); })()
      : 'your-refresh-secret-change-in-production'
  );
  return jwt.verify(token, refreshSecret) as JwtPayload;
};
