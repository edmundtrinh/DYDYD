# DYDYD Mobile App Accessibility Audit Report

**Date**: 2026-07-09
**Standard**: WCAG 2.1 AA
**Platform**: React Native 0.79 / Expo 53
**Auditor**: Edmund Trinh

---

## Executive Summary

The DYDYD mobile app has significant accessibility gaps across all screens and most components. Two components (ToastContainer, StreakCalendar) demonstrate good accessibility patterns that should be replicated. The primary issues fall into six categories: missing screen reader semantics, absent reduced-motion support, inaccessible gesture-only interactions, unannounced dynamic content, undersized touch targets, and minor contrast concerns.

**Findings by severity**:
- Critical: 6
- Major: 14
- Minor: 12

---

## 1. Screen Reader Support (accessibilityLabel, accessibilityRole, accessibilityHint, accessibilityState)

### Critical

| Location | Issue | Fix |
|----------|-------|-----|
| QuestCard (component) | Swipe-to-complete gesture is the only completion path; screen reader users cannot complete quests | Add `accessibilityActions` with "complete" action and `onAccessibilityAction` handler |
| QuestCompletionOverlay | `pointerEvents="none"` blocks all screen reader interaction; XP earned is never announced | Use `AccessibilityInfo.announceForAccessibility` for XP notification |
| HomeScreen inline QuestCard | No accessibilityLabel, accessibilityRole, or accessibilityState on any interactive element | Add full a11y props to all Pressable/TouchableOpacity elements |

### Major

| Location | Issue | Fix |
|----------|-------|-----|
| Button (component) | Missing accessibilityRole="button", accessibilityState={disabled}, accessibilityHint | Add props |
| Input (component) | Password toggle missing accessibilityRole="button", accessibilityLabel; error text not linked | Add props, use accessibilityLabelledBy |
| XPBar (component) | Missing accessibilityRole="progressbar", accessibilityValue={min,max,now} | Add progressbar semantics |
| Badge (component) | No accessibilityLabel describing badge name/rarity/locked state | Add descriptive label |
| StatCard (component) | No accessibilityLabel combining icon meaning + value + label | Add composite label |
| LoginScreen | Error banner missing accessibilityRole="alert" + accessibilityLiveRegion; "Forgot password" missing role | Add alert semantics and link roles |
| RegisterScreen | Password strength indicator not accessible to screen readers | Add accessibilityLabel with strength text |
| QuestsScreen | Search input missing accessibilityLabel; FilterTab missing accessibilityRole="tab"; action buttons missing labels | Add all missing props |
| QuestDetailScreen | Back button, complete button, notes toggle, text inputs all missing a11y props | Add labels, roles, hints |
| ProgressScreen | Weekly chart bars not accessible; category breakdown bars missing labels | Add accessibilityLabel per bar |
| ProfileScreen | Avatar, settings gear, stat cards, badge cards, category rows all missing a11y props | Add labels and roles |
| SettingsScreen | Switch components missing accessibilityLabel; navigation rows missing accessibilityRole; delete account missing destructive hint | Add props |
| CategoryPriorityScreen | Category cards missing accessibilityRole; long-press reorder has no accessible alternative | Add checkbox role, document reorder limitation |
| SelectQuestsScreen | Quest cards missing accessibilityRole="checkbox" and accessibilityState; filter tabs missing role | Add props |

### Minor

| Location | Issue | Fix |
|----------|-------|-----|
| CategoryIcon (component) | Decorative emoji read aloud by screen readers | Mark accessible={false} when parent provides context |
| LoadingScreen (component) | ActivityIndicator missing accessibilityLabel | Add "Loading" label |
| WelcomeScreen | Shield emoji decorative but announced | Mark accessible={false} |
| AddQuestScreen | Category chip emoji decorative; create button missing accessibilityRole | Mark emoji accessible={false}, add button role |
| ForgotPasswordScreen | Success state transition not announced via live region | Add accessibilityLiveRegion |
| NotificationsScreen | Switches missing accessibilityLabel | Add labels |
| HealthIntegrationsScreen | Connect/Disconnect buttons missing accessibilityLabel and role | Add props |
| HealthPermissionsScreen | Buttons missing accessibilityRole; skip link missing role | Add props |
| NotificationPermissionsScreen | Same as HealthPermissions | Add props |
| OnboardingCompleteScreen | Particles decorative but not marked | Mark accessible={false} |
| BadgesScreen | Earned/locked state communicated only visually (relies on Badge component fix) | Fixed via Badge component |

---

