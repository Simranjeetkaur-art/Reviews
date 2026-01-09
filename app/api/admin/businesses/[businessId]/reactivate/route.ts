import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    const { resetGenerationCount, reason } = body;

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

    const previousGenerationCount = business.generationCount;

    // Reactivate business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        generationCount: resetGenerationCount ? 0 : business.generationCount,
      },
    });

    // Create reactivation record
    await prisma.businessReactivation.create({
      data: {
        businessId: businessId,
        reactivatedBy: currentUser.id,
        reason: reason || "Admin reactivation",
        previousGenerationCount,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "business_reactivated",
        entityType: "business",
        entityId: businessId,
        details: JSON.stringify({
          businessName: business.businessName,
          resetGenerationCount,
          previousGenerationCount,
          reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        id: updatedBusiness.id,
        isActive: updatedBusiness.isActive,
        generationCount: updatedBusiness.generationCount,
      },
      message: "Business reactivated successfully",
    });
  } catch (error) {
    console.error("Error reactivating business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
