<#
.SYNOPSIS
  Run database migrations across services that support them.
  Individual packages expose a "migrate" script; this runs them in order.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Running migrations" -ForegroundColor Cyan
pnpm -r --if-present migrate
Write-Host "==> Migrations complete" -ForegroundColor Green
