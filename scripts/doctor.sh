#!/usr/bin/env bash
# Diagnose the local developer environment for required tooling and services.
set -uo pipefail

pass=0
warn=0
fail=0

ok()   { echo "  [x] $1"; pass=$((pass + 1)); }
bad()  { echo "  [ ] $1"; fail=$((fail + 1)); }
warnmsg() { echo "  [~] $1"; warn=$((warn + 1)); }

check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    local v
    v=$("$1" --version 2>/dev/null | head -n1)
    ok "$1 installed ($v)"
  else
    bad "$1 NOT INSTALLED  -> install via your package manager (e.g. corepack enable for pnpm)"
  fi
}

check_port() {
  local name=$1 port=$2
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "$port" 2>/dev/null; then
      ok "$name reachable on :$port"
    else
      warnmsg "$name NOT reachable on :$port  -> run 'pnpm start' to launch infra"
    fi
  else
    warnmsg "$name :$port (nc unavailable, skipped live check)"
  fi
}

echo "==> Casuya doctor"
echo "Toolchain:"
check_cmd git
check_cmd node
check_cmd pnpm
check_cmd docker
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    ok "docker daemon running"
  else
    bad "docker daemon NOT running  -> start Docker Desktop / dockerd"
  fi
fi

echo "Services (require 'pnpm start' first):"
check_port postgres 5432
check_port redis 6379

echo "Environment (.env):"
if [ -f .env ]; then
  for v in DATABASE_URL REDIS_URL JWT_SECRET; do
    if grep -q "^$v=" .env && ! grep -q "^$v=change-me" .env; then
      ok "$v set"
    else
      warnmsg "$v missing or still default in .env"
    fi
  done
else
  bad ".env NOT FOUND  -> run 'pnpm bootstrap'"
fi

echo "Workspace structure:"
missing=0
for d in casuya-*/; do
  [ ! -f "$d/README.md" ] && echo "  [ ] ${d}README.md missing" && missing=$((missing+1))
done
[ "$missing" -eq 0 ] && ok "all repositories have README.md" || fail=$((fail + missing))

echo "Required repositories:"
expected="casuya-orchestrator casuya-platform casuya-core casuya-runtime casuya-bridge casuya-editor casuya-search casuya-media casuya-exams casuya-ai casuya-sdk casuya-auth casuya-notifications casuya-analytics casuya-payments casuya-content casuya-api casuya-common casuya-design-system casuya-devtools casuya-docs casuya-deployment"
for r in $expected; do
  [ -d "$r" ] && ok "$r present" || bad "$r MISSING"
done

echo "Ports availability (no local conflict):"
check_port platform 3000
check_port api 8080

echo "Dependencies installed:"
if [ -d node_modules ] && [ -d "casuya-api/node_modules" ]; then
  ok "node_modules present"
else
  warnmsg "node_modules not found in some packages  -> run 'pnpm bootstrap'"
fi

echo "Disk space:"
if command -v df >/dev/null 2>&1; then
  avail=$(df -k . | awk 'NR==2 {print $4}')
  if [ "${avail:-0}" -gt 1048576 ]; then
    ok "sufficient disk space ($(df -h . | awk 'NR==2 {print $4}') free)"
  else
    warnmsg "low disk space ($(df -h . | awk 'NR==2 {print $4}') free)"
  fi
else
  warnmsg "df unavailable, skipped disk check"
fi

echo ""
echo "==> doctor summary: $pass ok, $warn warnings, $fail failures"
[ "$fail" -eq 0 ] && echo "Environment looks healthy." || echo "Resolve the failures above before developing."
exit $fail
