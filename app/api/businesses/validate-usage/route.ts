import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/businesses/validate-usage
 * Validates if a business can generate feedbacks based on usage limits
 * Called before Step 2 (Review Generation) to prevent unnecessary API calls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        generationCount: true,
        ownerId: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (business.ownerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Admin users have unlimited generations
    if (user.role === "superadmin") {
      return NextResponse.json({
        success: true,
        canGenerate: true,
        usage: {
          generationCount: business.generationCount || 0,
          limit: -1, // Unlimited
          remaining: -1, // Unlimited
          status: "available",
        },
        message: "Admin users have unlimited generations",
      });
    }

    // Determine limit based on subscription tier
    const limit = user.subscriptionTier === "free" ? 5 : -1; // -1 means unlimited
    const generationCount = business.generationCount || 0;

    // Check if limit is reached
    if (limit !== -1 && generationCount >= limit) {
      return NextResponse.json({
        success: false,
        canGenerate: false,
        usage: {
          generationCount,
          limit,
          remaining: 0,
          status: "limit_reached",
        },
        error: `You've reached your free tier limit of ${limit} feedback generations for "${business.businessName}". You've used ${generationCount}/${limit} generations. Please upgrade to Pro (₹9,999 / 6 months) to continue.`,
        requiresUpgrade: true,
        upgradeUrl: "/pricing",
        businessName: business.businessName,
      });
    }

    // Calculate remaining generations
    const remaining = limit === -1 ? -1 : limit - generationCount;
    const percentageUsed = limit === -1 ? 0 : (generationCount / limit) * 100;

    // Determine status
    let status: "available" | "warning" | "limit_reached";
    if (limit === -1) {
      status = "available";
    } else if (generationCount >= limit) {
      status = "limit_reached";
    } else if (percentageUsed >= 80) {
      status = "warning";
    } else {
      status = "available";
    }

    return NextResponse.json({
      success: true,
      canGenerate: true,
      usage: {
        generationCount,
        limit,
        remaining,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        status,
      },
      message:
        limit === -1
          ? "Unlimited generations available"
          : `${remaining} generation${remaining !== 1 ? "s" : ""} remaining`,
    });
  } catch (error: any) {
    console.error("Error validating usage:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
