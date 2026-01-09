import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logBusinessActivity } from "@/lib/activity-logger";

export async function GET(
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            subscriptionType: true,
            paymentType: true,
            lifetimePurchaseDate: true,
          },
        },
        products: true,
        employees: true,
        reactivations: {
          orderBy: { reactivatedAt: "desc" },
        },
        _count: {
          select: { feedbacks: true, analytics: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        businessName: business.businessName,
        businessType: business.businessType,
        googleMapsUrl: business.googleMapsUrl,
        generationCount: business.generationCount,
        isActive: business.isActive,
        deletedAt: business.deletedAt,
        deletedBy: business.deletedBy,
        owner: business.owner,
        products: business.products,
        employees: business.employees,
        reactivations: business.reactivations,
        feedbackCount: business._count.feedbacks,
        analyticsCount: business._count.analytics,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const { isActive, generationCount } = body;

    const updateData: any = {};
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      if (!isActive) {
        updateData.deletedAt = new Date();
        updateData.deletedBy = currentUser.id;
      } else {
        updateData.deletedAt = null;
        updateData.deletedBy = null;
      }
    }
    if (generationCount !== undefined) {
      updateData.generationCount = generationCount;
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    // Log activity using BusinessActivityLog
    const actionDetails: any = {};
    if (isActive !== undefined) {
      actionDetails.status = isActive ? "activated" : "deactivated";
    }
    if (generationCount !== undefined) {
      actionDetails.generationCount = generationCount;
    }

    await logBusinessActivity({
      businessId,
      userId: currentUser.id,
      action: "product_updated", // Using existing action type for business updates
      entityType: "product", // Using existing entity type
      entityName: business.businessName,
      details: {
        ...actionDetails,
        updatedBy: "admin",
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        isActive: business.isActive,
        generationCount: business.generationCount,
      },
    });
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Soft delete
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "business_deleted",
        entityType: "business",
        entityId: businessId,
        details: JSON.stringify({ businessName: business.businessName }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
