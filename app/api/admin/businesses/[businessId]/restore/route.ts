import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logBusinessActivity } from "@/lib/activity-logger";

// POST - Restore archived business to previous state
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

    // Get the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: true,
        employees: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Check if business has previous state
    if (!business.previousState) {
      return NextResponse.json(
        { success: false, error: "No previous state found to restore" },
        { status: 400 },
      );
    }

    // Parse previous state
    const previousState = JSON.parse(business.previousState);

    // Restore business to previous state
    const restoredBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ownerId: previousState.ownerId,
        businessName: previousState.businessName,
        businessType: previousState.businessType,
        googleMapsUrl: previousState.googleMapsUrl,
        normalizedGoogleMapsUrl: previousState.normalizedGoogleMapsUrl,
        googleMapsAboutUrl: previousState.googleMapsAboutUrl,
        businessLocation: previousState.businessLocation,
        aboutBusiness: previousState.aboutBusiness,
        brandLogo: previousState.brandLogo,
        generationCount: previousState.generationCount,
        isActive: true, // Restore to active
        deletedAt: null,
        deletedBy: null,
        previousState: null, // Clear previous state after restore
        archivedAt: null,
      },
    });

    // Update reassignment request status if exists
    await prisma.reassignmentRequest.updateMany({
      where: {
        businessId: businessId,
        status: "pending",
      },
      data: {
        status: "completed",
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        adminNotes: "Business restored to previous state with unique Google Maps URL",
      },
    });

    // Log activity
    await logBusinessActivity({
      businessId: businessId,
      userId: currentUser.id,
      action: "product_updated",
      entityType: "product",
      entityName: restoredBusiness.businessName,
      details: {
        action: "restored_from_archive",
        restoredBy: currentUser.email,
        restoredTo: previousState.ownerId,
        reason: "Restored to previous unique Google Maps URL registration",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business restored successfully",
      business: {
        id: restoredBusiness.id,
        businessName: restoredBusiness.businessName,
        isActive: restoredBusiness.isActive,
        ownerId: restoredBusiness.ownerId,
      },
    });
  } catch (error) {
    console.error("Error restoring business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
