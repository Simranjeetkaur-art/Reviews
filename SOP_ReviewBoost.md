# SOP: ReviewBoost - Complete Implementation Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [User Lifecycle](#user-lifecycle)
4. [Admin Lifecycle](#admin-lifecycle)
5. [Database Schema](#database-schema)
6. [Duplicate Prevention](#duplicate-prevention)
7. [Independent vs Dependent Systems](#independent-vs-dependent-systems)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Flow Diagrams](#flow-diagrams)
10. [Critical Implementation Details](#critical-implementation-details)

---

## Executive Summary

**ReviewBoost** is a SaaS platform that helps businesses collect Google reviews by:
- Generating AI-powered review templates (100 per business)
- Providing QR codes and branded links for customers
- Tracking analytics (scans, selections, redirects)
- Managing multi-tier subscriptions (Free, Pro, Lifetime)

**Tech Stack:**
- Frontend: Next.js 16.1.1, React 19, TypeScript, Tailwind CSS 4
- Backend: Next.js API Routes, Prisma ORM 6.19.1
- Database: SQLite (dev), PostgreSQL-ready
- Auth: JWT + bcrypt, HTTP-only cookies

**Key Metrics:**
- 35 API endpoints
- 11 database models
- 3 subscription tiers
- 2 user roles (owner, superadmin)

---

## System Architecture

### Directory Structure
```
feedback/
├── app/                          # Next.js App Router
│   ├── admin/dashboard/          # Admin panel
│   ├── api/                      # 35 API routes
│   ├── checkout/                 # Payment checkout
│   ├── dashboard/                # User dashboard
│   ├── login/ & signup/          # Authentication
│   ├── my-businesses/            # Business management
│   ├── pricing/                  # Pricing page
│   ├── profile/                  # User profile
│   ├── review/[businessId]/      # Customer review page
│   └── superadmin/               # Superadmin panel
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   ├── BusinessActivityLog.tsx
│   ├── Navigation.tsx
│   └── UsageWarning.tsx
├── context/                      # React Context
│   └── AuthContext.tsx           # Auth state management
├── lib/                          # Core utilities
│   ├── activity-logger.ts        # Activity tracking
│   ├── ai.ts                     # AI feedback generation
│   ├── auth.ts                   # Auth & authorization
│   ├── cache.ts                  # Caching layer
│   ├── google-maps-scraper.ts    # Google Maps scraping
│   ├── prisma.ts                 # Prisma client
│   ├── url-normalizer.ts         # URL normalization
│   └── utils.ts                  # General utilities
├── prisma/                       # Database
│   └── schema.prisma             # Database schema
└── scripts/                      # Utility scripts
    ├── create-superadmin.ts
    ├── check-duplicate-urls.ts
    ├── detect-and-resolve-duplicates.ts
    └── normalize-existing-urls.ts
```

### Core Dependencies Flow
```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 16 App Router                   │
├─────────────────────────────────────────────────────────────┤
│  React 19  │  TypeScript 5  │  Tailwind CSS 4              │
├─────────────────────────────────────────────────────────────┤
│        AuthContext (JWT + HTTP-only cookies)                 │
├─────────────────────────────────────────────────────────────┤
│  API Routes → lib/auth.ts → Prisma → SQLite Database       │
└─────────────────────────────────────────────────────────────┘
```

---

## User Lifecycle

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LIFECYCLE                           │
└─────────────────────────────────────────────────────────────┘

1. REGISTRATION
   └─> Signup (/signup)
       ├─> Email (case-insensitive, unique)
       ├─> Password (bcrypt, 12 rounds)
       ├─> Name (optional)
       └─> Default: Free tier, Active status
           └─> JWT token → HTTP-only cookie (7 days)
               └─> Redirect to /dashboard

2. AUTHENTICATION
   └─> Login (/login)
       ├─> Email lookup (case-insensitive)
       ├─> Password verification (bcrypt)
       └─> JWT token → HTTP-only cookie
           └─> Redirect to /dashboard

3. BUSINESS CREATION (Unlimited for all tiers)
   └─> Dashboard → New Business
       ├─> Step 1: Business Information
       │   ├─> Business Name (unique per user)
       │   ├─> Business Type
       │   ├─> Google Maps URL (validated, duplicate check)
       │   ├─> Products/Services (dynamic list)
       │   └─> Employees (dynamic list)
       │
       ├─> Step 2: Generate Reviews
       │   ├─> Preview 10 samples
       │   ├─> Check generation limit
       │   │   ├─> Free: 5 per business
       │   │   └─> Pro/Lifetime: Unlimited
       │   └─> Generate 100 reviews (70 positive, 30 neutral)
       │       └─> Business.generationCount++
       │
       └─> Step 3: Get Link & QR Code
           ├─> Review Link: /review/{businessId}
           ├─> QR Code (downloadable PNG)
           └─> View all 100 feedbacks

4. CUSTOMER REVIEW COLLECTION
   └─> Customer scans QR code
       └─> Review Page (/review/{businessId})
           ├─> Track QR scan analytics
           ├─> Fetch 12 random feedbacks (smart rotation)
           ├─> Customer selects review
           ├─> Copy to clipboard
           ├─> Track feedback_selected analytics
           ├─> Track google_redirect analytics
           └─> Redirect to Google Maps

5. SUBSCRIPTION MANAGEMENT
   ├─> Free Tier (Default)
   │   ├─> Unlimited businesses
   │   ├─> 5 generations per business
   │   └─> Usage warning at limit
   │       └─> Prompt to upgrade
   │
   ├─> Upgrade to Pro (₹9,999 / 6 months)
   │   └─> /pricing → /checkout?plan=pro
   │       ├─> Payment (mock)
   │       ├─> Update subscription
   │       │   ├─> subscriptionTier: "pro"
   │       │   ├─> feedbackLimit: -1 (unlimited)
   │       │   ├─> subscriptionEndDate: +6 months
   │       │   └─> paymentType: "recurring"
   │       └─> Redirect to /checkout/success
   │
   └─> Upgrade to Lifetime (₹39,999 one-time)
       └─> /pricing → /checkout?plan=lifetime
           ├─> Payment (mock)
           ├─> Update subscription
           │   ├─> subscriptionTier: "lifetime"
           │   ├─> feedbackLimit: -1 (unlimited)
           │   ├─> subscriptionEndDate: null (never expires)
           │   ├─> paymentType: "one_time"
           │   └─> lifetimePurchaseDate: now
           └─> Redirect to /checkout/success

6. PROFILE MANAGEMENT
   └─> /profile
       ├─> Update name, contact info
       ├─> Change password
       ├─> View subscription details
       └─> View usage statistics

7. BUSINESS MANAGEMENT
   └─> /my-businesses
       ├─> List all businesses
       ├─> View feedbacks per business
       ├─> Edit business details
       ├─> Delete business (soft delete)
       └─> View activity logs

8. ANALYTICS TRACKING (Automatic)
   ├─> QR scans (page load)
   ├─> Feedback selections (customer choice)
   └─> Google redirects (before redirect)
```

### User States

```
┌──────────────┐
│  REGISTERED  │ → Email verified, password hashed
│  (Free Tier) │    Default state for new users
└──────┬───────┘
       │
       ├─> ACTIVE (subscriptionStatus: "active")
       │   └─> Can create businesses & generate feedbacks
       │
       ├─> EXPIRED (Pro users only, subscriptionEndDate < now)
       │   └─> Cannot generate new feedbacks
       │   └─> Can upgrade/renew
       │
       └─> SUSPENDED (Admin action, subscriptionStatus: "suspended")
           └─> Cannot access platform
           └─> Admin can reactivate
```

### User Permissions by Tier

| Feature | Free | Pro | Lifetime | Superadmin |
|---------|------|-----|----------|------------|
| Create Businesses | ∞ | ∞ | ∞ | ∞ |
| Generate Feedbacks | 5/business | ∞ | ∞ | ∞ |
| QR Codes | Basic | Custom | White-label | All |
| Analytics | Basic | Full | Advanced | All |
| Support | Email | Priority | Dedicated | N/A |
| Duration | Permanent | 6 months | Lifetime | N/A |
| Cost | ₹0 | ₹9,999 | ₹39,999 | N/A |

---

## Admin Lifecycle

### Superadmin Role

```
┌─────────────────────────────────────────────────────────────┐
│                   SUPERADMIN LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

1. CREATION
   └─> Manual creation only (no signup)
       └─> Run script: npm run create-superadmin
           ├─> Email: admin@example.com
           ├─> Password: securepassword
           ├─> Role: "superadmin"
           ├─> subscriptionTier: "admin"
           └─> No subscription limits

2. LOGIN
   └─> /login (same as regular users)
       └─> Redirects to /admin/dashboard

3. ADMIN DASHBOARD ACCESS
   └─> /admin/dashboard
       ├─> Overview Stats
       │   ├─> Total users (excluding admins)
       │   ├─> Total businesses (excluding admin businesses)
       │   ├─> Active/deleted businesses
       │   ├─> Total feedbacks
       │   ├─> Subscription breakdown
       │   └─> Expiring soon (within 7 days)
       │
       ├─> User Management Tab
       │   ├─> List all users
       │   ├─> Search & filter
       │   ├─> View user details
       │   ├─> Change subscription tier
       │   ├─> Update profile
       │   ├─> Suspend/activate user
       │   └─> View user's businesses
       │
       ├─> Business Management Tab
       │   ├─> List all businesses (all users)
       │   ├─> Search & filter
       │   ├─> View business details
       │   ├─> Reassign to another user
       │   ├─> Edit business
       │   ├─> Delete permanently
       │   ├─> Reactivate deleted business
       │   └─> View activity logs
       │
       ├─> Analytics Tab
       │   ├─> QR scans by business
       │   ├─> Feedback selections
       │   ├─> Google redirects
       │   ├─> Conversion rates
       │   └─> User engagement metrics
       │
       ├─> Activity Log Tab
       │   ├─> Admin actions log
       │   ├─> Business activity log
       │   ├─> Filter by admin, date, action
       │   └─> View JSON details
       │
       └─> Reassignment Requests Tab
           ├─> List all requests
           ├─> Filter by status
           ├─> Approve/reject requests
           └─> Add admin notes

4. USER MANAGEMENT ACTIONS
   ├─> Change Subscription Tier
   │   └─> PUT /api/admin/users/{userId}
   │       ├─> Update subscriptionTier
   │       ├─> Update feedbackLimit
   │       ├─> Log activity
   │       └─> No payment required (admin override)
   │
   ├─> Suspend/Activate User
   │   └─> PUT /api/admin/users/{userId}
   │       ├─> Update subscriptionStatus
   │       └─> Log activity
   │
   └─> Update User Profile
       └─> PUT /api/admin/users/{userId}
           ├─> Update name, contact info
           └─> Log activity

5. BUSINESS MANAGEMENT ACTIONS
   ├─> Reassign Business
   │   └─> POST /api/admin/businesses/{businessId}/reassign
   │       ├─> Validate target user exists
   │       ├─> Update business.ownerId
   │       ├─> Log activity (admin & business)
   │       └─> Preserve feedbacks & analytics
   │
   ├─> Reactivate Deleted Business
   │   └─> POST /api/admin/businesses/{businessId}/reactivate
   │       ├─> Set isActive: true
   │       ├─> Clear deletedAt, deletedBy
   │       ├─> Create BusinessReactivation record
   │       ├─> Log activity
   │       └─> Preserve generation count
   │
   ├─> Delete Permanently
   │   └─> DELETE /api/admin/businesses/{businessId}
   │       ├─> Check if already deleted (isActive: false)
   │       ├─> Cascade delete:
   │       │   ├─> Products
   │       │   ├─> Employees
   │       │   ├─> Feedbacks
   │       │   └─> Analytics
   │       └─> Log activity
   │
   └─> Edit Business Details
       └─> PUT /api/businesses/{businessId}
           ├─> Update name, type, URLs, etc.
           └─> Log activity

6. SUPERADMIN PANEL ACCESS
   └─> /superadmin
       ├─> System-wide statistics
       ├─> Admin management (future)
       ├─> Advanced user management
       └─> Platform settings (future)

7. ACTIVITY LOGGING (Automatic)
   └─> All admin actions logged to ActivityLog
       ├─> adminId
       ├─> action type
       ├─> entityType & entityId
       ├─> JSON details
       └─> timestamp
```

### Admin Permissions

```
┌────────────────────────────────────────────────────────┐
│         SUPERADMIN EXCLUSIVE CAPABILITIES              │
├────────────────────────────────────────────────────────┤
│ ✓ View all users                                       │
│ ✓ View all businesses (all owners)                     │
│ ✓ Change user subscription tiers                       │
│ ✓ Suspend/activate users                               │
│ ✓ Reassign businesses between users                    │
│ ✓ Reactivate deleted businesses                        │
│ ✓ Permanently delete businesses                        │
│ ✓ View all analytics (platform-wide)                   │
│ ✓ View activity logs (all admins)                      │
│ ✓ No subscription limits                               │
│ ✓ Access admin & superadmin panels                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│         REGULAR USER RESTRICTIONS                      │
├────────────────────────────────────────────────────────┤
│ ✗ Cannot view other users                              │
│ ✗ Cannot view other users' businesses                  │
│ ✗ Cannot change own subscription (payment required)    │
│ ✗ Cannot reassign businesses                           │
│ ✗ Cannot reactivate deleted businesses                 │
│ ✗ Limited to own analytics only                        │
│ ✓ Can request business reassignment                    │
│ ✓ Can soft-delete own businesses                       │
└────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │◄──────────┐
│ passwordHash    │           │
│ name            │           │
│ role            │           │ ownerId (FK)
│ subscriptionTier│           │
│ feedbackLimit   │           │
└────────┬────────┘           │
         │                    │
         │ ownerId (FK)       │
         │                    │
         ▼                    │
┌─────────────────┐           │
│    Business     │───────────┘
├─────────────────┤
│ id (PK)         │
│ ownerId (FK)    │◄──────────┐
│ businessName    │           │
│ googleMapsUrl   │           │ businessId (FK)
│ normalizedUrl   │           │
│ generationCount │           │
│ isActive        │           │
└────────┬────────┘           │
         │                    │
         │ businessId (FK)    │
         │                    │
         ├────────────────────┤
         │                    │
         ▼                    │
┌─────────────────┐           │
│    Product      │           │
├─────────────────┤           │
│ id (PK)         │           │
│ businessId (FK) │───────────┤
│ name            │           │
│ category        │           │
└─────────────────┘           │
         │                    │
         │                    │
         ▼                    │
┌─────────────────┐           │
│    Employee     │           │
├─────────────────┤           │
│ id (PK)         │           │
│ businessId (FK) │───────────┤
│ name            │           │
│ role            │           │
└─────────────────┘           │
         │                    │
         │                    │
         ▼                    │
┌─────────────────┐           │
│    Feedback     │           │
├─────────────────┤           │
│ id (PK)         │           │
│ businessId (FK) │───────────┤
│ content         │           │
│ sentiment       │           │
│ usageCount      │           │
│ isActive        │           │
└─────────────────┘           │
         │                    │
         │                    │
         ▼                    │
┌─────────────────┐           │
│    Analytics    │           │
├─────────────────┤           │
│ id (PK)         │           │
│ businessId (FK) │───────────┘
│ eventType       │
│ feedbackId      │
│ timestamp       │
└─────────────────┘

┌─────────────────────────┐
│ BusinessReactivation    │
├─────────────────────────┤
│ id (PK)                 │
│ businessId (FK)         │
│ reactivatedBy (FK)      │
│ reactivatedAt           │
│ previousGenerationCount │
└─────────────────────────┘

┌─────────────────────────┐
│    ActivityLog          │
├─────────────────────────┤
│ id (PK)                 │
│ adminId (FK)            │
│ action                  │
│ entityType              │
│ entityId                │
│ details (JSON)          │
│ timestamp               │
└─────────────────────────┘

┌─────────────────────────┐
│ BusinessActivityLog     │
├─────────────────────────┤
│ id (PK)                 │
│ businessId (FK)         │
│ userId (FK)             │
│ action                  │
│ entityType              │
│ entityName              │
│ timestamp               │
└─────────────────────────┘

┌─────────────────────────┐
│ ReassignmentRequest     │
├─────────────────────────┤
│ id (PK)                 │
│ businessId (FK)         │
│ requestedBy (FK)        │
│ requestedFor (FK)       │
│ status                  │
│ reviewedBy (FK)         │
└─────────────────────────┘
```

### Key Indexes for Performance

```sql
-- User table
CREATE UNIQUE INDEX User_email ON User(email);

-- Business table
CREATE INDEX Business_ownerId ON Business(ownerId);
CREATE INDEX Business_googleMapsUrl ON Business(googleMapsUrl);
CREATE INDEX Business_normalizedUrl_isActive ON Business(normalizedGoogleMapsUrl, isActive);
CREATE INDEX Business_ownerId_businessName ON Business(ownerId, businessName);

-- Feedback table
CREATE INDEX Feedback_businessId_isActive ON Feedback(businessId, isActive);
CREATE INDEX Feedback_businessId_usageCount ON Feedback(businessId, usageCount);

-- Analytics table
CREATE INDEX Analytics_businessId_timestamp ON Analytics(businessId, timestamp);
CREATE INDEX Analytics_businessId_eventType ON Analytics(businessId, eventType);

-- ActivityLog table
CREATE INDEX ActivityLog_adminId ON ActivityLog(adminId);
CREATE INDEX ActivityLog_entityType_entityId ON ActivityLog(entityType, entityId);
CREATE INDEX ActivityLog_timestamp ON ActivityLog(timestamp);

-- BusinessActivityLog table
CREATE INDEX BusinessActivityLog_businessId_timestamp ON BusinessActivityLog(businessId, timestamp);
CREATE INDEX BusinessActivityLog_userId ON BusinessActivityLog(userId);

-- ReassignmentRequest table
CREATE INDEX ReassignmentRequest_businessId ON ReassignmentRequest(businessId);
CREATE INDEX ReassignmentRequest_status ON ReassignmentRequest(status);
```

---

## Duplicate Prevention

### Google Maps URL Duplicate Detection

**Problem:** Same business registered multiple times with variations:
- `https://g.page/r/example`
- `HTTPS://WWW.G.PAGE/R/EXAMPLE/`
- `http://g.page/r/example?param=value`

**Solution:** URL Normalization Algorithm

```typescript
// lib/url-normalizer.ts
function normalizeGoogleMapsUrl(url: string): string {
  let normalized = url.trim().toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www.
  normalized = normalized.replace(/^www\./, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // Remove query parameters
  normalized = normalized.split('?')[0];

  // Remove fragment
  normalized = normalized.split('#')[0];

  return normalized;
}

// Example transformations:
// "HTTPS://WWW.G.PAGE/R/EXAMPLE/" → "g.page/r/example"
// "https://g.page/r/example?param=value" → "g.page/r/example"
```

**Duplicate Check Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│         BUSINESS CREATION - DUPLICATE CHECK FLOW            │
└─────────────────────────────────────────────────────────────┘

Step 1: User enters Google Maps URL
   └─> "HTTPS://G.PAGE/R/MyBusiness/?param=123"

Step 2: Frontend validation (PUT /api/businesses)
   ├─> Trim whitespace
   ├─> Check format (must contain google.com or g.page)
   └─> Call API for duplicate check

Step 3: Backend duplicate check
   ├─> Normalize input URL
   │   └─> "g.page/r/mybusiness"
   │
   ├─> Check exact match (original URL)
   │   └─> WHERE googleMapsUrl = trimmedUrl AND isActive = true
   │   └─> If found: DUPLICATE
   │
   ├─> Check normalized match
   │   ├─> Fetch all active businesses
   │   ├─> Normalize each googleMapsUrl
   │   ├─> Compare with input normalizedUrl
   │   └─> If found: DUPLICATE
   │
   └─> If duplicate found:
       ├─> For regular users:
       │   ├─> Show error message
       │   ├─> "This Google Maps URL is already registered"
       │   └─> "Please contact support for reassignment"
       │
       └─> For superadmin:
           ├─> Show owner details:
           │   ├─> Owner name & email
           │   ├─> Subscription tier
           │   ├─> Business usage stats
           │   └─> Generation count
           │
           └─> Allow reassignment
               └─> Opens reassignment modal

Step 4: Store both URLs
   ├─> googleMapsUrl: original input (trimmed)
   ├─> normalizedGoogleMapsUrl: normalized version
   └─> Both used for future duplicate checks
```

**Utility Scripts:**

```bash
# Check existing duplicates
npm run check-duplicates

# Normalize all existing URLs (one-time migration)
npm run normalize-urls

# Detect and resolve duplicates interactively
npm run resolve-duplicates
```

### Business Name Duplicate Detection

**Scope:** Per-user only (not global)

```
┌─────────────────────────────────────────────────────────────┐
│       BUSINESS NAME DUPLICATE CHECK (Per User)              │
└─────────────────────────────────────────────────────────────┘

Step 1: User enters business name
   └─> "My Coffee Shop"

Step 2: Check user's existing businesses
   ├─> Fetch all user's businesses (including deleted)
   │   └─> WHERE ownerId = userId
   │
   ├─> Normalize business names (lowercase, trim)
   │   └─> "my coffee shop"
   │
   └─> Compare with input

Step 3: If duplicate found
   ├─> Show previous business details
   │   ├─> Business name
   │   ├─> Deleted status
   │   ├─> Generation count
   │   └─> Deletion date (if deleted)
   │
   └─> Options:
       ├─> Use different name
       ├─> Contact admin to reactivate (if deleted)
       └─> Upgrade to reset limits (if applicable)

Step 4: If no duplicate
   └─> Allow creation

Note: Different users CAN have same business name
```

### Email Duplicate Detection

**Scope:** Global (case-insensitive)

```
┌─────────────────────────────────────────────────────────────┐
│         EMAIL DUPLICATE CHECK (Registration)                │
└─────────────────────────────────────────────────────────────┘

Step 1: User enters email
   └─> "JohnDoe@Example.COM"

Step 2: Normalize email
   └─> "johndoe@example.com" (lowercase, trim)

Step 3: Database lookup (case-insensitive)
   ├─> Try exact match: WHERE email = normalizedEmail
   │
   └─> Fallback: Fetch all users, compare lowercased

Step 4: If duplicate found
   └─> Return error: "User with this email already exists"
   └─> Suggest: "Try logging in" or "Reset password"

Step 5: If no duplicate
   └─> Create user with normalized email
   └─> Hash password (bcrypt, 12 rounds)

Note: Login also uses case-insensitive email lookup
```

### Summary of Duplicate Prevention

| Type | Scope | Method | Field |
|------|-------|--------|-------|
| Google Maps URL | Global | Normalization + DB check | `normalizedGoogleMapsUrl` |
| Business Name | Per-user | Case-insensitive comparison | `businessName` |
| Email | Global | Case-insensitive + normalized | `email` |

**Database Constraints:**
```prisma
model User {
  email String @unique  // Enforces uniqueness
}

model Business {
  @@index([ownerId, businessName])  // Composite index for per-user check
  @@index([normalizedGoogleMapsUrl, isActive])  // Duplicate URL check
}
```

---

## Independent vs Dependent Systems

### Independent Systems (Can Run Standalone)

```
┌─────────────────────────────────────────────────────────────┐
│               INDEPENDENT SYSTEMS                           │
│   (No external dependencies, self-contained)                │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION SYSTEM
   Files:
   - lib/auth.ts
   - app/api/auth/signup/route.ts
   - app/api/auth/login/route.ts
   - app/api/auth/logout/route.ts
   - app/api/auth/me/route.ts
   - context/AuthContext.tsx

   Dependencies: ONLY database (User table)

   Functions:
   - User registration (email, password)
   - Login (JWT generation)
   - Logout (cookie clearing)
   - Session verification
   - Password hashing (bcrypt)

   Can work without: Businesses, Feedbacks, Analytics

2. URL NORMALIZATION UTILITY
   Files:
   - lib/url-normalizer.ts

   Dependencies: NONE (pure function)

   Functions:
   - normalizeGoogleMapsUrl()
   - No database, no API calls

   Can work without: Everything

3. CACHING LAYER
   Files:
   - lib/cache.ts

   Dependencies: OPTIONAL Redis (falls back to memory)

   Functions:
   - get(key)
   - set(key, value, ttl)
   - delete(key)
   - clear()

   Can work without: Database, other systems

4. ACTIVITY LOGGER
   Files:
   - lib/activity-logger.ts

   Dependencies: ONLY database (ActivityLog, BusinessActivityLog)

   Functions:
   - logAdminActivity()
   - logBusinessActivity()
   - Async logging (fire-and-forget)

   Can work without: Business logic (passive observer)

5. PRISMA CLIENT
   Files:
   - lib/prisma.ts

   Dependencies: Database only

   Functions:
   - Singleton Prisma client
   - Connection pooling

   Can work without: Application logic

6. UI COMPONENTS
   Files:
   - components/ui/*

   Dependencies: NONE (pure presentation)

   Components:
   - Button, Card, Input, Label, etc.
   - No business logic

   Can work without: Everything (reusable)
```

### Dependent Systems (Require Other Systems)

```
┌─────────────────────────────────────────────────────────────┐
│               DEPENDENT SYSTEMS                             │
│   (Require other systems to function)                       │
└─────────────────────────────────────────────────────────────┘

1. BUSINESS MANAGEMENT SYSTEM
   Dependencies:
   ├─> Authentication (lib/auth.ts) - getCurrentUser()
   ├─> URL Normalization (lib/url-normalizer.ts)
   ├─> Activity Logger (lib/activity-logger.ts)
   ├─> Prisma (lib/prisma.ts)
   └─> AI Service (lib/ai.ts) - for feedback generation

   Files:
   - app/api/businesses/route.ts (GET, POST, PUT)
   - app/api/businesses/[businessId]/route.ts
   - app/dashboard/page.tsx
   - app/my-businesses/page.tsx

   Cannot work without:
   - User authentication (need ownerId)
   - Database (Business table)

2. FEEDBACK GENERATION SYSTEM
   Dependencies:
   ├─> Authentication (lib/auth.ts) - canGenerateFeedback()
   ├─> Business Management (must have business first)
   ├─> AI Service (lib/ai.ts) - generateFeedbacks()
   ├─> Google Maps Scraper (lib/google-maps-scraper.ts) - optional
   ├─> Activity Logger (lib/activity-logger.ts)
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/api/feedbacks/generate/route.ts
   - app/api/feedbacks/preview/route.ts
   - lib/ai.ts

   Cannot work without:
   - Business (businessId required)
   - User authentication (subscription check)
   - Database (Feedback table)

3. REVIEW COLLECTION SYSTEM
   Dependencies:
   ├─> Business Management (fetch business data)
   ├─> Feedback System (fetch generated feedbacks)
   ├─> Analytics System (track events)
   ├─> Cache (lib/cache.ts) - optional
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/review/[businessId]/page.tsx
   - app/api/feedbacks/[businessId]/route.ts
   - app/api/analytics/route.ts

   Cannot work without:
   - Business (must exist)
   - Feedbacks (must be generated)
   - Database (Business, Feedback, Analytics tables)

4. ANALYTICS SYSTEM
   Dependencies:
   ├─> Business Management (businessId validation)
   ├─> Feedback System (feedbackId for selection events)
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/api/analytics/route.ts
   - components/BusinessActivityLog.tsx

   Cannot work without:
   - Business (businessId required)
   - Database (Analytics table)

5. ADMIN DASHBOARD SYSTEM
   Dependencies:
   ├─> Authentication (lib/auth.ts) - role check
   ├─> Business Management (fetch all businesses)
   ├─> User Management (fetch all users)
   ├─> Activity Logger (display logs)
   ├─> Analytics (display stats)
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/admin/dashboard/page.tsx
   - app/api/admin/dashboard/route.ts
   - app/api/admin/users/route.ts
   - app/api/admin/businesses/route.ts

   Cannot work without:
   - Authentication (role: "superadmin")
   - Database (all tables)

6. SUBSCRIPTION MANAGEMENT SYSTEM
   Dependencies:
   ├─> Authentication (lib/auth.ts) - user verification
   ├─> Payment System (app/api/payments/process/route.ts)
   ├─> Activity Logger (log subscription changes)
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/pricing/page.tsx
   - app/checkout/page.tsx
   - app/api/payments/process/route.ts
   - lib/auth.ts (subscription logic)

   Cannot work without:
   - User authentication
   - Database (User table)
   - Payment gateway (mock currently)

7. REASSIGNMENT REQUEST SYSTEM
   Dependencies:
   ├─> Authentication (lib/auth.ts) - user verification
   ├─> Business Management (business validation)
   ├─> User Management (target user validation)
   ├─> Activity Logger (log reassignments)
   └─> Prisma (lib/prisma.ts)

   Files:
   - app/api/reassignment-requests/route.ts
   - app/api/admin/businesses/[businessId]/reassign/route.ts

   Cannot work without:
   - Business (businessId required)
   - Users (requestedBy, requestedFor)
   - Database (ReassignmentRequest table)
```

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM DEPENDENCY GRAPH                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Database   │ ◄─── Everything depends on this
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Prisma    │ ◄─── All API routes use this
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                  LEVEL 1: Core Systems                   │
│  (Independent, only depend on database)                  │
├──────────────────────────────────────────────────────────┤
│  • Authentication (lib/auth.ts)                          │
│  • URL Normalizer (lib/url-normalizer.ts)                │
│  • Cache (lib/cache.ts)                                  │
│  • Activity Logger (lib/activity-logger.ts)              │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│                  LEVEL 2: Business Logic                 │
│  (Depends on Level 1)                                    │
├──────────────────────────────────────────────────────────┤
│  • Business Management                                   │
│    ├─> Uses: Auth, URL Normalizer, Activity Logger       │
│    └─> Provides: Business CRUD                           │
│                                                          │
│  • User Management                                       │
│    ├─> Uses: Auth, Activity Logger                       │
│    └─> Provides: User CRUD                               │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│                  LEVEL 3: Feature Systems                │
│  (Depends on Levels 1 & 2)                               │
├──────────────────────────────────────────────────────────┤
│  • Feedback Generation                                   │
│    ├─> Uses: Auth, Business Management, AI Service       │
│    └─> Provides: AI-generated feedbacks                  │
│                                                          │
│  • Subscription Management                               │
│    ├─> Uses: Auth, User Management                       │
│    └─> Provides: Tier upgrades                           │
└───────────────────┬──────────────────────────────────────┘
                    │
                    
                    ▼
┌──────────────────────────────────────────────────────────┐
│              LEVEL 4: Customer-Facing Systems             │
│  (Depends on Levels 1, 2, 3)                             │
├──────────────────────────────────────────────────────────┤
│  • Review Collection                                      │
│    ├─> Uses: Business, Feedback, Analytics              │
│    └─> Provides: Customer review page                    │
│                                                           │
│  • Analytics Tracking                                     │
│    ├─> Uses: Business, Feedback                          │
│    └─> Provides: Event tracking                          │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│              LEVEL 5: Administrative Systems              │
│  (Depends on all previous levels)                        │
├──────────────────────────────────────────────────────────┤
│  • Admin Dashboard                                        │
│    ├─> Uses: Auth, Business, User, Analytics, Activity  │
│    └─> Provides: Platform management                     │
│                                                           │
│  • Reassignment System                                    │
│    ├─> Uses: Auth, Business, User, Activity              │
│    └─> Provides: Business transfer                       │
└──────────────────────────────────────────────────────────┘
```

### Critical Path Dependencies

```
USER REGISTRATION FLOW (Minimal Dependencies):
Authentication → Database
✓ Can register without any businesses

BUSINESS CREATION FLOW (Medium Dependencies):
Authentication → User → Business → Database
+ URL Normalizer (duplicate check)
+ Activity Logger (optional)

FEEDBACK GENERATION FLOW (Heavy Dependencies):
Authentication → User → Business → Subscription Check → AI Service → Database
+ Activity Logger (optional)
+ Google Maps Scraper (optional)

CUSTOMER REVIEW FLOW (Full Stack):
Business → Feedbacks → Analytics → Cache (optional) → Database
(No authentication required for customers)

ADMIN OPERATIONS FLOW (Maximum Dependencies):
Authentication → Role Check → Target System → Activity Logger → Database
(Depends on specific operation: user, business, analytics, etc.)
```

---

## API Endpoints Reference

### Authentication Endpoints (6)

```
POST /api/auth/signup
├─> Body: { email, password, name? }
├─> Returns: { user, token }
├─> Sets: HTTP-only cookie (auth_token)
└─> Dependencies: None (independent)

POST /api/auth/login
├─> Body: { email, password }
├─> Returns: { user }
├─> Sets: HTTP-only cookie (auth_token)
└─> Dependencies: None (independent)

POST /api/auth/logout
├─> Body: None
├─> Returns: { success }
├─> Clears: HTTP-only cookie
└─> Dependencies: None (independent)

GET /api/auth/me
├─> Headers: Cookie (auth_token)
├─> Returns: { user } or null
└─> Dependencies: None (independent)

PUT /api/auth/profile
├─> Body: { name, ownerName, primaryContact, etc. }
├─> Returns: { user }
├─> Auth: Required
└─> Dependencies: Authentication

POST /api/auth/change-password
├─> Body: { currentPassword, newPassword }
├─> Returns: { success }
├─> Auth: Required
└─> Dependencies: Authentication
```

### Business Endpoints (9)

```
GET /api/businesses
├─> Query: None
├─> Returns: User's businesses (or all for superadmin)
├─> Auth: Required
└─> Dependencies: Authentication, Database

POST /api/businesses
├─> Body: { businessName, businessType, googleMapsUrl, products[], employees[], etc. }
├─> Returns: { business }
├─> Auth: Required
├─> Checks: Duplicate URL, business name
└─> Dependencies: Auth, URL Normalizer, Activity Logger

PUT /api/businesses
├─> Body: { googleMapsUrl }
├─> Returns: { isDuplicate, owner? }
├─> Purpose: Validate URL before creation
├─> Auth: Required
└─> Dependencies: Auth, URL Normalizer

POST /api/businesses/validate-usage
├─> Body: { businessId }
├─> Returns: { canGenerate, reason? }
├─> Auth: Required
└─> Dependencies: Auth, Subscription check

GET /api/businesses/[businessId]
├─> Returns: { business with products, employees }
├─> Auth: Required (owner or admin)
└─> Dependencies: Auth, Database

PUT /api/businesses/[businessId]
├─> Body: { businessName, businessType, etc. }
├─> Returns: { business }
├─> Auth: Required (owner or admin)
└─> Dependencies: Auth, Activity Logger

DELETE /api/businesses/[businessId]
├─> Returns: { success }
├─> Action: Soft delete (isActive: false)
├─> Auth: Required (owner or admin)
└─> Dependencies: Auth, Activity Logger

POST /api/businesses/[businessId]/archive-to-admin
├─> Returns: { success }
├─> Action: Reassign to admin
├─> Auth: Required (admin only)
└─> Dependencies: Auth, Activity Logger

GET /api/businesses/[businessId]/activity
├─> Returns: { logs[] }
├─> Auth: Required (owner or admin)
└─> Dependencies: Auth, Activity Logger
```

### Feedback Endpoints (3)

```
POST /api/feedbacks/generate
├─> Body: { businessId }
├─> Returns: { feedbacks[] } (100 feedbacks)
├─> Auth: Required
├─> Checks: Generation limit
├─> Updates: Business.generationCount++
└─> Dependencies: Auth, Business, AI Service, Subscription check

POST /api/feedbacks/preview
├─> Body: { businessData }
├─> Returns: { feedbacks[] } (10 samples)
├─> Auth: Required
└─> Dependencies: Auth, AI Service

GET /api/feedbacks/[businessId]
├─> Query: ?all=true (optional)
├─> Returns: 12 random feedbacks (or all if ?all=true)
├─> Auth: Not required (public for customers)
├─> Updates: feedback.usageCount++ (smart rotation)
├─> Cache: 30 minutes
└─> Dependencies: Business, Cache (optional)
```

### Analytics Endpoints (1)

```
POST /api/analytics
├─> Body: { businessId, eventType, feedbackId?, userAgent?, ipHash? }
├─> Returns: { success }
├─> Events: 'qr_scan' | 'feedback_selected' | 'google_redirect'
├─> Auth: Not required (public for customers)
└─> Dependencies: Business
```

### Admin Endpoints (9)

```
GET /api/admin/dashboard
├─> Returns: { stats, users, businesses, subscriptions }
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth, all tables

GET /api/admin/users
├─> Query: ?search=, ?role=, ?tier=
├─> Returns: { users[] }
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth

PUT /api/admin/users/[userId]
├─> Body: { subscriptionTier, subscriptionStatus, role, etc. }
├─> Returns: { user }
├─> Auth: Required (superadmin only)
├─> Logs: Activity log
└─> Dependencies: Auth, Activity Logger

GET /api/admin/businesses
├─> Query: ?search=, ?ownerId=, ?isActive=
├─> Returns: { businesses[] with owner }
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth

POST /api/admin/businesses/create
├─> Body: { business data, ownerId }
├─> Returns: { business }
├─> Auth: Required (superadmin only)
├─> Purpose: Admin creates business for user
└─> Dependencies: Auth, URL Normalizer, Activity Logger

GET /api/admin/businesses/admin-businesses
├─> Returns: { businesses[] } (admin-owned only)
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth

POST /api/admin/businesses/[businessId]/reassign
├─> Body: { targetUserId }
├─> Returns: { business }
├─> Auth: Required (superadmin only)
├─> Updates: business.ownerId
├─> Logs: Admin & business activity
└─> Dependencies: Auth, Activity Logger

POST /api/admin/businesses/[businessId]/reactivate
├─> Returns: { business }
├─> Auth: Required (superadmin only)
├─> Updates: isActive: true, clear deletedAt
├─> Creates: BusinessReactivation record
└─> Dependencies: Auth, Activity Logger

DELETE /api/admin/businesses/[businessId]
├─> Returns: { success }
├─> Action: Permanent delete (cascade)
├─> Auth: Required (superadmin only)
├─> Deletes: Products, Employees, Feedbacks, Analytics
└─> Dependencies: Auth, Activity Logger

GET /api/admin/activity-log
├─> Query: ?adminId=, ?entityType=, ?limit=
├─> Returns: { logs[] }
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth, Activity Logger

GET /api/admin/payments
├─> Query: ?userId=, ?tier=
├─> Returns: { payments[] }
├─> Auth: Required (superadmin only)
├─> Note: Mock implementation (no real data)
└─> Dependencies: Auth
```

### Superadmin Endpoints (3)

```
GET /api/superadmin/stats
├─> Returns: { totalUsers, totalBusinesses, platformStats }
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth, all tables

GET /api/superadmin/users
├─> Returns: { users[] } (includes admins)
├─> Auth: Required (superadmin only)
└─> Dependencies: Auth

PUT /api/superadmin/users/[userId]
├─> Body: { any user field }
├─> Returns: { user }
├─> Auth: Required (superadmin only)
├─> Purpose: Advanced user management
└─> Dependencies: Auth, Activity Logger
```

### Payment Endpoints (1)

```
POST /api/payments/process
├─> Body: { plan: 'pro' | 'lifetime', userId }
├─> Returns: { success, user }
├─> Updates: User subscription fields
├─> Auth: Required
├─> Note: MOCK implementation (no real payment)
└─> Dependencies: Auth, Activity Logger
```

### Reassignment Endpoints (2)

```
POST /api/reassignment-requests
├─> Body: { businessId, requestedFor, reason? }
├─> Returns: { request }
├─> Auth: Required
└─> Dependencies: Auth, Business

GET /api/reassignment-requests
├─> Returns: { requests[] }
├─> Auth: Required
└─> Dependencies: Auth
```

### Setup Endpoints (1)

```
POST /api/setup/superadmin
├─> Body: { email, password, name }
├─> Returns: { user }
├─> Purpose: Create initial superadmin
├─> Auth: Not required (one-time setup)
└─> Dependencies: None (independent)
```

### Usage Endpoints (2)

```
GET /api/usage
├─> Returns: { businessCount, feedbackCount, stats }
├─> Auth: Required
└─> Dependencies: Auth

GET /api/my-businesses
├─> Returns: { businesses[] with feedbacks }
├─> Auth: Required
└─> Dependencies: Auth
```

---

## Flow Diagrams

### 1. User Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│              USER REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────┘

[User] ─────────────────────────────────────────────────┐
  │                                                       │
  │ 1. Visit /signup                                     │
  ▼                                                       │
┌──────────────────┐                                     │
│  Signup Page     │                                     │
│  (/signup)       │                                     │
└────────┬─────────┘                                     │
         │                                               │
         │ 2. Fill form:                                 │
         │    - Email                                    │
         │    - Password                                 │
         │    - Name (optional)                          │
         │                                               │
         │ 3. Click "Sign Up"                            │
         ▼                                               │
┌──────────────────────────────────────┐                │
│  POST /api/auth/signup               │                │
├──────────────────────────────────────┤                │
│  1. Normalize email (lowercase)      │                │
│  2. Check duplicate (case-insensitive│                │
│  3. Validate password (min 6 chars)  │                │
│  4. Hash password (bcrypt, 12 rounds)│                │
│  5. Create user:                     │                │
│     - role: "owner"                  │                │
│     - subscriptionTier: "free"       │                │
│     - subscriptionStatus: "active"   │                │
│     - businessLimit: -1 (unlimited)  │                │
│     - feedbackLimit: 5               │                │
│  6. Generate JWT token               │                │
│  7. Set HTTP-only cookie (7 days)    │                │
│  8. Return user data                 │                │
└────────┬─────────────────────────────┘                │
         │                                               │
         │ Success                                       │
         ▼                                               │
┌──────────────────┐                                     │
│  Redirect to     │                                     │
│  /dashboard      │                                     │
└──────────────────┘                                     │
                                                         │
                                                         │
┌─────────────────────────────────────────────────────────────┐
│                   USER LOGIN FLOW                            │
└─────────────────────────────────────────────────────────────┘

[User] ─────────────────────────────────────────────────┐
  │                                                       │
  │ 1. Visit /login                                      │
  ▼                                                       │
┌──────────────────┐                                     │
│  Login Page      │                                     │
│  (/login)        │                                     │
└────────┬─────────┘                                     │
         │                                               │
         │ 2. Fill form:                                 │
         │    - Email                                    │
         │    - Password                                 │
         │                                               │
         │ 3. Click "Login"                              │
         ▼                                               │
┌──────────────────────────────────────┐                │
│  POST /api/auth/login                │                │
├──────────────────────────────────────┤                │
│  1. Normalize email (lowercase)      │                │
│  2. Find user (case-insensitive)     │                │
│  3. Verify password (bcrypt compare) │                │
│  4. Generate JWT token               │                │
│  5. Set HTTP-only cookie (7 days)    │                │
│  6. Return user data                 │                │
└────────┬─────────────────────────────┘                │
         │                                               │
         │ Success                                       │
         ▼                                               │
┌──────────────────┐                                     │
│  Redirect to     │                                     │
│  /dashboard      │                                     │
│  (or /admin if   │                                     │
│   superadmin)    │                                     │
└──────────────────┘                                     │
```

### 2. Business Creation & Feedback Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│         BUSINESS CREATION & FEEDBACK GENERATION             │
└─────────────────────────────────────────────────────────────┘

[User Dashboard] (/dashboard)
  │
  │ STEP 1: Business Information
  ▼
┌──────────────────────────────────────┐
│  Business Info Form                  │
├──────────────────────────────────────┤
│  • Business Name                     │
│  • Business Type                     │
│  • Google Maps Review URL            │
│  • Google Maps About URL (optional)  │
│  • Business Location (optional)      │
│  • About Business (max 50 words)     │
│  • Brand Logo URL (optional)         │
│  • Products/Services (dynamic list)  │
│  • Employees (dynamic list, optional)│
└────────┬─────────────────────────────┘
         │
         │ User fills form
         │
         │ Click "Continue to Review Generation"
         ▼
┌──────────────────────────────────────┐
│  PUT /api/businesses                 │
│  (Validate Google Maps URL)          │
├──────────────────────────────────────┤
│  1. Normalize URL                    │
│  2. Check duplicates:                │
│     - Exact match check              │
│     - Normalized match check         │
│  3. If duplicate:                    │
│     - Regular user: Show error       │
│     - Admin: Show owner details      │
│  4. Return validation result         │
└────────┬─────────────────────────────┘
         │
         │ ┌─────────────────┐
         │ │  If duplicate:  │
         │ │  - Contact      │
         │ │    support      │
         │ │  - Admin can    │
         │ │    reassign     │
         │ └─────────────────┘
         │
         │ No duplicate, proceed
         ▼
┌──────────────────────────────────────┐
│  STEP 2: Generate Reviews            │
├──────────────────────────────────────┤
│  • Review business info              │
│  • Show generation details:          │
│    - 100 templates total             │
│    - 70 positive (4-5 stars)         │
│    - 30 neutral (3-4 stars)          │
│  • Show usage warning (if free tier) │
│  • Generation count: X/5             │
└────────┬─────────────────────────────┘
         │
         │ ┌─────────────────────────────┐
         │ │  Check generation limit:    │
         │ │  - Free: 5 per business     │
         │ │  - Pro/Lifetime: Unlimited  │
         │ │                             │
         │ │  If limit reached:          │
         │ │  - Show upgrade prompt      │
         │ │  - Disable generate button  │
         │ └─────────────────────────────┘
         │
         │ Click "Generate Reviews with AI"
         ▼
┌──────────────────────────────────────┐
│  STEP 2.5: Preview (Optional)        │
│  POST /api/feedbacks/preview         │
├──────────────────────────────────────┤
│  1. Generate 10 sample feedbacks     │
│  2. Use AI or mock templates         │
│  3. Display samples                  │
│  4. User can regenerate              │
└────────┬─────────────────────────────┘
         │
         │ Click "Generate All 100 Reviews & Continue"
         ▼
┌──────────────────────────────────────┐
│  POST /api/businesses                │
│  (Create business)                   │
├──────────────────────────────────────┤
│  1. Validate all fields              │
│  2. Create business record           │
│  3. Create products (if any)         │
│  4. Create employees (if any)        │
│  5. Store original & normalized URL  │
│  6. Log activity                     │
│  7. Return business with ID          │
└────────┬─────────────────────────────┘
         │
         │ Business created
         ▼
┌──────────────────────────────────────┐
│  POST /api/feedbacks/generate        │
│  (Generate 100 feedbacks)            │
├──────────────────────────────────────┤
│  1. Check subscription tier          │
│  2. Check generation limit:          │
│     - business.generationCount < 5   │
│       (free tier)                    │
│     - OR feedbackLimit = -1          │
│       (pro/lifetime)                 │
│  3. Fetch business data:             │
│     - Business details               │
│     - Products list                  │
│     - Employees list                 │
│  4. Call AI service:                 │
│     - lib/ai.ts                      │
│     - generateFeedbacks()            │
│  5. Generate feedbacks:              │
│     - 70 positive (sentiment)        │
│     - 30 neutral (sentiment)         │
│     - 40-80 words each               │
│     - Include products, employees    │
│  6. Save to database:                │
│     - 100 Feedback records           │
│  7. Update business:                 │
│     - generationCount++              │
│  8. Log activity                     │
│  9. Return feedbacks                 │
└────────┬─────────────────────────────┘
         │
         │ Feedbacks generated
         ▼
┌──────────────────────────────────────┐
│  STEP 3: Get Review Link & QR Code  │
├──────────────────────────────────────┤
│  Display:                            │
│  • Review Link:                      │
│    /review/{businessId}              │
│    [Copy Button]                     │
│                                      │
│  • QR Code:                          │
│    Points to review link             │
│    [Download as PNG]                 │
│                                      │
│  • All 100 Feedbacks:                │
│    [List with copy & share buttons]  │
│                                      │
│  Next Steps:                         │
│  • Send link to customers            │
│  • Display QR code at location       │
│  • Track analytics in dashboard      │
└──────────────────────────────────────┘
```

### 3. Customer Review Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│            CUSTOMER REVIEW SELECTION FLOW                   │
└─────────────────────────────────────────────────────────────┘

[Customer]
  │
  │ 1. Scans QR Code OR clicks review link
  ▼
┌──────────────────────────────────────┐
│  Review Page                         │
│  /review/[businessId]                │
│  (Page Load)                         │
└────────┬─────────────────────────────┘
         │
         │ 2. Track QR scan event
         ▼
┌──────────────────────────────────────┐
│  POST /api/analytics                 │
├──────────────────────────────────────┤
│  Body: {                             │
│    businessId,                       │
│    eventType: "qr_scan",             │
│    timestamp: now,                   │
│    userAgent,                        │
│    ipHash                            │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         │ 3. Fetch feedbacks (smart rotation)
         ▼
┌──────────────────────────────────────┐
│  GET /api/feedbacks/[businessId]     │
├──────────────────────────────────────┤
│  1. Check cache (30 min TTL)        │
│  2. If not cached:                   │
│     - Fetch all active feedbacks     │
│     - ORDER BY usageCount ASC        │
│     - LIMIT 12 (least used first)    │
│  3. Increment usageCount for         │
│     selected 12                      │
│  4. Cache result                     │
│  5. Return feedbacks + business      │
└────────┬─────────────────────────────┘
         │
         │ 4. Display 12 review cards
         ▼
┌──────────────────────────────────────┐
│  Review Selection UI                 │
├──────────────────────────────────────┤
│  • Business Name (header)            │
│  • Instructions                      │
│  • Grid of 12 review cards:          │
│    ┌────────────────────┐            │
│    │ 5-Star Review      │            │
│    ├────────────────────┤            │
│    │ ⭐⭐⭐⭐⭐         │          │
│    │                    │            │
│    │ [Review content]   │            │
│    │ 40-80 words        │            │
│    │                    │            │
│    │ [Click to select]  │            │
│    └────────────────────┘            │
│  • Framer Motion animations          │
└────────┬─────────────────────────────┘
         │
         │ 5. Customer clicks a review card
         ▼
┌──────────────────────────────────────┐
│  Review Selected (Client-side)       │
├──────────────────────────────────────┤
│  1. Highlight selected card          │
│  2. Show checkmark                   │
│  3. Show "Copy & Continue" button    │
└────────┬─────────────────────────────┘
         │
         │ 6. Click "Copy & Continue to Google"
         ▼
┌──────────────────────────────────────┐
│  Copy to Clipboard (Client-side)     │
│  + Track Analytics                   │
├──────��───────────────────────────────┤
│  1. Copy review content              │
│  2. Show "Copied!" notification      │
└────────┬─────────────────────────────┘
         │
         │ 7. Track feedback_selected event
         ▼
┌──────────────────────────────────────┐
│  POST /api/analytics                 │
├──────────────────────────────────────┤
│  Body: {                             │
│    businessId,                       │
│    feedbackId,                       │
│    eventType: "feedback_selected",   │
│    timestamp: now,                   │
│    userAgent,                        │
│    ipHash                            │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         │ 8. Track google_redirect event
         ▼
┌──────────────────────────────────────┐
│  POST /api/analytics                 │
├──────────────────────────────────────┤
│  Body: {                             │
│    businessId,                       │
│    eventType: "google_redirect",     │
│    timestamp: now,                   │
│    userAgent,                        │
│    ipHash                            │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         │ 9. Redirect to Google Maps
         ▼
┌──────────────────────────────────────┐
│  window.open()                       │
│  → business.googleMapsUrl            │
│                                      │
│  Customer lands on Google Maps       │
│  Review page with review already     │
│  copied to clipboard                 │
│                                      │
│  Customer pastes review and submits  │
└──────────────────────────────────────┘
```

### 4. Subscription Upgrade Flow

```
┌─────────────────────────────────────────────────────────────┐
│              SUBSCRIPTION UPGRADE FLOW                       │
└─────────────────────────────────────────────────────────────┘

[User Dashboard]
  │
  │ Generation limit reached (Free tier)
  ▼
┌──────────────────────────────────────┐
│  Usage Warning Component             │
├──────────────────────────────────────┤
│  ⚠️ You've reached your limit        │
│     (5 generations for this business)│
│                                      │
│  Upgrade to Pro for unlimited        │
│  generations!                        │
│                                      │
│  [Upgrade to Pro] button             │
└────────┬─────────────────────────────┘
         │
         │ Click "Upgrade to Pro"
         ▼
┌──────────────────────────────────────┐
│  Pricing Page (/pricing)             │
├──────────────────────────────────────┤
│  3 Tiers:                            │
│                                      │
│  1. Free - ₹0 (Current)              │
│     • Unlimited businesses           │
│     • 5 generations per business     │
│     • Basic QR code                  │
│     • Email support                  │
│                                      │
│  2. Pro - ₹9,999 / 6 months          │
│     • Unlimited businesses           │
│     • Unlimited generations          │
│     • Custom QR codes                │
│     • Priority support               │
│     [Upgrade to Pro] button          │
│                                      │
│  3. Lifetime - ₹39,999 one-time      │
│     • Everything in Pro              │
│     • Lifetime access (no renewals)  │
│     • White-label QR codes           │
│     • Dedicated support              │
│     [Get Lifetime] button            │
└────────┬─────────────────────────────┘
         │
         │ Select plan (e.g., Pro)
         ▼
┌──────────────────────────────────────┐
│  Checkout Page                       │
│  /checkout?plan=pro                  │
├──────────────────────────────────────┤
│  Plan: Pro (6 months)                │
│  Price: ₹9,999                       │
│                                      │
│  Features recap                      │
│                                      │
│  [Proceed to Payment] button         │
└────────┬─────────────────────────────┘
         │
         │ Click "Proceed to Payment"
         ▼
┌──────────────────────────────────────┐
│  POST /api/payments/process          │
│  (Mock Implementation)               │
├──────────────────────────────────────┤
│  Body: { plan: "pro", userId }       │
│                                      │
│  1. Verify user authentication       │
│  2. Validate plan selection          │
│  3. Calculate dates:                 │
│     - Pro: +6 months from now        │
│     - Lifetime: null (never expires) │
│  4. Update user record:              │
│     UPDATE User SET                  │
│       subscriptionTier = "pro",      │
│       subscriptionStatus = "active", │
│       subscriptionType = "subscription",│
│       paymentType = "recurring",     │
│       feedbackLimit = -1 (unlimited),│
│       subscriptionStartDate = now,   │
│       subscriptionEndDate = +6mo     │
│     WHERE id = userId                │
│  5. Log activity (ActivityLog)       │
│  6. Return success                   │
└────────┬─────────────────────────────┘
         │
         │ Payment successful
         ▼
┌──────────────────────────────────────┐
│  Success Page                        │
│  /checkout/success                   │
├──────────────────────────────────────┤
│  ✓ Upgrade Successful!               │
│                                      │
│  You're now on Pro tier              │
│  • Unlimited generations             │
│  • Valid until: [date]               │
│                                      │
│  Next steps:                         │
│  • Generate unlimited feedbacks      │
│  • Create more businesses            │
│                                      │
│  [Go to Dashboard] button            │
└──────────────────────────────────────┘

Note: Real payment integration (Razorpay) would add:
- Order creation
- Payment gateway modal
- Payment verification
- Webhook handling
- Email confirmation
```

### 5. Admin Business Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│          ADMIN BUSINESS MANAGEMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

[Superadmin Login]
  │
  │ Navigate to /admin/dashboard
  ▼
┌──────────────────────────────────────┐
│  Admin Dashboard                     │
│  Tabs: Overview | Users | Businesses │
│        | Analytics | Activity | ...  │
└────────┬─────────────────────────────┘
         │
         │ Select "Business Management" tab
         ▼
┌──────────────────────────────────────┐
│  GET /api/admin/businesses           │
├──────────────────────────────────────┤
│  Returns all businesses:             │
│  • Business details                  │
│  • Owner info (name, email, tier)    │
│  • Products, employees               │
│  • Generation count                  │
│  • Active status                     │
│  • Created date                      │
└────────┬─────────────────────────────┘
         │
         │ Display business table
         ▼
┌──────────────────────────────────────────────────────────┐
│  Business Management Table                               │
├──────────────────────────────────────────────────────────┤
│  Search: [________] Filter: [All/Active/Deleted]        │
│                                                          │
│  ┌────┬────────────┬──────────┬───────┬────────────┐   │
│  │ ID │ Name       │ Owner    │ Tier  │ Actions    │   │
│  ├────┼────────────┼──────────┼───────┼────────────┤   │
│  │ 1  │ Coffee Co  │ john@..  │ Pro   │ [View]     │   │
│  │    │            │          │       │ [Edit]     │   │
│  │    │            │          │       │ [Reassign] │   │
│  │    │            │          │       │ [Delete]   │   │
│  ├────┼────────────┼──────────┼───────┼────────────┤   │
│  │ 2  │ Bakery LLC │ jane@..  │ Free  │ [View]     │   │
│  │    │ (Deleted)  │          │       │ [Reactivate│   │
│  └────┴────────────┴──────────┴───────┴────────────┘   │
└────────┬─────────────────────────────────────────────────┘
         │
         │ SCENARIO 1: Reassign Business
         ▼
┌──────────────────────────────────────┐
│  Click [Reassign] button             │
│  Opens modal                         │
├──────────────────────────────────────┤
│  Reassign Business                   │
│  ────────────────────────────        │
│  Current Owner: john@example.com     │
│  Business: Coffee Co                 │
│                                      │
│  New Owner:                          │
│  [Select user dropdown]              │
│    • jane@example.com (Free)         │
│    • bob@example.com (Pro)           │
│    • ...                             │
│                                      │
│  Reason (optional):                  │
│  [Text area]                         │
│                                      │
│  [Cancel] [Reassign Business]        │
└────────┬─────────────────────────────┘
         │
         │ Select new owner, click "Reassign"
         ▼
┌──────────────────────────────────────┐
│  POST /api/admin/businesses/         │
│       {businessId}/reassign          │
├──────────────────────────────────────┤
│  Body: { targetUserId, reason }      │
│                                      │
│  1. Verify admin role                │
│  2. Verify business exists           │
│  3. Verify target user exists        │
│  4. Update business:                 │
│     UPDATE Business SET              │
│       ownerId = targetUserId         │
│     WHERE id = businessId            │
│  5. Log admin activity:              │
│     - Action: business_reassigned    │
│     - From: oldOwnerId               │
│     - To: targetUserId               │
│     - Reason: reason                 │
│  6. Log business activity            │
│  7. Preserve:                        │
│     - Feedbacks                      │
│     - Analytics                      │
│     - Products, employees            │
│  8. Return updated business          │
└────────┬─────────────────────────────┘
         │
         │ Reassignment successful
         ▼
┌──────────────────────────────────────┐
│  Show success toast                  │
│  Refresh business table              │
│  New owner now sees business         │
└──────────────────────────────────────┘

         │
         │ SCENARIO 2: Reactivate Deleted Business
         ▼
┌──────────────────────────────────────┐
│  Click [Reactivate] button           │
│  (for deleted business)              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  POST /api/admin/businesses/         │
│       {businessId}/reactivate        │
├──────────────────────────────────────┤
│  1. Verify admin role                │
│  2. Verify business is deleted       │
│     (isActive = false)               │
│  3. Update business:                 │
│     UPDATE Business SET              │
│       isActive = true,               │
│       deletedAt = null,              │
│       deletedBy = null               │
│     WHERE id = businessId            │
│  4. Create BusinessReactivation:     │
│     INSERT INTO BusinessReactivation │
│       (businessId, reactivatedBy,    │
│        reactivatedAt, reason,        │
│        previousGenerationCount)      │
│  5. Log admin activity               │
│  6. Business.generationCount         │
│     preserved (no reset)             │
│  7. Return reactivated business      │
└────────┬─────────────────────────────┘
         │
         │ Reactivation successful
         ▼
┌──────────────────────────────────────┐
│  Show success toast                  │
│  Refresh business table              │
│  Business now marked as active       │
│  Owner can access business again     │
└──────────────────────────────────────┘

         │
         │ SCENARIO 3: Permanent Delete
         ▼
┌──────────────────────────────────────┐
│  Click [Delete] button               │
│  (for deleted business)              │
│  Confirmation dialog                 │
└────────┬─────────────────────────────┘
         │
         │ Confirm deletion
         ▼
┌──────────────────────────────────────┐
│  DELETE /api/admin/businesses/       │
│         {businessId}                 │
├──────────────────────────────────────┤
│  1. Verify admin role                │
│  2. Check if already deleted         │
│     (isActive = false)               │
│  3. Cascade delete:                  │
│     - DELETE Products                │
│     - DELETE Employees               │
│     - DELETE Feedbacks               │
│     - DELETE Analytics               │
│     - DELETE BusinessActivityLogs    │
│     - DELETE Business                │
│  4. Log admin activity               │
│  5. Return success                   │
└────────┬─────────────────────────────┘
         │
         │ Permanent deletion complete
         ▼
┌──────────────────────────────────────┐
│  Show success toast                  │
│  Refresh business table              │
│  Business permanently removed        │
│  Cannot be recovered                 │
└──────────────────────────────────────┘
```

---

## Critical Implementation Details

### 1. Authentication & Authorization

**JWT Token Structure:**
```typescript
{
  userId: string
  email: string
  role: string
  iat: number  // issued at
  exp: number  // expiration (7 days)
}
```

**Cookie Configuration:**
```typescript
{
  name: "auth_token"
  httpOnly: true      // Prevents XSS attacks
  secure: true        // HTTPS only (production)
  sameSite: "lax"     // CSRF protection
  maxAge: 7 days
  path: "/"
}
```

**Authorization Checks:**
```typescript
// Every protected route:
const user = await getCurrentUser();
if (!user) return unauthorized();

// Superadmin-only routes:
if (user.role !== "superadmin") return forbidden();

// Owner-or-admin routes:
const business = await prisma.business.findUnique({ where: { id } });
if (business.ownerId !== user.id && user.role !== "superadmin") {
  return forbidden();
}
```

### 2. Subscription Logic

**Tier-Based Limits:**
```typescript
Free Tier:
- businessLimit: -1 (unlimited)
- feedbackLimit: 5 per business
- Check: business.generationCount < 5

Pro Tier (₹9,999 / 6 months):
- businessLimit: -1 (unlimited)
- feedbackLimit: -1 (unlimited)
- Check: subscriptionEndDate > now

Lifetime Tier (₹39,999 one-time):
- businessLimit: -1 (unlimited)
- feedbackLimit: -1 (unlimited)
- Check: Always active (no expiration)

Admin Tier:
- businessLimit: -1 (unlimited)
- feedbackLimit: -1 (unlimited)
- Check: Always active
```

**Generation Limit Check:**
```typescript
// lib/auth.ts
export function canGenerateFeedback(
  user: User,
  currentGenerationCount: number
): boolean {
  // Superadmin: Always allow
  if (user.role === "superadmin") return true;

  // Check subscription active
  if (!isSubscriptionActive(user)) return false;

  // Free tier: Check business-level limit
  if (user.subscriptionTier === "free") {
    return currentGenerationCount < 5;
  }

  // Pro/Lifetime: Unlimited
  return user.feedbackLimit === -1;
}
```

### 3. Smart Feedback Rotation

**Algorithm:**
```typescript
// GET /api/feedbacks/[businessId]
// Smart rotation based on usageCount

SELECT * FROM Feedback
WHERE businessId = ? AND isActive = true
ORDER BY usageCount ASC  // Least used first
LIMIT 12;

// Increment usageCount for selected feedbacks
UPDATE Feedback
SET usageCount = usageCount + 1
WHERE id IN (selectedIds);

// Cache for 30 minutes
cache.set(`feedbacks:${businessId}`, feedbacks, 1800);
```

**Why Smart Rotation?**
- Ensures all feedbacks get used evenly
- Prevents "dead" feedbacks that never show up
- Provides variety for returning customers
- Balances usage across 100 templates

### 4. Activity Logging

**Admin Actions:**
```typescript
// Log all admin actions to ActivityLog
await logAdminActivity({
  adminId: user.id,
  action: "business_reassigned",
  entityType: "business",
  entityId: businessId,
  details: JSON.stringify({
    fromOwner: oldOwnerId,
    toOwner: newOwnerId,
    reason: reason
  })
});
```

**Business Actions:**
```typescript
// Log business-level actions to BusinessActivityLog
await logBusinessActivity({
  businessId,
  userId: user.id,
  action: "product_created",
  entityType: "product",
  entityId: productId,
  entityName: productName,
  details: JSON.stringify(productData)
});
```

**Action Types:**
```typescript
Admin Actions:
- user_created, user_updated, user_deleted
- business_reassigned, business_reactivated, business_deleted
- subscription_changed, role_changed

Business Actions:
- product_created, product_updated, product_deleted
- employee_created, employee_updated, employee_deleted
- feedback_generated
- business_info_updated
```

### 5. Soft Delete Pattern

**Implementation:**
```typescript
// Soft delete business
UPDATE Business SET
  isActive = false,
  deletedAt = NOW(),
  deletedBy = userId
WHERE id = businessId;

// Preserve all related data:
// - Products, employees (not deleted)
// - Feedbacks (marked inactive)
// - Analytics (preserved for history)

// Query active businesses
SELECT * FROM Business
WHERE isActive = true AND ownerId = userId;

// Reactivation
UPDATE Business SET
  isActive = true,
  deletedAt = null,
  deletedBy = null
WHERE id = businessId;

// Create reactivation record
INSERT INTO BusinessReactivation (...)
VALUES (...);
```

**Benefits:**
- Data recovery possible
- Audit trail maintained
- Analytics history preserved
- Generation count preserved

### 6. URL Normalization

**Edge Cases Handled:**
```typescript
// Different protocols
"https://g.page/r/example"
"http://g.page/r/example"
→ Same normalized URL

// Case sensitivity
"HTTPS://G.PAGE/R/EXAMPLE"
"https://g.page/r/example"
→ Same normalized URL

// www prefix
"https://www.g.page/r/example"
"https://g.page/r/example"
→ Same normalized URL

// Trailing slash
"https://g.page/r/example/"
"https://g.page/r/example"
→ Same normalized URL

// Query parameters
"https://g.page/r/example?param=value"
"https://g.page/r/example?other=123"
→ Same normalized URL

// Fragments
"https://g.page/r/example#section"
"https://g.page/r/example#other"
→ Same normalized URL
```

### 7. Error Handling

**API Error Response Format:**
```typescript
{
  error: string;  // User-facing message
  code?: string;  // Error code for debugging
  details?: any;  // Additional error details
}

Examples:
- { error: "Unauthorized" } // 401
- { error: "Business not found" } // 404
- { error: "Generation limit reached" } // 403
- { error: "Invalid Google Maps URL" } // 400
```

**Client-Side Error Handling:**
```typescript
try {
  const response = await fetch("/api/...");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Something went wrong");
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error(error);
  toast.error(error.message);
}
```

### 8. Performance Optimizations

**Database Indexes:**
```typescript
// Critical indexes for query performance
Business:
- ownerId (fetch user's businesses)
- googleMapsUrl (duplicate check)
- normalizedGoogleMapsUrl + isActive (duplicate check)
- isActive (filter active businesses)

Feedback:
- businessId + isActive (fetch active feedbacks)
- businessId + usageCount (smart rotation)

Analytics:
- businessId + timestamp (date range queries)
- businessId + eventType (event filtering)
```

**Caching Strategy:**
```typescript
// Feedback cache (30 minutes)
key: `feedbacks:${businessId}`
ttl: 1800 seconds

// User cache (5 minutes) - if needed
key: `user:${userId}`
ttl: 300 seconds

// Cache invalidation:
- On feedback generation (clear feedbacks cache)
- On business update (clear business cache)
- On user update (clear user cache)
```

**Query Optimization:**
```typescript
// Include related data in single query
const business = await prisma.business.findUnique({
  where: { id: businessId },
  include: {
    products: true,
    employees: true,
    feedbacks: { where: { isActive: true } },
    owner: { select: { name: true, email: true } }
  }
});

// Avoid N+1 queries
const businesses = await prisma.business.findMany({
  include: { owner: true }  // Single JOIN instead of N queries
});
```

---

---

## Implementation Status & Completeness

### Current Implementation Status

#### ✅ Fully Implemented Features

**1. Authentication System (100%)**
- ✅ User signup with email/password
- ✅ User login with JWT tokens
- ✅ HTTP-only cookie management
- ✅ Case-insensitive email handling
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Session management (7-day expiration)
- ✅ Logout functionality
- ✅ Password change functionality
- ✅ Profile update functionality

**2. User Management System (100%)**
- ✅ User registration
- ✅ User profile management
- ✅ Subscription tier tracking
- ✅ Usage limits enforcement
- ✅ Role-based access control (owner, superadmin)
- ✅ User state management (active, expired, suspended)

**3. Business Management System (100%)**
- ✅ Business creation wizard (3 steps)
- ✅ Business information collection
- ✅ Product/service management (dynamic lists)
- ✅ Employee management (dynamic lists)
- ✅ Google Maps URL validation
- ✅ Duplicate detection (URL & name)
- ✅ Business editing
- ✅ Soft delete with recovery
- ✅ Business listing (per user & admin)
- ✅ Business detail view
- ✅ Activity logging for all operations

**4. Feedback Generation System (100%)**
- ✅ AI-powered feedback generation (100 templates)
- ✅ Sentiment distribution (70 positive, 30 neutral)
- ✅ Preview functionality (10 samples)
- ✅ Generation limit enforcement
- ✅ Usage tracking (generationCount)
- ✅ Mock template fallback (no OpenAI key)
- ✅ Product/service mention in feedbacks
- ✅ Employee name integration
- ✅ Natural language variation
- ✅ Google Maps About page scraping (optional)

**5. Review Collection System (100%)**
- ✅ Customer review page (/review/{businessId})
- ✅ QR code generation (SVG → PNG)
- ✅ Smart feedback rotation (12 random, usage-based)
- ✅ Review selection UI
- ✅ Copy to clipboard functionality
- ✅ Google Maps redirect
- ✅ Analytics tracking (3 event types)
- ✅ Framer Motion animations
- ✅ Mobile-responsive design

**6. Analytics System (100%)**
- ✅ QR scan tracking
- ✅ Feedback selection tracking
- ✅ Google redirect tracking
- ✅ IP address hashing (privacy)
- ✅ User agent capture
- ✅ Timestamp recording
- ✅ Business-level analytics
- ✅ Admin dashboard analytics view

**7. Subscription Management (100%)**
- ✅ Three tiers (Free, Pro, Lifetime)
- ✅ Tier-based limits enforcement
- ✅ Subscription expiry calculation
- ✅ Renewal reminders (30-day window)
- ✅ Usage warnings for free tier
- ✅ Upgrade flow (pricing → checkout → success)
- ✅ Subscription status tracking
- ✅ Admin subscription override

**8. Admin Dashboard System (100%)**
- ✅ Overview statistics
- ✅ User management tab
- ✅ Business management tab
- ✅ Analytics tab
- ✅ Activity log tab
- ✅ Reassignment requests tab
- ✅ Search and filter functionality
- ✅ User subscription management
- ✅ Business reassignment
- ✅ Business reactivation
- ✅ Permanent business deletion
- ✅ Activity logging for all actions

**9. Superadmin Features (100%)**
- ✅ Superadmin creation script
- ✅ Platform-wide statistics
- ✅ User management (all users)
- ✅ Business management (all businesses)
- ✅ Subscription tier changes
- ✅ User suspension/activation
- ✅ No usage limits
- ✅ Access to admin & superadmin panels

**10. Duplicate Prevention (100%)**
- ✅ Google Maps URL normalization
- ✅ Case-insensitive email matching
- ✅ Per-user business name checking
- ✅ Duplicate resolution workflows
- ✅ Admin override for duplicates
- ✅ Utility scripts for duplicate management

**11. Activity Logging (100%)**
- ✅ Admin action logging (ActivityLog)
- ✅ Business action logging (BusinessActivityLog)
- ✅ JSON details storage
- ✅ Timestamp tracking
- ✅ Action type categorization
- ✅ Entity tracking (type & ID)
- ✅ Admin dashboard display

**12. UI/UX Components (100%)**
- ✅ shadcn/ui component library
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Navigation component
- ✅ Usage warning component
- ✅ Business activity log component
- ✅ Form validation
- ✅ Toast notifications (sonner)
- ✅ Loading states
- ✅ Error handling

#### ⚠️ Partially Implemented Features

**1. Payment Integration (30%)**
- ✅ Payment API endpoint structure
- ✅ Subscription update logic
- ✅ Checkout pages (pricing, checkout, success)
- ❌ Real payment gateway integration (Stripe/Razorpay)
- ❌ Payment verification
- ❌ Webhook handling
- ❌ Payment history tracking
- ❌ Invoice generation
- ❌ Refund handling
- ❌ Email notifications

**Status:** Mock implementation ready, needs real gateway integration

**2. Email Notifications (0%)**
- ❌ Welcome email on signup
- ❌ Subscription expiry reminders
- ❌ Payment confirmation emails
- ❌ Business creation confirmation
- ❌ Password reset emails
- ❌ Admin action notifications

**Status:** Not implemented

**3. Reassignment Request System (70%)**
- ✅ Request creation API
- ✅ Request listing API
- ✅ Database model
- ❌ Request approval/rejection workflow
- ❌ User notification on status change
- ❌ Admin dashboard UI for requests

**Status:** Backend ready, frontend needs completion

#### 🔮 Future Enhancement Opportunities

**1. Advanced Analytics**
- Conversion rate tracking
- A/B testing for feedback templates
- Heatmap for feedback selection
- Time-based analytics (hourly, daily, weekly)
- Export to CSV/PDF
- Custom date range filters
- Comparison between businesses
- Industry benchmarks

**2. Team Collaboration**
- Multiple users per business
- Team roles (admin, editor, viewer)
- Permission management
- Team activity feed
- Collaboration notifications

**3. Customization Features**
- Custom QR code designs (colors, logos)
- Branded review pages (custom CSS)
- Custom feedback templates
- White-label option (remove branding)
- Custom domain support
- Multi-language support

**4. Integration Enhancements**
- Google My Business API integration
- Real-time review sync from Google
- Social media sharing (Facebook, Twitter)
- Webhook support for external integrations
- Zapier integration
- API for third-party apps

**5. Feedback Management**
- Feedback editing by business owner
- Feedback archiving
- Feedback categories/tags
- Feedback search and filter
- Favorite feedbacks
- Feedback performance metrics

**6. Business Management Enhancements**
- Bulk operations (import/export businesses)
- Business templates
- Business categories/tags
- Business groups
- Multi-location support
- Franchise management

**7. User Experience Improvements**
- Dark mode
- Keyboard shortcuts
- Onboarding tour
- Interactive tutorials
- Help center integration
- In-app chat support

**8. Security Enhancements**
- Two-factor authentication (2FA)
- IP whitelisting for admin
- Rate limiting per user
- CAPTCHA on signup/login
- Session management (view active sessions)
- Audit trail for sensitive operations

**9. Performance Optimizations**
- Server-side caching (Redis full integration)
- CDN for static assets
- Image optimization
- Database query optimization
- Lazy loading for lists
- Pagination improvements

**10. Reporting & Insights**
- Business performance reports
- Revenue reports (for admin)
- User engagement reports
- Subscription analytics
- Custom report builder
- Scheduled email reports

---

## System Interaction Diagrams

### Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REVIEWBOOST SYSTEM ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [User Dashboard]  [Admin Dashboard]  [Customer Review Page]   │
│        │                  │                     │              │
│        │                  │                     │              │
│        └──────────┬───────┴─────────────────────┘              │
│                   │                                            │
│                   ▼                                            │
│          [Navigation Component]                                │
│          [Auth Context Provider]                               │
│                   │                                            │
└───────────────────┼────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │   Auth APIs  │  │Business APIs │  │Feedback APIs │         │
│   │  (6 routes)  │  │  (9 routes)  │  │  (3 routes)  │         │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│          │                  │                  │               │
│          │                  │                  │               │
│   ┌──────┴──────────────────┴──────────────────┴───────┐       │
│   │            Next.js API Route Handlers              │       │
│   └──────────────────────┬─────────────────────────────┘       │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐       │
│  │  lib/auth  │  │lib/ai.ts     │  │lib/url-normalizer│      │
│  │   .ts      │  │(AI Service)  │  │    .ts          │       │
│  └─────┬──────┘  └──────┬───────┘  └────────┬────────┘       │
│        │                │                     │                │
│        │  ┌──────────────────────────────┐   │                │
│        │  │  lib/activity-logger.ts      │   │                │
│        │  └──────────────┬───────────────┘   │                │
│        │                 │                    │                │
│        └─────────┬───────┴────────────────────┘                │
│                  │                                             │
└──────────────────┼─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│                          DATA ACCESS LAYER                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     ┌──────────────────┐                       │
│                     │  lib/prisma.ts   │                       │
│                     │ (Prisma Client)  │                       │
│                     └────────┬─────────┘                       │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     SQLite (Development)                        │
│                     PostgreSQL (Production)                     │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐     │
│  │  User   │  │Business │  │Feedback │  │ Analytics   │     │
│  │ Table   │  │ Table   │  │ Table   │  │   Table     │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘     │
│                                                                 │
│  + 7 more tables (Product, Employee, ActivityLog, etc.)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [OpenAI API]      [Google Maps]     [Razorpay]               │
│   (Optional)       (Scraping)        (Future)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Journey - End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE USER JOURNEY (End-to-End)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐
│  New User   │
│  Visits App │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  1. SIGN UP             │
├─────────────────────────┤
│  • Enter email/password │
│  • Account created      │
│  • Auto-login           │
│  • Free tier assigned   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  2. DASHBOARD           │
├─────────────────────────┤
│  • Welcome message      │
│  • Empty state          │
│  • "Create Business"    │
│    button               │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  3. CREATE BUSINESS (Step 1/3)              │
├─────────────────────────────────────────────┤
│  • Fill business info:                      │
│    - Name: "Joe's Coffee Shop"              │
│    - Type: "Cafe"                           │
│    - Google Maps URL                        │
│    - Products: [Espresso, Latte, Pastries]  │
│    - Employees: [Sarah, Mike]               │
│  • Click "Continue"                         │
│  • URL validation check                     │
└──────┬──────────────────────────────────────┘
       │
       ▼  ✅ No duplicate
┌─────────────────────────────────────────────┐
│  4. GENERATE REVIEWS (Step 2/3)             │
├─────────────────────────────────────────────┤
│  • Review entered info                      │
│  • See generation details:                  │
│    "Will generate 100 reviews               │
│     (70 positive, 30 neutral)"              │
│  • Usage meter: "1/5 generations used"      │
│  • Click "Generate Reviews with AI"         │
│  • Preview 10 samples                       │
│  • Click "Generate All 100 & Continue"      │
│  ⏳ Processing... (10-30 seconds)           │
└──────┬──────────────────────────────────────┘
       │
       ▼  ✅ 100 feedbacks generated
┌─────────────────────────────────────────────┐
│  5. GET REVIEW LINK (Step 3/3)              │
├─────────────────────────────────────────────┤
│  • Review link displayed                    │
│    📋 https://app.com/review/abc123         │
│        [Copy Link]                          │
│                                             │
│  • QR Code generated                        │
│    [QR Code Image]                          │
│    [Download QR Code]                       │
│                                             │
│  • All 100 feedbacks listed                 │
│    [Feedback 1] [Copy] [Share to Google]    │
│    [Feedback 2] [Copy] [Share to Google]    │
│    ... (98 more)                            │
│                                             │
│  Next Steps Guide:                          │
│  ✓ Print QR code, display at store          │
│  ✓ Send link to customers via SMS/Email     │
│  ✓ Share on social media                    │
└──────┬──────────────────────────────────────┘
       │
       │  👤 Business Owner Actions
       ▼
┌─────────────────────────────────────────────┐
│  6. SHARE WITH CUSTOMERS                    │
├─────────────────────────────────────────────┤
│  Option A: Physical QR Code                 │
│  • Print QR code poster                     │
│  • Display at checkout counter              │
│  • Customer scans with phone                │
│                                             │
│  Option B: Digital Link                     │
│  • Send link via WhatsApp/SMS               │
│  • Email to customers                       │
│  • Post on social media                     │
│  • Add to website footer                    │
└──────┬──────────────────────────────────────┘
       │
       │  📱 Customer Actions
       ▼
┌─────────────────────────────────────────────┐
│  7. CUSTOMER SCANS QR / CLICKS LINK         │
├─────────────────────────────────────────────┤
│  • Review page loads                        │
│  • Business name shown                      │
│  • 12 review cards displayed                │
│  • Instructions: "Choose a review"          │
│                                             │
│  [Review Card 1]  [Review Card 2]           │
│  ⭐⭐⭐⭐⭐     ⭐⭐⭐⭐⭐             │
│  "Amazing coffee   "Best espresso           │
│   and friendly     in town! Sarah           │
│   service..."      was so helpful..."       │
│                                             │
│  ... (10 more cards)                        │
└──────┬──────────────────────────────────────┘
       │
       ▼  👆 Customer clicks a card
┌─────────────────────────────────────────────┐
│  8. CUSTOMER SELECTS REVIEW                 │
├─────────────────────────────────────────────┤
│  • Selected card highlighted ✓              │
│  • "Copy & Continue to Google" button       │
│  • Click button                             │
│  • Review copied to clipboard ✓             │
│  • "Copied!" notification shown             │
│  • Redirecting to Google Maps...            │
└──────┬──────────────────────────────────────┘
       │
       ▼  🌐 Opens Google Maps
┌─────────────────────────────────────────────┐
│  9. GOOGLE MAPS REVIEW PAGE                 │
├─────────────────────────────────────────────┤
│  • Google Maps review page opens            │
│  • Customer sees review text box            │
│  • Pastes copied review (Ctrl+V)            │
│  • Adds star rating (5 stars)               │
│  • Clicks "Post"                            │
│  • Review published! ✓                      │
└──────┬──────────────────────────────────────┘
       │
       │  📊 Behind the scenes
       ▼
┌─────────────────────────────────────────────┐
│  10. ANALYTICS TRACKED                      │
├─────────────────────────────────────────────┤
│  Events recorded:                           │
│  ✓ qr_scan (when page loaded)               │
│  ✓ feedback_selected (when card clicked)    │
│  ✓ google_redirect (before redirect)        │
│                                             │
│  Business owner can view:                   │
│  • Total QR scans                           │
│  • Most selected reviews                    │
│  • Conversion rate                          │
│  • Peak hours for scans                     │
└──────┬──────────────────────────────────────┘
       │
       │  🔁 Repeat Process
       ▼
┌─────────────────────────────────────────────┐
│  11. USER CONTINUES                         │
├─────────────────────────────────────────────┤
│  Options:                                   │
│  • Create more businesses (unlimited)       │
│  • Generate more reviews (4 left - free)    │
│  • View analytics                           │
│  • Edit business info                       │
│  • Download new QR codes                    │
│  • Upgrade to Pro (if limit reached)        │
└─────────────────────────────────────────────┘


┌─────────────────────────────────────────────┐
│  12. LIMIT REACHED (Free Tier)              │
├─────────────────────────────────────────────┤
│  • User tries 6th generation                │
│  • Warning modal appears:                   │
│    "You've reached your limit!              │
│     Upgrade to Pro for unlimited"           │
│  • [View Pricing] button                    │
└──────┬──────────────────────────────────────┘
       │
       ▼  💳 User decides to upgrade
┌─────────────────────────────────────────────┐
│  13. UPGRADE TO PRO                         │
├─────────────────────────────────────────────┤
│  • View pricing page                        │
│  • Select Pro (₹9,999/6mo)                  │
│  • Proceed to checkout                      │
│  • Payment processed (mock)                 │
│  • Subscription updated ✓                   │
│  • Now: Unlimited generations!              │
└──────┬──────────────────────────────────────┘
       │
       ▼  🎉 Pro User Benefits
┌─────────────────────────────────────────────┐
│  14. PRO USER EXPERIENCE                    │
├─────────────────────────────────────────────┤
│  • Unlimited businesses                     │
│  • Unlimited feedback generations           │
│  • Custom QR codes                          │
│  • Priority support                         │
│  • Advanced analytics                       │
│  • Valid for 6 months                       │
│  • Renewal reminder at 30 days              │
└─────────────────────────────────────────────┘
```

---

## Component-Level Architecture

### Frontend Component Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                     APP COMPONENT TREE                         │
└────────────────────────────────────────────────────────────────┘

app/
├── layout.tsx (Root Layout)
│   ├── <html>
│   ├── <body>
│   │   └── <AuthProvider>              ← Context wrapper
│   │       ├── <Navigation />          ← Global navigation
│   │       └── {children}               ← Page content
│   └── </body>
│
├── page.tsx (Home Page)
│   ├── Hero section
│   ├── Features grid
│   ├── Pricing preview
│   └── CTA buttons
│
├── login/page.tsx (Login Page)
│   ├── <Card>
│   │   ├── <Form>
│   │   │   ├── <Input type="email" />
│   │   │   ├── <Input type="password" />
│   │   │   └── <Button>Login</Button>
│   │   └── </Form>
│   └── Link to /signup
│
├── signup/page.tsx (Signup Page)
│   ├── <Card>
│   │   ├── <Form>
│   │   │   ├── <Input type="email" />
│   │   │   ├── <Input type="password" />
│   │   │   ├── <Input type="text" name="name" />
│   │   │   └── <Button>Sign Up</Button>
│   │   └── </Form>
│   └── Link to /login
│
├── dashboard/page.tsx (User Dashboard) ★
│   ├── [Protected Route - requires auth]
│   │
│   ├── Step 1: Business Information
│   │   ├── <Card>
│   │   │   ├── <Input name="businessName" />
│   │   │   ├── <Input name="businessType" />
│   │   │   ├── <Input name="googleMapsUrl" />
│   │   │   ├── <Textarea name="aboutBusiness" />
│   │   │   ├── Dynamic Product List
│   │   │   │   └── <Input name="products[]" />
│   │   │   ├── Dynamic Employee List
│   │   │   │   └── <Input name="employees[]" />
│   │   │   └── <Button>Continue</Button>
│   │   └── </Card>
│   │
│   ├── Step 2: Generate Reviews
│   │   ├── <Card>
│   │   │   ├── Business info summary
│   │   │   ├── Generation details
│   │   │   ├── <UsageWarning /> (if free tier)
│   │   │   ├── <Button>Preview</Button>
│   │   │   └── <Button>Generate All 100</Button>
│   │   └── </Card>
│   │   └── Preview Modal (if clicked)
│   │       ├── 10 sample feedbacks
│   │       └── <Button>Regenerate</Button>
│   │
│   └── Step 3: Get Review Link
│       ├── <Card>
│       │   ├── Review Link
│       │   │   ├── <Input readonly value={link} />
│       │   │   └── <Button>Copy</Button>
│       │   ├── QR Code
│       │   │   ├── <QRCodeSVG />
│       │   │   └── <Button>Download</Button>
│       │   └── Feedbacks List
│       │       └── {feedbacks.map(f => (
│       │           <FeedbackCard>
│       │               ├── {f.content}
│       │               ├── <Button>Copy</Button>
│       │               └── <Button>Share</Button>
│       │           </FeedbackCard>
│       │       ))}
│       └── </Card>
│
├── my-businesses/page.tsx (Business List)
│   ├── [Protected Route]
│   ├── <Card>
│   │   ├── Business Grid
│   │   └── {businesses.map(b => (
│   │       <BusinessCard>
│   │           ├── {b.businessName}
│   │           ├── {b.feedbackCount} feedbacks
│   │           ├── <Button>View</Button>
│   │           ├── <Button>Edit</Button>
│   │           └── <Button>Delete</Button>
│   │       </BusinessCard>
│   │   ))}
│   └── </Card>
│
├── profile/page.tsx (User Profile)
│   ├── [Protected Route]
│   ├── <Card>
│   │   ├── Profile Info
│   │   │   ├── <Input name="name" />
│   │   │   ├── <Input name="email" readonly />
│   │   │   └── <Button>Update</Button>
│   │   ├── Subscription Info
│   │   │   ├── Current tier
│   │   │   ├── Expiry date (if Pro)
│   │   │   └── <Button>Upgrade</Button>
│   │   └── Change Password
│   │       ├── <Input type="password" name="current" />
│   │       ├── <Input type="password" name="new" />
│   │       └── <Button>Change</Button>
│   └── </Card>
│
├── pricing/page.tsx (Pricing Page)
│   ├── <div className="pricing-grid">
│   │   ├── <PricingCard tier="free">
│   │   │   ├── Features list
│   │   │   └── [Current Plan] (if free)
│   │   ├── <PricingCard tier="pro">
│   │   │   ├── Features list
│   │   │   └── <Button>Upgrade</Button>
│   │   └── <PricingCard tier="lifetime">
│   │       ├── Features list
│   │       └── <Button>Get Lifetime</Button>
│   └── </div>
│
├── checkout/page.tsx (Checkout Page)
│   ├── [Protected Route]
│   ├── <Card>
│   │   ├── Plan summary
│   │   ├── Price display
│   │   ├── Features recap
│   │   └── <Button>Proceed to Payment</Button>
│   └── </Card>
│
├── checkout/success/page.tsx (Success Page)
│   ├── <Card>
│   │   ├── ✓ Success message
│   │   ├── Subscription details
│   │   └── <Button>Go to Dashboard</Button>
│   └── </Card>
│
├── review/[businessId]/page.tsx (Customer Review Page) ★★
│   ├── [PUBLIC - No auth required]
│   ├── <div className="review-container">
│   │   ├── <h1>{businessName}</h1>
│   │   ├── Instructions
│   │   ├── Review Grid (2 cols desktop, 1 mobile)
│   │   │   └── {feedbacks.map(f => (
│   │   │       <motion.div>           ← Framer Motion
│   │   │           <ReviewCard
│   │   │               selected={selectedId === f.id}
│   │   │               onClick={() => setSelected(f.id)}
│   │   │           >
│   │   │               ├── ⭐⭐⭐⭐⭐
│   │   │               ├── {f.content}
│   │   │               └── {selected && <CheckIcon />}
│   │   │           </ReviewCard>
│   │   │       </motion.div>
│   │   │   ))}
│   │   └── {selected && (
│   │       <Button>Copy & Continue to Google</Button>
│   │   )}
│   ├── QR Code section (collapsible)
│   │   ├── <QRCodeSVG />
│   │   └── <Button>Download</Button>
│   └── </div>
│
└── admin/dashboard/page.tsx (Admin Dashboard) ★★★
    ├── [Protected Route - superadmin only]
    ├── <Tabs defaultValue="overview">
    │   ├── <TabsList>
    │   │   ├── Overview
    │   │   ├── Users
    │   │   ├── Businesses
    │   │   ├── Analytics
    │   │   ├── Activity Log
    │   │   └── Reassignment Requests
    │   └── </TabsList>
    │
    ├── <TabsContent value="overview">
    │   ├── Stats Grid
    │   │   ├── <StatCard>Total Users</StatCard>
    │   │   ├── <StatCard>Total Businesses</StatCard>
    │   │   ├── <StatCard>Total Feedbacks</StatCard>
    │   │   └── <StatCard>Subscriptions</StatCard>
    │   └── Charts (Recharts)
    │       ├── <LineChart> User growth
    │       └── <PieChart> Subscription distribution
    │
    ├── <TabsContent value="users">
    │   ├── Search & Filter
    │   │   ├── <Input placeholder="Search users..." />
    │   │   └── <Select>Filter by tier</Select>
    │   ├── <Table>
    │   │   ├── <TableHeader>
    │   │   └── <TableBody>
    │   │       └── {users.map(u => (
    │   │           <TableRow>
    │   │               ├── {u.email}
    │   │               ├── {u.subscriptionTier}
    │   │               ├── {u.businessCount}
    │   │               └── <Actions>
    │   │                   ├── View
    │   │                   ├── Edit
    │   │                   └── Suspend
    │   │               </Actions>
    │   │           </TableRow>
    │   │       ))}
    │   └── </Table>
    │
    ├── <TabsContent value="businesses">
    │   ├── Search & Filter
    │   ├── <Table>
    │   │   └── {businesses.map(b => (
    │   │       <TableRow>
    │   │           ├── {b.businessName}
    │   │           ├── {b.owner.email}
    │   │           ├── {b.generationCount}
    │   │           └── <Actions>
    │   │               ├── View
    │   │               ├── Edit
    │   │               ├── Reassign
    │   │               ├── Reactivate (if deleted)
    │   │               └── Delete
    │   │           </Actions>
    │   │       </TableRow>
    │   │   ))}
    │   └── </Table>
    │
    ├── <TabsContent value="analytics">
    │   ├── <Card>Analytics Overview</Card>
    │   ├── Charts
    │   │   ├── QR scans over time
    │   │   ├── Feedback selections
    │   │   └── Conversion rate
    │   └── Top performing businesses
    │
    ├── <TabsContent value="activity">
    │   ├── <BusinessActivityLog businessId={null} />
    │   └── Filter controls
    │       ├── By admin
    │       ├── By action type
    │       └── By date range
    │
    └── <TabsContent value="reassignments">
        ├── <Table>
        │   └── {requests.map(r => (
        │       <TableRow>
        │           ├── {r.business.name}
        │           ├── {r.requestedBy.email}
        │           ├── {r.requestedFor.email}
        │           ├── {r.status}
        │           └── <Actions>
        │               ├── Approve
        │               ├── Reject
        │               └── View Details
        │           </Actions>
        │       </TableRow>
        │   ))}
        └── </Table>
```

### Shared Components

```
components/
│
├── ui/ (shadcn/ui components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── dialog.tsx
│   └── ... (15+ more)
│
├── Navigation.tsx
│   ├── Logo
│   ├── Nav Links (conditional based on auth)
│   │   ├── Dashboard (if user)
│   │   ├── My Businesses (if user)
│   │   ├── Admin Dashboard (if superadmin)
│   │   ├── Profile (if user)
│   │   └── Logout (if user)
│   └── Mobile menu toggle
│
├── UsageWarning.tsx
│   ├── Props: { businessId, generationCount, tier }
│   ├── Conditional render (only if free tier)
│   ├── Usage meter display
│   │   └── {generationCount} / 5 generations used
│   └── Upgrade button (if limit reached)
│
└── BusinessActivityLog.tsx
    ├── Props: { businessId? } (null = all businesses)
    ├── Fetch activity logs
    ├── <Table>
    │   └── {logs.map(log => (
    │       <TableRow>
    │           ├── {log.timestamp}
    │           ├── {log.user.email}
    │           ├── {log.action}
    │           ├── {log.entityType}
    │           └── <ViewDetails> JSON modal
    │       </TableRow>
    │   ))}
    └── </Table>
```

---

## Security Considerations

### Current Security Implementations

#### 1. Authentication Security ✅
```typescript
// Password Security
- bcrypt hashing (12 rounds)
- Minimum 6 characters
- No password strength requirements (future enhancement)
- No rate limiting on login attempts (future enhancement)

// Token Security
- JWT with 7-day expiration
- HTTP-only cookies (prevents XSS)
- SameSite: lax (CSRF protection)
- Secure flag (HTTPS only in production)

// Session Management
- Single session per user (no multiple device tracking)
- Manual logout clears cookie
- Token refresh not implemented (future enhancement)
```

#### 2. Authorization Security ✅
```typescript
// Role-Based Access Control (RBAC)
- getCurrentUser() check on all protected routes
- Role verification (owner vs superadmin)
- Business ownership verification
- API endpoint protection

// Authorization Patterns
// Pattern 1: User-only routes
const user = await getCurrentUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Pattern 2: Superadmin-only routes
if (user.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Pattern 3: Owner-or-admin routes
const business = await prisma.business.findUnique({ where: { id } });
if (business.ownerId !== user.id && user.role !== "superadmin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

#### 3. Data Privacy ✅
```typescript
// IP Address Hashing
- Analytics: IP addresses hashed with crypto.createHash('sha256')
- Not reversible
- Preserves uniqueness for tracking without storing PII

// User Data Protection
- Passwords never logged
- Sensitive data not exposed in API responses
- Email normalization prevents case-based duplicates

// Database Security
- No SQL injection (Prisma ORM parameterized queries)
- Unique constraints on email
- Indexed fields for performance
```

#### 4. Input Validation ✅
```typescript
// Frontend Validation
- Required field checks
- Email format validation
- URL format validation (Google Maps)
- Word count limits (aboutBusiness: 50 words)
- Dynamic list validation (products, employees)

// Backend Validation
- Duplicate detection (email, URL, business name)
- Business ownership verification
- Subscription tier verification
- Generation limit checks
- Safe JSON parsing (try/catch)
```

#### 5. API Security ✅
```typescript
// Current Protections
- HTTP-only cookies
- CORS configuration (Next.js default)
- Authentication on protected routes
- Role-based authorization

// Not Implemented (Future)
- Rate limiting (per user/IP)
- API key authentication
- Request throttling
- CAPTCHA on signup/login
- IP whitelisting for admin
```

### Security Vulnerabilities & Mitigations

#### 🔴 High Priority

**1. No Rate Limiting**
- **Risk:** Brute force attacks on login
- **Impact:** Account takeover, DDoS
- **Mitigation:** Implement rate limiting (5 attempts/15 min)
- **Library:** `@upstash/ratelimit` (already in package.json)
- **Status:** Not implemented

**2. No Email Verification**
- **Risk:** Fake account creation
- **Impact:** Spam, abuse
- **Mitigation:** Email verification on signup
- **Status:** Not implemented

**3. No Two-Factor Authentication**
- **Risk:** Account compromise
- **Impact:** Unauthorized access
- **Mitigation:** 2FA via SMS/TOTP
- **Status:** Not implemented

#### 🟡 Medium Priority

**4. Weak Password Policy**
- **Risk:** Weak passwords
- **Impact:** Account takeover
- **Mitigation:** Enforce strong password (8+ chars, uppercase, digit, special)
- **Status:** Partial (min 6 chars only)

**5. No CAPTCHA Protection**
- **Risk:** Bot signup/login
- **Impact:** Spam accounts
- **Mitigation:** Add reCAPTCHA v3
- **Status:** Not implemented

**6. No Session Revocation**
- **Risk:** Stolen tokens remain valid
- **Impact:** Unauthorized access
- **Mitigation:** Session management table, token blacklist
- **Status:** Not implemented

#### 🟢 Low Priority

**7. No Content Security Policy (CSP)**
- **Risk:** XSS attacks
- **Impact:** Script injection
- **Mitigation:** Add CSP headers
- **Status:** Not implemented

**8. No Request Logging**
- **Risk:** No audit trail for API calls
- **Impact:** Hard to detect attacks
- **Mitigation:** Request logging middleware
- **Status:** Partial (activity logs only)

### Recommended Security Enhancements

```typescript
// 1. Rate Limiting Implementation
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});

// Usage in login route
const identifier = req.headers.get("x-forwarded-for") || "anonymous";
const { success } = await loginRateLimit.limit(identifier);
if (!success) {
  return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
}

// 2. Password Strength Validation
function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// 3. Email Verification Flow
// Add emailVerified field to User model
// Send verification email on signup
// Require verification before business creation

// 4. 2FA Implementation
// Add twoFactorSecret & twoFactorEnabled to User model
// Use speakeasy library for TOTP
// Verify code on login if enabled

// 5. Session Management
// Create Session model
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

// 6. CAPTCHA on Forms
// Add Google reCAPTCHA v3
// Verify on signup/login/contact forms

// 7. Content Security Policy
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  }
];
```

---

## Deployment & Environment Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
DATABASE_URL="postgresql://user:password@host:5432/dbname"  # PostgreSQL for prod

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"  # Generate with: openssl rand -base64 32
JWT_EXPIRES_IN="7d"

# OpenAI (Optional - falls back to mock)
OPENAI_API_KEY="sk-..."

# Redis (Optional - for caching & rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Payment Gateway (Future)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Future)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-password"
SMTP_FROM="noreply@reviewboost.com"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Dev
NEXT_PUBLIC_APP_URL="https://reviewboost.com"  # Prod

# Analytics (Future)
GOOGLE_ANALYTICS_ID="G-..."

# Sentry (Future)
SENTRY_DSN="https://..."
```

### Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd feedback

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your values

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed database
npx prisma db seed

# 7. Create superadmin
npm run create-superadmin
# Follow prompts to create admin account

# 8. Start development server
npm run dev

# 9. Open browser
# http://localhost:3000
```

### Production Deployment

#### Option 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all production env vars

# 5. Deploy production
vercel --prod
```

#### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/reviewboost
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=reviewboost
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Deploy with Docker
docker-compose up -d
```

#### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Clone repository
git clone <repo-url>
cd feedback

# 5. Install dependencies
npm install

# 6. Setup environment
cp .env.example .env
nano .env  # Edit values

# 7. Build application
npm run build

# 8. Start with PM2
pm2 start npm --name "reviewboost" -- start
pm2 save
pm2 startup

# 9. Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/reviewboost

# Nginx config:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 10. Enable site
sudo ln -s /etc/nginx/sites-available/reviewboost /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 11. Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Database Migration (SQLite to PostgreSQL)

```bash
# 1. Export data from SQLite
npm install -g prisma-sqlite-to-postgres

# 2. Update DATABASE_URL in .env to PostgreSQL

# 3. Run migrations
npx prisma migrate deploy

# 4. (Optional) Import data
# Manual data migration script required
```

### Monitoring & Logging

```typescript
// Recommended tools:

// 1. Error Tracking
// - Sentry.io
// - Rollbar

// 2. Performance Monitoring
// - Vercel Analytics (if using Vercel)
// - Google Analytics
// - PostHog

// 3. Uptime Monitoring
// - UptimeRobot
// - Pingdom

// 4. Log Aggregation
// - Logtail
// - Datadog
// - Logflare

// 5. Database Monitoring
// - Prisma Studio (dev)
// - pg_stat_statements (prod)
```

---

## Version Control & Git Management

### Repository Information
- **GitHub Repository:** https://github.com/Simranjeetkaur-art/Reviews.git
- **Default Branch:** main
- **Version Control System:** Git
- **Remote Hosting:** GitHub

### Branch Strategy

**Branch Types:**
- `main` - Production-ready code (protected)
- `feature/*` - New features and enhancements
- `bugfix/*` - Bug fixes and patches
- `hotfix/*` - Critical production fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates
- `test/*` - Test additions/updates
- `chore/*` - Maintenance tasks

**Branch Naming Convention:**
```
<type>/<short-description>
```
- Use lowercase
- Separate words with hyphens
- Keep descriptions concise (3-5 words)
- Examples: `feature/subscription-upgrade`, `bugfix/duplicate-url-detection`

### Commit Message Standards

**Bug Fixes (Detailed Format):**
```
[BUGFIX] <Component>: <Brief Summary>

Problem:
- Detailed issue description
- Reproduction steps
- Expected vs actual behavior

Solution:
- What was changed
- Why this approach
- Edge cases handled

Files Changed:
- path/to/file1.ts (changes made)
- path/to/file2.tsx (changes made)

Testing:
- Verification steps
- Test cases added

Related Issues:
- #issue-number
```

**Features (One-Liner Format):**
```
[FEATURE] <Component>: <Brief description>
```
- Keep under 72 characters
- Be specific and concise
- Use present tense

### Git Workflow Process

```
1. Pull latest: git pull origin main
2. Create branch: git checkout -b feature/name
3. Make changes
4. Stage: git add .
5. Commit: git commit -m "[TYPE] Component: Description"
6. Push: git push -u origin feature/name
7. Create Pull Request
8. Review & Merge
9. Delete branch after merge
```

### Version Control Status

**Current Implementation:**
- ✅ Git repository initialized
- ✅ Remote configured (GitHub)
- ✅ Branch strategy defined
- ✅ Commit message standards established
- ✅ PR workflow documented
- ⚠️ Pre-commit hooks (not implemented)
- ⚠️ Automated testing in CI/CD (not implemented)
- ⚠️ Release tagging process (manual)

**Best Practices Enforced:**
- ✅ No force push to main
- ✅ PR required for all merges
- ✅ Detailed commit messages for bugs
- ✅ One-liner commits for features
- ✅ Branch cleanup after merge
- ✅ Regular pulls before work

**Future Enhancements:**
- [ ] Pre-commit hooks (linting, testing)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Automated semantic versioning
- [ ] Release notes generation
- [ ] Changelog automation
- [ ] Branch protection rules
- [ ] Code review requirements

### Release Management

**Version Format:** `v<major>.<minor>.<patch>`

**Release Process:**
1. Create release branch from main
2. Update version in package.json
3. Update CHANGELOG.md
4. Create annotated tag: `git tag -a v1.0.0 -m "Release notes"`
5. Push tag: `git push origin v1.0.0`
6. Create GitHub release with notes

**Current Version:** v1.0.0 (Initial Release)

---

## End of SOP

**Document Version:** 2.1
**Last Updated:** 2026-01-09
**Total Sections:** 14
**Total Flow Diagrams:** 7
**Total API Endpoints:** 35
**Total Database Models:** 11

**Implementation Status:**
- ✅ Core Features: 100%
- ⚠️ Payment Integration: 30%
- ❌ Email Notifications: 0%
- ⚠️ Reassignment Requests: 70%

**Next Steps:**
1. Integrate real payment gateway (Razorpay/Stripe)
2. Implement email notification system
3. Add security enhancements (rate limiting, 2FA)
4. Deploy to production
5. Setup monitoring and logging

For questions or clarifications, contact the development team.
