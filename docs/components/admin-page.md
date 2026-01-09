# Admin Dashboard

## Overview

The Admin Dashboard (`/admin`) allows business owners to manage all their registered businesses, edit details, and access review links and QR codes.

## Location

`app/admin/page.tsx`

## Features

### 1. Business List View

Displays all registered businesses with:

- Business name and type
- Number of generated reviews
- Customer review link (copyable)
- Google Maps review URL
- Products/services list
- Employees list
- QR code (toggleable)

### 2. Edit Business Details

Business owners can edit:

- **Business Name** - Update the name displayed to customers
- **Business Type** - e.g., Coffee Shop, Restaurant, Salon
- **Google Maps Review URL** - Where customers are redirected to leave reviews
- **Products/Services** - Add, edit, or remove products
- **Employees** - Add, edit, or remove employee names

### 3. Quick Actions

- **Copy Link** - Copy the customer review URL to clipboard
- **Open Review Page** - Preview the customer experience
- **Show QR Code** - Toggle QR code display
- **Download QR Code** - Download QR code as PNG image
- **Delete Business** - Remove business and all associated data

## API Endpoints Used

### GET /api/businesses

Returns all businesses for the current user.

```json
{
  "success": true,
  "businesses": [
    {
      "id": "businessId",
      "businessName": "Hello Cafe",
      "businessType": "Coffee Shop",
      "googleMapsUrl": "https://...",
      "products": ["Latte", "Cappuccino"],
      "employees": ["Sara", "John"],
      "feedbackCount": 100,
      "createdAt": "2026-01-06T..."
    }
  ]
}
```

### GET /api/businesses/[businessId]

Returns details for a single business.

### PUT /api/businesses/[businessId]

Updates business details.

```json
// Request body
{
  "businessName": "Updated Name",
  "businessType": "Updated Type",
  "googleMapsUrl": "https://new-url...",
  "products": ["Product 1", "Product 2"],
  "employees": ["Employee 1", "Employee 2"]
}
```

### DELETE /api/businesses/[businessId]

Deletes a business and all associated data (products, employees, feedbacks, analytics).

## User Flow

1. **View All Businesses** - Admin sees list of all their businesses
2. **Click Edit** - Edit form appears with current values
3. **Make Changes** - Update any field (especially Google Maps URL)
4. **Save Changes** - Click "Save Changes" to update database
5. **Use New Link** - Customers now redirect to the new Google Maps URL

## Key Use Cases

### Changing Google Maps Review URL

When a business needs to update their Google Maps review URL:

1. Go to `/admin`
2. Click "Edit" on the business
3. Update the "Google Maps Review URL" field
4. Click "Save Changes"
5. Customer reviews will now redirect to the new URL

### Adding New Products/Employees

When adding new menu items or staff:

1. Go to `/admin`
2. Click "Edit" on the business
3. Click "Add Product" or "Add Employee"
4. Enter the new names
5. Click "Save Changes"
6. Note: Existing reviews won't change, but new AI-generated reviews can include the new items

## Navigation

- From Landing Page: Click "Admin" in navbar
- From Dashboard: Click "Manage Businesses" button
- Direct URL: `/admin`

## Screenshots

### Business List View

Shows all businesses with review links and quick actions.

### Edit Mode

Form for editing all business details including Google Maps URL.

### QR Code View

Expandable QR code section with download option.
