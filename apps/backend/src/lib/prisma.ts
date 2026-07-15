import { Prisma, PrismaClient } from '@prisma/client';
import { recordQueryEvent } from './prisma-metrics';

// Prevent multiple instances in development due to hot reload
declare global {
  var prisma: PrismaClient | undefined;
}

const isPerfEnabled = process.env.ENABLE_PERF_LOGGING === 'true';
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

/**
 * Build Prisma log configuration.
 * - In test: minimal logging (errors only, no events)
 * - When perf logging enabled: emit query events for metrics collection
 * - In development: stdout logging for queries + event emission for metrics
 * - In production: errors only, plus optional event emission for perf
 */
function buildLogConfig(): Array<Prisma.LogLevel | Prisma.LogDefinition> {
  if (isTest) {
    return ['error'];
  }

  if (isPerfEnabled) {
    // Emit query events so the $on('query') listener can capture them.
    // Also keep human-readable dev logging in development.
    const config: Array<Prisma.LogLevel | Prisma.LogDefinition> = [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ];
    if (isDev) {
      config.push({ emit: 'stdout', level: 'query' });
    }
    return config;
  }

  // Default: same as before
  return isDev ? ['query', 'error', 'warn'] : ['error'];
}

export const prisma =
  global.prisma ||
  new PrismaClient({ log: buildLogConfig() });

// Register the query event listener for performance metrics.
// Guard: only when perf is enabled and the client supports $on (not mocked in tests).
if (isPerfEnabled && !isTest && typeof prisma.$on === 'function') {
  (prisma as any).$on('query', (e: { duration: number; query: string; params: string }) => {
    recordQueryEvent(e.duration, e.query, e.params);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
