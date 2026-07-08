#!/usr/bin/env bash
# Seed local databases with development fixtures.
set -euo pipefail

echo "==> Seeding databases"
pnpm -r --if-present seed
echo "==> Seeding complete"
