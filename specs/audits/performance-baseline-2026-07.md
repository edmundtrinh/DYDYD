# Performance Baseline — July 2026

## Profiling Infrastructure

### Performance Middleware (`src/middleware/performance.ts`)

- **Activation**: `ENABLE_PERF_LOGGING=true` environment variable (default: off)
- **Mechanism**: Hono middleware using `AsyncLocalStorage` to isolate per-request metrics
- **Captures per request**:
  - Total response time (ms)
  - HTTP method, path, status code
  - Prisma query count
  - Total Prisma query time (ms)
  - Individual slow queries (above configurable threshold)

### Prisma Query Metrics (`src/lib/prisma-metrics.ts`)

- **Query event emission**: Prisma client configured with `{ emit: 'event', level: 'query' }` when perf logging is enabled
- **Per-request attribution**: `AsyncLocalStorage` ensures query counts are not cross-contaminated between concurrent requests
- **Slow query threshold**: Configurable via `SLOW_QUERY_THRESHOLD_MS` (default: 100ms)
- **Zero overhead when disabled**: No ALS context created, no event listeners active

### Benchmark Script (`scripts/benchmark.ts`)

- **Runner**: `bun run scripts/benchmark.ts`
- **Measures**: p50, p95, p99 response times, min, max, mean, requests/second
- **Endpoints benchmarked**:
  - `GET /health` (no auth)
  - `POST /api/auth/login` (no auth)
  - `GET /api/quests` (authenticated)
  - `POST /api/quests/:id/complete` (authenticated, requires valid quest)
  - `GET /api/progress` (authenticated)
  - `GET /api/badges` (authenticated)
  - `GET /api/user/profile` (authenticated)
  - `GET /api/notifications` (authenticated)
- **Output**: Formatted table to stdout + `benchmark-results.json`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ENABLE_PERF_LOGGING` | `false` | Enable performance middleware and Prisma query event logging |
| `SLOW_QUERY_THRESHOLD_MS` | `100` | Threshold (ms) above which queries are flagged as slow |
| `BENCHMARK_MODE` | not used | Reserved for future rate-limit bypass during benchmarking |

## Performance Budget

Target p95 response times for API endpoints:

| Category | Budget | Rationale |
|---|---|---|
| Health check | < 10ms | Static response, no DB |
| Auth endpoints | < 300ms | bcrypt hashing is intentionally slow (12 rounds) |
| Read endpoints (GET) | < 200ms | Single DB query + serialization |
| Write endpoints (POST) | < 300ms | Transaction + possible cascade |

### Budget Exceptions

- `POST /api/auth/register` and `POST /api/auth/login` include bcrypt operations (~200-300ms) which dominate response time. This is by design for security.
- `POST /api/quests/:id/complete` may involve streak calculations and badge checks, potentially requiring multiple queries.

## Baseline Measurements

> **To be filled** — Run `yarn workspace @dydyd/backend perf:benchmark` against a local PostgreSQL instance with seed data and paste results here.

```
Endpoint                            | Method | N     | p50(ms) | p95(ms) | p99(ms) | req/s
------------------------------------|--------|-------|---------|---------|---------|------
GET /health                         | GET    |       |         |         |         |
POST /api/auth/register             | POST   |       |         |         |         |
POST /api/auth/login                | POST   |       |         |         |         |
GET /api/quests                     | GET    |       |         |         |         |
POST /api/quests/:id/complete       | POST   |       |         |         |         |
GET /api/progress                   | GET    |       |         |         |         |
GET /api/badges                     | GET    |       |         |         |         |
GET /api/user/profile               | GET    |       |         |         |         |
GET /api/notifications              | GET    |       |         |         |         |
```

## Verification Status

**Per-request query attribution has not yet been verified against a live database.** The AsyncLocalStorage-based mechanism relies on Prisma's `$on('query')` event callback inheriting the ALS context from the request that triggered the query. While this is expected to work in both Node.js and Bun (both support ALS propagation through event emitters), it must be confirmed with a real PostgreSQL connection. Until verified:

- The middleware structure, timing, and logging are confirmed working via unit tests.
- Query counts (`queries: N`) in `[PERF]` log lines may show `0` if ALS context is lost in the `$on` callback.
- Verification steps: start the server with `ENABLE_PERF_LOGGING=true` and a real database, send concurrent authenticated requests, confirm `[PERF]` lines show nonzero query counts that are correctly attributed (no cross-contamination).

## Known Caveats

1. **Rate limiting**: The default rate limiter (100 req/15min per IP) will throttle benchmark runs. For meaningful measurements, temporarily increase the limit or bypass it for the benchmark client.

2. **Cold start**: The first few requests after server start incur Prisma connection pool warmup. The benchmark includes configurable warmup iterations (default: 3) to mitigate this.

3. **Local vs production**: Local benchmarks do not reflect production latency (network hops, connection pooling, load balancer overhead). Use these numbers for relative comparisons and regression detection, not absolute SLA targets.

4. **AsyncLocalStorage overhead**: ALS adds ~0.01ms per request on Bun. This is negligible but measurable at very high throughput. When `ENABLE_PERF_LOGGING=false`, ALS is not used at all.

## Next Steps

- [ ] Run initial baseline against local PostgreSQL with seed data
- [ ] Add benchmark results to CI as a non-blocking check (track regressions)
- [ ] Wire Redis caching and measure improvement on read-heavy endpoints
- [ ] Add database connection pool metrics (Prisma `$metrics`)
- [ ] Consider `Prisma.$metrics` (preview feature) for built-in connection/query histograms
