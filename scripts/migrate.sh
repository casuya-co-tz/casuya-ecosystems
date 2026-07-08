#!/usr/bin/env bash
# Run database migrations across services that support them.
set -euo pipefail

echo "==> Running migrations"
pnpm -r --if-present migrate
echo "==> Migrations complete"
