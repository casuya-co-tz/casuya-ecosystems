#!/usr/bin/env bash
# Build every package in the workspace.
set -euo pipefail

echo "==> Building all packages"
pnpm -r build
echo "==> Build complete"
