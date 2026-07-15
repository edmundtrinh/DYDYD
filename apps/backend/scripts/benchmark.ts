/**
 * DYDYD Backend API Benchmark Script
 *
 * Measures p50, p95, p99 response times and requests/second for all API endpoints.
 * Designed for local profiling — not CI.
 *
 * Usage:
 *   bun run scripts/benchmark.ts
 *   bun run scripts/benchmark.ts --base-url http://localhost:3000 --iterations 200
 *
 * Prerequisites:
 *   - Backend server running (yarn workspace @dydyd/backend dev)
 *   - A real database with seed data, OR the script will create a test user
 *
 * NOTE: The default rate limiter allows 100 requests per 15 minutes per IP.
 * For meaningful benchmarks, either:
 *   1. Set BENCHMARK_MODE=true on the server to bypass rate limiting
 *   2. Increase the rate limit for benchmarking
 *   3. Accept that only ~100 requests can be measured per run
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface BenchmarkConfig {
  baseUrl: string;
  iterations: number;
  warmupIterations: number;
  concurrency: number;
}

function parseArgs(): BenchmarkConfig {
  const args = process.argv.slice(2);
  const config: BenchmarkConfig = {
    baseUrl: 'http://localhost:3000',
    iterations: 50,
    warmupIterations: 3,
    concurrency: 1,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url':
        config.baseUrl = args[++i];
        break;
      case '--iterations':
        config.iterations = parseInt(args[++i], 10);
        break;
      case '--warmup':
        config.warmupIterations = parseInt(args[++i], 10);
        break;
      case '--concurrency':
        config.concurrency = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
DYDYD Backend Benchmark

Options:
  --base-url <url>      Server URL (default: http://localhost:3000)
  --iterations <n>      Requests per endpoint (default: 50)
  --warmup <n>          Warmup iterations (default: 3)
  --concurrency <n>     Concurrent requests (default: 1)
  --help                Show this help
`);
        process.exit(0);
    }
  }

  return config;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EndpointResult {
  endpoint: string;
  method: string;
  iterations: number;
  successCount: number;
  errorCount: number;
  timings: number[]; // ms
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
  reqPerSec: number;
}

interface BenchmarkReport {
  timestamp: string;
  config: BenchmarkConfig;
  serverInfo: Record<string, unknown> | null;
  results: EndpointResult[];
  totalDurationMs: number;
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeStats(timings: number[]): Pick<EndpointResult, 'p50' | 'p95' | 'p99' | 'min' | 'max' | 'mean'> {
  if (timings.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
  }
  const sorted = [...timings].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function timedFetch(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; durationMs: number; body: unknown }> {
  const start = performance.now();
  const res = await fetch(url, init);
  const durationMs = performance.now() - start;
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, durationMs, body };
}

// ---------------------------------------------------------------------------
// Auth setup
// ---------------------------------------------------------------------------

interface AuthContext {
  accessToken: string;
  userId: string;
  email: string;
  password: string;
}

async function setupAuth(baseUrl: string): Promise<AuthContext> {
  const email = `benchmark-${Date.now()}@test.local`;
  const password = 'BenchmarkPass1';
  const displayName = 'Benchmark User';

  // Register
  const registerRes = await timedFetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (registerRes.status === 201 || registerRes.status === 200) {
    const data = registerRes.body as any;
    return {
      accessToken: data.data.tokens.accessToken,
      userId: data.data.user.id,
      email,
      password,
    };
  }

  // If registration fails (user exists), try login
  const loginRes = await timedFetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (loginRes.status === 200) {
    const data = loginRes.body as any;
    return {
      accessToken: data.data.tokens.accessToken,
      userId: data.data.user.id,
      email,
      password,
    };
  }

  throw new Error(
    `Auth setup failed. Register status: ${registerRes.status}, Login status: ${loginRes.status}. ` +
    `Is the server running at ${baseUrl}?`,
  );
}

/**
 * Find a valid quest ID by fetching the user's quests.
 * Returns undefined if no quests are available (endpoint may not have seed data).
 */
