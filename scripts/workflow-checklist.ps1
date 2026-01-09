# ReviewBoost Git Workflow Checklist
# Usage: .\scripts\workflow-checklist.ps1
# Interactive checklist for daily Git workflow

Write-Host "=== ReviewBoost Git Workflow Checklist ===" -ForegroundColor Cyan
Write-Host ""

# Before Starting Work
Write-Host "📋 BEFORE STARTING WORK:" -ForegroundColor Yellow
$check1 = Read-Host "  [ ] Checked out main branch? (y/n)"
$check2 = Read-Host "  [ ] Pulled latest changes? (y/n)"
$check3 = Read-Host "  [ ] Verified clean working directory? (y/n)"

if ($check1 -ne "y" -or $check2 -ne "y" -or $check3 -ne "y") {
    Write-Host "`n⚠️  Please complete pre-work checklist first!" -ForegroundColor Yellow
    Write-Host "Run these commands:" -ForegroundColor Cyan
    Write-Host "  git checkout main" -ForegroundColor White
    Write-Host "  git pull origin main" -ForegroundColor White
    Write-Host "  git status" -ForegroundColor White
    exit 1
}

# During Work
Write-Host "`n📝 DURING WORK:" -ForegroundColor Yellow
Write-Host "  [ ] Making small, focused commits" -ForegroundColor White
Write-Host "  [ ] Writing clear commit messages" -ForegroundColor White
Write-Host "  [ ] Testing changes before committing" -ForegroundColor White
Write-Host "  [ ] Checking for sensitive data" -ForegroundColor White

# Before Pushing
Write-Host "`n🚀 BEFORE PUSHING:" -ForegroundColor Yellow
$check4 = Read-Host "  [ ] Reviewed all changes (git diff)? (y/n)"
$check5 = Read-Host "  [ ] Verified staged changes (git diff --cached)? (y/n)"
$check6 = Read-Host "  [ ] Ran pre-commit validation? (y/n)"
$check7 = Read-Host "  [ ] No console.log or debug code? (y/n)"

if ($check6 -ne "y") {
    Write-Host "`nRunning pre-commit validation..." -ForegroundColor Yellow
    & .\scripts\pre-commit-check.ps1
}

# After Pushing
Write-Host "`n✅ AFTER PUSHING:" -ForegroundColor Yellow
Write-Host "  [ ] Create Pull Request" -ForegroundColor White
Write-Host "  [ ] Add appropriate labels" -ForegroundColor White
Write-Host "  [ ] Add reviewers if required" -ForegroundColor White
Write-Host "  [ ] Monitor CI/CD pipeline" -ForegroundColor White

Write-Host "`n✅ Checklist complete!" -ForegroundColor Green
