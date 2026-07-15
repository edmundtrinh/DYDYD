import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request Prisma query metrics tracked via AsyncLocalStorage.
 *
 * The performance middleware calls `runWithMetrics()` to create an isolated
 * metrics store for each request. The global `$on('query')` listener in
 * `prisma.ts` increments counters in that store, so concurrent requests
 * never cross-contaminate.
 */

export interface RequestMetrics {
  queryCount: number;
  totalQueryMs: number;
  slowQueries: SlowQuery[];
}

export interface SlowQuery {
  query: string;
  params: string;
  durationMs: number;
  timestamp: number;
}

/** Threshold in ms above which a query is considered "slow". */
const DEFAULT_SLOW_QUERY_THRESHOLD_MS = 100;

export const SLOW_QUERY_THRESHOLD_MS = parseInt(
  process.env.SLOW_QUERY_THRESHOLD_MS || String(DEFAULT_SLOW_QUERY_THRESHOLD_MS),
  10,
);

/**
 * AsyncLocalStorage instance shared between the perf middleware and the
 * Prisma event listener. Each in-flight request gets its own store.
 */
export const metricsStorage = new AsyncLocalStorage<RequestMetrics>();

/** Create a fresh metrics store for the current request. */
export function createRequestMetrics(): RequestMetrics {
  return { queryCount: 0, totalQueryMs: 0, slowQueries: [] };
}

/**
 * Record a query event into the current request's metrics store.
 * Called from the Prisma `$on('query')` listener.
 * No-ops gracefully when there is no active store (e.g. queries outside
 * an HTTP request context, or when perf logging is disabled).
 */
export function recordQueryEvent(durationMs: number, query: string, params: string): void {
  const store = metricsStorage.getStore();
  if (!store) return;

  store.queryCount++;
  store.totalQueryMs += durationMs;

  if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
    store.slowQueries.push({
      query,
      params,
      durationMs,
      timestamp: Date.now(),
    });
  }
}

/** Retrieve the current request's metrics (or undefined if none). */
export function getRequestMetrics(): RequestMetrics | undefined {
  return metricsStorage.getStore();
}
