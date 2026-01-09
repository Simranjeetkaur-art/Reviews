import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, SUBSCRIPTION_TIERS } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const { subscriptionTier, subscriptionStatus, role } = body;

    // Get the tier limits
    const tierConfig =
      SUBSCRIPTION_TIERS[subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];

    const updateData: Record<string, unknown> = {};

    if (subscriptionTier) {
      updateData.subscriptionTier = subscriptionTier;
      if (tierConfig) {
        updateData.businessLimit =
          tierConfig.businessLimit === -1 ? -1 : tierConfig.businessLimit;
        updateData.feedbackLimit =
          tierConfig.feedbackLimit === -1 ? -1 : tierConfig.feedbackLimit;
      }
    }

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (role) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { userId } = await params;

    // Don't allow deleting superadmin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (targetUser?.role === "superadmin") {
      return NextResponse.json(
        { success: false, error: "Cannot delete superadmin" },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
