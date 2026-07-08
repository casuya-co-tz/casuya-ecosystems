#!/usr/bin/env bash
# Stop all locally-started Casuya dev processes and shared infra.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PIDFILE="$ROOT/.dev-pids"
if [ -f "$PIDFILE" ]; then
  echo "Stopping local services..."
  while read -r pid; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null && echo "  killed $pid"
  done < "$PIDFILE"
  rm -f "$PIDFILE"
fi

echo "Stopping shared infrastructure..."
docker compose stop postgres redis 2>/dev/null || true

echo "==> Stopped. (Use 'docker compose down' to remove volumes.)"
