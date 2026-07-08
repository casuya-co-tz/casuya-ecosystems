<#
.SYNOPSIS
  Diagnose the local developer environment for required tooling and services.
#>
$ErrorActionPreference = "Continue"

function Check-Command($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "  [ ] $name : NOT INSTALLED  -> install via package manager (corepack enable for pnpm)" -ForegroundColor Red
        return $false
    }
    $v = & $name --version 2>$null | Select-Object -First 1
    Write-Host "  [x] $name : $v" -ForegroundColor Green
    return $true
}

function Check-EnvVar($name) {
    $val = [Environment]::GetEnvironmentVariable($name)
    if ($val -and $val -ne "change-me") { Write-Host "  [x] $name : set" -ForegroundColor Green }
    elseif ($val -eq "change-me") { Write-Host "  [~] $name : still default" -ForegroundColor Yellow }
    else { Write-Host "  [ ] $name : NOT SET" -ForegroundColor Yellow }
}

function Check-Service($name, $port) {
    $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($conn.TcpTestSucceeded) { Write-Host "  [x] $name : listening on :$port" -ForegroundColor Green }
    else { Write-Host "  [~] $name : not reachable on :$port  -> run 'pnpm start'" -ForegroundColor Yellow }
}

$pass = 0; $warn = 0; $fail = 0

Write-Host "==> Casuya doctor" -ForegroundColor Cyan
Write-Host "Toolchain:" -ForegroundColor Cyan
if (Check-Command git) { $pass++ } else { $fail++ }
if (Check-Command node) { $pass++ } else { $fail++ }
if (Check-Command pnpm) { $pass++ } else { $fail++ }
if (Check-Command docker) {
    $pass++
    $dockerUp = docker info 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "  [x] docker daemon running" -ForegroundColor Green; $pass++ }
    else { Write-Host "  [ ] docker daemon NOT running  -> start Docker Desktop" -ForegroundColor Red; $fail++ }
} else { $fail++ }

Write-Host "Services (require 'pnpm start' first):" -ForegroundColor Cyan
Check-Service postgres 5432
Check-Service redis 6379

Write-Host "Environment (.env):" -ForegroundColor Cyan
if (Test-Path .env) {
    Check-EnvVar DATABASE_URL
    Check-EnvVar REDIS_URL
    Check-EnvVar JWT_SECRET
} else {
    Write-Host "  [ ] .env NOT FOUND  -> run 'pnpm bootstrap'" -ForegroundColor Red
    $fail++
}

Write-Host "Workspace structure:" -ForegroundColor Cyan
$bad = 0
Get-ChildItem -Directory -Filter "casuya-*" | ForEach-Object {
    if (-not (Test-Path (Join-Path $_.FullName "README.md"))) { Write-Host "  [ ] $($_.Name): missing README.md" -ForegroundColor Yellow; $bad++ }
}
if ($bad -eq 0) { Write-Host "  [x] all repositories have README.md" -ForegroundColor Green; $pass++ } else { $warn++ }

Write-Host "Required repositories:" -ForegroundColor Cyan
$expected = @("casuya-orchestrator","casuya-platform","casuya-core","casuya-runtime","casuya-bridge","casuya-editor","casuya-search","casuya-media","casuya-exams","casuya-ai","casuya-sdk","casuya-auth","casuya-notifications","casuya-analytics","casuya-payments","casuya-content","casuya-api","casuya-common","casuya-design-system","casuya-devtools","casuya-docs","casuya-deployment")
foreach ($r in $expected) {
    if (Test-Path (Join-Path "." $r)) { Write-Host "  [x] $r present" -ForegroundColor Green; $pass++ }
    else { Write-Host "  [ ] $r MISSING" -ForegroundColor Red; $fail++ }
}

Write-Host "Ports availability:" -ForegroundColor Cyan
Check-Service platform 3000
Check-Service api 8080

Write-Host "Dependencies installed:" -ForegroundColor Cyan
$apiModules = Join-Path -Path "." -ChildPath "casuya-api" 
$apiModules = Join-Path -Path $apiModules -ChildPath "node_modules"
if ((Test-Path node_modules) -and (Test-Path $apiModules)) {
    Write-Host "  [x] node_modules present" -ForegroundColor Green; $pass++
} else {
    Write-Host "  [~] node_modules not found in some packages  -> run 'pnpm bootstrap'" -ForegroundColor Yellow; $warn++
}

Write-Host "Disk space:" -ForegroundColor Cyan
$drive = (Get-Location).Drive
$free = [math]::Round($drive.Free / 1GB, 1)
if ($free -gt 1) { Write-Host "  [x] sufficient disk space (${free} GB free)" -ForegroundColor Green; $pass++ }
else { Write-Host "  [~] low disk space (${free} GB free)" -ForegroundColor Yellow; $warn++ }

Write-Host ""
Write-Host "==> doctor summary: $pass ok, $warn warnings, $fail failures" -ForegroundColor Cyan
if ($fail -eq 0) { Write-Host "Environment looks healthy." -ForegroundColor Green } else { Write-Host "Resolve the failures above before developing." -ForegroundColor Red }
exit $fail
