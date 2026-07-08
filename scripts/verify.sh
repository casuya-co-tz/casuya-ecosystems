#!/usr/bin/env bash
# Verify workspace integrity: structure, configs, and that packages build/typecheck.
set -euo pipefail

echo "==> Verifying workspace"

errors=0
exempt="casuya-deployment casuya-docs casuya-design-system casuya-platform casuya-core"

for d in casuya-*/; do
  name="${d%/}"
  skip=0
  for e in $exempt; do
    [ "$name" = "$e" ] && skip=1 && break
  done
  [ $skip -eq 1 ] && continue

  for f in README.md LICENSE .gitignore package.json docs; do
    if [ ! -e "$d$f" ]; then
      echo "  MISSING $d$f"
      errors=$((errors + 1))
    fi
  done
  if [ -f "${d}package.json" ] && [ ! -f "${d}tsconfig.json" ]; then
    echo "  MISSING ${d}tsconfig.json (TypeScript package)"
    errors=$((errors + 1))
  fi
done

if [ "$errors" -gt 0 ]; then
  echo "==> Verification FAILED with $errors error(s)"
  exit 1
fi

echo "==> Structure OK. Running typecheck/build/test..."
pnpm -r typecheck
pnpm -r build
pnpm -r test

echo "==> Verification complete"
