<#
.SYNOPSIS
  Start local development WITHOUT building Docker images for every service.
  Brings up shared infra (postgres, redis) in Docker and runs the runnable
  packages (platform frontend/backend, orchestrator dashboard) as local
  processes.
#>
$ErrorActionPreference = "Continue"
$ROOT = (Get-Item $PSScriptRoot).Parent.FullName
$PIDFILE = Join-Path $ROOT ".dev-pids"
"" | Set-Content -NoNewline $PIDFILE

Write-Host "==> Casuya local dev (Docker-free services)" -ForegroundColor Cyan

Write-Host "Starting shared infrastructure (postgres, redis)..."
docker compose up -d postgres redis

function Start-Bg($label, $cmd) {
  Write-Host "Starting $label..."
  $p = Start-Process -FilePath "cmd" -ArgumentList "/c","$cmd > `"$ROOT\.dev-$label.log`" 2>&1" -PassThru -WindowStyle Hidden
  $p.Id | Add-Content $PIDFILE
}

# Orchestrator dashboard (:4010)
Start-Bg "dashboard" "cd $ROOT\casuya-orchestrator && node dashboards/dev-server/index.js"

# Platform frontend (static, :5173)
Start-Bg "frontend" "cd $ROOT\casuya-platform && npx serve frontend -l 5173"

# Platform backend (Python/uvicorn, :8000)
Start-Bg "backend" "cd $ROOT\casuya-platform && python -m uvicorn backend.main:app --reload --port 8000"

# API gateway (build then run)
if (Select-String -Path (Join-Path $ROOT "casuya-api/package.json") -Pattern '"start"' -Quiet) {
  Write-Host "Building casuya-api..." -ForegroundColor Cyan
  Push-Location (Join-Path $ROOT "casuya-api")
  pnpm build
  Pop-Location
  Start-Bg "api" "cd $ROOT\casuya-api && node dist/server.js"
} else {
  Write-Host "NOTE: casuya-api has no runnable server entry yet - skipped." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==> Services starting. Dashboard: http://localhost:4010" -ForegroundColor Green
Write-Host "    Frontend: http://localhost:5173   Backend: http://localhost:8000"
Write-Host "    Logs: .dev-*.log   Stop with: pnpm stop"
