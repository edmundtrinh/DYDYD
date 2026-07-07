---
title: DYDYD API Reference
version: "1.0"
date: 2026-07-07
status: current
base_url: http://localhost:3000
---

# DYDYD API Reference

Complete API reference for the DYDYD backend. All `/api/*` endpoints are rate-limited to **100 requests per 15-minute window per IP**. Endpoints outside `/api/` (such as the health check) are not rate-limited.

## Table of Contents

- [Common Information](#common-information)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [Request / Response Format](#request--response-format)
  - [Error Handling](#error-handling)
  - [Rate Limiting](#rate-limiting)
- [System](#system)
- [Authentication](#authentication-endpoints)
- [Quests](#quests)
- [User](#user)
- [Progress](#progress)
- [Health](#health)
- [Badges](#badges)
- [Notifications](#notifications)

---

## Common Information

### Base URL

```
http://localhost:3000
```

All API routes are prefixed with `/api`. The server listens on port 3000 by default (configurable via the `PORT` environment variable).

### Authentication

DYDYD uses **JWT bearer tokens** for authentication. The flow is:

1. **Register** (`POST /api/auth/register`) or **Login** (`POST /api/auth/login`) to receive an access token and a refresh token.
2. Include the access token in the `Authorization` header of subsequent requests:
   ```
   Authorization: Bearer <access_token>
   ```
3. Access tokens expire after **15 minutes** (900 seconds).
4. Use **Refresh** (`POST /api/auth/refresh-token`) to exchange a valid refresh token for a new token pair. Refresh tokens expire after **7 days**.
5. On refresh, the old refresh token is revoked and a new one is issued (rotation).

Three authentication levels are used across endpoints:

| Level | Middleware | Behavior |
|-------|-----------|----------|
| **Required** | `authenticate` | Request fails with 401 if no valid token is present |
| **Optional** | `optionalAuth` | User info is attached if a valid token is present, but the request proceeds either way |
| **None** | *(no middleware)* | No token checked |

### Request / Response Format

**Request body** content type: `application/json` (max 10 MB).

**Success response envelope:**

```json
{
  "success": true,
  "data": { ... }
}
```

Some list endpoints include pagination metadata:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 42,
    "hasMore": true
  }
}
```

### Error Handling

**Error response envelope** (from the global `errorHandler` middleware):

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }
  }
}
```

**Standard error codes:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid request (e.g., period maxed out, premium limit reached) |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired JWT token |
| 403 | `FORBIDDEN` | Authenticated but not authorized for this resource |
| 404 | `NOT_FOUND` | Resource or endpoint not found |
| 409 | `CONFLICT` | Resource already exists (e.g., duplicate email, quest already activated) |
| 422 | `VALIDATION_ERROR` | Request body failed validation |
| 429 | *(see below)* | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error (message hidden in production) |

**Validation error details** (422) contain a map of field names to arrays of error messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Please provide a valid email"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Rate Limiting

All `/api/*` endpoints are rate-limited to **100 requests per 15-minute window per IP address**. When the limit is exceeded, the server returns HTTP 429 with the following body (note: this does **not** use the standard error envelope):

```json
{
  "error": "Too many requests, please try again later."
}
```

The top-level `/health` endpoint is **not** rate-limited.

---

## System

### `GET /health`

**Authentication:** None
**Rate Limited:** No

**Description:** Server health check. Returns the current server status, timestamp, and environment. This endpoint is outside the `/api` prefix and is not rate-limited.

**Request:** No parameters.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-07-07T12:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication Endpoints

All auth routes are mounted under `/api/auth`.

### `POST /api/auth/register`

**Authentication:** None
**Rate Limited:** Yes (100 req/15min)

**Description:** Register a new user account. Creates the user, initializes default settings, generates a JWT token pair, and returns both.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `email` | body | string | Yes | Valid email address (normalized) |
| `password` | body | string | Yes | Min 8 characters; must contain uppercase, lowercase, and a number |
| `displayName` | body | string | Yes | 2-50 characters (trimmed) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Jane",
      "avatarUrl": null,
      "totalXP": 0,
      "level": 1,
      "isPremium": false,
      "premiumExpiresAt": null,
      "createdAt": "2026-07-07T12:00:00.000Z",
      "updatedAt": "2026-07-07T12:00:00.000Z",
      "settings": {
        "id": "uuid",
        "userId": "uuid",
        "notificationsEnabled": true,
        "dailyReminderTime": null,
        "weeklyResetDay": 0,
        "timezone": "UTC",
        "theme": "system",
        "soundEnabled": true,
        "hapticFeedbackEnabled": true
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": 900
    }
  }
}
```

The `password` field is stripped from the returned user object.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 409 | `CONFLICT` | "User with this email already exists" |
| 422 | `VALIDATION_ERROR` | Invalid email, weak password, or invalid display name |

---

### `POST /api/auth/login`

**Authentication:** None
**Rate Limited:** Yes (100 req/15min)

**Description:** Authenticate with email and password. Returns the user object (with settings) and a new JWT token pair.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `email` | body | string | Yes | Valid email address (normalized) |
| `password` | body | string | Yes | Non-empty |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Jane",
      "avatarUrl": null,
      "totalXP": 150,
      "level": 2,
      "isPremium": false,
      "premiumExpiresAt": null,
      "createdAt": "2026-07-01T12:00:00.000Z",
      "updatedAt": "2026-07-07T12:00:00.000Z",
      "settings": { ... }
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": 900
    }
  }
}
```

The `password` field is stripped from the returned user object.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | "Invalid email or password" |
| 422 | `VALIDATION_ERROR` | Invalid email format or empty password |

---

### `POST /api/auth/refresh-token`

**Authentication:** None
**Rate Limited:** Yes (100 req/15min)

**Description:** Exchange a valid, non-revoked refresh token for a new access token and a new refresh token. The old refresh token is revoked (token rotation).

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `refreshToken` | body | string | Yes | A previously issued refresh token |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 900
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | "Invalid or expired refresh token" or "User not found" |
| 422 | `VALIDATION_ERROR` | Missing refresh token |

---

### `POST /api/auth/logout`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Revoke refresh tokens. If a specific `refreshToken` is provided in the body, only that token is revoked. If omitted, **all** active refresh tokens for the authenticated user are revoked.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `refreshToken` | body | string | No | Specific refresh token to revoke. If omitted, all tokens are revoked. |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `POST /api/auth/forgot-password`

**Authentication:** None
**Rate Limited:** Yes (100 req/15min)

**Description:** Request a password reset. Generates a secure random reset token (SHA-256 hashed before storage) that expires in 1 hour. Any previously issued unused reset tokens for the same user are revoked. The response is intentionally identical whether or not the email exists, to prevent enumeration.

> **Dev note:** In the current implementation, the raw `resetToken` is returned in the response body for testing purposes. In production, this token would be sent via email and not included in the API response.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `email` | body | string | Yes | Valid email address (normalized) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "If that email exists, a reset link has been sent.",
    "resetToken": "a1b2c3d4e5f6..."
  }
}
```

The `resetToken` field is present only in development. When the email does not match any user, the response still returns `success: true` with the same message but no `resetToken`.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 422 | `VALIDATION_ERROR` | Invalid email format |

---

### `POST /api/auth/reset-password`

**Authentication:** None
**Rate Limited:** Yes (100 req/15min)

**Description:** Reset a user's password using a valid reset token. The token is verified by hashing the provided value and comparing against the stored hash. On success, the password is updated, the reset token is revoked, and **all existing refresh tokens are revoked** (forcing re-login on all devices).

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `token` | body | string | Yes | The raw reset token received from `/forgot-password` |
| `newPassword` | body | string | Yes | Min 8 characters; must contain uppercase, lowercase, and a number |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully."
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | "Invalid or expired reset token" |
| 422 | `VALIDATION_ERROR` | Missing token or weak password |

---

## Quests

All quest routes are mounted under `/api/quests`.

### `GET /api/quests/library`

**Authentication:** Optional
**Rate Limited:** Yes (100 req/15min)

**Description:** List all predefined (default) quests from the quest library. Sorted by category ascending, then by name ascending.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Walk 10,000 Steps",
      "description": "Hit your daily step goal",
      "category": "physical_health",
      "frequency": "daily",
      "baseXP": 5,
      "maxCompletionsPerPeriod": 1,
      "isDefault": true,
      "isCustom": false,
      "iconName": "walking",
      "healthDataType": "steps",
      "targetValue": 10000,
      "unit": "steps",
      "createdAt": "2026-06-18T00:00:00.000Z",
      "createdById": null
    }
  ]
}
```

---

### `GET /api/quests/user`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's active quests with their associated quest definitions and today's completions.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-quest-uuid",
      "userId": "uuid",
      "questId": "uuid",
      "isActive": true,
      "customName": null,
      "customXP": null,
      "reminderTime": null,
      "reminderEnabled": false,
      "currentStreak": 3,
      "longestStreak": 7,
      "totalCompletions": 15,
      "lastCompletedAt": "2026-07-07T08:30:00.000Z",
      "createdAt": "2026-06-20T12:00:00.000Z",
      "quest": {
        "id": "uuid",
        "name": "Walk 10,000 Steps",
        "description": "...",
        "category": "physical_health",
        "frequency": "daily",
        "baseXP": 5,
        "maxCompletionsPerPeriod": 1,
        "isDefault": true,
        "isCustom": false,
        "iconName": "walking",
        "healthDataType": "steps",
        "targetValue": 10000,
        "unit": "steps",
        "createdAt": "2026-06-18T00:00:00.000Z",
        "createdById": null
      },
      "completions": [
        {
          "id": "uuid",
          "userQuestId": "user-quest-uuid",
          "completedAt": "2026-07-07T08:30:00.000Z",
          "xpEarned": 5,
          "value": 10234,
          "source": "apple_health",
          "periodStart": "2026-07-07T00:00:00.000Z",
          "notes": null
        }
      ]
    }
  ]
}
```

The `completions` array is filtered to only include completions from today (midnight onward). Quests are sorted by `createdAt` ascending.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `POST /api/quests/activate`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Activate a quest from the library for the authenticated user. If the quest was previously activated and then deactivated, it is reactivated. Creates a new UserQuest record with streaks and completions initialized to zero.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `questId` | body | UUID | Yes | The **Quest** ID from the library (not a UserQuest ID) |

**Response (201):** *(new activation)*

```json
{
  "success": true,
  "data": {
    "id": "user-quest-uuid",
    "userId": "uuid",
    "questId": "uuid",
    "isActive": true,
    "reminderEnabled": false,
    "currentStreak": 0,
    "longestStreak": 0,
    "totalCompletions": 0,
    "lastCompletedAt": null,
    "createdAt": "2026-07-07T12:00:00.000Z",
    "quest": { ... }
  }
}
```

**Response (200):** *(reactivation of a previously deactivated quest)*

Same shape as above, with `isActive: true`.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "Quest not found" |
| 409 | `CONFLICT` | "Quest already activated" |
| 422 | `VALIDATION_ERROR` | `questId` is not a valid UUID |

---

### `POST /api/quests/:id/complete`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Mark a quest as completed for the current period. Creates a `QuestCompletion` record, increments the user's total XP, updates streak counters, and increments `totalCompletions`. The entire operation runs in a database transaction.

The period is determined by the quest's frequency: daily resets at midnight, weekly resets on Sunday, monthly resets on the 1st.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | UUID | Yes | The **UserQuest** ID (from `GET /api/quests/user`), **not** the library Quest ID |
| `value` | body | number | No | Measured value (e.g., steps taken, minutes exercised) |
| `source` | body | string | No | Data source. Default: `"manual"`. Valid: `apple_health`, `google_fit`, `garmin`, `samsung_health`, `manual` |
| `notes` | body | string | No | Free-text notes for this completion |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "completion": {
      "id": "uuid",
      "userQuestId": "user-quest-uuid",
      "completedAt": "2026-07-07T12:00:00.000Z",
      "xpEarned": 5,
      "value": 10234,
      "source": "apple_health",
      "periodStart": "2026-07-07T00:00:00.000Z",
      "notes": "Morning walk"
    },
    "userQuest": {
      "id": "user-quest-uuid",
      "currentStreak": 4,
      "longestStreak": 7,
      "totalCompletions": 16,
      "lastCompletedAt": "2026-07-07T12:00:00.000Z",
      "quest": { ... }
    },
    "xpEarned": 5
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | "Maximum completions for this period reached" |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "User quest not found" (wrong ID or quest is inactive) |
| 422 | `VALIDATION_ERROR` | `id` is not a valid UUID, or `value` is not numeric |

---

### `DELETE /api/quests/:id`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Deactivate a user quest. Sets `isActive` to `false`. This is a soft-delete; the UserQuest record and its completion history are preserved.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | UUID | Yes | The **UserQuest** ID (from `GET /api/quests/user`) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Quest deactivated successfully"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "User quest not found" |
| 422 | `VALIDATION_ERROR` | `id` is not a valid UUID |

---

### `POST /api/quests/custom`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Create a custom quest and automatically activate it for the user. Free users may have at most **3** custom quests; premium users may have at most **50**.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `name` | body | string | Yes | 2-100 characters (trimmed) |
| `description` | body | string | No | Max 500 characters (trimmed) |
| `category` | body | string | Yes | One of: `physical_health`, `mental_wellness`, `career_productivity`, `relationships_social`, `home_chores` |
| `frequency` | body | string | Yes | One of: `daily`, `weekly`, `monthly` |
| `baseXP` | body | integer | Yes | 1-10 |
| `maxCompletionsPerPeriod` | body | integer | No | 1-10. Default: `1` |
| `iconName` | body | string | No | Icon identifier. Default: `"star"` |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "user-quest-uuid",
    "userId": "uuid",
    "questId": "uuid",
    "isActive": true,
    "reminderEnabled": false,
    "currentStreak": 0,
    "longestStreak": 0,
    "totalCompletions": 0,
    "lastCompletedAt": null,
    "createdAt": "2026-07-07T12:00:00.000Z",
    "quest": {
      "id": "uuid",
      "name": "Read for 30 minutes",
      "description": "Read a book or article",
      "category": "mental_wellness",
      "frequency": "daily",
      "baseXP": 3,
      "maxCompletionsPerPeriod": 1,
      "isDefault": false,
      "isCustom": true,
      "iconName": "star",
      "healthDataType": null,
      "targetValue": null,
      "unit": null,
      "createdAt": "2026-07-07T12:00:00.000Z",
      "createdById": "uuid"
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | "Maximum custom quests reached (3)" or "(50)" |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid name, category, frequency, or baseXP |

---

## User

All user routes are mounted under `/api/user`.

### `GET /api/user/profile`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's full profile, including settings and category priorities. The `password` field is excluded from the response.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Jane",
    "avatarUrl": null,
    "totalXP": 450,
    "level": 3,
    "isPremium": false,
    "premiumExpiresAt": null,
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-07-07T12:00:00.000Z",
    "settings": {
      "id": "uuid",
      "userId": "uuid",
      "notificationsEnabled": true,
      "dailyReminderTime": null,
      "weeklyResetDay": 0,
      "timezone": "UTC",
      "theme": "system",
      "soundEnabled": true,
      "hapticFeedbackEnabled": true
    },
    "categoryPriorities": [
      {
        "id": "uuid",
        "userId": "uuid",
        "category": "physical_health",
        "priority": 5,
        "isEnabled": true
      }
    ]
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "User not found" |

---

### `PUT /api/user/profile`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Update the authenticated user's profile fields. Only the provided fields are updated; omitted fields are left unchanged. Returns the full updated profile (without `password`).

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `displayName` | body | string | No | 2-50 characters (trimmed) |
| `avatarUrl` | body | string | No | Valid URL |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Updated Name",
    "avatarUrl": "https://example.com/avatar.png",
    "settings": { ... },
    "categoryPriorities": [ ... ]
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid display name length or invalid URL |

---

### `GET /api/user/settings`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's settings.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "notificationsEnabled": true,
    "dailyReminderTime": null,
    "weeklyResetDay": 0,
    "timezone": "UTC",
    "theme": "system",
    "soundEnabled": true,
    "hapticFeedbackEnabled": true
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "Settings not found" |

---

### `PUT /api/user/settings`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Update the authenticated user's settings. Only the provided fields are updated; omitted fields are left unchanged.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `notificationsEnabled` | body | boolean | No | Enable or disable push notifications |
| `dailyReminderTime` | body | string | No | Time in `HH:mm` format (24-hour) |
| `weeklyResetDay` | body | integer | No | 0 (Sunday) through 6 (Saturday) |
| `timezone` | body | string | No | Timezone identifier (e.g., `"America/Los_Angeles"`) |
| `theme` | body | string | No | One of: `light`, `dark`, `system` |
| `soundEnabled` | body | boolean | No | Enable or disable sounds |
| `hapticFeedbackEnabled` | body | boolean | No | Enable or disable haptic feedback |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "notificationsEnabled": false,
    "dailyReminderTime": "08:30",
    "weeklyResetDay": 1,
    "timezone": "America/Los_Angeles",
    "theme": "dark",
    "soundEnabled": true,
    "hapticFeedbackEnabled": false
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid value for a settings field |

---

### `GET /api/user/category-priorities`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the user's category priorities, sorted by priority descending.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "category": "physical_health",
      "priority": 5,
      "isEnabled": true
    },
    {
      "id": "uuid",
      "userId": "uuid",
      "category": "mental_wellness",
      "priority": 4,
      "isEnabled": true
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `PUT /api/user/category-priorities`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Replace the user's category priorities. All existing priorities are deleted and recreated from the provided array.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `priorities` | body | array | Yes | Array of priority objects |
| `priorities[].category` | body | string | Yes | One of: `physical_health`, `mental_wellness`, `career_productivity`, `relationships_social`, `home_chores` |
| `priorities[].priority` | body | integer | Yes | 1-5 (higher = more important) |
| `priorities[].isEnabled` | body | boolean | Yes | Whether this category is enabled |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "category": "physical_health",
      "priority": 5,
      "isEnabled": true
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid category, priority out of range, or missing isEnabled |

---

### `DELETE /api/user/account`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Permanently delete the authenticated user's account and all associated data. Requires password confirmation. Deletes, in order: quest completions, user quests, user badges, notifications, device tokens, refresh tokens, category priorities, user settings, and the user record.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `password` | body | string | Yes | The user's current password for confirmation |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | "Incorrect password" or missing/invalid access token |
| 404 | `NOT_FOUND` | "User not found" |
| 422 | `VALIDATION_ERROR` | Password field is empty |

---

## Progress

All progress routes are mounted under `/api/progress`.

### `GET /api/progress/stats`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's overall statistics including XP, level, completion counts, day streaks (computed from actual completion data), badge count, and per-category breakdowns with per-quest streak calculations.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalXP": 1250,
    "level": 5,
    "totalQuestsCompleted": 87,
    "currentDayStreak": 12,
    "longestDayStreak": 21,
    "badgesEarned": 5,
    "categoryStats": {
      "physical_health": {
        "totalXP": 0,
        "totalCompletions": 30,
        "currentStreak": 7,
        "longestStreak": 14
      },
      "mental_wellness": {
        "totalXP": 0,
        "totalCompletions": 20,
        "currentStreak": 3,
        "longestStreak": 10
      },
      "career_productivity": {
        "totalXP": 0,
        "totalCompletions": 15,
        "currentStreak": 0,
        "longestStreak": 5
      },
      "relationships_social": {
        "totalXP": 0,
        "totalCompletions": 12,
        "currentStreak": 2,
        "longestStreak": 4
      },
      "home_chores": {
        "totalXP": 0,
        "totalCompletions": 10,
        "currentStreak": 0,
        "longestStreak": 3
      }
    },
    "weeklyAverage": 0,
    "monthlyAverage": 0
  }
}
```

Note: `categoryStats[].totalXP` is initialized at 0 in the current implementation. `weeklyAverage` and `monthlyAverage` are placeholders (always 0). Streaks (`currentDayStreak`, `longestDayStreak`) are calculated from real completion history, not cached counters.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "User not found" |

---

### `GET /api/progress/daily`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get quest completion progress for a single day. Defaults to today if no date is provided.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `date` | query | string | No | ISO 8601 date (e.g., `2026-07-07`). Defaults to today. |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2026-07-07T00:00:00.000Z",
    "totalXP": 15,
    "questsCompleted": 3,
    "questsTotal": 5,
    "categoryBreakdown": {
      "physical_health": 10,
      "mental_wellness": 5,
      "career_productivity": 0,
      "relationships_social": 0,
      "home_chores": 0
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid date format |

---

### `GET /api/progress/weekly`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get quest completion progress for a full week (Sunday through Saturday). Defaults to the current week. Returns an array of 7 daily progress objects plus weekly aggregates.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `weekStart` | query | string | No | ISO 8601 date for the start of the week. Defaults to the most recent Sunday. |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "weekStart": "2026-07-05T00:00:00.000Z",
    "weekEnd": "2026-07-11T23:59:59.999Z",
    "totalXP": 85,
    "dailyProgress": [
      {
        "date": "2026-07-05T00:00:00.000Z",
        "totalXP": 10,
        "questsCompleted": 2,
        "questsTotal": 5,
        "categoryBreakdown": {
          "physical_health": 5,
          "mental_wellness": 5,
          "career_productivity": 0,
          "relationships_social": 0,
          "home_chores": 0
        }
      }
    ],
    "topCategory": "physical_health",
    "streaksContinued": 0,
    "streaksBroken": 0
  }
}
```

Note: `streaksContinued` and `streaksBroken` are placeholders (always 0 in the current implementation). `topCategory` is the category with the most XP earned during the week.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid weekStart date format |

---

### `GET /api/progress/badges`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's earned badges with full badge details, sorted by `earnedAt` descending (most recent first).

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-badge-uuid",
      "userId": "uuid",
      "badgeId": "uuid",
      "earnedAt": "2026-07-05T12:00:00.000Z",
      "badge": {
        "id": "uuid",
        "name": "First Steps",
        "description": "Complete your first quest",
        "iconName": "trophy",
        "rarity": "common",
        "requirementType": "total_completions",
        "requirementValue": 1,
        "requirementCategory": null,
        "xpBonus": 10,
        "createdAt": "2026-06-18T00:00:00.000Z"
      }
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `GET /api/progress/leaderboard`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get a ranked leaderboard. Supports two modes: `weekly` (XP earned this week only, since Sunday) or `all-time` (total XP). Users are ranked and returned with their public profile info.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `type` | query | string | No | `weekly` or `all-time`. Default: `weekly` |
| `limit` | query | integer | No | 1-100. Default: `10` |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "displayName": "Jane",
      "avatarUrl": "https://example.com/avatar.png",
      "totalXP": 1250,
      "level": 5,
      "rank": 1,
      "weeklyXP": 85
    },
    {
      "userId": "uuid",
      "displayName": "Alex",
      "avatarUrl": null,
      "totalXP": 980,
      "level": 4,
      "rank": 2,
      "weeklyXP": 60
    }
  ]
}
```

For `all-time` type, `weeklyXP` is always `0`.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Invalid type or limit value |

---

## Health

All health routes are mounted under `/api/health`.

### `POST /api/health/sync`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Sync aggregated health metrics from the mobile app. The backend matches incoming metrics against the user's active quests that have a `healthDataType` set. If a metric meets a quest's `targetValue`, the quest is auto-completed for the current period. The user's total XP is incremented accordingly.

The mobile app is responsible for aggregating raw health data locally; only summary metrics are sent to the server (e.g., total steps today, total workout minutes).

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `metrics` | body | array | Yes | Non-empty array of health metric objects |
| `metrics[].type` | body | string | Yes | One of: `steps`, `distance`, `active_calories`, `sleep_hours`, `water_cups`, `workout_minutes`, `heart_rate`, `mindful_minutes`, `stand_hours` |
| `metrics[].value` | body | number | Yes | The measured value |
| `metrics[].source` | body | string | Yes | One of: `apple_health`, `google_fit`, `garmin`, `samsung_health`, `manual` |
| `metrics[].timestamp` | body | string | Yes | ISO 8601 timestamp |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "dataPoints": [
      {
        "type": "steps",
        "value": 10234,
        "unit": "",
        "source": "apple_health",
        "timestamp": "2026-07-07T08:30:00.000Z"
      }
    ],
    "questsAutoCompleted": ["user-quest-uuid-1", "user-quest-uuid-2"],
    "xpEarned": 10
  }
}
```

Note: The `unit` field in `dataPoints` is currently always set to an empty string. `questsAutoCompleted` contains the UserQuest IDs that were auto-completed.

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Missing or empty metrics array, invalid type/source/timestamp |

---

## Badges

All badge routes are mounted under `/api/badges`.

### `GET /api/badges`

**Authentication:** Optional
**Rate Limited:** Yes (100 req/15min)

**Description:** List all badges in the badge library. Sorted by rarity ascending, then by name ascending.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "First Steps",
      "description": "Complete your first quest",
      "iconName": "trophy",
      "rarity": "common",
      "requirementType": "total_completions",
      "requirementValue": 1,
      "requirementCategory": null,
      "xpBonus": 10,
      "createdAt": "2026-06-18T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/badges/user`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** List the authenticated user's earned badges with full badge details, sorted by `earnedAt` descending.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-badge-uuid",
      "userId": "uuid",
      "badgeId": "uuid",
      "earnedAt": "2026-07-05T12:00:00.000Z",
      "badge": {
        "id": "uuid",
        "name": "First Steps",
        "description": "Complete your first quest",
        "iconName": "trophy",
        "rarity": "common",
        "requirementType": "total_completions",
        "requirementValue": 1,
        "requirementCategory": null,
        "xpBonus": 10,
        "createdAt": "2026-06-18T00:00:00.000Z"
      }
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `POST /api/badges/check`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Evaluate all unearned badges against the user's current stats and award any that are now earned. Checks four requirement types:

