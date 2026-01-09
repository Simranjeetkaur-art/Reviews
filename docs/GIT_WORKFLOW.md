# Git Version Control Management Guide - ReviewBoost

## Repository Information
- **Repository URL:** https://github.com/Simranjeetkaur-art/Reviews.git
- **Default Branch:** main (or master if main doesn't exist)
- **Project Name:** ReviewBoost
- **Agent Identity:** ReviewBoost AI Agent (ai-agent@reviewboost.com)

## Quick Reference

### Branch Naming
```
<type>/<short-description>
```
Types: `feature`, `bugfix`, `hotfix`, `refactor`, `docs`, `test`, `chore`

### Commit Messages

**Features (One-liner):**
```bash
[FEATURE] Component: Brief description
```

**Bugfixes (Detailed):**
```bash
[BUGFIX] Component: Summary

Problem:
- Issue description
- Steps to reproduce
- Expected vs actual

Solution:
- What changed
- Why this approach

Files Changed:
- file1.ts (changes)

Testing:
- Verification steps
```

## Daily Workflow

### 1. Before Starting Work
```powershell
# Check current branch
git branch --show-current

# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Verify clean working directory
git status
```

### 2. Create Feature Branch
```powershell
# Using helper script
.\scripts\create-branch.ps1 feature your-feature-name

# Or manually
git checkout -b feature/your-feature-name
```

### 3. Make Changes & Commit
```powershell
# For features
.\scripts\commit-feature.ps1 Component "Brief description"

# For bugfixes
.\scripts\commit-bugfix.ps1 Component "Summary"
```

### 4. Push & Create PR
```powershell
# Push branch
git push -u origin feature/your-feature-name

# Create PR via GitHub or CLI
gh pr create --title "[FEATURE] Component: Description" --body "PR description"
```

## Helper Scripts

### `scripts/create-branch.ps1`
Creates a new branch following naming conventions.

**Usage:**
```powershell
.\scripts\create-branch.ps1 <type> <description>
.\scripts\create-branch.ps1 feature subscription-upgrade
```

### `scripts/commit-feature.ps1`
Commits feature changes with proper one-liner format.

**Usage:**
```powershell
.\scripts\commit-feature.ps1 <component> <message>
.\scripts\commit-feature.ps1 Dashboard "Added usage warning component"
```

### `scripts/commit-bugfix.ps1`
Commits bugfix changes with detailed multi-line format.

**Usage:**
```powershell
.\scripts\commit-bugfix.ps1 <component> <summary>
.\scripts\commit-bugfix.ps1 Business-API "Duplicate URL detection failing"
```

### `scripts/pre-commit-check.ps1`
Validates staged changes before committing.

**Usage:**
```powershell
.\scripts\pre-commit-check.ps1
```

### `scripts/workflow-checklist.ps1`
Interactive checklist for daily Git workflow.

**Usage:**
```powershell
.\scripts\workflow-checklist.ps1
```

## Branch Types

| Type | Use Case | Example |
|------|----------|---------|
| `feature/` | New features, enhancements | `feature/subscription-upgrade-flow` |
| `bugfix/` | Bug fixes, error corrections | `bugfix/duplicate-url-normalization` |
| `hotfix/` | Critical production fixes | `hotfix/auth-token-expiration` |
| `refactor/` | Code refactoring | `refactor/activity-logger-optimization` |
| `docs/` | Documentation updates | `docs/api-endpoint-documentation` |
| `test/` | Test additions/updates | `test/feedback-generation-unit-tests` |
| `chore/` | Maintenance, dependencies | `chore/update-dependencies` |

## Commit Message Examples

### Feature Commit
```bash
[FEATURE] Dashboard: Added usage warning component for free tier users
```

### Bugfix Commit
```bash
[BUGFIX] Business API: Duplicate URL detection failing for normalized URLs

Problem:
- Users could register businesses with URLs that normalized to the same value
- Example: 'HTTPS://G.PAGE/R/EXAMPLE' and 'https://g.page/r/example' were treated as different
- This violated the global uniqueness constraint for Google Maps URLs

Solution:
- Enhanced duplicate check in POST /api/businesses to compare normalized URLs
- Added normalizedGoogleMapsUrl field to Business model for efficient lookups
- Updated URL normalizer to handle all edge cases

Files Changed:
- app/api/businesses/route.ts (added normalized URL check)
- prisma/schema.prisma (added normalizedGoogleMapsUrl field)
- lib/url-normalizer.ts (enhanced normalization algorithm)

Testing:
- Tested with various URL formats (HTTP/HTTPS, uppercase/lowercase)
- Verified duplicate detection works across different users
- Confirmed existing businesses are not affected
```

## Pre-Commit Checklist

Before every commit, ensure:
- [ ] Code is tested and working
- [ ] No `console.log` or debug statements
- [ ] No sensitive data (API keys, passwords)
- [ ] Commit message follows format
- [ ] Related files are staged together
- [ ] `.gitignore` is respected

## Files to NEVER Commit

- `.env` files
- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `*.log`
- `.DS_Store`
- Database files (`*.db`, `*.sqlite`)
- IDE config files (unless shared)

## Pull Request Template

```markdown
## Type
- [ ] Feature
- [ ] Bug Fix
- [ ] Hotfix
- [ ] Refactor
- [ ] Documentation

## Description
Brief description of what this PR does

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Browser compatibility checked

## Related Issues
Closes #issue-number
```

## Emergency Procedures

### Revert Last Commit (not pushed)
```powershell
# Keep changes staged
git reset --soft HEAD~1

# Discard changes completely
git reset --hard HEAD~1
```

### Revert Last Commit (pushed)
```powershell
# Create revert commit
git revert HEAD
git push origin main
```

## Common Commands

```powershell
# Check status
git status

# View changes
git diff
git diff --cached

# Stage files
git add .
git add <file>

# Commit
git commit -m "Message"

# Push
git push -u origin <branch-name>

# Pull
git pull origin main

# Switch branch
git checkout <branch-name>

# Create branch
git checkout -b <branch-name>

# List branches
git branch -a

# View commit history
git log --oneline -10
```

## Best Practices

✅ **DO:**
- Commit frequently (after each logical unit of work)
- Write clear, descriptive commit messages
- Use the correct format (detailed for bugs, one-liner for features)
- Test before committing
- Keep commits focused (one logical change per commit)
- Pull before creating branches
- Create PRs for code review

❌ **DON'T:**
- Commit commented-out code
- Commit debug statements
- Commit sensitive data
- Commit generated files
- Force push to main
- Commit with vague messages ("fix", "update", "WIP")
- Squash unrelated changes into one commit

## Support

For questions or issues with Git workflow:
1. Review this documentation
2. Check helper scripts in `scripts/` directory
3. Run `.\scripts\workflow-checklist.ps1` for interactive guidance

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")
**Maintained by:** ReviewBoost AI Agent