async function findQuestId(baseUrl: string, token: string): Promise<string | undefined> {
  const res = await timedFetch(`${baseUrl}/api/quests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) return undefined;
  const data = res.body as any;
  const quests = data?.data?.quests ?? data?.data ?? [];
  if (Array.isArray(quests) && quests.length > 0) {
    return quests[0].id;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------

async function benchmarkEndpoint(
  name: string,
  method: string,
  url: string,
  config: BenchmarkConfig,
  init?: RequestInit,
): Promise<EndpointResult> {
  const timings: number[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    await timedFetch(url, init);
  }

  // Measured iterations
  const totalStart = performance.now();

  for (let i = 0; i < config.iterations; i++) {
    try {
      const { status, durationMs } = await timedFetch(url, init);
      timings.push(durationMs);
      if (status >= 200 && status < 400) {
        successCount++;
      } else if (status === 429) {
        // Rate limited — stop early, results are partial
        console.warn(`  [WARN] Rate limited at iteration ${i + 1}/${config.iterations}`);
        errorCount++;
        break;
      } else {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
    }
  }

  const totalDurationMs = performance.now() - totalStart;
  const stats = computeStats(timings);
  const reqPerSec = timings.length > 0 ? (timings.length / totalDurationMs) * 1000 : 0;

  return {
    endpoint: name,
    method,
    iterations: timings.length,
    successCount,
    errorCount,
    timings,
    ...stats,
    reqPerSec,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function formatTable(results: EndpointResult[]): string {
  const header = [
    'Endpoint'.padEnd(35),
    'Method'.padEnd(7),
    'N'.padStart(5),
    'OK'.padStart(5),
    'Err'.padStart(5),
    'p50(ms)'.padStart(10),
    'p95(ms)'.padStart(10),
    'p99(ms)'.padStart(10),
    'min(ms)'.padStart(10),
    'max(ms)'.padStart(10),
    'mean(ms)'.padStart(10),
    'req/s'.padStart(10),
  ].join(' | ');

  const separator = '-'.repeat(header.length);

  const rows = results.map((r) =>
    [
      r.endpoint.padEnd(35),
      r.method.padEnd(7),
      String(r.iterations).padStart(5),
      String(r.successCount).padStart(5),
      String(r.errorCount).padStart(5),
      r.p50.toFixed(2).padStart(10),
      r.p95.toFixed(2).padStart(10),
      r.p99.toFixed(2).padStart(10),
      r.min.toFixed(2).padStart(10),
      r.max.toFixed(2).padStart(10),
      r.mean.toFixed(2).padStart(10),
      r.reqPerSec.toFixed(1).padStart(10),
    ].join(' | '),
  );

  return [separator, header, separator, ...rows, separator].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = parseArgs();

  console.log('=== DYDYD Backend Benchmark ===');
  console.log(`Target: ${config.baseUrl}`);
  console.log(`Iterations per endpoint: ${config.iterations}`);
  console.log(`Warmup: ${config.warmupIterations}`);
  console.log('');

  // Check server is reachable
  let serverInfo: Record<string, unknown> | null = null;
  try {
    const health = await timedFetch(`${config.baseUrl}/health`);
    if (health.status !== 200) {
      console.error(`Server health check returned ${health.status}. Is the server running?`);
      process.exit(1);
    }
    serverInfo = health.body as Record<string, unknown>;
    console.log('Server health:', JSON.stringify(serverInfo, null, 2));
  } catch (err) {
    console.error(`Cannot reach server at ${config.baseUrl}. Is it running?`);
    process.exit(1);
  }

  console.log('\nSetting up auth...');
  const auth = await setupAuth(config.baseUrl);
  console.log(`Authenticated as user ${auth.userId}\n`);

  const authHeaders = {
    Authorization: `Bearer ${auth.accessToken}`,
    'Content-Type': 'application/json',
  };

  // Find a valid quest ID for the complete endpoint
  const questId = await findQuestId(config.baseUrl, auth.accessToken);
  if (questId) {
    console.log(`Found quest ID for benchmarking: ${questId}`);
  } else {
    console.log('No quests found — /api/quests/:id/complete will be skipped');
  }

  console.log('\nRunning benchmarks...\n');

  const totalStart = performance.now();
  const results: EndpointResult[] = [];

  // 1. Health check (no auth)
  console.log('Benchmarking: GET /health');
  results.push(
    await benchmarkEndpoint('GET /health', 'GET', `${config.baseUrl}/health`, config),
  );

  // 2. Register (no auth) — each iteration creates a unique user
  console.log('Benchmarking: POST /api/auth/register');
  {
    let registerIter = 0;
    const registerTimings: number[] = [];
    let registerSuccess = 0;
    let registerError = 0;

    // Warmup
    for (let i = 0; i < config.warmupIterations; i++) {
      await timedFetch(`${config.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `bench-warmup-${Date.now()}-${i}@test.local`,
          password: 'BenchmarkPass1',
          displayName: 'Bench Warmup',
        }),
      });
    }

    const regStart = performance.now();
    for (let i = 0; i < config.iterations; i++) {
      try {
        const { status, durationMs } = await timedFetch(`${config.baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `bench-reg-${Date.now()}-${registerIter++}@test.local`,
            password: 'BenchmarkPass1',
            displayName: 'Bench User',
          }),
        });
        registerTimings.push(durationMs);
        if (status >= 200 && status < 400) registerSuccess++;
        else if (status === 429) {
          console.warn(`  [WARN] Rate limited at iteration ${i + 1}`);
          registerError++;
          break;
        } else registerError++;
      } catch { registerError++; }
    }
    const regDuration = performance.now() - regStart;
    const regStats = computeStats(registerTimings);
    results.push({
      endpoint: 'POST /api/auth/register',
      method: 'POST',
      iterations: registerTimings.length,
      successCount: registerSuccess,
      errorCount: registerError,
      timings: registerTimings,
      ...regStats,
      reqPerSec: registerTimings.length > 0 ? (registerTimings.length / regDuration) * 1000 : 0,
    });
  }

  // 3. Login (no auth) — uses the registered benchmark user for realistic bcrypt timing
  console.log('Benchmarking: POST /api/auth/login');
  results.push(
    await benchmarkEndpoint(
      'POST /api/auth/login',
      'POST',
      `${config.baseUrl}/api/auth/login`,
      config,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.email,
          password: auth.password,
        }),
      },
    ),
  );

  // 3. GET /api/quests (authenticated)
  console.log('Benchmarking: GET /api/quests');
  results.push(
    await benchmarkEndpoint('GET /api/quests', 'GET', `${config.baseUrl}/api/quests`, config, {
      headers: authHeaders,
    }),
  );

  // 4. POST /api/quests/:id/complete (authenticated, requires valid quest)
  if (questId) {
    console.log('Benchmarking: POST /api/quests/:id/complete');
    results.push(
      await benchmarkEndpoint(
        'POST /api/quests/:id/complete',
        'POST',
        `${config.baseUrl}/api/quests/${questId}/complete`,
        config,
        {
          method: 'POST',
          headers: authHeaders,
        },
      ),
    );
  }

  // 5. GET /api/progress (authenticated)
  console.log('Benchmarking: GET /api/progress');
  results.push(
    await benchmarkEndpoint('GET /api/progress', 'GET', `${config.baseUrl}/api/progress`, config, {
      headers: authHeaders,
    }),
  );

  // 6. GET /api/badges (authenticated)
  console.log('Benchmarking: GET /api/badges');
  results.push(
    await benchmarkEndpoint('GET /api/badges', 'GET', `${config.baseUrl}/api/badges`, config, {
      headers: authHeaders,
    }),
  );

  // 7. GET /api/user/profile (authenticated)
  console.log('Benchmarking: GET /api/user/profile');
  results.push(
    await benchmarkEndpoint(
      'GET /api/user/profile',
      'GET',
      `${config.baseUrl}/api/user/profile`,
      config,
      { headers: authHeaders },
    ),
  );

  // 8. GET /api/notifications (authenticated)
  console.log('Benchmarking: GET /api/notifications');
  results.push(
    await benchmarkEndpoint(
      'GET /api/notifications',
      'GET',
      `${config.baseUrl}/api/notifications`,
      config,
      { headers: authHeaders },
    ),
  );

  const totalDurationMs = performance.now() - totalStart;

  // Output results
  console.log('\n' + formatTable(results));
  console.log(`\nTotal benchmark duration: ${(totalDurationMs / 1000).toFixed(2)}s`);

  // Write JSON report
  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    config,
    serverInfo,
    results: results.map(({ timings, ...rest }) => ({ ...rest, timings: [] })), // Omit raw timings from report
    totalDurationMs,
  };

  const reportPath = 'benchmark-results.json';
  const reportContent = JSON.stringify(report, null, 2);

  if (typeof Bun !== 'undefined') {
    await Bun.write(reportPath, reportContent);
  } else {
    const fs = await import('node:fs/promises');
    await fs.writeFile(reportPath, reportContent, 'utf-8');
  }

  console.log(`\nJSON report written to: ${reportPath}`);

  // Performance budget check
  console.log('\n=== Performance Budget Check ===');
  const budgetMs = 200;
  let budgetViolations = 0;
  for (const r of results) {
    const status = r.p95 <= budgetMs ? 'PASS' : 'FAIL';
    if (status === 'FAIL') budgetViolations++;
    console.log(`  ${status}: ${r.endpoint} p95=${r.p95.toFixed(2)}ms (budget: ${budgetMs}ms)`);
  }

  if (budgetViolations > 0) {
    console.log(`\n${budgetViolations} endpoint(s) exceeded the ${budgetMs}ms p95 budget.`);
  } else {
    console.log(`\nAll endpoints within ${budgetMs}ms p95 budget.`);
  }
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
