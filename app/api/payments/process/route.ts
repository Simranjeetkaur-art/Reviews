import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, calculateProSubscriptionEndDate } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { plan, userId } = body;

    if (!plan || !["pro", "lifetime"].includes(plan)) {
      return NextResponse.json(
        { success: false, error: "Invalid plan selected" },
        { status: 400 },
      );
    }

    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // TODO: Integrate with actual payment gateway (Razorpay, Stripe, etc.)
    // For now, simulate successful payment

    const now = new Date();
    let updateData: any = {
      subscriptionTier: plan,
      subscriptionStatus: "active",
      subscriptionStartDate: now,
    };

    if (plan === "pro") {
      updateData.subscriptionType = "subscription";
      updateData.paymentType = "recurring";
      updateData.subscriptionEndDate = calculateProSubscriptionEndDate(now);
      updateData.businessLimit = -1;
      updateData.feedbackLimit = -1;
    } else if (plan === "lifetime") {
      updateData.subscriptionType = "lifetime";
      updateData.paymentType = "one_time";
      updateData.lifetimePurchaseDate = now;
      updateData.subscriptionEndDate = null; // Never expires
      updateData.businessLimit = -1;
      updateData.feedbackLimit = -1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Log payment activity (if ActivityLog exists)
    try {
      await prisma.activityLog.create({
        data: {
          adminId: user.id,
          action: "subscription_purchased",
          entityType: "subscription",
          entityId: user.id,
          details: JSON.stringify({
            plan,
            price: plan === "pro" ? 9999 : 39999,
            currency: "INR",
            timestamp: now.toISOString(),
          }),
        },
      });
    } catch (error) {
      // ActivityLog might not exist, continue anyway
      console.log("Could not log activity:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      user: {
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
