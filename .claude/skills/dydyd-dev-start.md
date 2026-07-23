# DYDYD Dev Start

Start the DYDYD development environment in the correct order.

## Steps

1. **Check for missing `.env`**
   - If `apps/backend/.env` does not exist, copy from `apps/backend/.env.example` and fill in `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ANTHROPIC_API_KEY`.

2. **Build shared package** (required if `packages/shared/src/` has uncommitted changes or if `packages/shared/dist/` is missing)
   ```bash
   yarn shared build
   ```

3. **Start the backend** in one terminal:
   ```bash
   yarn start:backend
   ```
   Wait until you see `DYDYD Backend running on port 3000` before proceeding.

4. **Start the mobile bundler** in a second terminal:
   ```bash
   yarn start:mobile
   ```

5. **Verify** the backend is healthy:
   ```bash
   curl http://localhost:3000/health
   ```
   Expected: `{"status":"ok",...}`

## Common Issues

- `Cannot find module '@dydyd/shared'` → run `yarn shared build` first.
- `DATABASE_URL` connection refused → check that PostgreSQL is running and `.env` is configured.
- Metro bundler port conflict → run `yarn start:mobile --reset-cache`.
