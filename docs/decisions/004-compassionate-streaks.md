# ADR-004: Compassionate Streak Design

**Status:** Accepted
**Date:** 2026-06-16
**Deciders:** Founder (Edmund Trinh)

## Context

Streak mechanics are a core engagement driver in habit apps. The industry standard -- popularized by Duolingo -- is punitive: miss a day, lose your streak, feel bad, re-engage out of loss aversion. This approach demonstrably drives engagement (Duolingo reported 36% YoY DAU growth driven in part by streak mechanics), but it also causes anxiety, guilt, and eventually churn when users break a long streak and feel too demoralized to restart.

The founder is self-described as scatter-brained and procrastination-prone -- exactly the user profile that punitive streaks harm most. A user who misses one day and sees "Streak: 0" after 30 days of consistency is more likely to uninstall than re-engage.

Finch, a compassionate gamification app, grew to approximately $30M ARR by taking the opposite approach -- meeting users where they are with encouragement rather than guilt. Apps with interactive widgets see 12-18% lifts in re-engagement. The opportunity is to combine proven engagement patterns with genuinely supportive design.

## Decision

Implement a **compassionate streak system** modeled after evidence-backed alternatives to punitive mechanics:

1. **Streak Freezes.** Users bank a freeze on good days; the freeze auto-applies on missed days (Duolingo model, but available for free rather than paywalled).
2. **Comeback Quests.** Missing a day triggers a special "Welcome Back" quest with bonus XP, reframing a miss as an opportunity rather than a failure.
3. **Progressive onboarding.** New users start with ONE morning habit, adding more over weeks (Fabulous model). Prevents the overwhelm that leads to early churn.
4. **2-minute minimum quest bars.** Every quest has a minimum bar so low "you'd feel silly saying no." Lowers the activation energy for bad days.
5. **Gentle re-engagement notifications.** "We missed you!" not "You broke your streak!" Tone matters at the moment a user is most likely to churn.

## Consequences

### What becomes easier

- **User retention on bad days.** Streak freezes and comeback quests convert what would be a churn event into a re-engagement event. The user's worst day with the app is still a positive interaction.
- **Founder dogfooding.** The founder is the primary user. Punitive mechanics would make the app unpleasant to use for its creator, undermining development motivation.
- **Brand differentiation.** Most habit apps compete on gamification intensity. Compassionate design is a genuine differentiator that resonates in app store reviews and word-of-mouth.
- **Progressive disclosure.** Starting with one habit and gradually adding more reduces the "blank slate" problem of onboarding and gives the app time to demonstrate value.

### What becomes harder

- **Engagement measurement.** Without punitive mechanics, engagement metrics (DAU, retention curves) may look different from industry benchmarks. Success must be measured by sustained weekly active usage, not daily streak anxiety.
- **Streak freeze balance.** Too generous and streaks become meaningless. Too stingy and the system feels punitive anyway. Requires iteration and user feedback to calibrate.
- **Implementation complexity.** Comeback quests, streak freezes, and progressive onboarding are each non-trivial features. A simple "streak = consecutive days" counter is far simpler to build and maintain.
- **A/B testing difficulty.** As a solo-founder project, there is no user base to A/B test compassionate vs. punitive mechanics. The decision is conviction-driven, not data-driven.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Compassionate streaks (chosen)** | User-friendly, reduces churn on bad days, brand differentiator, founder-aligned | More complex to implement, harder to benchmark, streak freezes need calibration |
| **Punitive streaks (Duolingo model)** | Proven engagement driver (36% YoY DAU growth), simple to implement, industry standard | Causes anxiety, punishes the target user profile (scatter-brained), high churn after streak breaks |
| **No streaks** | Simplest implementation, no anxiety, focus on intrinsic motivation | Removes a proven engagement mechanic entirely, harder to drive daily habit formation, fewer gamification hooks |
| **Social streaks (team-based)** | Social accountability drives engagement, less individual pressure | Requires multiplayer infrastructure, privacy concerns, social pressure can also be punitive |
