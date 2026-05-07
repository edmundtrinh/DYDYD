# DYDYD Mobile UI Kit

A pixel-faithful recreation of the DYDYD habit-quest mobile app, built from the React Native source in `apps/mobile/src/screens/`.

## Screens
- `OnboardingScreen.jsx` — splash → name → starting category
- `HomeScreen.jsx` — greeting, daily progress ring, stat trio, health metrics, today's quests
- `QuestsScreen.jsx` — quest library with filter tabs and toggleable items
- `QuestDetailScreen.jsx` — full quest stats + complete-with-notes flow
- `ProfileScreen.jsx` — avatar + level + XP bar + stats grid + badges scroll + per-category breakdown

## Atoms / building blocks
- `tokens.jsx` — `dyColors`, `CATEGORIES`, `RARITY`, `fmtNum()`
- `Atoms.jsx` — `DYButton`, `DYEyebrow`, `DYLevelPill`, `DYProgressBar`
- `Cards.jsx` — `DYStatCard`, `DYProgressCard`, `DYHealthBlock`, `DYFilterTabs`, `DYEmptyState`
- `Chrome.jsx` — `DYHeader`, `DYScreenHeader`, `DYTabBar`
- `QuestCard.jsx` — `DYQuestCard` (the workhorse component)

## How to run
Open `index.html`. It loads through `<IOSFrame>` from the starter component.

## Faithfulness
- Colors, layout, copy, and category metadata lifted directly from the source. Where the source uses `#4CAF50` we substituted the design system's `#2EA043` (more pure / RPG-saturated per the brand brief).
- Original animations are Reanimated-only (springs, FadeInDown). We use CSS transitions for the web kit — interactions feel similar but not pixel-identical motion.
- Wearables & API services are stubbed; everything is in-memory state.
