/**
 * Per-suite setup for integration tests.
 *
 * Loaded via `setupFilesAfterEnv` in jest.integration.config.js.
 * Sets environment variables and wires up beforeEach/afterAll hooks
 * for database cleanup and Prisma client lifecycle.
 */

// Set env before any app code is imported
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.DATABASE_URL ??=
  'postgresql://test:test@localhost:5433/dydyd_test';

import { prisma } from '../../lib/prisma';

/**
 * Truncate all application tables, preserving _prisma_migrations.
 * Uses a single TRUNCATE ... RESTART IDENTITY CASCADE statement
 * for speed and referential-integrity safety.
 */
export async function truncateAllTables(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const tableList = tables
    .map((t) => `"${t.tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE ${tableList} RESTART IDENTITY CASCADE`
  );
}

// Clean slate before every test
beforeEach(async () => {
  await truncateAllTables();
});

// Disconnect Prisma after all tests in this worker
afterAll(async () => {
  await prisma.$disconnect();
});
