# Subscription Model Updates

## Key Changes

### 1. Pro Pricing

- **Old**: $500/month
- **New**: INR 1000 for 3 months
- Updated across all UI components

### 2. Per-Business Limits (Free Tier)

- **Old**: 5 total feedback generations per user
- **New**: 5 feedback generations **per business**
- Each business tracks its own generation count independently
- Users can create unlimited businesses on free tier

### 3. Business Creation Limits

- **Free Tier**: Unlimited businesses (each with 5-generation limit)
- **Pro Tier**: Unlimited businesses (unlimited generations per business)
- **Enterprise**: Unlimited businesses (unlimited generations per business)

### 4. Duplicate Business Name Prevention

- Users cannot create a business with the same name twice
- Applies even after deleting a business
- Case-insensitive matching
- Prevents: "Coffee Shop" and "coffee shop" as separate businesses

## Database Schema Changes

### Business Model

Added `generationCount` field:

```prisma
generationCount Int @default(0) // Tracks feedback generations per business
```

## API Changes

### `/api/businesses` (POST)

- Added duplicate name validation
- Checks all businesses by user (including deleted ones)
- Returns error if duplicate found

### `/api/feedbacks/generate` (POST)

- Checks per-business generation limit (not per-user)
- Increments `generationCount` after each generation
- Free tier: 5 generations per business
- Pro/Enterprise: Unlimited

## UI Updates

### Pricing Page

- Pro shows: "INR 1000/3 months"
- Removed monthly/yearly toggle (Pro is 3-month subscription)
- Updated feature descriptions

### My Businesses Page

- Shows per-business generation count
- Displays "X / 5 generations used" for each business
- Warning card shows all businesses with their individual limits
- Red indicator when business reaches limit

### Signup Page

- Updated to show "Unlimited businesses"
- "5 AI-generated review generations per business"

## Migration Notes

After deploying:

1. Run `npx prisma db push` to add `generationCount` field
2. Existing businesses will have `generationCount: 0`
3. Users can continue using existing businesses
4. New generations will be tracked accurately

## Error Messages

- **Duplicate Business**: "A business with the name '{name}' already exists. Please use a different name."
- **Generation Limit**: "This business has reached the free tier limit of 5 feedback generations. Please upgrade to Pro (INR 1000/3 months) to continue."
