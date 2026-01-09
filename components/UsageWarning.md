# UsageWarning Component Documentation

## Overview

The `UsageWarning` component displays usage statistics and warnings for free tier users who are approaching or have reached their generation limits. It provides visual feedback about usage status and includes an upgrade call-to-action.

## Location

`components/UsageWarning.tsx`

## Props

### UsageWarningProps

```typescript
interface UsageWarningProps {
  subscriptionTier: string; // User's subscription tier ("free", "pro", "enterprise")
  businesses: BusinessUsage[]; // Array of business usage data
  summary?: {
    // Optional summary statistics
    totalGenerationsUsed: number;
    businessesAtLimit: number;
    businessesWithWarnings: number;
  };
}

interface BusinessUsage {
  id: string; // Business ID
  name: string; // Business name
  generationCount: number; // Current number of generations used
  limit: number; // Maximum allowed generations (5 for free tier, -1 for unlimited)
  percentageUsed: number; // Percentage of limit used (0-100)
  status: "available" | "warning" | "limit_reached"; // Current status
}
```

## Behavior

### Visibility

- Only displays for free tier users (`subscriptionTier === "free"`)
- Only shows if there are businesses with warnings or limit reached
- Automatically hides for pro/enterprise users
- Returns `null` if no businesses need attention

### Status Logic

- **limit_reached**: `generationCount >= limit` (typically 5/5)
- **warning**: `percentageUsed >= 80 && generationCount < limit` (typically 4/5)
- **available**: `percentageUsed < 80` (typically 0-3/5)

### Visual Indicators

#### Color Coding

- **Green**: 0-79% used (available)
- **Yellow**: 80-99% used (warning)
- **Red**: 100% used (limit reached)

#### Icons

- `XCircle` icon for limit reached
- `AlertCircle` icon for warnings
- No icon for available status

### Features

1. **Collapsible Display**: For multiple businesses, the component can be expanded/collapsed
2. **Progress Bars**: Visual progress indicators for each business
3. **Status Messages**: Contextual messages based on usage status
4. **Upgrade CTA**: Direct link to pricing page for upgrading to Pro

## Usage Example

```tsx
import { UsageWarning } from "@/components/UsageWarning";

// In your component
{
  usageData && user?.subscriptionTier === "free" && (
    <UsageWarning
      subscriptionTier={usageData.subscriptionTier}
      businesses={usageData.businesses}
      summary={usageData.summary}
    />
  );
}
```

## Integration Points

### Dashboard Integration

The component is integrated into:

1. **Step 1 (Business Information)**: Shows usage warnings before business creation
2. **Step 2 (Generate Reviews)**: Shows usage warnings before generation

### Data Source

Usage data is fetched from `/api/usage` endpoint which returns:

- Subscription tier
- All businesses with their usage statistics
- Summary statistics

## Styling

- Uses Tailwind CSS classes
- Matches existing dashboard card styling (`bg-slate-900/50 border-slate-700`)
- Responsive design with mobile support
- Smooth animations for progress bars

## Accessibility

- Progress bars include ARIA attributes (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`)
- Keyboard navigation support for upgrade button
- Screen reader friendly status messages

## Related Components

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`
- `Button` from `@/components/ui/button`

## Related API

- `/api/usage` - Fetches usage statistics for the current user
