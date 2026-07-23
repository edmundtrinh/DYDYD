# DYDYD Feature

Full SDLC workflow for implementing a new feature.

## Steps

1. **Create a GitHub issue** via the REST API (token in `token.txt`, never commit it)
   ```bash
   TOKEN=$(cat token.txt)
   curl -s -X POST https://api.github.com/repos/edmundtrinh/DYDYD/issues \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"<title>","body":"<description>"}'
   ```
   Note the issue number from the response.

2. **Create a feature branch** from `main` (or from the parent feature branch if nested)
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/<short-name>
   ```

3. **Implement with tests**
   - Backend routes: add Zod schema + `validateBody` middleware, import types from `@dydyd/shared`
   - New route: register in `apps/backend/src/index.ts`
   - Add test suite in `apps/backend/src/__tests__/routes/<route>.test.ts`
   - Mobile: add Redux slice + service + screen, wire into navigation

4. **Self-validate** — run the DYDYD review skill:
   ```
   /dydyd-review
   ```

5. **Create a PR** via the REST API
   ```bash
   TOKEN=$(cat token.txt)
   curl -s -X POST https://api.github.com/repos/edmundtrinh/DYDYD/pulls \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"<title>","body":"<body>","head":"<branch>","base":"main"}'
   ```

6. **Post a decision record comment** on the issue with:
   - Approach chosen
   - Alternatives considered (table format)
   - Assumptions and tradeoffs

7. **Close the issue** via REST API after CI passes
   ```bash
   TOKEN=$(cat token.txt)
   curl -s -X PATCH https://api.github.com/repos/edmundtrinh/DYDYD/issues/<number> \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"state":"closed"}'
   ```

## Constraints

- Never use `gh` CLI — always use the GitHub REST API with the PAT from `token.txt`.
- Never commit directly to `main`. Never use `--no-verify`.
- All domain types must come from `@dydyd/shared`.
