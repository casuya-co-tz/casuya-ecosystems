<#
.SYNOPSIS
  Verify workspace integrity: structure, configs, and that packages build/typecheck.
#>
$ErrorActionPreference = "Stop"

Write-Host "==> Verifying workspace" -ForegroundColor Cyan

$errors = 0
$exempt = @("casuya-deployment", "casuya-docs", "casuya-design-system", "casuya-platform", "casuya-core")

foreach ($repo in (Get-ChildItem -Directory -Filter "casuya-*")) {
    $name = $repo.Name
    if ($name -in $exempt) { continue }
    $p = $repo.FullName
    foreach ($f in @("README.md", "LICENSE", ".gitignore", "package.json", "docs")) {
        if (-not (Test-Path (Join-Path $p $f))) {
            Write-Host "  MISSING $name/$f" -ForegroundColor Red
            $errors++
        }
    }
    if ((Test-Path (Join-Path $p "package.json")) -and -not (Test-Path (Join-Path $p "tsconfig.json"))) {
        Write-Host "  MISSING $name/tsconfig.json (TypeScript package)" -ForegroundColor Yellow
        $errors++
    }
}

if ($errors -gt 0) {
    Write-Host "==> Verification FAILED with $errors error(s)" -ForegroundColor Red
    exit 1
}

Write-Host "==> Structure OK. Running typecheck/build/test..." -ForegroundColor Cyan
pnpm -r typecheck
pnpm -r build
pnpm -r test

Write-Host "==> Verification complete" -ForegroundColor Green
