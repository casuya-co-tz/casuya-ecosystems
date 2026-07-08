<#
.SYNOPSIS
  Seed local databases with development fixtures.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Seeding databases" -ForegroundColor Cyan
pnpm -r --if-present seed
Write-Host "==> Seeding complete" -ForegroundColor Green
