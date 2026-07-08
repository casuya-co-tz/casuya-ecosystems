<#
.SYNOPSIS
  Build every package in the workspace.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Building all packages" -ForegroundColor Cyan
pnpm -r build
Write-Host "==> Build complete" -ForegroundColor Green
