# ADR-008: Redux Toolkit + Redux Persist for State Management

**Status:** Accepted
**Date:** 2026-05-28 (inception; formally recorded 2026-07-07)
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD's mobile app manages complex state across multiple domains: authentication (JWT tokens, user session), quests (30+ predefined quests, custom quests, completion state), progress (XP, level, streaks), user profile, health data, notifications, and UI state. State must persist across app restarts for a seamless experience -- a user should not need to re-login or re-fetch quests every time they open the app.

The app has 19 screens and 14 components that read and write state. Some state is local to a screen, but most is global (auth token used by every API call, quest list displayed on multiple screens, XP/level shown in headers).

## Decision

Use **Redux Toolkit (RTK)** for state management with **Redux Persist** for selective persistence via AsyncStorage.

- 7 Redux slices: `auth`, `quests`, `progress`, `user`, `health`, `notifications`, `ui`
- Persisted slices: `auth`, `user`, `quests` (survive app restarts via AsyncStorage)
- Non-persisted slices: `ui`, `health` (ephemeral, refreshed on app launch)
- `createSlice` and `createAsyncThunk` for all state mutations and async operations
- Typed hooks (`useAppSelector`, `useAppDispatch`) for type-safe component access

## Consequences

### What becomes easier

- **Predictable state flow.** Redux's unidirectional data flow (dispatch action -> reducer -> new state -> re-render) makes state changes traceable and debuggable. Redux DevTools (when connected) show every action and state transition.
- **Selective persistence.** Redux Persist's `whitelist`/`blacklist` configuration allows fine-grained control over which slices survive app restarts. Auth tokens persist; UI state (modals, toasts) does not.
- **Cross-screen state sharing.** Quest completion on HomeScreen immediately updates ProgressScreen's XP display, BadgesScreen's unlock state, and the navigation tab badges -- all without prop drilling or context nesting.
- **Async operation management.** `createAsyncThunk` provides built-in `pending`, `fulfilled`, and `rejected` states for API calls, eliminating manual loading/error state management.
- **Testing.** Redux slices are pure functions (reducers) with no side effects. Testing a reducer is testing input/output with no mocking required. Async thunks can be tested with a mock store.
- **Ecosystem maturity.** Redux Toolkit is the official, maintained, recommended way to use Redux. Community knowledge, debugging tools, and middleware options are extensive.

### What becomes harder

- **Boilerplate.** Even with Redux Toolkit's simplified API, each new domain requires a slice file, typed selectors, typed dispatch, async thunks for API calls, and persistence configuration. Adding a new data domain is more ceremony than Zustand or MobX.
- **Learning curve.** Contributors unfamiliar with Redux must understand actions, reducers, slices, thunks, selectors, and persistence configuration. The conceptual overhead is higher than simpler alternatives.
- **Bundle size.** Redux + Redux Toolkit + Redux Persist + AsyncStorage is a larger dependency chain than alternatives like Zustand (1.1kb) or Jotai (2.4kb). For a mobile app, bundle size directly impacts cold start time.
- **Normalization pressure.** As the quest and badge libraries grow, Redux encourages normalized state (entities by ID with separate ID arrays). The current implementation uses denormalized arrays, which works at the current scale but may need refactoring for larger datasets.
- **Over-centralization risk.** The convenience of global state can lead to putting everything in Redux, including state that should be local to a screen or component. The `ui` slice already contains state (toast messages, modal visibility) that could be component-local.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Redux Toolkit + Persist (chosen)** | Predictable state flow, selective persistence, cross-screen sharing, mature ecosystem, testable reducers | Boilerplate, learning curve, bundle size, normalization pressure |
| **Zustand** | Minimal boilerplate (~1kb), hooks-native, no providers, simple persist middleware | Less structured for large state, no built-in async patterns, smaller ecosystem, less debugging tooling |
| **MobX** | Observable state is intuitive, minimal boilerplate, automatic re-renders | Magic (implicit reactivity), harder to debug state flow, decorator syntax, less explicit than Redux |
| **React Context + useReducer** | Built into React, no dependencies, simple for small state | Performance issues with many consumers (re-renders on any context change), no persist built-in, no middleware, no devtools |
| **Jotai / Recoil** | Atomic state model, fine-grained re-renders, minimal boilerplate | Atomic model is harder to reason about for domain-wide state, smaller ecosystem, persistence requires additional setup |
| **TanStack Query (React Query)** | Excellent for server state (caching, revalidation, optimistic updates) | Not designed for client-only state (UI, offline queues), would need a companion store for non-server state |
