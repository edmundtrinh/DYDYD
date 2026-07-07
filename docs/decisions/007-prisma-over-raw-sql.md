# ADR-007: Prisma ORM With Migrations

**Status:** Accepted
**Date:** 2026-05-28 (inception; formally recorded 2026-07-07)
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD's backend needs a database layer for PostgreSQL. The schema covers 11+ models: users, quests, quest completions, badges, user badges, streaks, notifications, devices, refresh tokens, and health data. The schema uses PostgreSQL-specific features: enums for quest categories (`PHYSICAL_HEALTH`, `MENTAL_WELLNESS`, etc.), quest statuses, and badge rarities; JSON fields for flexible metadata; and array types.

The choice of database access layer affects developer experience, type safety, migration management, and the ability to use PostgreSQL-specific features.

## Decision

Use **Prisma ORM** with **Prisma Migrate** for schema management.

- Schema defined declaratively in `prisma/schema.prisma`
- Migrations generated and applied via `prisma migrate` (not `db push`)
- Initial baseline migration at `prisma/migrations/20260618000000_init`
- Prisma Client auto-generated for type-safe database queries
- CI validates schema syntax, migration drift, and clean migration application via a PostgreSQL service container

## Consequences

### What becomes easier

- **Type-safe queries.** Prisma Client generates TypeScript types from the schema. Every query, include, and select is type-checked at compile time. Combined with the shared package's domain types, there are zero untyped database interactions.
- **Schema-as-code.** The Prisma schema file is a single, readable declaration of the entire data model. New contributors can understand the database by reading one file.
- **Migration management.** `prisma migrate` generates SQL migration files from schema diffs, creating an auditable history. The CI pipeline validates that migrations apply cleanly to a fresh database.
- **PostgreSQL features.** Prisma supports PostgreSQL enums, JSON fields, and array types natively. The schema uses enums for `QuestCategory`, `QuestStatus`, `BadgeRarity`, `NotificationType`, etc. -- these map directly to PostgreSQL enums.
- **Testing.** Mocking Prisma for unit tests is straightforward: `jest.mock('../../lib/prisma')` replaces the client with a mock object. All 94+ backend unit tests use this pattern.

### What becomes harder

- **Complex queries.** Prisma's query API does not support all PostgreSQL features. Window functions, CTEs, lateral joins, and complex aggregations require `$queryRaw` or `$executeRaw`, which lose type safety.
- **Migration friction.** Prisma Migrate is opinionated: it generates SQL migration files that must be committed and applied in order. Branching workflows where multiple branches modify the schema can produce conflicting migrations.
- **Runtime overhead.** Prisma Client adds a query engine layer between the app and the database. For extremely high-throughput scenarios, this overhead is measurable compared to raw SQL or lighter query builders.
- **Enum rigidity.** Adding or renaming a PostgreSQL enum value requires a migration. Unlike string columns, enums cannot be extended without schema changes and deployment.
- **Shadow database.** `prisma migrate dev` requires a shadow database for drift detection. CI needs a separate PostgreSQL instance (or uses `--skip-seed` and careful configuration) to handle this.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Prisma ORM (chosen)** | Type-safe queries, schema-as-code, migration management, PostgreSQL feature support, easy to mock | Complex query limitations, migration friction in branching, runtime overhead, shadow database requirement |
| **Raw SQL (pg / node-postgres)** | Full PostgreSQL control, no ORM overhead, simplest dependency | No type safety, manual migration management, SQL injection risk if not parameterized, no schema documentation |
| **Knex.js (query builder)** | Lightweight, composable queries, migration support | No type generation, manual type maintenance, less readable than Prisma schema |
| **TypeORM** | Decorator-based entity definitions, Active Record and Data Mapper patterns, mature | Decorator syntax diverges from TypeScript conventions, historically buggy, complex configuration, slower development |
| **Drizzle ORM** | Lightweight, SQL-like API, type-safe, schema-as-code | Newer ecosystem, less community support, PostgreSQL enum support was immature at project start |
| **MikroORM** | Unit of work pattern, identity map, strong TypeScript support | Less community adoption, steeper learning curve, less documentation |
