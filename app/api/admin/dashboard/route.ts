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

    const [
      totalUsers,
      totalBusinesses,
      activeBusinesses,
      totalFeedbacks,
      tierCounts,
      expiredSubscriptions,
      expiringSoon,
    ] = await Promise.all([
      // Exclude admin users from total count
      prisma.user.count({
        where: {
          role: {
            not: "superadmin",
          },
        },
      }),
      // Exclude admin businesses from total count
      prisma.business.count({
        where: {
          owner: {
            role: {
              not: "superadmin",
            },
          },
        },
      }),
      // Exclude admin businesses from active count
      prisma.business.count({
        where: {
          isActive: true,
          owner: {
            role: {
              not: "superadmin",
            },
          },
        },
      }),
      prisma.feedback.count(),
      // Exclude admin users from tier counts
      prisma.user.groupBy({
        by: ["subscriptionTier"],
        where: {
          role: {
            not: "superadmin",
          },
        },
        _count: true,
      }),
      prisma.user.count({
        where: {
          subscriptionStatus: "expired",
          subscriptionTier: { in: ["pro", "lifetime"] },
          role: {
            not: "superadmin",
          },
        },
      }),
      prisma.user.count({
        where: {
          subscriptionTier: { in: ["pro", "lifetime"] },
          subscriptionStatus: "active",
          role: {
            not: "superadmin",
          },
          subscriptionEndDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            gte: new Date(),
          },
        },
      }),
    ]);

    const subscriptionBreakdown = {
      free: 0,
      pro: 0,
      lifetime: 0,
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
        activeBusinesses,
        deletedBusinesses: totalBusinesses - activeBusinesses,
        totalFeedbacks,
        subscriptionBreakdown,
        expiredSubscriptions,
        expiringSoon,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
