# ReviewBoost Git Branch Creation Script
# Usage: .\scripts\create-branch.ps1 <type> <description>
# Example: .\scripts\create-branch.ps1 feature subscription-upgrade

param(
    [Parameter(Mandatory=$true)]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Description
)

# Validate branch type
$validTypes = @("feature", "bugfix", "hotfix", "refactor", "docs", "test", "chore")
if ($validTypes -notcontains $Type) {
    Write-Host "Error: Invalid branch type. Use: feature, bugfix, hotfix, refactor, docs, test, chore" -ForegroundColor Red
    exit 1
}

# Construct branch name
$branchName = "$Type/$Description"

# Ensure we're on main/master and up to date
$currentBranch = git branch --show-current
if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout master 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: Could not switch to main/master branch" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "Pulling latest changes from remote..." -ForegroundColor Yellow
git pull origin main 2>$null
if ($LASTEXITCODE -ne 0) {
    git pull origin master 2>$null
}

# Check if branch already exists
$existingBranch = git branch --list $branchName
if ($existingBranch) {
    Write-Host "Branch '$branchName' already exists. Switching to it..." -ForegroundColor Yellow
    git checkout $branchName
    git pull origin $branchName 2>$null
} else {
    Write-Host "Creating new branch: $branchName" -ForegroundColor Green
    git checkout -b $branchName
}

Write-Host "✅ Successfully on branch: $branchName" -ForegroundColor Green
