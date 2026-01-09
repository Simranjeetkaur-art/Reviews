# Fixing Prisma Generate Error on Windows

## Problem

When running `npx prisma generate` on Windows, you may encounter this error:

```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

This happens because the Prisma query engine file is locked by a running Node.js process (usually your dev server).

## Solutions

### Solution 1: Use the Provided Scripts (Recommended)

We've created helper scripts to automatically stop Node processes and regenerate Prisma:

**For PowerShell:**

```powershell
.\scripts\regenerate-prisma.ps1
```

**For Command Prompt:**

```cmd
scripts\regenerate-prisma.bat
```

These scripts will:

1. Stop any running Node.js processes
2. Wait 2 seconds for file locks to release
3. Run `npx prisma generate`
4. Show success/error messages

### Solution 2: Manual Steps

1. **Stop the dev server:**
   - Press `Ctrl+C` in the terminal running `npm run dev`
   - Or close the terminal window

2. **Kill any remaining Node processes:**

   ```powershell
   # PowerShell
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

   ```cmd
   # Command Prompt
   taskkill /F /IM node.exe
   ```

3. **Wait a few seconds** for file locks to release

4. **Regenerate Prisma:**

   ```bash
   npx prisma generate
   ```

5. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### Solution 3: Close All Terminals and VS Code

If the above doesn't work:

1. Close all terminal windows
2. Close VS Code completely
3. Reopen VS Code
4. Run `npx prisma generate` in a fresh terminal

## When to Run Prisma Generate

Run `npx prisma generate` whenever you:

- Update the Prisma schema (`prisma/schema.prisma`)
- Add new fields to models
- Change field types
- Add new models or relations

## Verification

After running `npx prisma generate`, you should see:

```
✔ Generated Prisma Client (x.xx s)
```

If you see errors, check:

- The schema file syntax is correct
- All required fields have proper types
- No syntax errors in the schema
