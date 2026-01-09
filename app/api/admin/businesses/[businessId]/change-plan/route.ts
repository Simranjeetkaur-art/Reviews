import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST - Change subscription plan for a business (changes owner's plan)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { businessId } = await params;
    const body = await request.json();
    const { subscriptionTier, subscriptionStatus } = body;

    if (!subscriptionTier) {
      return NextResponse.json(
        { success: false, error: "Subscription tier is required" },
        { status: 400 },
      );
    }

    // Get the business to find the owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Don't allow changing plan for admin businesses (admin has ADMIN PLAN with no restrictions)
    if (business.owner.role === "superadmin") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot change plan for admin businesses. Admin has ADMIN PLAN with no restrictions.",
        },
        { status: 400 },
      );
    }

    // Update the owner's subscription tier and status
    const updateData: any = {
      subscriptionTier,
    };

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    // Set subscription dates if upgrading to Pro
    if (
      subscriptionTier === "pro" &&
      business.owner.subscriptionTier !== "pro"
    ) {
      updateData.subscriptionStartDate = new Date();
      updateData.subscriptionEndDate = new Date();
      updateData.subscriptionEndDate.setMonth(
        updateData.subscriptionEndDate.getMonth() + 3,
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: business.ownerId },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "business_plan_changed",
        entityType: "business",
        entityId: businessId,
        details: JSON.stringify({
          businessName: business.businessName,
          ownerEmail: business.owner.email,
          oldTier: business.owner.subscriptionTier,
          newTier: subscriptionTier,
          newStatus: subscriptionStatus || business.owner.subscriptionStatus,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plan updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionTier: updatedUser.subscriptionTier,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Error changing business plan:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
