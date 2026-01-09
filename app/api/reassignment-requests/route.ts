import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeGoogleMapsUrl } from "@/lib/url-normalizer";

// POST - Create reassignment request
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
    const { businessId, reason } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Get the business
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

    // Check if user already has a business with this URL
    const userBusinessWithSameUrl = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
        normalizedGoogleMapsUrl:
          business.normalizedGoogleMapsUrl ||
          normalizeGoogleMapsUrl(business.googleMapsUrl),
        isActive: true,
        id: { not: businessId },
      },
    });

    if (userBusinessWithSameUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have a business ("${userBusinessWithSameUrl.businessName}") registered with this Google Maps URL. Reassignment would create a duplicate.`,
          errorType: "DUPLICATE_GOOGLE_MAPS_URL_OWN",
        },
        { status: 400 },
      );
    }

    // Check if request already exists
    const existingRequest = await prisma.reassignmentRequest.findFirst({
      where: {
        businessId,
        requestedFor: user.id,
        status: { in: ["pending", "approved"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A reassignment request for this business is already pending or approved.",
        },
        { status: 400 },
      );
    }

    // Create request
    const request = await prisma.reassignmentRequest.create({
      data: {
        businessId,
        requestedBy: user.id,
        requestedFor: user.id,
        reason: reason || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Reassignment request submitted successfully. An admin will review your request.",
      request: {
        id: request.id,
        status: request.status,
      },
    });
  } catch (error) {
    console.error("Error creating reassignment request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Get user's reassignment requests
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const requests = await prisma.reassignmentRequest.findMany({
      where: {
        requestedBy: user.id,
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            googleMapsUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Error fetching reassignment requests:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
