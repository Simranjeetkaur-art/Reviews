import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "reviewboost-secret-key-change-in-production";

export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  lifetimePurchaseDate?: Date | null;
  subscriptionType?: string | null;
  paymentType?: string | null;
  businessLimit: number;
  feedbackLimit: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify user still exists and get fresh data
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        lifetimePurchaseDate: true,
        subscriptionType: true,
        paymentType: true,
        businessLimit: true,
        feedbackLimit: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string, name?: string) {
  // Normalize email to lowercase for case-insensitive handling
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists (case-insensitive - SQLite workaround)
  // Try exact match first (for already normalized emails)
  let existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // If not found, check case-insensitively (for existing mixed-case emails)
  if (!existingUser) {
    const allUsers = await prisma.user.findMany({
      select: { email: true },
    });
    existingUser = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    ) as any;
  }

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user with free tier (5 feedback generations limit per business)
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      role: "owner",
      subscriptionTier: "free",
      subscriptionStatus: "active",
      subscriptionType: null,
      paymentType: null,
      businessLimit: -1, // Free tier: unlimited businesses
      feedbackLimit: 5, // Free tier: 5 feedback generations per business
      trialEndsAt: null, // Remove trial for free tier
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      businessLimit: true,
      feedbackLimit: true,
    },
  });

  return user;
}

export async function signIn(email: string, password: string) {
  // Normalize email to lowercase for case-insensitive login
  const normalizedEmail = email.trim().toLowerCase();

  // Find user with case-insensitive email lookup (SQLite workaround)
  // Try exact match first (for already normalized emails)
  let fullUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // If not found, check case-insensitively (for existing mixed-case emails)
  if (!fullUser) {
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    if (user) {
      fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
    }
  }

  if (!fullUser) {
    throw new Error("Invalid email or password");
  }

  const isValid = await verifyPassword(password, fullUser.passwordHash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return {
    id: fullUser.id,
    email: fullUser.email,
    name: fullUser.name,
    role: fullUser.role,
    subscriptionTier: fullUser.subscriptionTier,
    subscriptionStatus: fullUser.subscriptionStatus,
    businessLimit: fullUser.businessLimit,
    feedbackLimit: fullUser.feedbackLimit,
  };
}

// Subscription tier limits
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    priceDisplay: "Free",
    currency: "INR",
    symbol: "₹",
    businessLimit: -1, // Unlimited businesses
    feedbackLimit: 5, // 5 generations per business
    subscriptionType: null, // No subscription
    paymentType: null,
    duration: null,
    features: [
      "Unlimited Businesses",
      "5 AI-generated review generations per business",
      "1 Basic QR code per business",
      "Email support",
      "Analytics dashboard",
      "Custom branding",
      "Upgrade to Pro after limit (₹9,999 / 6 months)",
    ],
    upgradeMessage: "Upgrade to Pro (₹9,999 / 6 months) to continue",
    cta: "Get Started Free",
    badge: null,
  },
  pro: {
    name: "Pro",
    price: 9999,
    priceDisplay: "₹9,999",
    currency: "INR",
    symbol: "₹",
    pricePeriod: "6 months",
    fullPriceDisplay: "₹9,999 / 6 months",
    businessLimit: -1, // Unlimited businesses
    feedbackLimit: -1, // Unlimited generations per business
    subscriptionType: "subscription",
    paymentType: "recurring",
    duration: 6, // 6 months
    durationUnit: "months",
    oneTimeSetupFee: 0, // Can be configured if needed
    features: [
      "Unlimited Businesses",
      "Unlimited AI-generated review generations per business",
      "Custom QR codes",
      "Priority support",
      "Full analytics dashboard",
    ],
    upgradeMessage: null,
    cta: "Upgrade to Pro",
    badge: "Most Common",
    description: "Built for growing businesses",
  },
  lifetime: {
    name: "Lifetime",
    price: 39999,
    priceDisplay: "₹39,999",
    currency: "INR",
    symbol: "₹",
    fullPriceDisplay: "₹39,999 – One-time payment",
    businessLimit: -1, // Unlimited businesses
    feedbackLimit: -1, // Unlimited generations per business
    subscriptionType: "lifetime",
    paymentType: "one_time",
    duration: null, // Lifetime (no expiration)
    features: [
      "Unlimited Businesses",
      "Unlimited AI-generated reviews",
      "One business, one QR code — valid for the entire lifetime of your business",
      "Customized brand page (Logo & Background)",
      "White-label custom QR codes",
      "Advanced analytics",
      "Full white-label option",
      "Dedicated priority support",
      "No subscription. No renewals. Ever.",
    ],
    upgradeMessage: null,
    cta: "Get Lifetime Access",
    badge: "Recommended",
    description: "One-time payment. Reviews for life. No subscriptions.",
    benefits: [
      "Pay once, use forever",
      "No monthly or yearly fees",
      "Best long-term value",
      "Perfect for agencies, franchises, and brand-focused businesses",
      "Lifetime access to reviews using a single QR per business",
    ],
  },
};

