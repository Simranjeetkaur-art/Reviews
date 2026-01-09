import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // 'active' | 'expired' | 'expiring_soon' | 'cancelled'

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let where: any = {
      subscriptionTier: { in: ["pro", "lifetime"] },
      role: {
        not: "superadmin", // Exclude admin users from payments
      },
    };

    if (status === "active") {
      where.subscriptionStatus = "active";
      where.subscriptionEndDate = { gte: now };
    } else if (status === "expired") {
      where.OR = [
        { subscriptionStatus: "expired" },
        {
          subscriptionStatus: "active",
          subscriptionEndDate: { lt: now },
        },
      ];
    } else if (status === "expiring_soon") {
      where.subscriptionStatus = "active";
      where.subscriptionEndDate = {
        lte: sevenDaysFromNow,
        gte: now,
      };
    } else if (status === "cancelled") {
      where.subscriptionStatus = "cancelled";
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: {
          select: { businesses: true },
        },
      },
      orderBy: { subscriptionEndDate: "desc" },
    });

    // Calculate payment status for each user
    const payments = users.map((user) => {
      let paymentStatus: string;
      if (user.subscriptionTier === "free") {
        paymentStatus = "free";
      } else if (user.subscriptionStatus === "cancelled") {
        paymentStatus = "cancelled";
      } else if (!user.subscriptionEndDate) {
        paymentStatus = "unknown";
      } else if (user.subscriptionEndDate < now) {
        paymentStatus = "expired";
      } else if (
        user.subscriptionEndDate <= sevenDaysFromNow &&
        user.subscriptionEndDate >= now
      ) {
        paymentStatus = "expiring_soon";
      } else {
        paymentStatus = "active";
      }

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: "owner", // All users in payments are owners (admin excluded)
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        businessCount: user._count.businesses,
        paymentStatus,
      };
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
