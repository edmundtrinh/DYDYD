const { execSync } = require('child_process');

/**
 * Global setup for integration tests.
 *
 * Runs once before all test suites. Applies Prisma migrations to the
 * test database so the schema is ready. Uses `prisma migrate deploy`
 * (production-safe, no interactive prompts) rather than `migrate dev`.
 *
 * This file is plain JS because Jest's globalSetup runs outside the
 * ts-jest transform pipeline and would require a standalone `ts-node`
 * install to process .ts files (only ts-node-dev is installed).
 */
module.exports = async function globalSetup() {
  // Default to the local Docker Compose test DB; CI overrides via env
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://test:test@localhost:5433/dydyd_test';

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';

  console.log('\n[integration] Running Prisma migrations...');

  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/../../..', // apps/backend/
    env: Object.assign({}, process.env),
    stdio: 'inherit',
  });

  console.log('[integration] Migrations applied.\n');
};
