# DYDYD Design System

> *"Did You Do Your Dailies?"* — A gamified habit tracker that turns daily life into an action‑RPG quest log. Earn XP, level up, defeat your own bad habits.

This is the design system for DYDYD — colors, type, spacing, motion, components, and an interactive UI kit modeled directly on the production React Native source.

---

## Sources used to build this system

| Source | Path | Notes |
|---|---|---|
| Codebase (private) | `DYDYD/` (mounted via File System Access API; assume the reader does **not** have it) | React Native + Expo monorepo with `apps/mobile`, `apps/backend`, `packages/shared` |
| GitHub | [`edmundtrinh/DYDYD`](https://github.com/edmundtrinh/DYDYD) | Same project, public-facing repo |
| Key files referenced | `apps/mobile/src/screens/home/HomeScreen.tsx`, `screens/quests/QuestsScreen.tsx`, `screens/quests/QuestDetailScreen.tsx`, `screens/profile/ProfileScreen.tsx`, `packages/shared/src/constants.ts`, `app.json` | Color values, copy, layout, animation patterns lifted directly from these |

No design files (Figma / Sketch) were attached. Visuals were derived from the React Native StyleSheets + the user's brief: *"classic action‑RPG, primary colors not pastel/neon, pure shades, functional & straightforward, rounded but not soft."*

---

## What's in this folder

```
.
├── README.md                  ← this file
├── SKILL.md                   ← agent-invocable skill manifest
├── colors_and_type.css        ← CSS vars: surfaces, primaries, type, radii, motion
├── assets/                    ← logo SVG, category emblems, icon system
├── preview/                   ← cards rendered in the Design System tab
├── ui_kits/
│   └── mobile/                ← React Native → web recreation of DYDYD mobile
│       ├── index.html         ← interactive click‑thru prototype
│       ├── README.md          ← how the kit is structured
│       └── *.jsx              ← components (HomeScreen, QuestsScreen, etc.)
└── slides/                    ← (none — no deck template was provided)
```

---

## The product, in 60 seconds

DYDYD is a habit tracker dressed as an RPG. The user picks daily / weekly "quests" (steps, sleep, meditate, journal, call a loved one, do laundry…) from a library of ~30 templates organized into 5 categories. Completing a quest awards **XP**; XP rolls into a **level** with a 1.15× growth curve, capped at 100 ("Immortal"). **Streaks** track consecutive completions; **badges** ("Week Warrior", "Century Club", "Hydration Hero") have rarity tiers from common to legendary. The home screen is built around: *greeting → today's progress ring → streak/completed/XP stat trio → category-tinted quest list*.

### Quest categories (from `packages/shared/src/constants.ts`)

| Category | Role color | What it covers |
|---|---|---|
| Physical Health | Quest Green `#2EA043` | Steps, sleep, hydration, exercise, hygiene |
| Mental Wellness | Arcane Purple `#7C3AED` | Meditation, journaling, reading, hobbies |
| Career & Productivity | Mana Blue `#2563EB` | Job apps, learning, networking, side projects |
| Relationships & Social | Heart Red `#DC2626` | Calls, family time, social outings, kindness |
| Home & Chores | Flame Orange `#EA580C` | Bed, dishes, laundry, deep clean, groceries |

XP / progress / "loot" are always **Loot Gold `#F5B400`**. The codebase ships category colors as Material 500s (`#4CAF50`, `#9C27B0`, `#2196F3`, `#E91E63`, `#FF9800`); we shifted them one notch toward **Tailwind 600s / pure primaries** per the brief — same hue mapping, more saturated, less candy.

---

## CONTENT FUNDAMENTALS

DYDYD's voice is the **GM (Game Master) voice**: encouraging, direct, second-person, light gamer slang — never sarcastic, never cute‑coded, never lecturing. It treats the user as the hero of their own story without overplaying it.

### Voice & tone

- **Person:** Always *you* / *your*. App refers to itself rarely; the system narrates, it doesn't introduce itself.
- **Tense:** Active, present. *"Walk 10,000 steps"*, not *"Walking 10,000 steps will help you…"*.
- **Imperatives for quests** ("Drink water", "Take a shower", "Make your bed"). They're orders from the quest board, not suggestions.
- **Metaphor budget:** RPG vocabulary is the **only** decorative layer. *Quest, XP, level, streak, badge, adventurer, hero, novice → master*. Don't stack metaphors (no "epic gym journey").
- **No filler praise.** "Quest complete." beats "Amazing job, you're crushing it!" — the XP number does the celebrating.
- **Honest empty states.** *"No quests yet! Add some quests to start your journey."* — short, points at the next action.

### Casing

- **Title Case** for screen titles, section headers, quest names, badge names, level titles. (*"Quest Library"*, *"Today's Quests"*, *"Walk 10,000 Steps"*, *"Week Warrior"*, *"Novice Adventurer"*.)
- **Sentence case** for descriptions and helper copy. (*"Get your daily steps in for better cardiovascular health"*.)
- **ALL CAPS** is reserved for eyebrow labels (`XP`, `LV`, `STREAK`) — never for sentences.

### Length

- Quest names: **2–5 words**, verb-first.
- Quest descriptions: **one short sentence**, ideally < 10 words.
- Empty states: title (2–4 words) + one helper line.
- Buttons: **1–2 words**, verb where possible (*"+ Custom"*, *"See All →"*, *"Create Custom Quest"*).

### Numbers, units, time

- XP is always prefixed with `+` when awarded (`+10 XP`) and styled in **Loot Gold** or **Quest Green** (when complete).
- Levels render as `Lv {N}` (compact) or `Level {N}` (full). Both ship in the codebase; pick one per surface.
- Streaks always read with the **🔥** icon and `N day streak` (singular / plural; don't abbreviate to "d").
- Compact numbers above 1000 use `.1K` / `.1M`. Always keep a leading digit.

### Emoji

Emoji are used **deliberately** in the running app — they're the cheapest way to get colorful, instantly readable category iconography on RN without bundling a vector set. They are **not** decorative; they map 1:1 to a meaning:

| Glyph | Meaning |
|---|---|
| 💪 | Physical Health |
| 🧠 | Mental Wellness |
| 💼 | Career & Productivity |
| ❤️ | Relationships & Social |
| 🏠 | Home & Chores |
| 🔥 | Streak / level / fire |
| ✓ | Quest complete |
| ⭐ | XP total |
| 🏆 | Best streak |
| 🏅 | Badge |
| 👑 | Premium |
| ⚙️ | Settings |
| 🎯 | Goal / empty quests |

For new design surfaces (web, marketing, slides) **prefer the SVG emblems in `assets/icons/`** to emoji — they hold the brand better at large sizes. Keep emoji for in-app density.

### Sample copy (drawn from the codebase)

- Greeting: *"Good morning, {name}!"* / *"Good afternoon, Adventurer!"*
- Header subtitle: *"Monday, May 4"* (full weekday + month + day)
- XP ring caption: *"{N} XP earned today"* + *"{N}% to Level {N+1}"*
- Empty quest list: *"No quests yet!"* / *"Add some quests to start your journey"* / button: `+ Add Quests`
- Quest meta line: `Daily · +10 XP · Auto`
- Streak line on quest card: `🔥 12 day streak  ·  47 completions`
- Account row: `Member Since · May 2024`

---

## VISUAL FOUNDATIONS

The aesthetic is **a midnight quest log**: pure-black-leaning navy paper, lit by saturated primary jewels. Borders are flat, corners are noticeably rounded but never pillowy, shadows are heavy because we live near 0% lightness.

### Backgrounds

- **Single-color flat fields**, no gradients in the chrome. App background is `#0F0F1A` (near-black with a tiny purple shift).
- **No background imagery** in the app itself. No textures, no full-bleed photos, no patterns. The only "image" surface is the user's avatar.
- **Slides / web (where this system is reused):** OK to add a **single subtle radial darken** behind hero numbers (gold or purple at ≤8% alpha) to make XP totals feel like loot drops. No purple→pink gradients, no aurora.

### Color in use

- **At most one accent per element.** A button is green OR gold OR red — never a blend.
- **Tinted backgrounds** for category chips: `category-color` at 20% alpha (`#4CAF5033` style) — that's the codebase pattern; we keep it. Foreground is the same color at 100%. Border is the same color when active, `--bg-surface-3` when not.
- **XP / loot / premium use Loot Gold `#F5B400`.** Level titles, total-XP big number, premium crown.
- **Imagery vibe:** minimal. When photography is used, **cool**, slightly desaturated, never warm‑and‑cozy. No grain, no duotone.

### Typography

- **Display (Sora 700/800)** for screen titles, big numbers (XP, level), eyebrow labels — geometric, dense, has weight.
- **Body (Manrope)** for everything else — high x-height, very legible at 12–16px on dark surfaces.
- **Mono (JetBrains Mono)** for code, IDs, debug surfaces only.
- **Tabular numerals on every number that animates or compares** (XP counters, streak days, % to next level) using `font-variant-numeric: tabular-nums`.

> **Substitution flag:** the React Native app inherits the OS system font (no custom fonts bundled). For this design system we **selected** Sora + Manrope + JetBrains Mono as production-ready Google Fonts that match the action‑RPG / functional brief. If the team has a licensed font in mind (e.g. Sharp Grotesk, GT America, Recoleta), drop the `.woff2` files into `fonts/` and update `colors_and_type.css`.

### Animation

- **Spring-first**, never linear. Defaults from `react-native-reanimated`: `withSpring({ damping: 15, stiffness: 100 })`. We mirror that with `--easing-spring` and `220ms` durations.
- **Entry animations are staggered per item:** `FadeInRight.delay(index * 100)` for lists, `FadeInDown.delay(100 * sectionIndex)` for sections. Each card slides in from below or from the right and settles with a slight overshoot.
- **No infinite ambient animations.** No pulsing glows, no shimmer placeholders, no looping particles. The only loop is a brief XP-bar fill on level-up.
- **Bounces** are reserved for completion: pressing a quest card does a `0.95 → 1` spring scale ("the quest jiggles when you stamp it complete"). Use sparingly.

### Hover, press, focus

| State | Visual |
|---|---|
| Hover (web) | `transform: translateY(-1px)` + shadow level up by one |
| Press | `transform: scale(0.97)` (cards) or `scale(0.95)` (icon buttons), instant down, spring back |
| Active list row | bg shifts to `--bg-pressed` (`#252538`) |
| Focus visible | `box-shadow: 0 0 0 2px var(--c-loot-gold)` — gold ring, 2px, no offset |
| Disabled | `opacity: 0.4`, no pointer events |

There is **no opacity-based hover** for primary actions — bright primary buttons gain a +5% lightness instead. Opacity-based hover is only used on already-completed items (quest card with strike-through).

### Borders, dividers, corners

- **1px borders** in `--bg-surface-3` (`#2A2A3E`) for default cards. Active = category color at 100%.
- **Dividers** are 1px solid `--bg-surface-3`, edge-to-edge inside cards.
- **Radii** (`--r-*` tokens):
  - 4 px: tiny chips, small badges
  - 8 px: pill segments, small inputs
  - **12 px: default card** (`questCard`, `statCard`)
  - 16 px: bigger panels, modal sheets, top of stat tiles
  - 20–24 px: profile card, full-screen sheets, big CTAs
  - Pill (∞): level badge, action buttons, filter tabs
- **No square corners.** Even icon containers use `r-md` (12).
- The brief said *"rounded but not too soft"* — so **no `r-2xl`+ for ordinary cards**. The 12px default reads structured, not pillowy.

### Shadows & elevation

- Three flat shadow steps, all heavy & dark (we sit on `#0F0F1A`):
  - `--shadow-1`: 1px hairline (`rgba(0,0,0,0.5)`) — for inputs, chips
  - `--shadow-2`: 4×12 (`0.45 alpha`) — default raised card
  - `--shadow-3`: 12×32 (`0.55 alpha`) — modals, the level-up hero card
- **Glow halos** for emphasis only (`--glow-green`, `--glow-gold`, `--glow-purple`) — used on the *currently active* quest, the level-up burst, and the premium crown. Glow = 1px ring at 55–60% alpha + 24px blur at 35–40% alpha. **Never on hover** — only on a tracked active state.
- **Inner stroke** (`--inner-stroke`) is added to every card for a subtle "engraved" edge — `inset 0 0 0 1px rgba(255,255,255,0.04)`.

### Cards

The default DYDYD card is:

```css
background: var(--bg-surface-1);   /* #1A1A2E */
border-radius: var(--r-md);        /* 12px */
padding: var(--s-3) var(--s-4);    /* 12 / 16 */
box-shadow: var(--shadow-2), var(--inner-stroke);
border: 1px solid var(--bg-surface-3);
```

Three card variants:

1. **Quest card** — leading colored 4px bar (`questColorBar`), tinted icon tile, name + meta, trailing XP, optional checkmark.
2. **Stat card** — colored top border (`borderTopWidth: 3, borderTopColor: cat`), centered icon + big number + label.
3. **Hero card** (profile / level-up) — `r-xl`, padded `s-6`, centered avatar + level badge + XP track. The only place we go larger.

### Layout rules

- Mobile is **20px horizontal gutter**, `s-4` (16) between cards.
- **Fixed elements:** safe-area-respecting top header (greeting + level pill), bottom tab bar (4 tabs: Home, Quests, Profile, Settings).
- Tab bar = `--bg-surface-1` over the page bg, no shadow, 1px top divider.
- Section heads are 18px bold + optional `See All →` action right-aligned.

### Transparency & blur

- **Almost none.** Real opacity is reserved for: tinted category backgrounds (20% alpha of color), the modal scrim (`--bg-overlay`, 72% near‑black). No frosted glass, no `backdrop-filter` blurs anywhere in the app.
- This is intentional — flat ink-on-stone reads as functional, the brief asked for that.

### Iconography

See `assets/icons/` and the **ICONOGRAPHY** section below.

---

## ICONOGRAPHY

DYDYD's mobile app uses **emoji as the primary icon system** — the 13-glyph set listed under "Emoji" above. There's no bundled icon font and no custom SVG set in the React Native code. Every quest, stat tile, badge slot, and category chip leans on emoji so the app ships native colorful glyphs without an asset pipeline.

For this design system we **augment** that with a vector layer for two reasons:

1. Emoji render inconsistently across OS versions and look weak above ~32 px.
2. Marketing surfaces (web, slides, store screenshots) need brand-grade iconography.

### What we ship

- **`assets/logo/dydyd-mark.svg`** — the wordmark, geometric uppercase set in Sora 800 with the *D-Y-D-Y-D* letters laid out as a quest checkbox row. One ✓ stamp on the final D.
- **`assets/logo/dydyd-emblem.svg`** — square emblem (icon-only) for app icon, favicon, slide watermarks. A shield silhouette wrapping the ✓.
- **`assets/icons/category-*.svg`** — 5 category emblems (Physical, Mental, Career, Relationships, Home). Solid-fill, two-tone (category color + 20% tint for negative space). Stroke-free.
- **`assets/icons/rarity-*.svg`** — 6 loot-rarity gem facets (common → mythic), single-color flat polygons.
- **CDN icon set:** for general UI affordances (settings, search, chevrons, +/×, plus the in-quest icons named in `constants.ts` like `walk`, `dumbbell`, `brain`, `briefcase`, `crown`, `flame`) we link **[Lucide](https://lucide.dev)** at v0.469.0 from CDN. Lucide's **24px stroke 2** style matches the brand: clean, geometric, no flourishes. Quest names in `constants.ts` already use Lucide-compatible icon slugs (`heart-pulse`, `chef-hat`, `users-round`, etc.).
- **Substitution flag:** the React Native app does *not* currently render Lucide. This is a forward-looking pick — if/when icons replace emoji in-app, this is the set. Flag for review.

### Rules

- **One icon system per surface.** Don't mix Lucide strokes with emoji on the same row. The mobile app is emoji-only today; the design system's slide/web work is Lucide + custom emblems.
- **24px** is the default icon size; **20px** in dense lists; **44px** for tap targets (icon centered in `--hit-min` button).
- **Stroke icons** use `currentColor` so they pick up the category color or `--fg-2`.
- **Filled icons** are reserved for: badges (rarity gems), category emblems on the home dashboard, the wordmark.
- **No duotone, no gradients on icons.** Pure flat colors.
- **Unicode is acceptable** for `→ ← × · ✓` inline in copy; not as primary iconography.

---

## Index — what to read next

- **[`SKILL.md`](./SKILL.md)** — agent skill manifest; load this when you want Claude to design *with* the brand.
- **[`colors_and_type.css`](./colors_and_type.css)** — the source of truth for tokens. Import this in any HTML you author.
- **[`preview/`](./preview/)** — the cards rendered in the project's Design System tab. One card per concept.
- **[`assets/`](./assets/)** — logos, category emblems, rarity gems.
- **[`ui_kits/mobile/`](./ui_kits/mobile/)** — interactive recreation of the mobile app's core screens (`index.html` is the click-thru; `*.jsx` are the components).

---

*Built from the `edmundtrinh/DYDYD` source. Tokens reflect the brief: pure primaries, dark stone, functional rounding, no candy.*
