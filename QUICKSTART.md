# Quick Start Guide

## 🚀 Getting Started

Your Smart Business Feedback Generator Platform is now running!

### Current Status

- ✅ Development server running on **http://localhost:3004**
- ✅ Database configured (SQLite)
- ✅ All dependencies installed

## 📝 Next Steps

### 1. Seed the Database with Demo Data

To test the application with sample data, make a POST request to the seed endpoint:

**Using PowerShell:**

```powershell
Invoke-WebRequest -Uri "http://localhost:3004/api/seed" -Method POST
```

**Using curl:**

```bash
curl -X POST http://localhost:3004/api/seed
```

**Or visit in browser:**
Just open your browser's developer console and run:

```javascript
fetch("http://localhost:3004/api/seed", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
```

This will create:

- A demo user account
- A sample business ("Joe's Coffee Shop")
- 12 pre-written review templates
- Sample products and employees

### 2. Test the Customer Experience

After seeding, you'll receive a `businessId`. Visit:

```
http://localhost:3004/review/{businessId}
```

This is what your customers will see when they scan the QR code!

### 3. Explore the Application

**Landing Page:**

- Visit: http://localhost:3004
- See the marketing page with features and how-it-works

**Dashboard:**

- Visit: http://localhost:3004/dashboard
- Create a new business profile
- Generate AI-powered review templates
- Get your QR code

## 🎯 Key Features to Test

### Customer Flow

1. Navigate to `/review/{businessId}`
2. Browse 12 different review templates
3. Click any review card
4. Review is automatically copied to clipboard
5. Redirected to Google Maps review page

### Business Owner Flow

1. Go to `/dashboard`
2. Fill in business information:
   - Business name
   - Business type
   - Google Maps URL
   - Products/services
   - Employee names (optional)
3. Click "Generate Reviews with AI"
4. Get your unique QR code
5. Preview the customer experience

## 🔧 API Endpoints

### Get Feedbacks for a Business

```
GET /api/feedbacks/{businessId}
```

Returns 12 random feedback templates with load balancing.

### Track Analytics

```
POST /api/analytics
Body: {
  "businessId": "string",
  "eventType": "qr_scan" | "feedback_selected" | "google_redirect",
  "feedbackId": "string" (optional)
}
```

### Generate Feedbacks (AI)

```
POST /api/feedbacks/generate
Body: {
  "businessId": "string",
  "businessName": "string",
  "businessType": "string",
  "products": [{ "name": "string" }],
  "employees": [{ "name": "string" }] (optional)
}
```

### Seed Database (Development Only)

```
POST /api/seed
```

## 📊 Database

View your database using Prisma Studio:

```bash
npx prisma studio
```

This will open a visual database browser at http://localhost:5555

## 🎨 Customization

### Update Branding

- Edit `app/page.tsx` - Change "ReviewBoost" to your brand name
- Edit `app/globals.css` - Update color scheme (CSS variables)

### Modify AI Generation

- Edit `lib/ai.ts` - Customize the prompt and generation logic
- Adjust positive/neutral ratio
- Change review length and tone

### Styling

- All UI components are in `components/ui/`
- Global styles in `app/globals.css`
- Uses Tailwind CSS for utility classes

## 🐛 Troubleshooting

### Port Already in Use

The app automatically finds an available port. Check the terminal output for the actual port number.

### Database Issues

Reset the database:

```bash
npx prisma migrate reset
```

### Clear Cache

Delete the `.next` folder:

```bash
Remove-Item -Recurse -Force .next
```

## 📱 Testing the QR Code Flow

1. Seed the database (see step 1 above)
2. Note the `businessId` from the response
3. Create a QR code pointing to: `http://localhost:3004/review/{businessId}`
4. Use a QR code generator like https://qr-code-generator.com
5. Scan with your phone to test the mobile experience

## 🚀 Production Deployment

When ready to deploy:

1. **Set up a production database** (PostgreSQL recommended)
2. **Update environment variables** in Vercel/hosting platform
3. **Run migrations**: `npx prisma migrate deploy`
4. **Add OpenAI API key** for real AI generation
5. **Configure Redis** for better caching (optional)

See README.md for detailed deployment instructions.

## 💡 Tips

- **Analytics**: All QR scans and feedback selections are tracked in the Analytics table
- **Load Balancing**: Feedbacks with lower usage counts are shown more frequently
- **Caching**: Feedbacks are cached for 30 minutes to improve performance
- **Mobile First**: The customer interface is optimized for mobile devices

## 🎉 You're All Set!

Your platform is ready to help businesses boost their Google reviews. Start by seeding the database and exploring the customer review flow!

For questions or issues, check the main README.md file.