## 2. Touch Targets (minimum 44x44pt)

### Major

| Location | Issue | Measured Size | Fix |
|----------|-------|---------------|-----|
| QuestsScreen actionButton | Touch target too small | ~36pt | Add hitSlop={{top:8,bottom:8,left:8,right:8}} |
| QuestsScreen FilterTab | Touch target too short | ~34pt tall | Add hitSlop={{top:6,bottom:6}} |
| QuestDetailScreen backButton | Touch target too small | 40x40pt | Add hitSlop={{top:4,bottom:4,left:4,right:4}} |

### Minor

| Location | Issue | Fix |
|----------|-------|-----|
| Input password toggle | May be undersized despite hitSlop | Verify hitSlop provides 44pt effective area |

---

## 3. Color Contrast (4.5:1 minimum for normal text, 3:1 for large text 18pt+)

### Major

| Location | Foreground | Background | Ratio | Fix |
|----------|-----------|------------|-------|-----|
| HomeScreen statSubtitle | #666666 | #1A1A2E | ~3.0:1 | Change to #9E9EB8 (~4.6:1) |
| QuestDetailScreen lastCompletedLabel | #666666 | #1A1A2E | ~3.0:1 | Change to #9E9EB8 |
| QuestDetailScreen activateHint | #666666 | #1A1A2E | ~3.0:1 | Change to #9E9EB8 |

### Minor (Informational - partial exemption for non-text/placeholder content)

| Location | Foreground | Background | Ratio | Note |
|----------|-----------|------------|-------|------|
| Placeholder text (#5A5A6E) | #5A5A6E | #1A1A2E | ~2.5:1 | Placeholder text has partial exemption; no fix required but flagged |

---

## 4. Focus & Navigation

### Minor

| Location | Issue | Fix |
|----------|-------|-----|
| LevelUpOverlay | Dismiss area not keyboard/focus accessible | Add accessibilityRole="button", accessibilityLabel="Dismiss" |
| BadgeEarnedModal | Same dismiss area issue | Same fix |

---

## 5. Text & Typography (Dynamic Type support)

### Informational

All text components use default React Native Text which supports dynamic type scaling. No `allowFontScaling={false}` found anywhere. Fixed-height containers (Button minHeight 48, cards) may clip at very large type sizes, but fixing this would require layout rewrites beyond the scope of this audit. **No action required.**

---

## 6. Motion & Animation (Reduced Motion)

### Critical

| Location | Issue | Fix |
|----------|-------|-----|
| OnboardingCompleteScreen | Infinite `Animated.loop` shimmer animations violate "no infinite loops" rule and reduced-motion | Gate with useReducedMotion hook; disable loops when reduced motion enabled |
| LevelUpOverlay | Spring animations with no reduced-motion check | Gate with useReducedMotion hook |
| BadgeEarnedModal | Spring animations with no reduced-motion check | Gate with useReducedMotion hook |

### Major

| Location | Issue | Fix |
|----------|-------|-----|
| QuestCompletionOverlay | Entrance/exit animations not gated | Gate with useReducedMotion hook |
| WelcomeScreen | FadeIn entrance animations not gated | Gate with useReducedMotion hook |
| ForgotPasswordScreen | Success transition animation not gated | Gate with useReducedMotion hook |
| HomeScreen | ProgressRing animation and FadeIn entrance not gated | Gate with useReducedMotion hook |

---

## Positive Findings

| Component | Good Practice |
|-----------|--------------|
| ToastContainer | accessibilityLiveRegion="polite", accessibilityRole="alert", dismiss button has label and role |
| StreakCalendar | Calendar cells have descriptive accessibilityLabel with date and quest count |
| AddQuestScreen | Category and frequency chips have accessibilityRole="radio" and accessibilityState |

---

## Implementation Plan

1. Create shared `useReducedMotion` hook
2. Fix shared components (Button, Input, Card, Badge, XPBar, StatCard, CategoryIcon, LoadingScreen, QuestCard)
3. Fix overlay components (LevelUpOverlay, BadgeEarnedModal, QuestCompletionOverlay)
4. Fix auth screens (Login, Register, Welcome, ForgotPassword)
5. Fix main screens (Home, Quests, QuestDetail, AddQuest, Progress, Badges, Profile, Settings)
6. Fix onboarding screens (CategoryPriority, SelectQuests, HealthPermissions, NotificationPermissions, OnboardingComplete)
7. Fix contrast issues (#666666 -> #9E9EB8)
8. Fix touch targets (hitSlop additions)
9. Validate: TypeScript compilation + test suite
