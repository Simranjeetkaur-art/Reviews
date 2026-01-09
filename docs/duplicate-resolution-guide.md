# Duplicate Google Maps URL Resolution Guide

## Overview

This guide explains how to identify and resolve duplicate Google Maps URLs in the database. The system prevents new duplicates from being created, but existing duplicates need to be resolved manually.

## Checking for Duplicates

### Using the Check Script

Run the duplicate check script to identify all duplicate Google Maps URLs:

```bash
npx tsx scripts/check-duplicate-urls.ts
```

This script will:

- Scan all active businesses
- Normalize URLs for comparison
- Identify duplicate groups
- Display detailed information about each duplicate

### Output Example

```
🔍 Checking for duplicate Google Maps URLs...

📊 Total active businesses: 150

⚠️  Found 3 duplicate URL group(s):

================================================================================
Duplicate Group 1: g.page/r/example-cafe
Number of businesses: 2
================================================================================

  Business 1:
    ID: abc123
    Name: Example Cafe
    Original URL: https://g.page/r/example-cafe
    Owner: John Doe (john@example.com)
    Owner ID: user123
    Created: 2024-01-15T10:00:00.000Z
    Active: true

  Business 2:
    ID: def456
    Name: Example Cafe - Branch
    Original URL: https://G.PAGE/R/EXAMPLE-CAFE
    Owner: Jane Smith (jane@example.com)
    Owner ID: user456
    Created: 2024-02-20T14:30:00.000Z
    Active: true
```

## Resolving Duplicates

### Option 1: Automatic Resolution (Recommended)

The resolve script automatically keeps the oldest business and deactivates duplicates:

```bash
# Preview changes (dry run)
npx tsx scripts/resolve-duplicates.ts --dry-run

# Actually resolve duplicates
npx tsx scripts/resolve-duplicates.ts --resolve
```

**What it does:**

- Keeps the business created first (oldest)
- Deactivates all other businesses with the same normalized URL
- Sets `isActive: false` and `deletedAt` timestamp

### Option 2: Manual Resolution via Admin Dashboard

1. **Identify the duplicate businesses** using the check script
2. **Decide which business to keep** (usually the oldest or most complete)
3. **Reassign or deactivate duplicates:**

   **Option A: Reassign to the correct owner**
   - Use the Admin Dashboard
   - Navigate to the business
   - Use the "Reassign Business" feature
   - Select the correct owner

   **Option B: Deactivate duplicates**
   - Use the Admin Dashboard
   - Navigate to the business
   - Deactivate the business (sets `isActive: false`)

### Option 3: Reassignment API

Use the reassignment API endpoint to transfer a business to another user:

```typescript
POST /api/admin/businesses/[businessId]/reassign
{
  "newOwnerId": "user-id-here"
}
```

**Important:** The API will automatically check if the new owner already has a business with the same URL and prevent the reassignment if a duplicate would be created.

## Resolution Strategy

### Recommended Approach

1. **Keep the oldest business** - Usually the first registration is the legitimate one
2. **Deactivate duplicates** - Set `isActive: false` to prevent them from blocking new registrations
3. **Reassign if needed** - If the duplicate should belong to a different owner, use reassignment

### Decision Criteria

When multiple businesses have the same URL, consider:

- **Creation Date:** Keep the oldest (first registered)
- **Data Completeness:** Keep the one with more complete information
- **Owner Legitimacy:** Keep the one owned by the actual business owner
- **Activity:** Keep the one that's actively being used

## Preventing Future Duplicates

The system now automatically prevents new duplicates:

1. **URL Normalization:** All URLs are normalized before comparison
2. **Case-Insensitive:** Handles HTTP vs http, uppercase vs lowercase
3. **Protocol-Agnostic:** Treats http:// and https:// as equivalent
4. **Active-Only Check:** Only active businesses block new registrations
5. **Real-Time Validation:** Frontend validates URLs before submission

## User Request for Reassignment

If a user requests to have a business reassigned to them:

1. **Check for duplicates** - Verify the user doesn't already have a business with that URL
2. **Use Admin Dashboard** - Navigate to the business details
3. **Reassign Business** - Use the reassignment feature
4. **Verify** - Confirm the reassignment was successful

### Reassignment API Validation

The reassignment API automatically:

- Checks if the new owner already has a business with the same URL
- Prevents reassignment if it would create a duplicate
- Returns a clear error message if a duplicate would be created

## Verification

After resolving duplicates, verify the resolution:

```bash
# Run the check script again
npx tsx scripts/check-duplicate-urls.ts
```

You should see:

```
✅ No duplicate Google Maps URLs found!
```

## Important Notes

1. **Inactive businesses don't block new registrations** - Only `isActive: true` businesses are checked
2. **Normalized comparison** - URLs are normalized before comparison, so variations are caught
3. **Reassignment validation** - The reassignment API prevents creating duplicates
4. **User requests** - Users can request reassignment, but admins must approve and execute it

## Troubleshooting

### Issue: Script can't find Prisma client

**Solution:** Make sure you're running from the project root:

```bash
cd /path/to/project
npx tsx scripts/check-duplicate-urls.ts
```

### Issue: Duplicates still showing after resolution

**Solution:**

- Check if businesses are actually set to `isActive: false`
- Verify the `deletedAt` timestamp is set
- Run the check script again to confirm

### Issue: Reassignment fails with duplicate error

**Solution:**

- The new owner already has a business with the same URL
- Either deactivate the existing business first, or
- Reassign to a different owner

## Related Files

- `scripts/check-duplicate-urls.ts` - Script to identify duplicates
- `scripts/resolve-duplicates.ts` - Script to automatically resolve duplicates
- `app/api/admin/businesses/[businessId]/reassign/route.ts` - Reassignment API
- `lib/url-normalizer.ts` - URL normalization utility