// Check if subscription is active
export function isSubscriptionActive(user: UserPayload): boolean {
  // Admin users always have active subscription
  if (user.role === "superadmin") return true;
  if (user.role === "superadmin") return true;
  if (user.subscriptionTier === "lifetime") return true; // Lifetime never expires
  if (user.subscriptionTier === "free")
    return user.subscriptionStatus === "active";

  // For Pro (subscription-based)
  if (user.subscriptionTier === "pro") {
    if (user.subscriptionStatus !== "active") return false;
    if (!user.subscriptionEndDate) return true; // No end date means active
    return new Date(user.subscriptionEndDate) > new Date();
  }

  return false;
}

export function canCreateBusiness(
  user: UserPayload,
  currentBusinessCount: number,
): boolean {
  if (user.role === "superadmin") return true;
  if (!isSubscriptionActive(user)) return false;
  // All tiers allow unlimited businesses
  if (user.businessLimit === -1) return true; // unlimited
  return currentBusinessCount < user.businessLimit;
}

export function canGenerateFeedback(
  user: UserPayload,
  currentFeedbackCount: number,
): boolean {
  if (user.role === "superadmin") return true;
  if (!isSubscriptionActive(user)) return false;

  // Free tier: 5 generations per business (checked at business level)
  if (user.subscriptionTier === "free") {
    // This is checked per-business, not per-user
    return true; // Business-level check happens in API
  }

  // Pro and Lifetime: unlimited
  if (user.feedbackLimit === -1) return true;
  return currentFeedbackCount < user.feedbackLimit;
}

// Calculate subscription end date for Pro plan
export function calculateProSubscriptionEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 6); // 6 months
  return endDate;
}

// Check if subscription needs renewal
export function needsRenewal(user: UserPayload): boolean {
  if (user.subscriptionTier === "lifetime") return false;
  if (user.subscriptionTier === "free") return false;

  if (user.subscriptionTier === "pro") {
    if (!user.subscriptionEndDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(user.subscriptionEndDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30; // Renewal needed within 30 days
  }

  return false;
}

// Get subscription expiry information
export function getSubscriptionExpiryInfo(user: UserPayload): {
  expiresAt: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
} {
  if (user.subscriptionTier === "lifetime") {
    return {
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
    };
  }

  if (user.subscriptionTier === "free") {
    return {
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
    };
  }

  if (user.subscriptionTier === "pro") {
    if (!user.subscriptionEndDate) {
      return {
        expiresAt: null,
        daysRemaining: null,
        isExpired: false,
      };
    }

    const expiresAt = new Date(user.subscriptionEndDate);
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      expiresAt,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: daysRemaining < 0,
    };
  }

  return {
    expiresAt: null,
    daysRemaining: null,
    isExpired: false,
  };
}
