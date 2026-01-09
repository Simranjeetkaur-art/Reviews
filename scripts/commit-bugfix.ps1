# ReviewBoost Bugfix Commit Script
# Usage: .\scripts\commit-bugfix.ps1 <component> <summary>
# Example: .\scripts\commit-bugfix.ps1 Business-API "Duplicate URL detection failing"

param(
    [Parameter(Mandatory=$true)]
    [string]$Component,
    
    [Parameter(Mandatory=$true)]
    [string]$Summary
)

# Validate we're on a bugfix branch
$currentBranch = git branch --show-current
if ($currentBranch -notlike "bugfix/*") {
    Write-Host "Warning: Not on a bugfix branch. Current branch: $currentBranch" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
}

# Collect detailed information
Write-Host "`n=== Bugfix Commit Information ===" -ForegroundColor Cyan
Write-Host "Please provide detailed information for the bugfix commit:" -ForegroundColor Yellow

$problem = Read-Host "`nProblem (describe the issue, steps to reproduce, expected vs actual):"
$solution = Read-Host "`nSolution (what was changed and why):"
$filesChanged = Read-Host "`nFiles Changed (list files and what changed in each):"
$testing = Read-Host "`nTesting (how the fix was verified):"
$relatedIssues = Read-Host "`nRelated Issues (issue numbers or descriptions, or press Enter to skip):"

# Check for staged changes
$stagedChanges = git diff --cached --name-only
if (-not $stagedChanges) {
    Write-Host "No staged changes. Staging all changes..." -ForegroundColor Yellow
    git add .
}

# Check for sensitive data
Write-Host "`nChecking for sensitive data..." -ForegroundColor Yellow
$stagedContent = git diff --cached
if ($stagedContent -match "(?i)(password|api_key|secret|token|private_key)") {
    Write-Host "WARNING: Potential sensitive data detected in staged changes!" -ForegroundColor Red
    Write-Host "Please review the changes before committing." -ForegroundColor Red
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
}

# Build commit message
$commitMessage = @(
    "[BUGFIX] $Component`: $Summary",
    "",
    "Problem:",
    "- $problem",
    "",
    "Solution:",
    "- $solution",
    "",
    "Files Changed:",
    "- $filesChanged",
    "",
    "Testing:",
    "- $testing"
)

if ($relatedIssues) {
    $commitMessage += @(
        "",
        "Related Issues:",
        "- $relatedIssues"
    )
}

# Commit with detailed message
Write-Host "`nCommitting changes with detailed message..." -ForegroundColor Green
git commit -m $commitMessage[0] `
    -m $commitMessage[1] `
    -m $commitMessage[2] `
    -m $commitMessage[3] `
    -m $commitMessage[4] `
    -m $commitMessage[5] `
    -m $commitMessage[6] `
    -m $commitMessage[7] `
    -m $commitMessage[8] `
    -m $commitMessage[9] `
    -m $commitMessage[10] `
    -m $commitMessage[11] `
    -m $commitMessage[12]

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Commit successful!" -ForegroundColor Green
    Write-Host "Commit message preview:" -ForegroundColor Cyan
    Write-Host ($commitMessage -join "`n")
} else {
    Write-Host "`n❌ Commit failed!" -ForegroundColor Red
    exit 1
}
