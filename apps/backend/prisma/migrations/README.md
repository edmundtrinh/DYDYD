# Prisma Migrations

## Initial Migration (20260618000000_init)

This migration was created by baselining the existing schema that was
previously managed with `prisma db push`. It contains all 11 tables.

## Baselining Existing Databases

If you have an existing database created with `prisma db push`, run:

```bash
# Mark the init migration as already applied (skip execution)
prisma migrate resolve --applied 20260618000000_init
```

## Fresh Database Setup

```bash
# Apply all migrations
prisma migrate deploy

# Seed (optional)
yarn db:seed
```

## Development Workflow

```bash
# Create a new migration after editing schema.prisma
prisma migrate dev --name descriptive_name

# Check migration/schema drift
prisma migrate diff --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" --exit-code
```
