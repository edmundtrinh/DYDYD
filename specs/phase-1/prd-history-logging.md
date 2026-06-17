# PRD: History Logging & Pattern Insights

> **Status**: APPROVED (2026-06-16)
> **Priority**: High — core differentiator
> **Phase**: 4 (milestoned delivery — see roadmap.md for execution order)

---

## Problem Statement

Users complete quests daily but have no visibility into their long-term patterns, trends, or progress over time. Without this feedback loop, the app feels transactional ("did you do it? yes/no") rather than transformative. Users can't see whether they're building real routines or just checking boxes.

Habit formation research shows that seeing your own patterns — especially improvements — is a key driver of sustained behavior change. Users need to feel that the app *understands* their journey.

## Proposed Solution

A **History Logging System** that records every quest completion with rich context (timestamp, time-of-day, category, source), then uses that data to:

1. Surface personalized insights ("You completed this an hour earlier than usual!")
2. Track week-over-week changes (inspired by iPhone Screen Time weekly reports)
3. Award time-based mini-achievements (inspired by Duolingo's Early Bird / Night Owl badges)
4. Power an analytics dashboard showing habit trends over time
5. Feed widget and Apple Watch complications with real-time progress context

---

## User Stories

### US-1: Completion Logging
**Given** a user completes a quest
**When** they tap the completion button
**Then** the system records: quest ID, timestamp, time-of-day bucket, value (if applicable), source (manual/health), and duration from quest activation to completion

### US-2: Timing Pattern Insights
**Given** a user has completed the same quest at least 5 times
**When** they complete it significantly earlier or later than their average
**Then** they see an inline insight: "Completed 1h earlier than your average — nice hustle!"

### US-3: Week-Over-Week Digest
**Given** a new week begins (Monday)
**When** the user opens the app
**Then** they see a brief weekly summary: total completions, XP earned, streak status, and comparison to previous week ("12 quests, up from 9 last week")

### US-4: Time-of-Day Badges
**Given** a user consistently completes quests in a specific time window
**When** they hit the badge threshold (e.g., 5 mornings in a row)
**Then** they earn a time-based badge (Early Bird, Night Owl, Steady Eddie)

### US-5: Analytics Dashboard
**Given** a user navigates to the Progress screen
**When** they view the dashboard
**Then** they see: completion heat map, per-category trends, health metric overlays, personal records, and week-over-week comparisons

### US-6: Widget / Watch Summary
**Given** a user has configured widgets or Apple Watch
**When** they glance at their device
**Then** they see: today's completion count, streak status, and a pace indicator ("2 ahead of your usual pace")

---

## Acceptance Criteria

1. Every quest completion creates a `QuestCompletion` record with: `questId`, `userId`, `completedAt` (ISO timestamp), `timeBucket` (enum: EARLY_MORNING/MORNING/AFTERNOON/EVENING/NIGHT), `value` (optional numeric), `source` (MANUAL/HEALTH_SYNC), `xpEarned`
2. After 5+ completions of the same quest, the system computes average completion time-of-day and flags deviations of 1+ hours as "early" or "late"
3. Timing insights appear as a brief toast/banner on the quest completion confirmation screen
4. Weekly digest shows: total completions, total XP, active quests, streak length, comparison to prior week (absolute + percentage change)
5. Time-of-day badges: "Early Bird" (5+ morning completions in a row), "Night Owl" (5+ evening/night), "Steady Eddie" (same time bucket for 7+ days), "Dawn Patrol" (complete all dailies before 9am for 5 days)
6. Dashboard charts: 7-day and 30-day views, with category color coding matching design system
7. Widget displays: quest count today (completed/total), streak, and one contextual line
8. All insights are computed from data already in the system — no additional user input required

---

## Edge Cases

- **Timezone changes**: Completions should be bucketed in the user's configured timezone, not UTC
- **First week**: No "week-over-week" comparison available — show absolute stats only
- **Missed days**: Weekly digest should honestly show dips ("7 quests, down from 12") — don't hide bad weeks
- **Health sync timing**: Auto-completions from HealthKit may arrive with a delay; use the health data timestamp, not the sync timestamp
- **Clock manipulation**: Don't award time-based badges if device clock appears to have changed significantly

---

## Dependencies

- `QuestCompletion` model exists in Prisma schema — has `completedAt`, `value`, `source`, `periodStart`, `notes`. **Needs `timeBucket` enum field added** (one Prisma migration).
- Backend analytics service (new — computes averages, detects deviations, generates digests)
- Progress screen enhancement (completion history list, then dashboard charts)
- Widget infrastructure (Phase 4 — see Q3 decision)
- Apple Watch complication (Phase 4 — see Q8 decision)

---

## Success Metrics

- **Insight engagement**: % of users who see an insight and complete another quest that session
- **Dashboard visits**: Weekly active users viewing the Progress screen
- **Retention impact**: Compare D7/D30 retention with vs without insight exposure
- **Badge unlock rate**: % of active users earning at least one time-based badge within 14 days

---

## Time-of-Day Buckets

| Bucket | Hours | Badge |
|--------|-------|-------|
| EARLY_MORNING | 4am – 7am | Dawn Patrol |
| MORNING | 7am – 12pm | Early Bird |
| AFTERNOON | 12pm – 5pm | Afternoon Adventurer |
| EVENING | 5pm – 9pm | — |
| NIGHT | 9pm – 4am | Night Owl |

**Steady Eddie**: Same bucket for the same quest, 7+ consecutive completions.

---

*Inspired by: Duolingo (time badges, streak mechanics), iPhone Screen Time (weekly digests, trend visualization)*
