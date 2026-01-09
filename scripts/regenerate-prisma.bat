@echo off
echo Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Regenerating Prisma client...
call npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo Prisma client regenerated successfully!
    echo You can now restart your dev server with: npm run dev
) else (
    echo Error regenerating Prisma client. Try closing all terminals and VS Code, then run this script again.
)
pause

