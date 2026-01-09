import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeGoogleMapsUrl } from "@/lib/url-normalizer";

// POST - Reassign business to another user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const { businessId } = await params;
    const body = await request.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return NextResponse.json(
        { success: false, error: "New owner ID is required" },
        { status: 400 },
      );
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
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

    // Verify new owner exists
    const newOwner = await prisma.user.findUnique({
      where: { id: newOwnerId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
      },
    });

    if (!newOwner) {
      return NextResponse.json(
        { success: false, error: "New owner not found" },
        { status: 404 },
      );
    }

    // Check if the new owner already has a business with the same Google Maps URL
    // This prevents creating duplicates when reassigning
    const normalizedUrl = normalizeGoogleMapsUrl(business.googleMapsUrl);
    const trimmedUrl = business.googleMapsUrl.trim();

    // Check for existing business with same URL owned by new owner
    let existingBusinessWithUrl = await prisma.business.findFirst({
      where: {
        ownerId: newOwnerId,
        OR: [{ googleMapsUrl: trimmedUrl }],
        isActive: true,
        id: { not: businessId }, // Exclude current business
      },
    });

    // If no exact match, check normalized URLs
    if (!existingBusinessWithUrl) {
      const allNewOwnerBusinesses = await prisma.business.findMany({
        where: {
          ownerId: newOwnerId,
          isActive: true,
          id: { not: businessId },
        },
      });

      existingBusinessWithUrl =
        allNewOwnerBusinesses.find((b) => {
          const existingNormalized = normalizeGoogleMapsUrl(b.googleMapsUrl);
          return existingNormalized === normalizedUrl;
        }) || null;
    }

    if (existingBusinessWithUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `The new owner already has a business ("${existingBusinessWithUrl.businessName}") registered with this Google Maps URL. Each Google Maps location can only be registered once per account.`,
          errorType: "DUPLICATE_GOOGLE_MAPS_URL_OWN",
          existingBusiness: {
            id: existingBusinessWithUrl.id,
            businessName: existingBusinessWithUrl.businessName,
            googleMapsUrl: existingBusinessWithUrl.googleMapsUrl,
          },
        },
        { status: 400 },
      );
    }

    // Reassign business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        ownerId: newOwnerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        adminId: currentUser.id,
        action: "business_reassigned",
        entityType: "business",
        entityId: businessId,
        details: JSON.stringify({
          businessName: business.businessName,
          previousOwner: {
            id: business.owner.id,
            email: business.owner.email,
            name: business.owner.name,
          },
          newOwner: {
            id: newOwner.id,
            email: newOwner.email,
            name: newOwner.name,
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business reassigned successfully",
      business: {
        id: updatedBusiness.id,
        businessName: updatedBusiness.businessName,
        owner: {
          id: updatedBusiness.owner.id,
          email: updatedBusiness.owner.email,
          name: updatedBusiness.owner.name,
        },
      },
    });
  } catch (error: any) {
    console.error("Error reassigning business:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
        errorType: "REASSIGN_ERROR",
      },
      { status: 500 },
    );
  }
}
