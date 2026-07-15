import { Context, Next } from 'hono';
import {
  metricsStorage,
  createRequestMetrics,
  getRequestMetrics,
  SLOW_QUERY_THRESHOLD_MS,
} from '../lib/prisma-metrics';

/**
 * Performance profiling middleware for Hono.
 *
 * When `ENABLE_PERF_LOGGING=true`:
 * - Wraps each request in an AsyncLocalStorage context so Prisma query
 *   events are attributed to the correct request.
 * - Logs response time, status, Prisma query count, and total query time.
 * - Logs individual slow queries (above the configurable threshold).
 *
 * When disabled (default): complete no-op — no ALS context, no timing,
 * no logging overhead.
 */
export const performanceMiddleware = () => {
  const enabled = process.env.ENABLE_PERF_LOGGING === 'true';

  return async (c: Context, next: Next) => {
    if (!enabled) {
      await next();
      return;
    }

    const metrics = createRequestMetrics();
    const startTime = performance.now();

    // Run the rest of the middleware/route chain inside the ALS context
    // so Prisma query events are attributed to this request.
    await metricsStorage.run(metrics, async () => {
      await next();
    });

    const durationMs = performance.now() - startTime;
    const method = c.req.method;
    const path = c.req.path;
    const status = c.res.status;

    const requestMetrics = metrics; // Already captured via closure

    // Main request log line
    console.log(
      `[PERF] ${method} ${path} ${status} | ` +
      `${durationMs.toFixed(2)}ms | ` +
      `queries: ${requestMetrics.queryCount} (${requestMetrics.totalQueryMs.toFixed(2)}ms)`,
    );

    // Log slow queries for this request
    if (requestMetrics.slowQueries.length > 0) {
      for (const sq of requestMetrics.slowQueries) {
        console.warn(
          `[PERF:SLOW_QUERY] ${sq.durationMs.toFixed(2)}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms) | ` +
          `${sq.query} | params: ${sq.params}`,
        );
      }
    }
  };
};
