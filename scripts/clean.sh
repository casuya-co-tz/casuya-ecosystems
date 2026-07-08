#!/usr/bin/env bash
# Clean build artifacts and dependencies across the workspace.
set -euo pipefail

echo "==> Cleaning workspace"
pnpm -r clean
echo "==> Clean complete"
