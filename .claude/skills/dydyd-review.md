# DYDYD Review

Run the full quality gate before committing or opening a PR.

## Steps

1. **Lint all workspaces**
   ```bash
   yarn lint:all
   ```
   Fix any errors before continuing.

2. **Run all tests**
   ```bash
   yarn test:all
   ```
   All suites must pass.

3. **Check for forbidden `as any` usage**
   ```bash
   grep -rn "as any" apps/ packages/shared/src/
   ```
   The ONLY accepted occurrence is stripping sensitive fields before a response (e.g. `password: undefined as any`). Every other hit is a bug — fix it with proper types or Prisma `select`/`omit`.

4. **Verify domain types are imported from `@dydyd/shared`**
   ```bash
   grep -rn "interface User\|interface Quest\|interface Badge\|type QuestCategory\|type BadgeType" apps/backend/src/ apps/mobile/src/
   ```
   Any match is a violation — remove the local definition and import from `@dydyd/shared` instead.

5. **Check Zod schemas on every new route**
   Every `POST`, `PUT`, and `PATCH` handler must call `validateBody(schema)` middleware before accessing `c.get('validatedBody')`. No manual `if (!body.field)` checks.

6. **Run final code review**
   ```
   /code-review --effort max
   ```
