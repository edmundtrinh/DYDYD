# ADR-009: GitHub REST API Over gh CLI

**Status:** Accepted
**Date:** 2026-06-17
**Deciders:** Founder (Edmund Trinh)

## Context

DYDYD uses an agent-driven SDLC (ADR-006) where Claude Code agents create issues, open pull requests, post decision record comments, and close issues. These operations happen programmatically from within agent sessions, not from interactive terminal use.

The `gh` CLI -- GitHub's official command-line tool -- is the standard way to interact with GitHub from the terminal. However, agents operating in automated workflows need deterministic, scriptable GitHub interactions that work consistently across Windows and macOS environments.

## Decision

Use the **GitHub REST API** directly with a Personal Access Token (PAT) for all GitHub operations. Never use the `gh` CLI.

- Token stored in `token.txt` at the repo root (gitignored -- never committed)
- Read at runtime: `Get-Content token.txt -Raw | ForEach-Object { $_.Trim() }`
- Passed as header: `Authorization: Bearer <token>`
- All GitHub operations (create issue, open PR, post comment, close issue) use `Invoke-RestMethod` (PowerShell) or `curl`

Documented in commit `a7a6637` ("docs: add GitHub API workflow and gitignore token.txt") and codified in CLAUDE.md under the "GitHub API" section.

## Consequences

### What becomes easier

- **Deterministic behavior.** REST API calls have predictable request/response shapes. No interactive prompts, no terminal UI, no editor pop-ups. Agents can script the entire GitHub workflow without human intervention.
- **Cross-platform consistency.** The REST API behaves identically on Windows 11 (primary) and macOS (secondary). PowerShell's `Invoke-RestMethod` and bash `curl` both work with the same endpoint and headers.
- **Token management simplicity.** A PAT in a gitignored file is straightforward to rotate, scope, and audit. No `gh auth login` sessions, no browser-based OAuth flows, no credential helpers.
- **Full API access.** The REST API exposes every GitHub feature. Complex operations (posting structured comments, querying check run statuses, managing labels) are directly accessible without relying on `gh` extensions or parsing CLI output.
- **Explicit over implicit.** Every API call is visible in the agent's output with the full URL, headers, and body. There is no hidden behavior behind a CLI abstraction.

### What becomes harder

- **Verbosity.** A simple `gh pr create --title "..." --body "..."` becomes a multi-line `Invoke-RestMethod` call with explicit headers, URI, method, and body construction. More code for common operations.
- **Pagination.** List operations (issues, PRs, comments) require manual pagination via `Link` headers. The `gh` CLI handles this automatically.
- **Error handling.** HTTP status codes must be checked manually. The `gh` CLI provides human-readable error messages; raw API responses require parsing JSON error objects.
- **Authentication setup.** New contributors or new machines must create a PAT, save it to `token.txt`, and configure permissions. `gh auth login` is a more guided experience.
- **API versioning.** GitHub occasionally deprecates REST API endpoints. The `gh` CLI abstracts version changes; direct API use requires monitoring GitHub's changelog.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **GitHub REST API + PAT (chosen)** | Deterministic, cross-platform, full API access, no interactive prompts, explicit | Verbose, manual pagination, manual error handling, PAT setup per machine |
| **gh CLI** | Concise syntax, built-in pagination, human-readable errors, guided auth setup | Interactive prompts break agents, inconsistent behavior across shells, `gh auth` requires browser flow, output parsing is fragile |
| **GitHub GraphQL API** | Single request for complex queries, type system, no over-fetching | Steeper learning curve, harder to debug, query complexity for simple operations, unnecessary for most DYDYD operations |
| **Octokit.js (GitHub SDK)** | Type-safe, pagination built-in, retry logic, webhook support | Adds a dependency, requires Node.js runtime, heavier than direct REST calls from shell |
