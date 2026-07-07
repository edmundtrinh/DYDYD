# ADR-001: Yarn Workspaces + Turborepo Monorepo

**Status:** Accepted
**Date:** 2026-05-28 (inception; formally recorded 2026-07-07)
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD has three tightly coupled packages: a React Native mobile app, a Node.js/Express backend, and a shared TypeScript package containing domain types, constants, and utility functions. These packages share a common domain model (User, Quest, Badge, etc.) and evolve together -- a new quest category means type changes in shared, route changes in backend, and screen changes in mobile.

The question was whether to manage these as separate repositories or a single monorepo, and if a monorepo, which tooling to use.

## Decision

Use a single monorepo managed with **Yarn Workspaces** for package linking and dependency management, plus **Turborepo** for build orchestration and caching.

The structure:
```
apps/backend/        # Express API server
apps/mobile/         # React Native app
packages/shared/     # Shared types, constants, utilities
```

Turbo pipelines enforce build order: `shared` must build before `backend` or `mobile` consume it.

## Consequences

### What becomes easier

- **Type safety across boundaries.** The shared package (`@dydyd/shared`) is the single source of truth for domain types. Both apps import from it directly -- domain types are never redefined locally, eliminating type drift.
- **Atomic changes.** A schema change that touches all three packages is a single commit, single PR, single CI run. No cross-repo coordination or version pinning.
- **Shared tooling.** One `tsconfig.json` base, one CI workflow, one linting configuration. Reduces maintenance surface.
- **Dependency deduplication.** Yarn Workspaces hoists shared dependencies to the root, reducing `node_modules` size and install time.

### What becomes harder

- **CI complexity.** Every push runs tests for all packages even if only one changed. Turbo's caching mitigates this, but the CI workflow still needs to understand package boundaries for database service containers (backend-only concern).
- **Tooling overhead.** Turborepo configuration, workspace-aware scripts, and path resolution add cognitive load for new contributors. The root `package.json` has workspace-scoped script shortcuts to reduce friction.
- **React Native constraints.** Metro bundler has historically had issues with symlinked workspaces. Projects using Yarn Workspaces with React Native may need `watchFolders` and `nodeModulesPaths` configuration in `metro.config.js` to resolve module resolution issues.
- **Yarn 4 migration friction.** Yarn 4 (Berry) with PnP mode is not fully compatible with React Native. The project uses `nodeLinker: node-modules` to maintain compatibility, losing some PnP benefits.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Yarn Workspaces + Turbo (chosen)** | Native workspace support, Turbo caching, single lockfile, established in RN ecosystem | Turbo config overhead, Metro symlink workarounds needed |
| **Separate repos (polyrepo)** | Full isolation, independent CI, independent versioning | Type drift between packages, cross-repo PRs for domain changes, version pinning hell, no atomic commits |
| **Nx monorepo** | More features than Turbo (affected commands, module boundaries), computation caching | Heavier setup, steeper learning curve, less common in React Native projects, Nx plugins add abstraction |
| **pnpm workspaces** | Faster installs, stricter dependency isolation, disk-efficient | Less mature React Native support, community examples skew toward web projects |
| **Lerna (legacy)** | Established monorepo tool, familiar to many developers | Maintenance mode, feature-frozen, Turbo is the spiritual successor |
