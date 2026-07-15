import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';
import { performanceMiddleware } from './middleware/performance';
import authRoutes from './routes/auth';
import questRoutes from './routes/quests';
import userRoutes from './routes/user';
import progressRoutes from './routes/progress';
import badgeRoutes from './routes/badges';
import notificationRoutes from './routes/notifications';
import healthRoutes from './routes/health';
import streakRoutes from './routes/streaks';

dotenv.config();

const app = new Hono();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security
app.use('*', secureHeaders());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || (
    process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('CORS_ORIGIN must be set in production'); })()
      : '*'
  ),
  credentials: true,
}));

// Rate limiting on API routes
app.use('/api/*', rateLimiter(15 * 60 * 1000, 100));

// Compression
app.use('*', compress());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use('*', logger());
}

// Performance profiling (after logger, before routes)
// Active only when ENABLE_PERF_LOGGING=true
app.use('*', performanceMiddleware());

// Global error handler
app.onError((err, c) => {
  return errorHandler(err, c);
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/quests', questRoutes);
app.route('/api/user', userRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/badges', badgeRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/streaks', streakRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  }, 404);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  const isBun = typeof globalThis.Bun !== 'undefined';
  if (isBun) {
    Bun.serve({ fetch: app.fetch, port: PORT });
    console.log(`DYDYD Backend running on port ${PORT} (Bun)`);
  } else {
    import('@hono/node-server').then(({ serve }) => {
      serve({ fetch: app.fetch, port: PORT }, () => {
        console.log(`DYDYD Backend running on port ${PORT} (Node.js)`);
      });
    });
  }
  console.log(`Health check: http://localhost:${PORT}/health`);
}

export default app;
