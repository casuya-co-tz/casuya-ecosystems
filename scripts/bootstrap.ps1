<#
.SYNOPSIS
  Casuya workspace bootstrap: install dependencies and prepare local environment.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Casuya bootstrap" -ForegroundColor Cyan

# 1. Ensure pnpm is available (detect via where.exe for non-profile shells)
$pnpmOk = $false
try { if (Get-Command pnpm -ErrorAction SilentlyContinue) { $pnpmOk = $true } } catch {}
if (-not $pnpmOk) {
    $found = where.exe pnpm 2>$null
    if ($found) { $pnpmOk = $true }
}
if (-not $pnpmOk) {
    Write-Host "pnpm not found. Installing via corepack..." -ForegroundColor Yellow
    corepack enable
    corepack prepare pnpm@9.15.9 --activate
}

# 2. Copy .env if missing
if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example" -ForegroundColor Yellow
    Copy-Item .env.example .env
} else {
    Write-Host ".env already exists, skipping" -ForegroundColor DarkGray
}

# 3. Install workspace dependencies
Write-Host "Installing workspace dependencies..." -ForegroundColor Cyan
pnpm install

# 4. Install Python backend deps (casuya-platform)
$reqPath = Join-Path -Path "." -ChildPath "casuya-platform" 
$reqFile = Join-Path -Path $reqPath -ChildPath "requirements.txt"
if (Test-Path $reqFile) {
  $pipCmd = if (Get-Command pip -ErrorAction SilentlyContinue) { "pip" } elseif (Get-Command pip3 -ErrorAction SilentlyContinue) { "pip3" } else { $null }
  if ($pipCmd) {
    Write-Host "Installing casuya-platform Python dependencies..." -ForegroundColor Cyan
    Push-Location casuya-platform
    & $pipCmd install -r requirements.txt
    Pop-Location
  } else {
    Write-Host "WARNING: pip not found. Install casuya-platform/requirements.txt manually." -ForegroundColor Yellow
  }
}

# 4. Quick environment sanity check
Write-Host "Running doctor..." -ForegroundColor Cyan
$doctorShell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
& $doctorShell -File scripts/doctor.ps1

Write-Host "==> Bootstrap complete. Next: pnpm dev" -ForegroundColor Green
