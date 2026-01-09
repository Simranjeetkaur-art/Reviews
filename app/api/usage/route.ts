import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get all businesses for this user (including inactive)
    const businesses = await prisma.business.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        businessName: true,
        generationCount: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Determine limit based on subscription tier
    const limit = user.subscriptionTier === "free" ? 5 : -1; // -1 means unlimited

    // Process businesses and calculate usage statistics
    const businessesWithUsage = businesses.map((business) => {
      const generationCount = business.generationCount || 0;
      const percentageUsed =
        limit === -1 ? 0 : Math.min(100, (generationCount / limit) * 100);

      // Determine status
      let status: "available" | "warning" | "limit_reached";
      if (limit === -1) {
        status = "available"; // Unlimited for pro/lifetime
      } else if (generationCount >= limit) {
        status = "limit_reached";
      } else if (percentageUsed >= 80) {
        status = "warning";
      } else {
        status = "available";
      }

      return {
        id: business.id,
        name: business.businessName,
        generationCount,
        limit,
        percentageUsed: Math.round(percentageUsed * 10) / 10, // Round to 1 decimal
        status,
      };
    });

    // Calculate summary statistics
    const totalGenerationsUsed = businessesWithUsage.reduce(
      (sum, business) => sum + business.generationCount,
      0,
    );

    const businessesAtLimit = businessesWithUsage.filter(
      (business) => business.status === "limit_reached",
    ).length;

    const businessesWithWarnings = businessesWithUsage.filter(
      (business) => business.status === "warning",
    ).length;

    return NextResponse.json({
      success: true,
      usage: {
        subscriptionTier: user.subscriptionTier || "free",
        totalBusinesses: businesses.length,
        businesses: businessesWithUsage,
        summary: {
          totalGenerationsUsed,
          businessesAtLimit,
          businessesWithWarnings,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
