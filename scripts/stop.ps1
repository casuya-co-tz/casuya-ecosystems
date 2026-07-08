<#
.SYNOPSIS
  Stop all locally-started Casuya dev processes and shared infra.
#>
$ErrorActionPreference = "Continue"
$ROOT = (Get-Item $PSScriptRoot).Parent.FullName
$PIDFILE = Join-Path $ROOT ".dev-pids"

if (Test-Path $PIDFILE) {
  Write-Host "Stopping local services..." -ForegroundColor Cyan
  Get-Content $PIDFILE | ForEach-Object {
    if ($_ -match '^\d+$') {
      $proc = Get-Process -Id $_ -ErrorAction SilentlyContinue
      if ($proc) { $proc | Stop-Process -Force; Write-Host "  killed $_" }
    }
  }
  Remove-Item $PIDFILE -Force
}

Write-Host "Stopping shared infrastructure..." -ForegroundColor Cyan
docker compose stop postgres redis

Write-Host "==> Stopped. (Use 'docker compose down' to remove volumes.)"