- **`total_completions`** -- total quest completions across all quests
- **`xp_threshold`** -- total accumulated XP
- **`streak`** -- maximum current streak across all active quests
- **`category_completions`** -- completions within a specific quest category

Badges with requirement type `special` are skipped (require custom awarding logic). Each newly earned badge grants its `xpBonus` to the user's total XP.

**Request:** No parameters.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "awarded": [
      {
        "id": "uuid",
        "name": "Weekly Warrior",
        "description": "Complete quests for 7 consecutive days",
        "iconName": "fire",
        "rarity": "rare",
        "requirementType": "streak",
        "requirementValue": 7,
        "requirementCategory": null,
        "xpBonus": 50,
        "createdAt": "2026-06-18T00:00:00.000Z"
      }
    ],
    "xpBonusTotal": 50
  }
}
```

If no new badges are earned:

```json
{
  "success": true,
  "data": {
    "awarded": [],
    "xpBonusTotal": 0
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "User not found" |

---

## Notifications

All notification routes are mounted under `/api/notifications`.

### `POST /api/notifications/device-token`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Register or update a device push notification token. Uses upsert: if the token already exists, it updates the associated user, platform, device name, and last-active timestamp. Otherwise, it creates a new record.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `token` | body | string | Yes | Device push token (e.g., APNs or FCM token) |
| `platform` | body | string | Yes | One of: `ios`, `android`, `watchos`, `wear_os`, `tizen`, `garmin` |
| `deviceName` | body | string | No | Human-readable device name (trimmed) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "token": "fcm_token_abc123",
    "platform": "ios",
    "deviceName": "iPhone 15 Pro",
    "lastActive": "2026-07-07T12:00:00.000Z",
    "createdAt": "2026-07-07T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 422 | `VALIDATION_ERROR` | Missing token, invalid platform |

---

### `GET /api/notifications`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Get the authenticated user's notification history with pagination. Sorted by `createdAt` descending (newest first).

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `page` | query | integer | No | Page number (min 1). Default: `1` |
| `perPage` | query | integer | No | Items per page (1-100). Default: `20` |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "achievement",
      "title": "Badge Earned!",
      "body": "You earned the First Steps badge",
      "data": { "badgeId": "uuid" },
      "scheduledFor": null,
      "sentAt": "2026-07-05T12:00:00.000Z",
      "readAt": null,
      "createdAt": "2026-07-05T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 42,
    "hasMore": true
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |

---

### `PUT /api/notifications/:id/read`

**Authentication:** Required
**Rate Limited:** Yes (100 req/15min)

**Description:** Mark a notification as read. Sets `readAt` to the current timestamp. If the notification is already read, it is returned as-is without modification.

**Request:**

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `id` | path | UUID | Yes | Notification ID |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "type": "achievement",
    "title": "Badge Earned!",
    "body": "You earned the First Steps badge",
    "data": { "badgeId": "uuid" },
    "scheduledFor": null,
    "sentAt": "2026-07-05T12:00:00.000Z",
    "readAt": "2026-07-07T12:00:00.000Z",
    "createdAt": "2026-07-05T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 404 | `NOT_FOUND` | "Notification not found" (wrong ID or belongs to another user) |
| 422 | `VALIDATION_ERROR` | `id` is not a valid UUID |
