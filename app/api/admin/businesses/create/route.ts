import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  normalizeGoogleMapsUrl,
  isValidGoogleMapsUrl,
} from "@/lib/url-normalizer";

// POST - Create admin business (no restrictions)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { businessName, businessType, googleMapsUrl, products, employees } =
      body;

    if (!businessName || !businessType || !googleMapsUrl || !products) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate Google Maps URL format
    if (!isValidGoogleMapsUrl(googleMapsUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Google Maps Review URL format. Please provide a valid Google Maps URL (e.g., https://g.page/r/... or https://maps.google.com/...).",
          errorType: "INVALID_GOOGLE_MAPS_URL",
        },
        { status: 400 },
      );
    }

    // Normalize the Google Maps URL for duplicate detection
    const normalizedGoogleMapsUrl = normalizeGoogleMapsUrl(googleMapsUrl);
    const trimmedUrl = googleMapsUrl.trim();

    // Check for duplicate Google Maps URL (even for admin, to maintain data integrity)
    // First check exact match
    let existingBusinessWithUrl = await prisma.business.findFirst({
      where: {
        googleMapsUrl: trimmedUrl,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    // If no exact match, check normalized URLs
    if (!existingBusinessWithUrl) {
      const allActiveBusinesses = await prisma.business.findMany({
        where: {
          isActive: true,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            },
          },
        },
      });

      // Find business with matching normalized URL
      existingBusinessWithUrl =
        allActiveBusinesses.find((b) => {
          const existingNormalized = normalizeGoogleMapsUrl(b.googleMapsUrl);
          return existingNormalized === normalizedGoogleMapsUrl;
        }) || null;
    }

    if (existingBusinessWithUrl) {
      // Get full owner details including subscription info
      const owner = await prisma.user.findUnique({
        where: { id: existingBusinessWithUrl.ownerId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          businessLimit: true,
          feedbackLimit: true,
          _count: {
            select: { businesses: true },
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: `A business with this Google Maps Review URL already exists. Each Google Maps location can only be registered once.`,
          errorType: "DUPLICATE_GOOGLE_MAPS_URL",
          isAdmin: true,
          existingBusiness: {
            id: existingBusinessWithUrl.id,
            businessName: existingBusinessWithUrl.businessName,
            businessType: existingBusinessWithUrl.businessType,
            googleMapsUrl: existingBusinessWithUrl.googleMapsUrl,
            generationCount: existingBusinessWithUrl.generationCount || 0,
          },
          ownerDetails: owner
            ? {
                id: owner.id,
                email: owner.email,
                name: owner.name,
                role: owner.role,
                subscriptionTier:
                  owner.role === "superadmin"
                    ? "admin"
                    : owner.subscriptionTier,
                subscriptionStatus: owner.subscriptionStatus,
                businessLimit: owner.businessLimit,
                feedbackLimit: owner.feedbackLimit,
                businessCount: owner._count.businesses,
              }
            : null,
          resolutionOptions: [
            "Reassign business to another user",
            "Reassign business to Admin",
            "Contact the current owner",
          ],
        },
        { status: 400 },
      );
    }

    // Create admin business (no restrictions, no limits)
    const business = await prisma.business.create({
      data: {
        ownerId: user.id, // Admin owns this business
        businessName,
        businessType,
        googleMapsUrl: trimmedUrl, // Store trimmed URL
        products: {
          create: products
            .filter((p: string) => p.trim() !== "")
            .map((productName: string) => ({
              name: productName,
              category: "General",
            })),
        },
        employees: {
          create:
            employees
              ?.filter((e: string) => e.trim() !== "")
              .map((employeeName: string) => ({
                name: employeeName,
              })) || [],
        },
      },
      include: {
        products: true,
        employees: true,
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        businessName: business.businessName,
        businessType: business.businessType,
        googleMapsUrl: business.googleMapsUrl,
        products: business.products,
        employees: business.employees,
        createdAt: business.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating admin business:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
