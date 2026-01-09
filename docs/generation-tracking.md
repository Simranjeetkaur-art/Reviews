# Free Tier Generation Tracking & Limit Management

## Overview

This document describes the implementation of generation count tracking and limit management for the Free Tier usage in ReviewBoost. The system tracks how many times feedbacks have been generated for each business and enforces a 5-generation limit per business for free tier users.

## Key Features

1. **Per-Business Generation Tracking**: Each business tracks its own `generationCount` independently
2. **Pre-Generation Validation**: Usage is validated before allowing Step 2 (Review Generation)
3. **Real-Time Usage Display**: Users see their current usage status with visual indicators
4. **Limit Enforcement**: System prevents generation when limit is reached
5. **Automatic Increment**: Generation count is automatically incremented after successful feedback generation

## Database Schema

### Business Model

```prisma
model Business {
  id              String   @id @default(cuid())
  generationCount Int      @default(0) // Tracks how many times feedbacks were generated
  // ... other fields
}
```

## API Endpoints

### 1. `/api/businesses/validate-usage` (POST)

**Purpose**: Validates if a business can generate feedbacks based on usage limits. Called before Step 2 to prevent unnecessary API calls.

**Request Body**:

```json
{
  "businessId": "cmk1h3jxb00g5fkgkftuxe101"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "canGenerate": true,
  "usage": {
    "generationCount": 3,
    "limit": 5,
    "remaining": 2,
    "percentageUsed": 60.0,
    "status": "available"
  },
  "message": "2 generations remaining"
}
```

**Response (Limit Reached)**:

```json
{
  "success": false,
  "canGenerate": false,
  "usage": {
    "generationCount": 5,
    "limit": 5,
    "remaining": 0,
    "status": "limit_reached"
  },
  "error": "You've reached your free tier limit...",
  "requiresUpgrade": true,
  "upgradeUrl": "/pricing"
}
```

### 2. `/api/feedbacks/generate` (POST)

**Enhancement**: Now includes usage information in the response after successful generation.

**Response**:

```json
{
  "success": true,
  "count": 100,
  "message": "Generated 100 feedback templates",
  "usage": {
    "generationCount": 4,
    "limit": 5,
    "remaining": 1,
    "percentageUsed": 80.0,
    "status": "warning"
  }
}
```

## Frontend Implementation

### Dashboard Flow

#### Step 1: Business Information

- When user clicks "Continue to Review Generation", the system validates usage if the business already exists
- If limit is reached, user is shown an error and upgrade prompt
- Usage status is displayed for existing businesses

#### Step 2: Generate Reviews

- Usage warning component is displayed for free tier users
- Current business usage is shown if editing an existing business
- Generation button is disabled if limit is reached

#### After Generation

- Usage data is automatically refreshed
- Current business usage state is updated with new generation count
- User sees updated status (available/warning/limit_reached)

### Usage Status States

1. **available**: Generation count is below 80% of limit
   - Green indicator
   - Shows remaining generations

2. **warning**: Generation count is between 80% and limit
   - Yellow indicator
   - Shows approaching limit message

3. **limit_reached**: Generation count equals or exceeds limit
   - Red indicator
   - Shows upgrade prompt
   - Disables generation button

## Usage Display Components

### Current Business Usage Card

Displays on Step 2 when editing an existing business:

- Generation count (e.g., "3 / 5 generations")
- Visual progress bar
- Status indicator (green/yellow/red)
- Upgrade button when limit is reached

### Usage Warning Component

Displays summary of all businesses:

- Total businesses
- Businesses at limit
- Businesses with warnings
- Overall usage statistics

## Limit Rules

### Free Tier

- **Limit**: 5 generations per business
- **Scope**: Per business (each business has its own limit)
- **Enforcement**: Checked before Step 2 and before generation

### Pro Tier

- **Limit**: Unlimited (-1)
- **Scope**: No restrictions
- **Enforcement**: No checks needed

### Admin Users

- **Limit**: Unlimited (-1)
- **Scope**: No restrictions
- **Enforcement**: No checks needed

## Error Handling

### Limit Reached Error

When a user tries to generate feedbacks but has reached the limit:

1. Error message is displayed
2. Upgrade prompt is shown
3. User is redirected to pricing page if they confirm
4. Generation button is disabled

### Validation Errors

If usage validation fails:

1. Error is displayed
2. User stays on current step
3. Usage state is updated
4. User can retry or upgrade

## Implementation Details

### Generation Count Increment

The `generationCount` is incremented **after** successful feedback generation:

```typescript
const updatedBusiness = await prisma.business.update({
  where: { id: businessId },
  data: {
    generationCount: {
      increment: 1,
    },
  },
});
```

### Usage Validation Flow

1. User clicks "Continue to Review Generation" (Step 1 → Step 2)
2. If business exists, validate usage via `/api/businesses/validate-usage`
3. If limit reached, show error and prevent Step 2
4. If valid, proceed to Step 2
5. On Step 2, show current usage status
6. Before generation, API checks limit again
7. After generation, usage is updated and displayed

## Testing Checklist

- [ ] New business starts with 0 generations
- [ ] Generation count increments after each generation
- [ ] Limit validation works before Step 2
- [ ] Limit validation works before generation
- [ ] Usage display shows correct count
- [ ] Warning status appears at 80% usage
- [ ] Limit reached status appears at 100% usage
- [ ] Upgrade prompt appears when limit reached
- [ ] Pro tier users have unlimited generations
- [ ] Admin users have unlimited generations
- [ ] Usage refreshes after generation
- [ ] Multiple businesses track independently

## Future Enhancements

1. **Usage History**: Track when each generation occurred
2. **Reset Functionality**: Allow admin to reset generation count
3. **Usage Analytics**: Show usage trends over time
4. **Email Notifications**: Notify users when approaching limit
5. **Grace Period**: Allow one extra generation after limit with warning
