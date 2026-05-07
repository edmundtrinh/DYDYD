---
name: dydyd-design
description: Use this skill to generate well-branded interfaces and assets for DYDYD (Did You Do Your Dailies?), a gamified habit-tracking mobile app. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- `README.md` — brand overview, content & visual foundations, iconography, file index
- `colors_and_type.css` — design tokens (colors, typography, spacing, radii, shadows) as CSS vars + semantic styles
- `fonts/` — Sora (display), Manrope (body), JetBrains Mono (mono / numerics)
- `assets/` — logo, category icons, badge / level imagery
- `preview/` — small HTML cards visualizing each system primitive
- `ui_kits/mobile/` — React JSX recreation of the app screens (Home, Quests, Quest Detail, Profile, Onboarding) plus reusable atoms

## House rules
- Action-RPG energy: pure primary colors, charcoal backgrounds, sharp typography. No pastels, no neon glow.
- Corner radii are rounded but not soft — pill (full-round) only for buttons/badges; cards live at 12–18px.
- Category color = identity. Always pair an icon with its category color when surfacing physical, mental, career, social, or home quests.
- Numbers use tabular figures (`font-variant-numeric: tabular-nums`) and gold (`--gold`) for XP totals.
- Tone: second-person, encouraging, light fantasy flourish ("Quest", "Adventurer", "Level up"). Never patronizing, never cute.
