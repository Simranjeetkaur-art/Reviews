import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const [totalUsers, totalBusinesses, totalFeedbacks, tierCounts] =
      await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.feedback.count(),
        prisma.user.groupBy({
          by: ["subscriptionTier"],
          _count: true,
        }),
      ]);

    const subscriptionBreakdown = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    tierCounts.forEach((t) => {
      if (t.subscriptionTier in subscriptionBreakdown) {
        subscriptionBreakdown[
          t.subscriptionTier as keyof typeof subscriptionBreakdown
        ] = t._count;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalBusinesses,
        totalFeedbacks,
        subscriptionBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
