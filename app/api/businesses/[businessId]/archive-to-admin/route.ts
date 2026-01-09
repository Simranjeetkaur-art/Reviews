import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logBusinessActivity } from "@/lib/activity-logger";

// POST - Archive duplicate business to admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { businessId } = await params;

    // Get the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Verify user owns this business
    if (business.ownerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "superadmin" },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 },
      );
    }

    // Store previous state before archiving
    const previousState = {
      ownerId: business.ownerId,
      businessName: business.businessName,
      businessType: business.businessType,
      googleMapsUrl: business.googleMapsUrl,
      normalizedGoogleMapsUrl: business.normalizedGoogleMapsUrl,
      googleMapsAboutUrl: business.googleMapsAboutUrl,
      businessLocation: business.businessLocation,
      aboutBusiness: business.aboutBusiness,
      brandLogo: business.brandLogo,
      generationCount: business.generationCount,
      isActive: business.isActive,
    };

    // Reassign business to admin and mark as inactive
    const archivedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ownerId: adminUser.id,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: adminUser.id,
        previousState: JSON.stringify(previousState),
        archivedAt: new Date(),
      },
    });

    // Log activity
    await logBusinessActivity({
      businessId,
      userId: adminUser.id,
      action: "product_updated",
      entityType: "product",
      entityName: business.businessName,
      details: {
        action: "archived_to_admin",
        previousOwner: business.owner.email,
        archivedBy: user.email,
        reason: "Duplicate Google Maps URL",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business archived to admin successfully",
      business: {
        id: archivedBusiness.id,
        businessName: archivedBusiness.businessName,
        isActive: archivedBusiness.isActive,
      },
    });
  } catch (error) {
    console.error("Error archiving business to admin:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
