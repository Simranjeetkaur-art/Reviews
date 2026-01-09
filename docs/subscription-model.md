# ReviewBoost Subscription Model

## Overview

ReviewBoost has been transformed into a SaaS subscription platform where users can sign up, manage their businesses, and subscribe to different plans.

## Subscription Tiers

### Free Tier ($0/month)

- 1 Business
- 50 AI-generated reviews
- Basic QR code
- Email support

### Pro Tier ($29/month)

- Up to 5 Businesses
- 500 AI-generated reviews per business
- Custom QR codes
- Analytics dashboard
- Priority support
- Remove branding

### Enterprise Tier ($99/month)

- Unlimited Businesses
- Unlimited AI-generated reviews
- Custom branding
- Advanced analytics
- API access
- Dedicated support
- White-label option

## User Roles

- **owner**: Regular business users who sign up and manage their businesses
- **superadmin**: Platform administrator with access to all users and subscription management

## Setup Instructions

### 1. Restart the Development Server

Due to Prisma schema changes, you need to restart the server:

```bash
# Stop the running server (Ctrl+C)
# Then regenerate Prisma client and restart
npx prisma generate
npm run dev
```

### 2. Create Super Admin

After restarting, create the super admin via API:

```bash
curl -X POST http://localhost:3005/api/setup/superadmin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@reviewboost.com", "password": "admin123", "name": "Super Admin"}'
```

Or sign up as a regular user first, then update their role in the database.

### 3. Access Points

- **Landing Page**: `http://localhost:3005/` - Marketing page with pricing
- **Sign Up**: `http://localhost:3005/signup` - Create new account (14-day free trial)
- **Login**: `http://localhost:3005/login` - Sign in to existing account
- **User Dashboard**: `http://localhost:3005/my-businesses` - Manage businesses
- **Add Business**: `http://localhost:3005/dashboard` - Create new business
- **Pricing**: `http://localhost:3005/pricing` - View subscription plans
- **Super Admin**: `http://localhost:3005/superadmin` - Platform management (superadmin only)

## Database Schema Changes

New fields added to the User model:

```prisma
model User {
  // Subscription fields
  subscriptionTier     String   @default("free") // 'free' | 'pro' | 'enterprise'
  subscriptionStatus   String   @default("active") // 'active' | 'cancelled' | 'expired' | 'past_due'
  stripeCustomerId     String?
  stripeSubscriptionId String?
  subscriptionStartDate DateTime?
  subscriptionEndDate  DateTime?
  trialEndsAt          DateTime?

  // Limits based on tier
  businessLimit        Int      @default(1) // free=1, pro=5, enterprise=unlimited (-1)
  feedbackLimit        Int      @default(50) // free=50, pro=500, enterprise=unlimited (-1)
}
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### User Businesses

- `GET /api/my-businesses` - Get user's businesses
- `POST /api/businesses` - Create new business (respects limits)
- `DELETE /api/businesses/:id` - Delete business

### Super Admin

- `GET /api/superadmin/users` - List all users
- `PUT /api/superadmin/users/:id` - Update user (subscription, role)
- `DELETE /api/superadmin/users/:id` - Delete user
- `GET /api/superadmin/stats` - Platform statistics

## Future Enhancements

1. **Stripe Integration**: Connect payment processing for Pro and Enterprise tiers
2. **Email Verification**: Send confirmation emails on signup
3. **Password Reset**: Forgot password functionality
4. **Team Management**: Invite team members to Enterprise accounts
5. **Usage Analytics**: Track review generation, QR scans, conversions per user
