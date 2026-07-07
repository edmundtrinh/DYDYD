# ADR-003: Continuous Native Generation (CNG)

**Status:** Accepted
**Date:** 2026-06-16
**Deciders:** Founder (Edmund Trinh)

## Context

The project had inconsistent native directory handling. The `android/` directory was regenerated via `expo prebuild` and committed to git with unresolved build issues. The `ios/` directory was partially committed -- generated Xcode project files were gitignored, but hand-authored Swift extensions (home screen widget at 435 lines, Apple Watch app at 503 lines) were tracked.

This inconsistency created three problems:
1. **Merge conflicts.** Generated native files changed on every prebuild, producing noise in diffs and conflicts between feature branches.
2. **Contributor confusion.** New contributors could not tell which files were generated vs. hand-authored, and running `expo prebuild` would overwrite or conflict with committed files.
3. **Android build failure.** The committed `android/` directory had lingering build issues from a package rename that prevented clean Android builds.

This corresponded to **Q2 (Android Native Directory Strategy)** in the project's open questions.

## Decision

Adopt **Continuous Native Generation (CNG)** -- Expo's recommended workflow:

1. Gitignore both `ios/` and `android/` generated output
2. Move hand-authored Swift code (widget, watch app) into Expo config plugins that inject the code during `expo prebuild`
3. Treat native directories as ephemeral build artifacts, regenerated on demand

Implemented in commit `6e7c32f` ("infra: adopt Continuous Native Generation (CNG) workflow").

## Consequences

### What becomes easier

- **Clean builds every time.** Running `expo prebuild` produces a fresh native project with zero accumulated drift. The Android build issues were resolved immediately by regenerating from scratch.
- **Contributor experience.** Contributors never touch native code directly. JavaScript/TypeScript changes are all that matter for most contributions. No Xcode or Android Studio required.
- **Merge conflict elimination.** No generated files in git means no conflicts on `Podfile.lock`, `project.pbxproj`, or Gradle files -- historically the noisiest files in React Native repos.
- **Platform version upgrades.** Upgrading Expo SDK or React Native version regenerates native projects from scratch, avoiding the painful manual merge of native file changes.

### What becomes harder

- **Native code indirection.** All native modifications must go through config plugins. Direct edits to `Info.plist`, `AppDelegate.m`, `MainActivity.java`, or `build.gradle` are overwritten on the next prebuild. Config plugins require understanding Expo's modification API.
- **Widget and Watch migration.** The existing 435-line Swift widget and 503-line Swift watch app must be wrapped in config plugins that inject them during prebuild. This is non-trivial and is tracked as a Phase 4B task (CNG migration -- issue #62).
- **Local native debugging.** Debugging native crashes requires first running `expo prebuild` to generate the native project, then opening in Xcode/Android Studio. The generated project is ephemeral, so breakpoints and native-level debugging state are lost between prebuilds.
- **Config plugin maintenance.** Every native dependency that requires manual linking or native file modification needs a corresponding config plugin. The config plugin ecosystem is growing but not exhaustive.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **CNG (chosen)** | Clean builds, no merge conflicts, contributor-friendly, Expo recommended | Config plugin indirection, widget/watch migration effort, ephemeral native projects |
| **Bare workflow (commit both dirs)** | Direct native access, no config plugin layer, easier native debugging | Merge conflicts on generated files, Android build issues persist, contributors need Xcode/Android Studio |
| **Hybrid (gitignore generated, commit hand-authored)** | Keeps Swift extensions accessible, no config plugin migration | Complex `.gitignore` patterns, contributor confusion about which files are safe to modify, prebuild can still overwrite tracked files |
