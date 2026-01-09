import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: {
          include: {
            _count: {
              select: { feedbacks: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { businesses: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Also fetch businesses that were archived from this user (have previousState with this user's ID)
    // These are businesses that were moved to admin due to duplicate URLs
    const archivedBusinesses = await prisma.business.findMany({
      where: {
        previousState: {
          contains: `"ownerId":"${userId}"`,
        },
        owner: {
          role: "superadmin",
        },
      },
      include: {
        _count: {
          select: { feedbacks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Combine current businesses with archived businesses
    const allBusinesses = [
      ...user.businesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        businessType: b.businessType,
        generationCount: b.generationCount,
        isActive: b.isActive,
        feedbackCount: b._count.feedbacks,
        createdAt: b.createdAt,
        isArchived: false,
      })),
      ...archivedBusinesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        businessType: b.businessType,
        generationCount: b.generationCount,
        isActive: false, // Archived businesses are always inactive
        feedbackCount: b._count.feedbacks,
        createdAt: b.createdAt,
        isArchived: true,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        businessLimit: user.businessLimit,
        feedbackLimit: user.feedbackLimit,
        businesses: allBusinesses,
        businessCount: allBusinesses.length,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const {
      subscriptionTier,
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
    } = body;

    const updateData: any = {};
    if (subscriptionTier) updateData.subscriptionTier = subscriptionTier;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
    if (subscriptionStartDate)
      updateData.subscriptionStartDate = new Date(subscriptionStartDate);
    if (subscriptionEndDate)
      updateData.subscriptionEndDate = new Date(subscriptionEndDate);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "user_updated",
        entityType: "user",
        entityId: userId,
        details: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
      },
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

    // Soft delete: deactivate user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "cancelled" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "user_deleted",
        entityType: "user",
        entityId: userId,
        details: JSON.stringify({ email: user.email }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
