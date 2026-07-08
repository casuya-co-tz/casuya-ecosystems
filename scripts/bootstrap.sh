#!/usr/bin/env bash
# Casuya workspace bootstrap: install dependencies and prepare local environment.
set -euo pipefail

echo "==> Casuya bootstrap"

# 1. Ensure pnpm is available
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Enabling via corepack..."
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
fi

# 2. Copy .env if missing
if [ ! -f .env ]; then
  echo "Creating .env from .env.example"
  cp .env.example .env
else
  echo ".env already exists, skipping"
fi

# 3. Install workspace dependencies
echo "Installing workspace dependencies..."
pnpm install

# 4. Install Python backend deps (casuya-platform)
if [ -f casuya-platform/requirements.txt ]; then
  if command -v pip >/dev/null 2>&1 || command -v pip3 >/dev/null 2>&1; then
    echo "Installing casuya-platform Python dependencies..."
    ( cd casuya-platform && ${PIP:-pip} install -r requirements.txt ) || \
      echo "WARNING: pip install failed. Run manually: cd casuya-platform && pip install -r requirements.txt"
  else
    echo "WARNING: pip not found. Install casuya-platform/requirements.txt manually."
  fi
fi

echo "==> Bootstrap complete. Next: pnpm dev"
