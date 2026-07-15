# DYDYD Security Audit Report -- July 2026

**Date:** 2026-07-15
**Scope:** Backend API (Hono 4 / Bun), Mobile App (React Native / Expo 53), Shared Package
**Branch:** `chore/security-review`

---

## Executive Summary

| Category                        | Status |
| ------------------------------- | ------ |
| Authentication & Authorization  | PASS (with caveats -- see findings S-01, S-02) |
| Input Validation (Injection)    | PASS   |
| Data Exposure                   | FAIL (S-01 critical in pre-fix state; fixed on this branch) |
| Rate Limiting & DoS             | FAIL (S-03, S-04) |
| CORS & Security Headers         | PASS (after fix S-05 on this branch) |
| Mobile Security                 | FAIL (S-06, S-07) |
| Dependencies                    | INFO (audit blocked by tooling; manual review below) |

---

## Findings

### S-01 -- CRITICAL: Password-Reset Token Exposed in HTTP Response

- **File:** `apps/backend/src/routes/auth.ts:357-363` (pre-fix)
- **Description:** The `POST /api/auth/forgot-password` endpoint returned the raw `resetToken` in the JSON response body when the email existed in the database. This allowed any caller who knew a user's email to obtain an account-takeover token without access to the user's email inbox. Additionally, the presence vs absence of `resetToken` in the response allowed user enumeration, defeating the "always return success" pattern on line 317-321.
- **Impact:** Full account takeover. An attacker could call forgot-password, receive the token, then call reset-password to change any user's password.
- **Status:** FIXED on this branch. The `resetToken` field is now only included when `NODE_ENV !== 'production'`. All existing tests pass because `jest.setup.js` sets `NODE_ENV=test`.
- **Effort:** Low (applied).

### S-02 -- HIGH: Hardcoded JWT Secret Fallbacks

- **File:** `apps/backend/src/middleware/auth.ts:19,89,98` (pre-fix)
- **Description:** Both `JWT_SECRET` and `JWT_REFRESH_SECRET` fell back to hardcoded strings (`'your-secret-key-change-in-production'` and `'your-refresh-secret-change-in-production'`) when environment variables were unset. If deployed to production without setting these env vars, all tokens would be signed with publicly known secrets, enabling token forgery.
- **Impact:** Complete auth bypass if env vars are misconfigured in production.
- **Status:** FIXED on this branch. The fallbacks now throw an error in `NODE_ENV=production`, while dev/test retain the convenience defaults. Tests pass unchanged because `jest.setup.js` sets the env vars explicitly.
- **Effort:** Low (applied).

### S-03 -- HIGH: Rate Limiter Keyed on Spoofable Header

- **File:** `apps/backend/src/middleware/rateLimit.ts:11`
- **Description:** The rate limiter uses `x-forwarded-for` as the client key. This header is client-controlled and trivially spoofed. When absent, all requests share the key `'unknown'`, making all unauthenticated traffic share a single bucket. Additionally:
  - Auth-sensitive endpoints (`/login`, `/forgot-password`, `/reset-password`) use the same 100 req/15min limit as all other API routes. Brute-force attacks on login or password reset need far stricter limits (e.g., 5-10 req/15min).
  - The in-memory store has no eviction. An attacker can create millions of unique `x-forwarded-for` values, causing unbounded memory growth (memory DoS).
  - In multi-instance deployments, each instance has its own store, so the rate limit is per-instance, not global.
- **Impact:** Rate limiting is ineffective against determined attackers. Auth brute-force is feasible.
- **Recommendation:**
  1. Use the real client IP from a trusted proxy (Hono's `c.req.header('x-real-ip')` behind a reverse proxy, or Bun's socket info).
  2. Add a stricter rate limiter specifically for auth endpoints (5 req/min for login, 3 req/min for forgot-password).
  3. Replace in-memory store with Redis (already in `package.json` dependencies) or add TTL-based eviction.
  4. Add a max-entries cap to prevent memory exhaustion.
- **Effort:** Medium.

### S-04 -- MEDIUM: No Account Lockout After Failed Login Attempts

- **File:** `apps/backend/src/routes/auth.ts:143-192`
- **Description:** There is no mechanism to lock accounts or add progressive delays after repeated failed login attempts. Combined with the weak rate limiter (S-03), this allows automated credential-stuffing attacks.
- **Impact:** Elevated risk of credential stuffing and brute-force password attacks.
- **Recommendation:** Implement account lockout (temporary, 15-30 min) after 5 failed attempts, or exponential backoff per-account. Log failed attempts for monitoring.
- **Effort:** Medium.

