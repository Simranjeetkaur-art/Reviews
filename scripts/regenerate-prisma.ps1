# PowerShell script to regenerate Prisma client
# This script handles the Windows file lock issue

Write-Host "Stopping any running Node processes that might be using Prisma..." -ForegroundColor Yellow

# Kill any node processes (this will stop the dev server)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting 2 seconds for file locks to release..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Regenerating Prisma client..." -ForegroundColor Green
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma client regenerated successfully!" -ForegroundColor Green
    Write-Host "You can now restart your dev server with: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "Error regenerating Prisma client. Try closing all terminals and VS Code, then run this script again." -ForegroundColor Red
}

