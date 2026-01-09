import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canCreateBusiness } from "@/lib/auth";
import {
  normalizeGoogleMapsUrl,
  isValidGoogleMapsUrl,
} from "@/lib/url-normalizer";
import { logBusinessActivity } from "@/lib/activity-logger";

// GET all businesses (for admin/superadmin)
export async function GET() {
  try {
    const user = await getCurrentUser();

    // If superadmin, return all businesses
    if (user?.role === "superadmin") {
      const businesses = await prisma.business.findMany({
        include: {
          products: true,
          employees: true,
          _count: {
            select: { feedbacks: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        businesses: businesses.map((b) => ({
          id: b.id,
          businessName: b.businessName,
          businessType: b.businessType,
          googleMapsUrl: b.googleMapsUrl,
          products: b.products.map((p) => p.name),
          employees: b.employees.map((e) => e.name),
          feedbackCount: b._count.feedbacks,
          createdAt: b.createdAt,
        })),
      });
    }

    // For regular users, return only their businesses
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const businesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        products: true,
        employees: true,
        _count: {
          select: { feedbacks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      businesses: businesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        businessType: b.businessType,
        googleMapsUrl: b.googleMapsUrl,
        products: b.products.map((p) => p.name),
        employees: b.employees.map((e) => e.name),
        feedbackCount: b._count.feedbacks,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching businesses:", error);

    let errorMessage = "Internal server error";
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorType: "SERVER_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      googleMapsUrl,
      googleMapsAboutUrl,
      products,
      employees,
    } = body;

    if (!businessName || !businessType || !googleMapsUrl || !products) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get current user or create demo user for unauthenticated access
    let user = await getCurrentUser();

    if (!user) {
      // Create or get demo user for unauthenticated access
      const demoUser = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: {
          email: "demo@example.com",
          passwordHash: "demo-hash",
          name: "Demo User",
          role: "owner",
        },
      });
      user = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        subscriptionTier: demoUser.subscriptionTier,
        subscriptionStatus: demoUser.subscriptionStatus,
        businessLimit: demoUser.businessLimit,
        feedbackLimit: demoUser.feedbackLimit,
      };
    }

    // Admin users have no restrictions - skip all checks
    if (user.role === "superadmin") {
      // Admin can create unlimited businesses without any restrictions
      // Skip subscription check, business limit check, etc.
    } else {
      // Check subscription status for regular users
      const { isSubscriptionActive } = await import("@/lib/auth");
      if (!isSubscriptionActive(user)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your subscription has expired. Please renew to continue using ReviewBoost.",
            requiresUpgrade: true,
            upgradeUrl: "/pricing",
          },
          { status: 403 },
        );
      }

      // Check business limit (all tiers allow unlimited businesses now)
      const businessCount = await prisma.business.count({
        where: { ownerId: user.id },
      });

      if (!canCreateBusiness(user, businessCount)) {
        return NextResponse.json(
          {
            success: false,
            error: "Business limit reached. Please upgrade your plan.",
          },
          { status: 403 },
        );
      }
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

    // Check for duplicate Google Maps URL across ALL users (not just current user)
    // This prevents any user from registering the same Google Maps Review URL
    // First check exact match
    let existingBusinessWithUrl = await prisma.business.findFirst({
      where: {
        googleMapsUrl: trimmedUrl,
        isActive: true, // Only check active businesses
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        products: true,
        employees: true,
      },
    });

    // If no exact match, check all active businesses and compare normalized URLs
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
            },
          },
          products: true,
          employees: true,
        },
      });

      // Find business with matching normalized URL
      existingBusinessWithUrl =
        allActiveBusinesses.find((b) => {
          const existingNormalized = normalizeGoogleMapsUrl(b.googleMapsUrl);
          return existingNormalized === normalizedGoogleMapsUrl;
        }) || null;
    }

    // Check if duplicate exists - if so, archive existing business and create new one as inactive
    let isDuplicate = false;
    let existingBusinessToArchive = null;
    if (existingBusinessWithUrl) {
      isDuplicate = true;
      existingBusinessToArchive = existingBusinessWithUrl;
      
      // Get admin user
      const adminUser = await prisma.user.findFirst({
        where: { role: "superadmin" },
      });

      if (adminUser && existingBusinessToArchive.ownerId !== adminUser.id) {
        // Store previous state before archiving
        const previousState = {
          ownerId: existingBusinessToArchive.ownerId,
          businessName: existingBusinessToArchive.businessName,
          businessType: existingBusinessToArchive.businessType,
          googleMapsUrl: existingBusinessToArchive.googleMapsUrl,
          normalizedGoogleMapsUrl: existingBusinessToArchive.normalizedGoogleMapsUrl,
          googleMapsAboutUrl: existingBusinessToArchive.googleMapsAboutUrl,
          businessLocation: existingBusinessToArchive.businessLocation,
          aboutBusiness: existingBusinessToArchive.aboutBusiness,
          brandLogo: existingBusinessToArchive.brandLogo,
          generationCount: existingBusinessToArchive.generationCount,
          isActive: existingBusinessToArchive.isActive,
        };

        // Archive existing business: move to admin, mark inactive, store previous state
        await prisma.business.update({
          where: { id: existingBusinessToArchive.id },
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
          businessId: existingBusinessToArchive.id,
          userId: adminUser.id,
          action: "product_updated",
          entityType: "product",
          entityName: existingBusinessToArchive.businessName,
          details: {
            action: "archived_due_to_duplicate",
            previousOwner: existingBusinessToArchive.owner.email,
            archivedBy: "system",
            reason: "Duplicate Google Maps URL detected during new business creation",
          },
        });
      }
    }

    // Check for duplicate business name (case-insensitive, including deleted businesses)
    // This prevents users from creating the same business name again
    const normalizedBusinessName = businessName.trim().toLowerCase();
    const allUserBusinesses = await prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        products: true,
        employees: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const duplicateBusiness = allUserBusinesses.find(
      (b) => b.businessName.trim().toLowerCase() === normalizedBusinessName,
    );

    if (duplicateBusiness) {
      // Return previous registration details
      return NextResponse.json(
        {
          success: false,
          error: `A business with the name "${businessName}" already exists. Please use a different name.`,
          errorType: "DUPLICATE_BUSINESS_NAME",
          previousRegistration: {
            businessName: duplicateBusiness.businessName,
            businessType: duplicateBusiness.businessType,
            googleMapsUrl: duplicateBusiness.googleMapsUrl,
            products: duplicateBusiness.products.map((p) => p.name),
            employees: duplicateBusiness.employees.map((e) => e.name),
            registeredAt: duplicateBusiness.createdAt.toISOString(),
            deletedAt: duplicateBusiness.deletedAt?.toISOString() || null,
            generationCount: duplicateBusiness.generationCount,
            status: duplicateBusiness.isActive ? "active" : "deleted",
          },
          resolutionOptions: [
            "Use a different business name",
            "Contact admin to reactivate previous business",
            "Upgrade to Pro to reset limits",
          ],
        },
        { status: 400 },
      );
    }

    // Create business with products and employees
    // If duplicate URL found, mark as inactive so user can use "Connect" button
    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        businessName,
        businessType,
        googleMapsUrl: trimmedUrl, // Store trimmed URL
        normalizedGoogleMapsUrl: normalizedGoogleMapsUrl, // Store normalized for duplicate checking
        googleMapsAboutUrl: googleMapsAboutUrl || null,
        businessLocation: body.businessLocation || null,
        aboutBusiness: body.aboutBusiness || null,
        brandLogo: body.brandLogo || null,
        isActive: !isDuplicate, // Mark as inactive if duplicate
        deletedAt: isDuplicate ? new Date() : null, // Set deletedAt if duplicate
        archivedAt: isDuplicate ? new Date() : null, // Set archivedAt if duplicate
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

    // Log initial products
    for (const product of business.products) {
      await logBusinessActivity({
        businessId: business.id,
        userId: user.id,
        action: "product_created",
        entityType: "product",
        entityId: product.id,
        entityName: product.name,
        details: { name: product.name, initialCreation: true },
      });
    }

    // Log initial employees
    for (const employee of business.employees) {
      await logBusinessActivity({
        businessId: business.id,
        userId: user.id,
        action: "employee_created",
        entityType: "employee",
        entityId: employee.id,
        entityName: employee.name,
        details: { name: employee.name, initialCreation: true },
      });
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        businessName: business.businessName,
        businessType: business.businessType,
        googleMapsUrl: business.googleMapsUrl,
        isActive: business.isActive,
        isDuplicate: isDuplicate,
        products: business.products,
        employees: business.employees,
      },
      message: isDuplicate
        ? "Business created but marked as inactive due to duplicate Google Maps URL. Use the 'Connect' button to move it to admin archives."
        : "Business created successfully",
    });
  } catch (error: any) {
    console.error("Error creating business:", error);

    // Provide detailed error message
    let errorMessage = "Internal server error";
    let errorType = "SERVER_ERROR";

    // Check for Prisma errors
    if (error?.code === "P2002") {
      errorMessage =
        "A business with this information already exists. Please use different details.";
      errorType = "DUPLICATE_ENTRY";
    } else if (error?.code === "P2003") {
      errorMessage =
        "Invalid user or owner reference. Please try logging in again.";
      errorType = "INVALID_REFERENCE";
    } else if (error?.message) {
      // Check for Prisma validation errors (unknown argument errors)
      if (error.message.includes("Unknown argument")) {
        const fieldMatch = error.message.match(/Unknown argument `(\w+)`/);
        if (fieldMatch) {
          errorMessage = `The system is being updated. Please refresh the page and try again. If the problem persists, please contact support.`;
          errorType = "SCHEMA_MISMATCH";
        } else {
          errorMessage =
            "An error occurred while creating your business. Please refresh the page and try again.";
          errorType = "VALIDATION_ERROR";
        }
      } else if (
        error.message.includes("prisma") ||
        error.message.includes("Prisma") ||
        error.message.includes("__TURBOPACK__")
      ) {
        // Generic Prisma/database errors - show user-friendly message
        errorMessage =
          "A database error occurred. Please refresh the page and try again. If the problem persists, please contact support.";
        errorType = "DATABASE_ERROR";
      } else {
        // Other errors - use the message but make it user-friendly
        errorMessage = error.message;
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Only include technical details in development mode
    const response: any = {
      success: false,
      error: errorMessage,
      errorType: errorType,
    };

    if (process.env.NODE_ENV === "development") {
      response.details = error?.message || String(error);
      if (error?.stack) {
        response.stack = error.stack;
      }
    }

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - Validate Google Maps URL before Step 2
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleMapsUrl } = body;

    if (!googleMapsUrl) {
      return NextResponse.json(
        { success: false, error: "Google Maps URL is required" },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Validate URL format
    if (!isValidGoogleMapsUrl(googleMapsUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Google Maps Review URL format",
          errorType: "INVALID_GOOGLE_MAPS_URL",
        },
        { status: 400 },
      );
    }

    // Normalize and check for duplicates
    const normalizedUrl = normalizeGoogleMapsUrl(googleMapsUrl);
    const trimmedUrl = googleMapsUrl.trim();

    // Check for exact match
    let existingBusiness = await prisma.business.findFirst({
      where: {
        OR: [
          { googleMapsUrl: trimmedUrl },
          { normalizedGoogleMapsUrl: normalizedUrl },
        ],
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If no exact match, check normalized URLs
    if (!existingBusiness) {
      const allActive = await prisma.business.findMany({
        where: { isActive: true, normalizedGoogleMapsUrl: { not: null } },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      existingBusiness = allActive.find(
        (b) => b.normalizedGoogleMapsUrl === normalizedUrl,
      ) as any;
    }

    if (existingBusiness) {
      const isOwnBusiness = existingBusiness.ownerId === user.id;
      const isAdmin = user.role === "superadmin";

      return NextResponse.json(
        {
          success: false,
          error: isOwnBusiness
            ? `You already have a business ("${existingBusiness.businessName}") registered with this Google Maps URL. Each Google Maps location can only be registered once per account.`
            : `This Google Maps Review URL is already registered by another user. Each Google Maps location can only be registered once across all accounts.`,
          errorType: isOwnBusiness
            ? "DUPLICATE_GOOGLE_MAPS_URL_OWN"
            : "DUPLICATE_GOOGLE_MAPS_URL",
          isAdmin,
          existingBusiness: {
            id: existingBusiness.id,
            businessName: existingBusiness.businessName,
            businessType: existingBusiness.businessType,
            googleMapsUrl: existingBusiness.googleMapsUrl,
            ownerEmail: existingBusiness.owner.email,
            ownerName: existingBusiness.owner.name,
            ownerRole: existingBusiness.owner.role,
            registeredAt: existingBusiness.createdAt.toISOString(),
          },
          resolutionOptions: isOwnBusiness
            ? ["Use a different Google Maps Review URL"]
            : isAdmin
              ? [
                  "Reassign this business to the current user",
                  "Use a different Google Maps Review URL",
                  "View the existing business owner's details",
                ]
              : [
                  "Request admin to reassign this business to you",
                  "Use a different Google Maps Review URL",
                  "Contact Support for assistance",
                ],
          supportMessage:
            "Please contact our Support team to request business reassignment. Our support team will assist you with transferring the business registration.",
        },
        { status: 400 },
      );
    }

    // URL is valid and unique
    return NextResponse.json({
      success: true,
      message: "Google Maps URL is valid and available",
    });
  } catch (error) {
    console.error("Error validating URL:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
