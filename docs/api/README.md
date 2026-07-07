---
title: DYDYD API Documentation
date: 2026-07-07
---

# DYDYD API Documentation

This directory contains the API documentation for the DYDYD backend service.

## Contents

| Document | Description |
|----------|-------------|
| [reference.md](./reference.md) | Complete API reference with all endpoints, parameters, and response shapes |

## API Architecture

### Technology Stack

- **Runtime:** Node.js with TypeScript (strict mode)
- **Framework:** Express 4
- **ORM:** Prisma with PostgreSQL
- **Auth:** JWT (jsonwebtoken) with bcryptjs password hashing
- **Validation:** express-validator

### Middleware Stack

Requests pass through the following middleware in order:

1. **Helmet** -- sets security-related HTTP headers
2. **CORS** -- configurable origin (defaults to `*`), with credentials support
3. **Rate limiter** -- 100 requests per 15 minutes per IP, applied to all `/api/*` routes
4. **Body parser** -- JSON (max 10 MB) and URL-encoded
5. **Compression** -- gzip response compression
6. **Morgan** -- HTTP request logging (disabled in test environment)
7. **Route-level middleware** -- authentication and validation, applied per-endpoint
8. **404 handler** -- catches unmatched routes
9. **Error handler** -- global error formatter

### Authentication Strategy

DYDYD uses a **short-lived access token + rotating refresh token** strategy:

| Token | Lifetime | Secret |
|-------|----------|--------|
| Access token | 15 minutes (900s) | `JWT_SECRET` |
| Refresh token | 7 days (604800s) | `JWT_REFRESH_SECRET` |

- Access tokens carry `{ userId, email }` in the JWT payload.
- Refresh tokens are stored in the database (`RefreshToken` table) and checked for revocation on each use.
- On refresh, the old token is revoked and a new pair is issued (token rotation).
- On logout, either a specific refresh token or all of the user's tokens can be revoked.
- On password reset, all refresh tokens are revoked to force re-login on every device.

Three middleware functions control endpoint access:

- **`authenticate`** -- requires a valid, non-expired access token. Returns 401 on failure.
- **`optionalAuth`** -- attaches user info if a valid token is present, but allows unauthenticated access.
- *(no middleware)* -- public endpoints that do not inspect the Authorization header at all.

### Error Handling

All errors pass through a centralized `errorHandler` middleware that normalizes the response shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

The application uses an `AppError` class with factory functions (`Errors.badRequest()`, `Errors.notFound()`, etc.) to throw structured errors from route handlers. Unrecognized errors are returned as 500 `INTERNAL_ERROR` with the message hidden in production.

**Exception:** The rate limiter returns its own format (`{ "error": "Too many requests, please try again later." }`) and does not pass through the `errorHandler`.

### Route Mounting

Routes are mounted in `apps/backend/src/index.ts`:

| Prefix | Route file | Description |
|--------|------------|-------------|
| `/api/auth` | `routes/auth.ts` | Registration, login, token refresh, password reset |
| `/api/quests` | `routes/quests.ts` | Quest library, activation, completion, custom quests |
| `/api/user` | `routes/user.ts` | Profile, settings, category priorities, account deletion |
| `/api/progress` | `routes/progress.ts` | Stats, daily/weekly progress, badges, leaderboard |
| `/api/health` | `routes/health.ts` | Health data sync and quest auto-completion |
| `/api/badges` | `routes/badges.ts` | Badge library, user badges, badge checking |
| `/api/notifications` | `routes/notifications.ts` | Device tokens, notification history, read status |
| `/health` | *(inline)* | Server health check (no auth, no rate limit) |

### Endpoint Count

The API exposes **31 endpoints** under `/api` across 7 route files, plus 1 system endpoint (32 total):

- Authentication: 6 (register, login, refresh-token, logout, forgot-password, reset-password)
- Quests: 6 (library, user quests, activate, complete, deactivate, custom)
- User: 7 (GET/PUT profile, GET/PUT settings, GET/PUT category-priorities, DELETE account)
- Progress: 5 (stats, daily, weekly, badges, leaderboard)
- Health: 1 (sync)
- Badges: 3 (list all, user badges, check)
- Notifications: 3 (device-token, list, mark-read)
- System: 1 (health check -- outside `/api`, not rate-limited)
