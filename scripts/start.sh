#!/usr/bin/env bash
# Start local development WITHOUT building Docker images for every service.
# Brings up shared infra (postgres, redis) in Docker and runs the runnable
# packages (platform frontend/backend, orchestrator dashboard) as local
# processes. The API gateway is started if it has a runnable entry.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PIDFILE="$ROOT/.dev-pids"
: > "$PIDFILE"

echo "==> Casuya local dev (Docker-free services)"

echo "Starting shared infrastructure (postgres, redis)..."
docker compose up -d postgres redis || {
  echo "WARNING: docker compose up failed (is Docker running?). Continuing with local services."
}

start_bg() {
  local label="$1"; shift
  echo "Starting $label..."
  "$@" >> "$ROOT/.dev-$label.log" 2>&1 &
  echo $! >> "$PIDFILE"
}

# Orchestrator dashboard (:4010)
( cd casuya-orchestrator && node dashboards/dev-server/index.js ) &
echo $! >> "$PIDFILE"

# Platform frontend (static, :5173)
( cd casuya-platform && npx serve frontend -l 5173 ) &
echo $! >> "$PIDFILE"

# Platform backend (Python/uvicorn, :8000)
( cd casuya-platform && python -m uvicorn backend.main:app --reload --port 8000 ) &
echo $! >> "$PIDFILE"

# API gateway (build then run)
if grep -q '"start"' casuya-api/package.json 2>/dev/null; then
  echo "Building casuya-api..."
  ( cd casuya-api && pnpm build ) || echo "WARNING: casuya-api build failed"
  ( cd casuya-api && node dist/server.js ) &
  echo $! >> "$PIDFILE"
else
  echo "NOTE: casuya-api has no runnable server entry yet — skipped."
fi

echo ""
echo "==> Services starting. Dashboard: http://localhost:4010"
echo "    Frontend: http://localhost:5173   Backend: http://localhost:8000"
echo "    Logs: .dev-*.log   Stop with: pnpm stop"