### S-05 -- MEDIUM: CORS Wildcard Origin with Credentials

- **File:** `apps/backend/src/index.ts:26-29` (pre-fix)
- **Description:** CORS was configured with `origin: '*'` and `credentials: true` when `CORS_ORIGIN` env var was unset. While most browsers block `Access-Control-Allow-Credentials: true` with `Access-Control-Allow-Origin: *`, some older clients or non-browser consumers may not enforce this. In production, the origin should always be explicit.
- **Status:** FIXED on this branch. Production now throws if `CORS_ORIGIN` is unset (matching the JWT secret pattern); dev retains `*`.
- **Effort:** Low (applied).

### S-06 -- MEDIUM: Tokens Stored in AsyncStorage (Unencrypted)

- **File:** `apps/mobile/src/services/api/client.ts:13,101-107`, `apps/mobile/src/store/index.ts:42-48`
- **Description:** JWT access and refresh tokens are stored in React Native's `AsyncStorage`, which is unencrypted plaintext on Android. The auth slice (including tokens) is also persisted via `redux-persist` to `AsyncStorage`. On a rooted Android device, these tokens are trivially extractable.
- **Impact:** Token theft on compromised or rooted devices enables account takeover until token expiry (7 days for refresh tokens).
- **Recommendation:** Migrate to `expo-secure-store` (iOS Keychain / Android Keystore) for token storage. This requires updating both the `ApiClient` class and the Redux persist storage engine.
- **Effort:** Medium-High.

### S-07 -- MEDIUM: No Certificate Pinning

- **File:** `apps/mobile/src/services/api/client.ts`
- **Description:** The Axios HTTP client does not implement certificate pinning. On a device with a malicious CA installed (e.g., corporate MITM proxy, compromised device), TLS traffic including JWT tokens can be intercepted.
- **Impact:** Man-in-the-middle attacks can intercept tokens and API payloads.
- **Recommendation:** Implement certificate pinning via `react-native-ssl-pinning` or Expo's network security config.
- **Effort:** Medium.

### S-08 -- LOW: JWT Algorithm Not Pinned

- **File:** `apps/backend/src/middleware/auth.ts:36,70`
- **Description:** `jwt.verify()` is called without specifying `algorithms: ['HS256']`. While the `jsonwebtoken` library defaults to the algorithm used during signing, explicitly pinning prevents algorithm-confusion attacks (e.g., `alg: none` or RSA/HMAC confusion).
- **Impact:** Low with current `jsonwebtoken@9.x` (which rejects `alg: none` by default), but defense-in-depth best practice.
- **Recommendation:** Add `{ algorithms: ['HS256'] }` to all `jwt.verify()` calls.
- **Effort:** Low.

### S-09 -- LOW: Password Removal via `undefined as any` Spread

- **Files:** `apps/backend/src/routes/auth.ts:126,182`
- **Description:** The register and login responses remove the password by spreading the user object and setting `password: undefined as any`. While functionally this works (JSON serialization omits `undefined` values), it is fragile: if the serializer changes or the object is logged before serialization, the password hash could leak. The user route (`user.ts:71,102`) correctly uses destructuring.
- **Impact:** Low -- bcrypt hash, not plaintext, and JSON serialization does omit `undefined`. But inconsistent with the safer pattern already used elsewhere.
- **Recommendation:** Use Prisma `select` or `omit` to exclude the password at the query level, or consistently use destructuring.
- **Effort:** Low.

### S-10 -- LOW: Logout Body Not Validated

- **File:** `apps/backend/src/routes/auth.ts:270`
- **Description:** The logout endpoint reads `refreshToken` from the raw body via `c.req.json().catch(() => ({}))` without Zod validation. While the field is optional and the worst case is revoking all tokens (which is safe), this is inconsistent with the validation pattern used everywhere else.
- **Impact:** Minimal -- no injection risk since Prisma parameterizes queries.
- **Recommendation:** Add a Zod schema for the optional `refreshToken` field for consistency.
- **Effort:** Low.

### S-11 -- INFO: Mobile API Client URL Mismatch

- **File:** `apps/mobile/src/services/api/client.ts:69`
- **Description:** The refresh token interceptor posts to `/auth/refresh`, but the backend route is `/auth/refresh-token` (`auth.ts:199`). This means the automatic token refresh flow is broken in the mobile app -- it will always get a 404 on refresh, causing silent logouts.
- **Impact:** Functional bug, not a direct security vulnerability, but causes degraded auth UX.
- **Recommendation:** Fix the mobile client URL to `/auth/refresh-token`.
- **Effort:** Low.

