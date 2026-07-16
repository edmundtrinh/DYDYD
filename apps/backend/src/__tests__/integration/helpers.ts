/**
 * Shared helpers for integration tests.
 *
 * Every helper hits the real database through Prisma or the Hono app.
 */
import { Hono } from 'hono';
import authRoutes from '../../routes/auth';
import questRoutes from '../../routes/quests';
import userRoutes from '../../routes/user';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../lib/prisma';

// ---------------------------------------------------------------------------
// App builders — mount only the routes needed by a test suite
// ---------------------------------------------------------------------------

export function buildAuthApp(): Hono {
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  app.onError((err, c) => errorHandler(err, c));
  return app;
}

export function buildQuestsApp(): Hono {
  const app = new Hono();
  // Auth routes needed for register/login to get tokens
  app.route('/api/auth', authRoutes);
  app.route('/api/quests', questRoutes);
  app.onError((err, c) => errorHandler(err, c));
  return app;
}

export function buildUserApp(): Hono {
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  app.route('/api/user', userRoutes);
  app.onError((err, c) => errorHandler(err, c));
  return app;
}

/**
 * Combined app with auth + quests + user routes.
 * Useful for tests that span multiple domains (e.g., account deletion
 * after activating quests).
 */
export function buildFullApp(): Hono {
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  app.route('/api/quests', questRoutes);
  app.route('/api/user', userRoutes);
  app.onError((err, c) => errorHandler(err, c));
  return app;
}

// ---------------------------------------------------------------------------
// User registration helper — registers via the auth route, returns tokens
// ---------------------------------------------------------------------------

interface RegisteredUser {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a user through the real auth route and return the access token.
 * This ensures tokens are derived from a real DB user, not fabricated.
 */
export async function registerUser(
  app: Hono,
  overrides: {
    email?: string;
    password?: string;
    displayName?: string;
  } = {}
): Promise<RegisteredUser> {
  const email = overrides.email ?? 'integrationtest@example.com';
  const password = overrides.password ?? 'ValidPass1';
  const displayName = overrides.displayName ?? 'Integration Test User';

  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  const body = (await res.json()) as any;

  if (!body.success) {
    throw new Error(
      `registerUser failed: ${body.error?.message ?? JSON.stringify(body)}`
    );
  }

  return {
    userId: body.data.user.id,
    email,
    accessToken: body.data.tokens.accessToken,
    refreshToken: body.data.tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Quest seeding — creates a Quest row directly via Prisma
// ---------------------------------------------------------------------------

export async function seedQuest(
  overrides: {
    name?: string;
    category?: string;
    frequency?: string;
    baseXP?: number;
    isDefault?: boolean;
  } = {}
) {
  return prisma.quest.create({
    data: {
      name: overrides.name ?? 'Test Quest',
      description: 'A quest used in integration tests',
      category: overrides.category ?? 'physical_health',
      frequency: overrides.frequency ?? 'daily',
      baseXP: overrides.baseXP ?? 5,
      isDefault: overrides.isDefault ?? true,
      isCustom: false,
      iconName: 'star',
      maxCompletionsPerPeriod: 1,
    },
  });
}

// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------

export function authHeader(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}
