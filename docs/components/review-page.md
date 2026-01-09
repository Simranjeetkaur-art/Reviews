# Review Page Component

## Overview

The Review Page (`/review/[businessId]`) is a customer-facing page that displays AI-generated review templates for a specific business. Customers can browse reviews, select one, and submit it to Google Maps in one seamless action.

**Design Reference**: Inspired by [review-magic-thanks](https://preview--review-magic-thanks.lovable.app/) with a warm peach/orange color scheme.

## Location

`app/review/[businessId]/page.tsx`

## Features

### 1. Dynamic Business Loading

- Fetches business data and feedbacks from API
- Displays business name prominently with store icon
- Tracks QR scan analytics on page load

### 2. Selectable Review Cards

Each review card displays:

- **Review Content**: AI-generated personalized review text in quotes
- **Star Rating**: 5 gold stars for positive reviews, 4 stars for neutral
- **Selection State**: Orange highlight with checkmark when selected

### 3. One-Button Flow

Instead of separate Copy and Share buttons, there's a single **"Copy & Continue to Google"** button that:

1. Copies the selected review to clipboard
2. Shows "Copied! Opening Google Reviews..." feedback
3. Opens the business's Google Maps Review URL in a new tab

### 4. User Experience Flow

1. Customer scans QR code → Opens review page
2. Customer sees list of pre-written reviews
3. Customer clicks on a review to select it
4. Customer clicks "Copy & Continue to Google" button
5. Review is copied to clipboard and Google Maps opens
6. Customer pastes the review and submits

## Props

```typescript
interface Props {
  params: Promise<{ businessId: string }>;
}
```

## State

| State              | Type                   | Description                    |
| ------------------ | ---------------------- | ------------------------------ |
| `feedbacks`        | `Feedback[]`           | Array of review templates      |
| `business`         | `BusinessData \| null` | Business information           |
| `selectedFeedback` | `Feedback \| null`     | Currently selected review      |
| `loading`          | `boolean`              | Loading state                  |
| `copied`           | `boolean`              | Whether review has been copied |

## API Endpoints Used

- `GET /api/feedbacks/[businessId]` - Fetch review templates
- `POST /api/analytics` - Track events

## Analytics Events

| Event               | Trigger                     |
| ------------------- | --------------------------- |
| `qr_scan`           | Page load                   |
| `feedback_selected` | Copy & Continue clicked     |
| `google_redirect`   | After copy, before redirect |

## UI Components Used

- `motion` from `framer-motion` - Animations
- `Button` from `@/components/ui/button`
- Lucide icons: `Store`, `Star`, `Copy`, `ExternalLink`, `CheckCircle2`

## Styling

- **Color Scheme**: Warm peach/orange gradient (`from-orange-50 via-amber-50 to-yellow-50`)
- **Store Icon**: Orange circle with store icon
- **Review Cards**:
  - White/cream background with rounded corners
  - Orange highlight when selected
  - Checkmark icon on selected card
- **Star Ratings**: Gold filled stars (5 for positive, 4 for neutral)
- **Action Button**:
  - Orange gradient when ready to copy
  - Green when copied
  - Sticky positioning at bottom

## Example Customer Flow

```
1. Scan QR Code
   ↓
2. Review Page Opens
   ↓
3. Browse Reviews
   ↓
4. Click to Select Review
   ↓
5. Click "Copy & Continue to Google"
   ↓
6. Review Copied → Google Maps Opens
   ↓
7. Paste Review → Submit
```

## Example Usage

Access the review page at:

```
/review/{businessId}
```

Where `businessId` is the unique identifier of a registered business.

## Screenshots

### Before Selection

- Reviews displayed in list format with star ratings
- "Select a review above to continue" prompt at bottom

### After Selection

- Selected review highlighted in orange
- Checkmark appears on selected card
- "Copy & Continue to Google" button appears

### After Copy

- Button shows "Copied! Opening Google Reviews..."
- Google Maps opens in new tab with review page
