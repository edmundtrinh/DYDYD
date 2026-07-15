#!/usr/bin/env bash
# Pre-push CI check: validates the 3 things that fail in CI
# 1. yarn.lock is in sync (yarn install --immutable)
# 2. Prisma client is generated
# 3. TypeScript compiles
#
# Runs automatically via git pre-push hook.
# Skip with: git push --no-verify (NOT recommended)

set -e

echo "[pre-push] Checking CI readiness..."

# 1. Check yarn.lock is in sync
echo "[pre-push] Verifying yarn.lock..."
if command -v corepack >/dev/null 2>&1; then
  YARN_CMD="corepack yarn"
else
  YARN_CMD="yarn"
fi

$YARN_CMD install --immutable --immutable-cache 2>/dev/null || {
  echo ""
  echo "ERROR: yarn.lock is out of sync with package.json"
  echo "Run 'corepack yarn install' and commit the updated yarn.lock"
  exit 1
}

# 2. Check Prisma client matches schema
echo "[pre-push] Generating Prisma client..."
$YARN_CMD workspace @dydyd/backend prisma generate >/dev/null 2>&1 || {
  echo ""
  echo "ERROR: Prisma client generation failed"
  echo "Run 'yarn workspace @dydyd/backend prisma generate'"
  exit 1
}

# 3. Quick typecheck on backend (catches schema/type drift)
echo "[pre-push] Type checking backend..."
$YARN_CMD workspace @dydyd/backend tsc --noEmit 2>&1 || {
  echo ""
  echo "ERROR: TypeScript compilation failed"
  echo "Fix type errors before pushing"
  exit 1
}

echo "[pre-push] All CI checks passed."
