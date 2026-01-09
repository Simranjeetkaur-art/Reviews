# ReviewBoost Pre-Commit Validation Script
# Usage: .\scripts\pre-commit-check.ps1
# This script checks for common issues before committing

Write-Host "=== Pre-Commit Validation ===" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# Check for staged changes
$stagedChanges = git diff --cached --name-only
if (-not $stagedChanges) {
    Write-Host "❌ No staged changes to commit" -ForegroundColor Red
    exit 1
}

Write-Host "`nChecking staged files..." -ForegroundColor Yellow
$stagedContent = git diff --cached

# Check for sensitive data
Write-Host "  - Checking for sensitive data..." -ForegroundColor Yellow
if ($stagedContent -match "(?i)(password\s*=\s*['`"][^'`"]+['`"]|api_key\s*=\s*['`"][^'`"]+['`"]|secret\s*=\s*['`"][^'`"]+['`"]|token\s*=\s*['`"][^'`"]+['`"])") {
    $errors += "Sensitive data detected (passwords, API keys, secrets, tokens)"
}

# Check for debug code
Write-Host "  - Checking for debug code..." -ForegroundColor Yellow
if ($stagedContent -match "(?i)(console\.log|debugger|alert\(|\.log\()") {
    $warnings += "Debug code detected (console.log, debugger, alert)"
}

# Check for TODO/FIXME comments
Write-Host "  - Checking for TODO/FIXME comments..." -ForegroundColor Yellow
if ($stagedContent -match "(?i)(TODO|FIXME|HACK|XXX)") {
    $warnings += "TODO/FIXME comments found"
}

# Check for .env files
Write-Host "  - Checking for .env files..." -ForegroundColor Yellow
$envFiles = $stagedChanges | Where-Object { $_ -like "*.env*" }
if ($envFiles) {
    $errors += ".env files detected in staged changes: $($envFiles -join ', ')"
}

# Check for node_modules
Write-Host "  - Checking for node_modules..." -ForegroundColor Yellow
$nodeModules = $stagedChanges | Where-Object { $_ -like "*node_modules*" }
if ($nodeModules) {
    $errors += "node_modules detected in staged changes"
}

# Check for database files
Write-Host "  - Checking for database files..." -ForegroundColor Yellow
$dbFiles = $stagedChanges | Where-Object { $_ -like "*.db" -or $_ -like "*.sqlite*" }
if ($dbFiles) {
    $errors += "Database files detected in staged changes: $($dbFiles -join ', ')"
}

# Check for large files (> 1MB)
Write-Host "  - Checking for large files..." -ForegroundColor Yellow
foreach ($file in $stagedChanges) {
    if (Test-Path $file) {
        $fileSize = (Get-Item $file).Length
        if ($fileSize -gt 1MB) {
            $warnings += "Large file detected: $file ($([math]::Round($fileSize/1MB, 2)) MB)"
        }
    }
}

# Display results
Write-Host "`n=== Validation Results ===" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERRORS (must fix before committing):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️  WARNINGS (review before committing):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ All checks passed! Safe to commit." -ForegroundColor Green
    exit 0
} elseif ($errors.Count -gt 0) {
    Write-Host "`n❌ Please fix errors before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n⚠️  Warnings found. Review before committing." -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
    exit 0
}