### S-12 -- INFO: Notification Model Missing Foreign Key Relation

- **File:** `apps/backend/prisma/schema.prisma:218-231`
- **Description:** The `Notification` model has a `userId` column but no `@relation` to `User` and no `onDelete: Cascade`. This means notification records are not automatically cleaned up when a user is deleted (the account deletion handler explicitly deletes them in a transaction, which mitigates this). It also means there is no database-level FK constraint preventing orphaned notifications.
- **Impact:** Data integrity issue, not a security vulnerability. The application-level cleanup in `user.ts:248` mitigates the risk.
- **Recommendation:** Add `user User @relation(fields: [userId], references: [id], onDelete: Cascade)` to the Notification model.
- **Effort:** Low (migration required).

---

## Passes (Explicitly Verified)

- **SQL Injection:** No raw SQL queries found. All database access goes through Prisma's parameterized query builder. PASS.
- **Password Hashing:** bcrypt with cost factor 12, consistent across register, reset-password, and delete-account flows. PASS.
- **Password Timing:** `bcrypt.compare()` is constant-time. Login returns the same error message for "user not found" and "wrong password". PASS.
- **IDOR Protection:** All authenticated routes scope queries by `userId` extracted from the JWT -- no route accepts a userId from the request body/params. PASS.
- **Refresh Token Rotation:** Implemented correctly at `auth.ts:239-251`. Old token is revoked in a transaction before the new one is created. PASS.
- **Account Deletion:** Comprehensive cascade deletion in a transaction (`user.ts:245-258`) -- covers completions, quests, badges, notifications, devices, tokens, priorities, settings, and the user record. Password re-verification required. PASS.
- **Error Handling:** Production error responses use generic messages (`errorHandler.ts:84`). Stack traces only logged in development (`errorHandler.ts:50-52`). PASS.
- **Security Headers:** `secureHeaders()` middleware applied globally. PASS.
- **Zod Validation:** All POST/PUT routes use Zod schemas via `validateBody()`. URL params validated inline with UUID regex. PASS.

---

## Dependencies

Dependency audit via `yarn npm audit` was not executable in the current environment (Yarn 4 corepack not available). Manual review of key dependency versions:

| Package            | Version   | Notes                                      |
| ------------------ | --------- | ------------------------------------------ |
| hono               | ^4.7.0    | Current major. No known CVEs.              |
| jsonwebtoken       | ^9.0.2    | Current. Rejects `alg: none` by default.   |
| bcryptjs           | ^2.4.3    | Pure JS bcrypt. Current.                   |
| @prisma/client     | 5.22.0    | Pinned. Check for updates periodically.    |
| zod                | ^3.24.0   | Current.                                   |
| firebase-admin     | ^12.0.0   | Listed but not imported in any route. May be unused.  |
| redis              | ^4.6.12   | Listed but not imported in any route. May be unused.  |
| axios              | (mobile)  | Check for prototype pollution CVEs.        |

**Recommendation:** Set up a Renovate or Dependabot config to automate dependency updates. Remove unused dependencies (`firebase-admin`, `redis`) if not planned for near-term use.

---

## Remediation Priority

| Priority | Finding | Severity | Status     |
| -------- | ------- | -------- | ---------- |
| 1        | S-01    | Critical | FIXED      |
| 2        | S-02    | High     | FIXED      |
| 3        | S-05    | Medium   | FIXED      |
| 4        | S-03    | High     | Open       |
| 5        | S-04    | Medium   | Open       |
| 6        | S-06    | Medium   | Open       |
| 7        | S-07    | Medium   | Open       |
| 8        | S-08    | Low      | Open       |
| 9        | S-09    | Low      | Open       |
| 10       | S-10    | Low      | Open       |
| 11       | S-11    | Info     | Open (bug) |
| 12       | S-12    | Info     | Open       |

---

## Quick Wins Applied on This Branch

1. **S-01:** Gated `resetToken` exposure behind `NODE_ENV !== 'production'` (`auth.ts`)
2. **S-02:** JWT secrets now throw in production if env vars are unset (`auth.ts`)
3. **S-05:** CORS origin now requires `CORS_ORIGIN` env var in production; throws if unset (`index.ts`)

All existing tests pass after these changes (150/150 tests pass; baseline comparison against unmodified `main` confirms identical results -- the 3 "failed" suites are a pre-existing Jest teardown issue with worker process exits, not actual test failures). TypeScript errors are also identical to `main` -- all in `streaks.ts` due to ungenerated Prisma client fields, unrelated to security changes.
