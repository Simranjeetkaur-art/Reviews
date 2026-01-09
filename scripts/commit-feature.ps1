# ReviewBoost Feature Commit Script
# Usage: .\scripts\commit-feature.ps1 <component> <message>
# Example: .\scripts\commit-feature.ps1 Dashboard "Added usage warning component"

param(
    [Parameter(Mandatory=$true)]
    [string]$Component,
    
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# Validate we're on a feature branch
$currentBranch = git branch --show-current
if ($currentBranch -notlike "feature/*") {
    Write-Host "Warning: Not on a feature branch. Current branch: $currentBranch" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
}

# Construct commit message
$commitMessage = "[FEATURE] $Component`: $Message"

# Check for staged changes
$stagedChanges = git diff --cached --name-only
if (-not $stagedChanges) {
    Write-Host "No staged changes. Staging all changes..." -ForegroundColor Yellow
    git add .
}

# Check for sensitive data
Write-Host "Checking for sensitive data..." -ForegroundColor Yellow
$stagedContent = git diff --cached
if ($stagedContent -match "(?i)(password|api_key|secret|token|private_key)") {
    Write-Host "WARNING: Potential sensitive data detected in staged changes!" -ForegroundColor Red
    Write-Host "Please review the changes before committing." -ForegroundColor Red
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
}

# Check for debug code
if ($stagedContent -match "(?i)(console\.log|debugger|alert\(|TODO|FIXME)") {
    Write-Host "Warning: Debug code or TODO comments detected." -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        exit 1
    }
}

# Commit
Write-Host "Committing changes..." -ForegroundColor Green
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful!" -ForegroundColor Green
    Write-Host "Commit message: $commitMessage" -ForegroundColor Cyan
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}
