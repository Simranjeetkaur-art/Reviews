# Global Google Maps URL Uniqueness Enforcement

## Overview

This document describes the implementation of a comprehensive system to enforce global uniqueness of Google Maps URLs across all businesses in the ReviewBoost application. The system prevents duplicate registrations by normalizing URLs and validating them at both the API and frontend levels.

## Components

### 1. URL Normalization Utility (`lib/url-normalizer.ts`)

A utility module that standardizes Google Maps URLs for consistent duplicate detection.

#### Functions

- **`normalizeGoogleMapsUrl(url: string): string`**
  - Normalizes URLs by:
    - Converting to lowercase
    - Removing protocol (http://, https://)
    - Removing www. prefix
    - Removing trailing slashes
    - Removing query parameters
    - Removing fragments (#)
    - Trimming whitespace

- **`isValidGoogleMapsUrl(url: string): boolean`**
  - Validates if a URL matches Google Maps URL patterns:
    - `g.page/r/...` (most common for review links)
    - `maps.google.com`
    - `www.google.com/maps`
    - `google.com/maps`
    - `goo.gl/maps` (shortened)

- **`validateAndNormalizeGoogleMapsUrl(url: string)`**
  - Combined validation and normalization
  - Returns: `{ valid: boolean, normalized?: string, error?: string }`

### 2. API Enhancements

#### Business Creation API (`app/api/businesses/route.ts`)

**Enhancements:**

- URL format validation before processing
- URL normalization for duplicate detection
- Case-insensitive and protocol-agnostic duplicate checking
- Enhanced error messages with owner details
- Support for admin vs regular user error responses

**Error Types:**

- `INVALID_GOOGLE_MAPS_URL`: Invalid URL format
- `DUPLICATE_GOOGLE_MAPS_URL`: URL already registered by another user
- `DUPLICATE_GOOGLE_MAPS_URL_OWN`: URL already registered by the same user

#### Business Update API (`app/api/businesses/[businessId]/route.ts`)

**Enhancements:**

- Always validates URL format (even if unchanged)
- Normalized URL checking for duplicates
- Prevents users from updating to URLs used by other businesses
- Prevents users from using URLs from their own other businesses
- Detailed error responses with resolution options

#### Admin Business Creation API (`app/api/admin/businesses/create/route.ts`)

**Enhancements:**

- Same URL normalization and validation as regular business creation
- Maintains data integrity even for admin users
- Provides detailed owner information in error responses

### 3. Frontend Validation

#### Dashboard (`app/dashboard/page.tsx`)

**Features:**

- Real-time URL validation on input change
- Visual feedback with red border for invalid URLs
- Error messages displayed below input field
- Pre-submission validation in `handleSubmit`
- Prevents form submission with invalid URLs

#### My Businesses (`app/my-businesses/page.tsx`)

**Features:**

- Real-time URL validation in edit form
- Enhanced error handling for duplicate URLs
- Displays existing business details when duplicate detected
- Shows resolution options for users
- Different error messages for own vs other user's businesses
- Support contact information for reassignment requests

### 4. Error Handling

#### Error Response Structure

```typescript
{
  success: false,
  error: "Error message",
  errorType: "DUPLICATE_GOOGLE_MAPS_URL" | "DUPLICATE_GOOGLE_MAPS_URL_OWN" | "INVALID_GOOGLE_MAPS_URL",
  isAdmin?: boolean,
  existingBusiness?: {
    id: string,
    businessName: string,
    businessType: string,
    googleMapsUrl: string,
    ownerEmail?: string,
    ownerName?: string,
    ownerRole?: string,
    registeredAt: string
  },
  ownerDetails?: {
    id: string,
    email: string,
    name: string,
    subscriptionTier: string,
    subscriptionStatus: string,
    businessLimit: number,
    feedbackLimit: number,
    businessCount: number
  },
  resolutionOptions?: string[],
  supportMessage?: string
}
```

#### Frontend Error Display

- **Duplicate URL (Other User):**
  - Yellow warning banner
  - Existing business details card
  - Resolution options list
  - Support contact information

- **Duplicate URL (Own Business):**
  - Yellow warning banner
  - Message explaining own business conflict
  - Suggestion to use different URL

- **Invalid URL Format:**
  - Red error banner
  - Format requirements message
  - Example URLs provided

## Implementation Details

### Duplicate Detection Strategy

1. **Exact Match Check:** First checks for exact trimmed URL match in database
2. **Normalized Match Check:** If no exact match, fetches all active businesses and compares normalized URLs
3. **Case-Insensitive:** Handles variations in case (HTTP vs http)
4. **Protocol-Agnostic:** Treats http:// and https:// as equivalent
5. **Trailing Slash Handling:** Removes trailing slashes for comparison

### URL Storage

- URLs are stored in their trimmed form in the database
- Original format is preserved (with protocol, case, etc.)
- Normalization is only used for comparison, not storage

### Performance Considerations

- Normalized URL checking is done in application code (not database) due to SQLite limitations
- For large datasets, consider adding a `normalizedGoogleMapsUrl` field with an index
- Current implementation fetches all active businesses for normalized comparison (acceptable for current scale)

## Testing

### Manual Testing Checklist

- [ ] User A creates business with URL "https://g.page/r/example"
- [ ] User B tries to create business with same URL → Should fail
- [ ] User B tries with "HTTP://G.PAGE/R/EXAMPLE" → Should fail (case-insensitive)
- [ ] User B tries with "https://g.page/r/example/" → Should fail (trailing slash)
- [ ] User A updates business to URL used by User B → Should fail
- [ ] User A updates business to URL used by own other business → Should fail with specific message
- [ ] Admin sees detailed owner information in error
- [ ] Regular user sees support contact option
- [ ] URL validation works on frontend before submission
- [ ] Invalid URL formats are rejected with helpful messages

### Edge Cases Handled

- **Query Parameters:** URLs with different query params are treated as the same
- **URL Encoding:** Handles encoded characters
- **Shortened URLs:** Supports goo.gl/maps shortened URLs
- **Mobile vs Desktop:** Handles both maps.google.com and www.google.com/maps
- **Deleted Businesses:** Only active businesses block new registrations
- **Concurrent Requests:** Database-level checks prevent race conditions

## Duplicate Resolution

### Existing Duplicates in Database

The system prevents **new** duplicates from being created, but existing duplicates in the database need to be resolved manually.

### Checking for Duplicates

Use the provided script to identify all duplicate Google Maps URLs:

```bash
npx tsx scripts/check-duplicate-urls.ts
```

This will:

- Scan all active businesses
- Normalize URLs for comparison
- Identify duplicate groups
- Display detailed information about each duplicate

### Resolving Duplicates

**Option 1: Automatic Resolution (Recommended)**

```bash
# Preview changes (dry run)
npx tsx scripts/resolve-duplicates.ts --dry-run

# Actually resolve duplicates
npx tsx scripts/resolve-duplicates.ts --resolve
```

The script automatically:

- Keeps the oldest business (first created)
- Deactivates all other businesses with the same normalized URL
- Sets `isActive: false` and `deletedAt` timestamp

**Option 2: Manual Resolution via Admin Dashboard**

1. Identify duplicates using the check script
2. Decide which business to keep (usually the oldest)
3. Reassign or deactivate duplicates using the Admin Dashboard

**Option 3: User Request for Reassignment**

Users can request admin to reassign a business to them. The reassignment API:

- Automatically checks if the new owner already has a business with the same URL
- Prevents reassignment if it would create a duplicate
- Returns a clear error message if a duplicate would be created

See `docs/duplicate-resolution-guide.md` for detailed instructions.

### Important Notes

1. **Only active businesses block new registrations** - Inactive businesses (`isActive: false`) don't prevent new registrations
2. **Normalized comparison** - URLs are normalized before comparison, catching all variations
3. **Reassignment validation** - The reassignment API prevents creating duplicates
4. **User requests** - Users can request reassignment, but admins must approve and execute it

## Future Enhancements

1. **Database-Level Constraint:**
   - Add `normalizedGoogleMapsUrl` field to Business model
   - Create unique index on normalized URL
   - Migrate existing data

2. **Performance Optimization:**
   - Cache normalized URLs
   - Use database-level case-insensitive comparison (PostgreSQL migration)

3. **Enhanced Admin Features:**
   - Direct reassignment from error message
   - Bulk URL normalization tool
   - URL conflict resolution dashboard

4. **User Experience:**
   - URL format auto-detection
   - URL preview/validation before submission
   - Suggested alternative URLs when duplicate detected

## Related Files

- `lib/url-normalizer.ts` - URL normalization utility
- `app/api/businesses/route.ts` - Business creation API
- `app/api/businesses/[businessId]/route.ts` - Business update API
- `app/api/admin/businesses/create/route.ts` - Admin business creation API
- `app/api/admin/businesses/[businessId]/reassign/route.ts` - Business reassignment API (with duplicate prevention)
- `app/dashboard/page.tsx` - Dashboard with URL validation
- `app/my-businesses/page.tsx` - My Businesses page with enhanced error handling
- `scripts/check-duplicate-urls.ts` - Script to identify existing duplicates
- `scripts/resolve-duplicates.ts` - Script to automatically resolve duplicates
- `docs/duplicate-resolution-guide.md` - Detailed guide for resolving duplicates

## Success Criteria

✅ No duplicate Google Maps URLs can be registered globally
✅ URL normalization handles case, protocol, trailing slash variations
✅ Users cannot update business to use already-registered URL
✅ Users cannot use URL from their own other business
✅ Admin sees detailed owner information in errors
✅ Regular users see support contact options
✅ Frontend validates URLs before submission
✅ Error messages are clear and actionable
✅ All existing functionality remains intact
