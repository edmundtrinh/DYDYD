# SKILL.md

Recommended Claude Code skills and automations for the DYDYD project. These complement the agents in `.claude/agents/` and the workflow documented in `CLAUDE.md`.

## Active Skills (use these regularly)

### `/code-review --effort max`
Run before every PR. Catches correctness bugs, silent failures, N+1 queries, and missing error handling. Use `--effort max` for backend route changes; `--effort medium` for smaller diffs.

### `/review`
Review a pull request by number. Run after pushing a branch to get an independent read before merging.

### `/simplify`
After a feature is working and tested, run this to find over-engineered code, duplicate logic, or unnecessary abstractions in the changed files.

### `/security-review`
Run on any PR touching auth routes (`routes/auth.ts`), middleware (`middleware/auth.ts`), or data deletion (`routes/user.ts`). Catches token handling issues, missing revocations, and validation gaps.

### `/commit` (commit-commands plugin)
Creates a well-formed commit following project conventions. Avoids accidental inclusion of `token.txt` or other gitignored secrets.

### `commit-commands:commit-push-pr`
End-to-end SDLC skill: commit → push → open PR. Use at the end of each feature branch after tests pass and code review is done.

### `commit-commands:clean_gone`
Clean up local branches whose remote has been deleted. Run periodically to keep the branch list tidy.

## Specialist Agents (invoke via Agent tool or FleetView)

These live in `.claude/agents/` and are scoped to DYDYD domain knowledge:

| Agent | When to use |
|-------|-------------|
| `architect` | Backend API changes, schema migrations, CI/CD, infrastructure |
| `mobile` | React Native screens, navigation, Redux slices, wearable integrations |
| `qa` | Test strategy, writing test suites, coverage reports, bug triage |
| `product` | PRDs, user stories, acceptance criteria, roadmap |
| `design` | Visual QA, design tokens, component specs, brand consistency |
| `growth` | Analytics, onboarding, push notifications, ASO |
| `compliance` | Privacy policy, ToS, store listings, security audits |

## Recommended Automations (not yet configured)

### SDLC workflow skills to build
- **`dydyd:issue-and-branch`** — Given a feature description, creates a GitHub issue via REST API and checks out a feature branch with the right naming convention (`feat/`, `fix/`, `test/`, etc.)
- **`dydyd:pr-and-close`** — After tests pass: creates PR via REST API with summary + test plan, posts decision record comment on the linked issue, closes issue after merge confirmed

### Hook suggestions
- **Pre-commit**: Run `corepack yarn workspace @dydyd/backend test --passWithNoTests` before every commit to catch regressions
- **Post-tool (Edit)**: On edits to `routes/*.ts`, remind to run the matching test suite

## Plugin Recommendations

**Keep active for DYDYD:**
- `pr-review-toolkit` — silent-failure-hunter and code-reviewer skills
- `expo` — EAS build commands and Expo config awareness
- `prisma` — schema introspection and migration assistance
- `playwright` — when E2E tests are set up (Phase 3, issue #61)
- `code-review`, `code-simplifier` — code quality loop
- `github` — REST API awareness for SDLC automation

**Can deactivate for DYDYD (wrong domain):**
- `gitlab` — project uses GitHub
- `atlassian` — no Jira/Confluence in this project
- `data`, `data-engineering` — ETL project plugins, not relevant here
- `greptile` — code search not needed with local codebase
