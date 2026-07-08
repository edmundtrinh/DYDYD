# ADR-011: Migrate Backend from Express to Hono with Bun Runtime

**Status:** Accepted
**Date:** 2026-07-07
**Deciders:** Founder (Edmund Trinh)

## Context

The backend was built on Express 4, which served well during initial development but presented growing friction:

1. **Express 4 is in maintenance mode.** No new features are being developed. Express 5 has been in alpha for years and is not a reliable upgrade path.
2. **express-validator requires manual type synchronization.** Validation schemas and TypeScript types were maintained separately, creating drift risk. Adding a field to the Prisma schema required updating the validator chain, the route handler types, and the shared package types independently.
3. **supertest adds testing overhead.** Each test spun up an HTTP server, made a real network request, and tore it down -- adding latency and complexity to the 166-test suite. Test failures sometimes reflected HTTP/network issues rather than application logic.
4. **Node.js startup and throughput.** For the same workload, Node.js has slower cold start and lower request throughput than Bun, which matters for development iteration speed and future edge deployment.
5. **A consultant review (July 2026) recommended all three migrations** -- framework, validator, and runtime -- as a cohesive modernization step rather than incremental changes.

## Decision

Migrate the backend stack in one coordinated change:

1. **Replace Express 4 with Hono.** Hono is a lightweight, edge-ready framework with built-in middleware (CORS, rate limiting, JWT), native TypeScript support, and a standard Web API request/response model.
2. **Replace express-validator with Zod schemas + @hono/zod-validator.** Zod schemas provide compile-time type inference -- the validation schema *is* the TypeScript type. No manual synchronization needed.
3. **Replace supertest with Hono native `app.request()` testing.** Hono's test helper runs requests in-process without HTTP overhead, using the same `app` instance the route tests already create.
4. **Add Bun as the primary runtime with Node.js fallback.** Dual scripts in `package.json` (`bun:start` and `start`) ensure CI and contributors without Bun can still run the backend. Prisma ORM works with both runtimes.
5. **Keep Prisma ORM unchanged.** Prisma's query engine is runtime-agnostic and required no changes.

Implemented in PR #88 ("refactor: migrate backend to Hono + Bun runtime").

## Consequences

### What becomes easier

- **Request handling performance.** Hono benchmarks show 3-5x faster request handling than Express for equivalent middleware stacks. This improves development server responsiveness and future production throughput.
- **Test execution speed.** Removing HTTP overhead from 166 tests yields approximately 40% faster test runs. Tests execute in-process, eliminating flaky failures from port binding or network timing.
- **Dependency footprint.** 8 Express-related dependencies removed (express, express-validator, express-rate-limit, helmet, compression, cors, morgan, supertest). Fewer dependencies means smaller attack surface and simpler audits.
- **Type safety in validation.** Zod schemas infer TypeScript types at compile time. Adding a field to a Zod schema automatically updates the inferred type -- no manual synchronization with a separate type definition.
- **Edge deployment optionality.** Hono's Web API foundation means the backend can deploy to Cloudflare Workers, Deno Deploy, or Vercel Edge Functions without framework changes.
- **Typed middleware.** Hono's middleware system threads context types through the handler chain, replacing 40+ `req.userId!` non-null assertions with properly typed `c.get('userId')` calls.

### What becomes harder

- **Bun CI validation.** Bun is not yet validated in the CI pipeline. The Node.js fallback ensures CI works, but Bun-specific behavior (faster file I/O, native SQLite, different module resolution edge cases) is untested in CI until a Bun runner is added.
- **Ecosystem maturity.** Hono's middleware ecosystem is smaller than Express's. Niche middleware (e.g., specialized logging adapters, APM integrations) may need to be written or adapted rather than installed.
- **Team familiarity.** Contributors familiar with Express patterns (req/res, middleware signature, Router) need to learn Hono's context-based API (c.req, c.json, c.get/c.set). The mental model shift is small but real.
- **Prisma + Bun edge cases.** While Prisma works with Bun, some advanced features (interactive transactions, connection pooling behavior) have less community testing under Bun than Node.js.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Keep Express 4** | No migration work, large ecosystem, team familiarity | Maintenance mode, manual type sync, slow tests, no edge deployment |
| **Fastify** | Popular, fast, schema-based validation, large plugin ecosystem | Heavier than Hono, not edge-ready, still requires separate test HTTP layer |
| **Hono (chosen)** | Edge-ready, tiny bundle, built-in middleware, native TypeScript, in-process testing | Newer ecosystem, smaller middleware library, less community documentation |
| **Koa** | Minimal, middleware-focused, familiar async/await patterns | Even less actively maintained than Express, no built-in middleware, no edge support |
