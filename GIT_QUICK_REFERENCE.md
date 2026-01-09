# Git Quick Reference - ReviewBoost

## 🚀 Most Common Commands

### Start New Feature
```powershell
git checkout main
git pull origin main
.\scripts\create-branch.ps1 feature feature-name
```

### Commit Feature
```powershell
.\scripts\commit-feature.ps1 Component "Brief description"
git push -u origin feature/feature-name
```

### Start Bugfix
```powershell
git checkout main
git pull origin main
.\scripts\create-branch.ps1 bugfix bug-description
```

### Commit Bugfix
```powershell
.\scripts\commit-bugfix.ps1 Component "Summary"
git push -u origin bugfix/bug-description
```

### Pre-Commit Check
```powershell
.\scripts\pre-commit-check.ps1
```

## 📋 Branch Types
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation
- `test/` - Tests
- `chore/` - Maintenance

## 💬 Commit Message Format

**Feature (One-liner):**
```
[FEATURE] Component: Brief description
```

**Bugfix (Detailed):**
```
[BUGFIX] Component: Summary

Problem:
- Issue description

Solution:
- What changed

Files Changed:
- file.ts (changes)

Testing:
- Verification steps
```

## ⚠️ Never Commit
- `.env` files
- `node_modules/`
- Database files (`*.db`)
- Debug code (`console.log`, `debugger`)
- Sensitive data (API keys, passwords)

## 📚 Full Documentation
See `docs/GIT_WORKFLOW.md` for complete guide.
