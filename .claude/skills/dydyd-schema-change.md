# DYDYD Schema Change

Checklist for modifying the Prisma schema safely.

## Steps

1. **Edit the schema**
   ```
   apps/backend/prisma/schema.prisma
   ```

2. **Run migration** (creates a new migration file and applies it to dev DB)
   ```bash
   yarn workspace @dydyd/backend db:migrate
   ```
   Give the migration a descriptive name when prompted (e.g. `add_sprite_messages`).

3. **Regenerate Prisma client**
   ```bash
   yarn workspace @dydyd/backend db:generate
   ```

4. **Update shared types** — if the change exposes new enums or fields to the mobile app, add them to:
   ```
   packages/shared/src/types.ts
   ```

5. **Rebuild shared package**
   ```bash
   yarn shared build
   ```

6. **Run backend tests** to catch any type or query regressions
   ```bash
   yarn workspace @dydyd/backend test
   ```

## Notes

- Never use `db push` — always use `db:migrate` so migration history is tracked.
- If adding a non-nullable column to an existing table, provide a `@default` in the schema or the migration will fail on non-empty tables.
- After merging, teammates must run `yarn workspace @dydyd/backend db:migrate` to apply new migrations locally.
