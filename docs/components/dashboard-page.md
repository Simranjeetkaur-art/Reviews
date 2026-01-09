# Dashboard Page Component

## Overview

The Dashboard Page (`/dashboard`) is a multi-step business onboarding flow that allows business owners to create their ReviewBoost account, generate AI-powered review templates, and get their branded review link and QR code.

## Location

`app/dashboard/page.tsx`

## Features

### Step 1: Business Information

Collects essential business details:

- **Business Name** (required)
- **Business Type** (required)
- **Google Maps Review URL** (required) - Where customers will be redirected to leave reviews
- **Products/Services** (optional) - Dynamic list of offerings
- **Employees** (optional) - Names to personalize reviews

### Step 2: Generate Reviews

Shows what will be generated and triggers AI review generation:

- 70 positive review templates (4-5 star tone)
- 30 neutral review templates (3-4 star tone)
- Personalized mentions of products and staff
- Natural language variations

### Step 3: Get Your Link

Displays the generated assets with share functionality:

#### Review Link Section

- **Your Review Link**: Displays the full URL (e.g., `http://localhost:3005/review/{businessId}`)
- **Copy Link Button**: Copies link to clipboard with "Copied!" confirmation
- **Open Review Page Button**: Opens the review page directly in a new tab (does NOT use Web Share API)

#### QR Code Section

- **QR Code**: Points to the review page URL (not Google Maps directly)
- **Download QR Code**: Downloads as PNG with business name

#### Generated Feedbacks Section

Each feedback card includes:

- **Sentiment Badge**: "5-Star Review" (positive) or "4-Star Review" (neutral)
- **Review Content**: AI-generated personalized text
- **Copy Button**: Copies the review text with visual feedback (green highlight)
- **Share on Google Button**: Opens the business's Google Maps Review URL

## User Flow

1. Business fills out Step 1 form
2. Clicks "Continue to Review Generation"
3. Clicks "Generate Reviews with AI" - creates business and generates 100 feedbacks
4. Step 3 shows:
   - Review link for sharing with customers
   - QR code for in-store display
   - All generated feedbacks with copy/share functionality

## State Management

```typescript
const [step, setStep] = useState(1);
const [businessData, setBusinessData] = useState({
  businessName: "",
  businessType: "",
  googleMapsUrl: "",
  products: [""],
  employees: [""],
});
const [businessId, setBusinessId] = useState<string | null>(null);
const [reviewLink, setReviewLink] = useState<string>("");
const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
const [generatedFeedbacks, setGeneratedFeedbacks] = useState<any[]>([]);
const [copiedFeedbackId, setCopiedFeedbackId] = useState<string | null>(null);
```

## API Integration

### Business Creation

```
POST /api/businesses
Body: { businessName, businessType, googleMapsUrl, products, employees }
```

### Feedback Generation

```
POST /api/feedbacks/generate
Body: { businessId, businessName, businessType, products, employees }
```

### Fetch Feedbacks

```
GET /api/feedbacks/{businessId}?all=true
```

## Key Functions

### `handleSubmit()`

Creates business and generates feedbacks in sequence, then loads all feedbacks for display.

### `handleCopyFeedback(feedbackId, content)`

Copies feedback content to clipboard and shows visual feedback (green highlight for 2 seconds).

### `handleShareToGoogle()`

Opens the business's Google Maps Review URL in a new tab using `window.open()`.

### `handleDownloadQR()`

Converts QR code SVG to PNG and triggers download with business name as filename.

## Dependencies

- `qrcode.react` - QR code generation
- `lucide-react` - Icons (Sparkles, Plus, Copy, Share2, CheckCircle2, Download, Link)
- `@/components/ui/*` - shadcn/ui components

## Notes

- The QR code points to the review page (`/review/{businessId}`), not directly to Google Maps
- This allows customers to see and copy review templates before being redirected to Google
- The "Share on Google" button uses the exact Google Maps Review URL provided by the business owner
