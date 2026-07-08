<#
.SYNOPSIS
  Clean build artifacts and dependencies across the workspace.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Cleaning workspace" -ForegroundColor Cyan
pnpm -r clean
Write-Host "==> Clean complete" -ForegroundColor Green
