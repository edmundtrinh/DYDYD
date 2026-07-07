---
title: "DYDYD System Architecture"
version: "1.0"
status: "current"
date: "2026-07-07"
author: "Edmund Trinh"
---

# System Architecture

## Table of Contents

- [Overview](#overview)
- [System Diagram](#system-diagram)
- [Layer Responsibilities](#layer-responsibilities)
- [Health Integrations](#health-integrations)
- [Push Notifications](#push-notifications)
- [Offline Sync](#offline-sync)
- [Authentication Flow](#authentication-flow)
- [Planned: iOS Widgets (Phase 4A)](#planned-ios-widgets-phase-4a)
- [Planned: Apple Watch (Phase 4A)](#planned-apple-watch-phase-4a)

## Overview

DYDYD is a gamified habit tracking application built as a **Yarn Workspaces + Turborepo monorepo** with three packages:

| Package | Path | Technology |
|---|---|---|
| Backend API | `apps/backend/` | Express 4, Prisma ORM, PostgreSQL |
| Mobile App | `apps/mobile/` | React Native 0.73, Expo, Redux Toolkit |
| Shared | `packages/shared/` | TypeScript types, constants, utilities |

## System Diagram

```mermaid
graph TB
    subgraph "Mobile App (React Native + Expo)"
        UI["UI Layer<br/>(Screens, Components)"]
        NAV["Navigation<br/>(React Navigation 6)"]
        REDUX["State Management<br/>(Redux Toolkit + Redux Persist)"]
        SERVICES["Services Layer"]
        OFFLINE["Offline Queue<br/>(AsyncStorage)"]
        HEALTH_SVC["Health Service"]
        NOTIF_SVC["Notifications Service<br/>(expo-notifications)"]
    end

    subgraph "Wearable Integrations (scaffolded)"
        AH["Apple HealthKit<br/>(react-native-health)"]
        GF["Google Fit<br/>(Platform API)"]
        GARMIN["Garmin Connect IQ<br/>(NativeModules scaffold)"]
        SAMSUNG["Samsung Health<br/>(NativeModules scaffold)"]
    end

    subgraph "Backend (Express + Prisma)"
        MW["Middleware Pipeline<br/>helmet → cors → rate-limit →<br/>json → compress → morgan"]
        AUTH_MW["Auth Middleware<br/>(JWT verify)"]
        VAL["Validation<br/>(express-validator)"]
        ROUTES["Route Handlers"]
        PRISMA["Prisma ORM"]
    end

    subgraph "Database"
        PG["PostgreSQL<br/>(11 models)"]
    end

    subgraph "External Services"
        EXPO_PUSH["Expo Push Notifications"]
    end

    subgraph "Shared Package (@dydyd/shared)"
        TYPES["TypeScript Types<br/>(User, Quest, Badge, etc.)"]
        CONSTANTS["Constants<br/>(quests, badges, XP config)"]
        UTILS["Utilities<br/>(XP calc, streaks, validation)"]
    end

    UI --> NAV
    UI --> REDUX
    REDUX --> SERVICES
    SERVICES --> OFFLINE
    SERVICES -->|"HTTPS/JSON"| MW
    HEALTH_SVC --> AH
    HEALTH_SVC --> GF
    HEALTH_SVC --> GARMIN
    HEALTH_SVC --> SAMSUNG
    NOTIF_SVC -->|"register token"| MW

    MW --> AUTH_MW
    AUTH_MW --> VAL
    VAL --> ROUTES
    ROUTES --> PRISMA
    PRISMA --> PG

    NOTIF_SVC ---|"local scheduling"| EXPO_PUSH

    TYPES -.->|"imported by"| UI
    TYPES -.->|"imported by"| ROUTES
    CONSTANTS -.->|"imported by"| UI
    CONSTANTS -.->|"imported by"| ROUTES
    UTILS -.->|"imported by"| SERVICES
    UTILS -.->|"imported by"| ROUTES

    style GARMIN stroke-dasharray: 5 5
    style SAMSUNG stroke-dasharray: 5 5
```

> Dashed borders indicate scaffolded services. Native modules are referenced in code but not yet installed or bridged.

## Layer Responsibilities

### Shared Package (`@dydyd/shared`)

The single source of truth for all domain types and business logic shared between backend and mobile.

- **`src/types.ts`** -- All TypeScript interfaces and enums: `User`, `Quest`, `Badge`, `HealthData`, `Progress`, `QuestCategory`, `QuestStatus`, etc.
- **`src/constants.ts`** -- 30+ predefined quests, 20+ badges, level titles (levels 1--100), XP configuration (base 100 XP, 1.15x exponential growth).
- **`src/utils.ts`** -- XP calculations, streak logic, date helpers, input validation, ID generation.

Must be built (`yarn shared build`) before backend or mobile can consume it. Turborepo pipelines enforce this ordering.

### Backend (`apps/backend/`)

Stateless REST API server. Responsibilities:

- **Authentication**: JWT-based. 15-minute access tokens, 7-day refresh tokens with rotation (old token revoked on refresh). Password reset via hashed tokens stored in the RefreshToken table with a `password_reset:` prefix.
- **Quest Management**: CRUD for user quests, quest completion with period-based limits (daily/weekly/monthly), automatic XP calculation, streak tracking.
- **Health Sync**: Accepts aggregated health metrics from the mobile app and auto-completes matching quests when target values are met. Raw health records are never sent to the server (Apple/Google data policy compliance).
- **Badge Evaluation**: Server-side badge check evaluates all unearned badges against current stats (total completions, XP thresholds, streaks, category completions) and awards in a single transaction.
- **Notifications**: Device token registration (upsert), notification history with pagination, mark-as-read. Note: the backend stores device tokens and notification records but does not currently have a send/dispatch endpoint -- push delivery is handled client-side via `expo-notifications`.
- **Rate Limiting**: 100 requests per 15-minute window per IP, applied globally to `/api/` routes.

### Mobile (`apps/mobile/`)

React Native application with Expo managed workflow. Responsibilities:

- **UI Rendering**: Screens and components for the full user journey (auth, onboarding, home, quests, progress, profile).
- **State Management**: Redux Toolkit with 7 slices (`auth`, `quests`, `progress`, `user`, `health`, `notifications`, `ui`). Persisted slices (`auth`, `user`, `quests`) use AsyncStorage via Redux Persist.
- **Offline Support**: `OfflineQueue` service persists actions (e.g., quest completions) to AsyncStorage when the network is unavailable. Queued actions flush with retry logic (max 3 retries) when connectivity is restored.
- **Health Data Collection**: Platform-specific health data aggregation (Apple HealthKit on iOS via `react-native-health`, Google Fit on Android). Summary metrics are sent to `POST /api/health/sync`.
- **Local Notifications**: Expo Notifications for quest reminders, scheduled locally on-device.

## Health Integrations

```mermaid
graph LR
    subgraph "iOS"
        HK["Apple HealthKit<br/>(react-native-health)"]
    end

    subgraph "Android"
        GF["Google Fit<br/>(Platform API)"]
    end

    subgraph "Scaffolded (NativeModules not installed)"
        GARMIN["Garmin Connect IQ"]
        SAMSUNG["Samsung Health<br/>(Wear OS + Tizen)"]
    end

    subgraph "Mobile App"
        HS["HealthService"]
    end

    subgraph "Backend"
        SYNC["POST /api/health/sync"]
    end

    HK -->|"steps, sleep,<br/>workout, heart rate"| HS
    GF -->|"steps, distance,<br/>calories"| HS
    GARMIN -.->|"planned"| HS
    SAMSUNG -.->|"planned"| HS

    HS -->|"aggregated metrics<br/>(never raw records)"| SYNC
    SYNC -->|"auto-completes<br/>matching quests"| DB[(PostgreSQL)]

    style GARMIN stroke-dasharray: 5 5
    style SAMSUNG stroke-dasharray: 5 5
```

Supported health data types: `steps`, `distance`, `active_calories`, `sleep_hours`, `water_cups`, `workout_minutes`, `heart_rate`, `mindful_minutes`, `stand_hours`.

Supported sources: `apple_health`, `google_fit`, `garmin` (scaffolded), `samsung_health` (scaffolded), `manual`.

## Push Notifications

The notification system has two parts:

1. **Local scheduling** (implemented): The `NotificationsService` on mobile uses `expo-notifications` to schedule quest reminders locally. It requests permission, obtains an Expo push token, and registers it with the backend via `POST /api/notifications/device-token`.

2. **Server-side push** (not yet implemented): The backend stores device tokens and notification records but does not have a dispatch endpoint. There is no server-to-Expo push path wired up yet. The `Notification` model tracks `scheduledFor`, `sentAt`, and `readAt` timestamps in preparation for this.

## Offline Sync

```mermaid
sequenceDiagram
    participant User
    participant App as Mobile App
    participant Queue as OfflineQueue<br/>(AsyncStorage)
    participant API as Backend API

    User->>App: Complete quest
    alt Network available
        App->>API: POST /api/quests/:id/complete
        API-->>App: 201 (completion + XP)
    else Network unavailable
        App->>Queue: enqueue(complete_quest, payload)
        Queue-->>App: Stored (id + timestamp)
    end

    Note over App,Queue: When network is restored...

    App->>Queue: flush(executor, onProgress)
    loop For each queued action (max 3 retries)
        Queue->>API: POST /api/quests/:id/complete
        alt Success
            API-->>Queue: 201
            Queue->>Queue: Remove from queue
        else Failure
            Queue->>Queue: Increment retryCount
        end
    end
    Queue-->>App: { synced: N, failed: M }
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Mobile App
    participant API as Backend
    participant DB as PostgreSQL

    Note over Client,DB: Registration
    Client->>API: POST /api/auth/register<br/>{email, password, displayName}
    API->>API: Validate input (express-validator)
    API->>DB: Check existing user
    API->>API: bcrypt.hash(password, 12)
    API->>DB: Create User + UserSettings
    API->>API: Sign JWT (15m access, 7d refresh)
    API->>DB: Store refresh token
    API-->>Client: 201 {user, tokens}

    Note over Client,DB: Login
    Client->>API: POST /api/auth/login<br/>{email, password}
    API->>DB: Find user by email
    API->>API: bcrypt.compare(password)
    API->>API: Sign new JWT pair
    API->>DB: Store refresh token
    API-->>Client: 200 {user, tokens}

    Note over Client,DB: Token Refresh (rotation)
    Client->>API: POST /api/auth/refresh-token<br/>{refreshToken}
    API->>API: Verify refresh token JWT
    API->>DB: Find valid stored token (not expired, not revoked)
    API->>API: Sign new JWT pair
    API->>DB: Transaction: revoke old + store new
    API-->>Client: 200 {accessToken, refreshToken}

    Note over Client,DB: Logout
    Client->>API: POST /api/auth/logout<br/>(Bearer token required)
    API->>DB: Revoke refresh token(s)
    API-->>Client: 200 {message}
```

## Planned: iOS Widgets (Phase 4A)

> **STATUS: PLANNED** -- No implementation exists. This section describes the intended architecture.

```mermaid
graph LR
    subgraph "Mobile App Process"
        REDUX_STORE["Redux Store"]
        MW_WIDGET["Widget Sync Middleware"]
    end

    subgraph "Shared App Group Container"
        UD["UserDefaults<br/>(App Groups)"]
    end

    subgraph "Widget Extension Process"
        TIMELINE["TimelineProvider"]
        WIDGET_VIEW["Widget Views"]
    end

    REDUX_STORE -->|"state changes"| MW_WIDGET
    MW_WIDGET -->|"write subset"| UD
    UD -->|"read on timeline<br/>reload"| TIMELINE
    TIMELINE --> WIDGET_VIEW

    WIDGET_VIEW -->|"WidgetKit.reloadTimelines()"| TIMELINE
```

**Planned widget types:**

| Size | Content | Data Needed |
|---|---|---|
| Small | Streak ring (current day streak) | `currentDayStreak`, `longestDayStreak` |
| Medium | Quest checklist (today's active quests) | Active `UserQuest[]` with completion status |
| Large | Dashboard (streak + XP + top quests) | Streak, level, XP, today's completions |

## Planned: Apple Watch (Phase 4A)

> **STATUS: PLANNED** -- The `WatchConnectivityService` is scaffolded (TypeScript interfaces and `NativeModules` references exist) but native modules are not installed or bridged.

```mermaid
graph TB
    subgraph "iPhone App"
        WATCH_SVC["WatchConnectivityService<br/>(scaffolded)"]
        HEALTH_SVC2["HealthService"]
    end

    subgraph "Apple Watch App (planned)"
        WATCH_APP["WatchOS App"]
        COMP["Complications"]
        HAPTIC["Haptic Reminders"]
        QUICK["Quick-Complete Action"]
    end

    subgraph "Shared"
        HEALTHKIT["HealthKit<br/>(shared access via<br/>App Group entitlement)"]
    end

    WATCH_SVC <-.->|"WatchConnectivity<br/>(sendMessage, transferUserInfo)"| WATCH_APP
    WATCH_APP --> COMP
    WATCH_APP --> HAPTIC
    WATCH_APP --> QUICK
    HEALTH_SVC2 --> HEALTHKIT
    WATCH_APP --> HEALTHKIT

    style WATCH_APP stroke-dasharray: 5 5
    style COMP stroke-dasharray: 5 5
    style HAPTIC stroke-dasharray: 5 5
    style QUICK stroke-dasharray: 5 5
```

**Planned watch message types** (defined in `WatchConnectivityService`):

- `SYNC_QUESTS` -- Send active quests to watch
- `QUEST_COMPLETED` -- Notify phone of watch-side completion
- `SYNC_PROGRESS` -- Send progress data to watch
- `REQUEST_SYNC` -- Watch requests fresh data
- `UPDATE_COMPLICATIONS` -- Trigger complication data refresh

**Planned watch features:**

- **Complications**: Streak count, XP progress ring, next quest due
- **Quick-Complete**: Tap to mark a quest done from the wrist
- **Haptic Reminders**: Gentle taps for quest reminders
- **HealthKit Shared Access**: Both iPhone and Watch read from the same HealthKit store via App Group entitlement
