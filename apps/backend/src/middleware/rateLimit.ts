import { Context, Next } from 'hono';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();

    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = { count: 1, resetTime: now + windowMs };
    } else {
      store[ip].count++;
    }

    if (store[ip].count > max) {
      return c.json(
        { error: 'Too many requests, please try again later.' },
        429
      );
    }

    await next();
  };
};
