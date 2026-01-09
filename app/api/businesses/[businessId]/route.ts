import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  normalizeGoogleMapsUrl,
  isValidGoogleMapsUrl,
} from "@/lib/url-normalizer";

// GET single business details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: true,
        employees: true,
        _count: {
          select: { feedbacks: true },
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
        googleMapsAboutUrl: business.googleMapsAboutUrl || null,
        businessLocation: business.businessLocation || null,
        aboutBusiness: business.aboutBusiness || null,
        brandLogo: business.brandLogo || null,
        generationCount: business.generationCount,
        products: business.products.map((p) => ({ id: p.id, name: p.name })),
        employees: business.employees.map((e) => ({ id: e.id, name: e.name })),
        feedbackCount: business._count.feedbacks,
        createdAt: business.createdAt,
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

// PUT update business details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const body = await request.json();
    const {
      businessName,
      businessType,
      googleMapsUrl,
      googleMapsAboutUrl,
      products,
      employees,
    } = body;

    // Get current user for authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      include: { products: true, employees: true },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Verify user owns this business (unless admin)
    if (existingBusiness.ownerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Always validate Google Maps URL if provided
    if (googleMapsUrl) {
      // Validate URL format
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

      // Normalize the URL
      const normalizedUrl = normalizeGoogleMapsUrl(googleMapsUrl);
      const trimmedUrl = googleMapsUrl.trim();

      // Check if URL is being changed
      const isUrlChanging = trimmedUrl !== existingBusiness.googleMapsUrl;
      let existingBusinessWithUrl: any = null; // Declare outside to use later

      if (isUrlChanging) {
        // Check for duplicate URL across ALL businesses (excluding current)
        // First check exact match
        existingBusinessWithUrl = await prisma.business.findFirst({
          where: {
            googleMapsUrl: trimmedUrl,
            id: { not: businessId }, // Exclude current business
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
              id: { not: businessId },
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
              const existingNormalized = normalizeGoogleMapsUrl(
                b.googleMapsUrl,
              );
              return existingNormalized === normalizedUrl;
            }) || null;
        }

        if (existingBusinessWithUrl) {
          // Check if it belongs to the same user
          if (existingBusinessWithUrl.ownerId === user.id) {
            return NextResponse.json(
              {
                success: false,
                error: `You already have another business ("${existingBusinessWithUrl.businessName}") registered with this Google Maps URL. Each Google Maps location can only be registered once per account.`,
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

          // Different user - archive existing business and mark current as inactive
          // Get admin user
          const adminUser = await prisma.user.findFirst({
            where: { role: "superadmin" },
          });

          if (adminUser && existingBusinessWithUrl.ownerId !== adminUser.id) {
            // Store previous state before archiving
            const previousState = {
              ownerId: existingBusinessWithUrl.ownerId,
              businessName: existingBusinessWithUrl.businessName,
              businessType: existingBusinessWithUrl.businessType,
              googleMapsUrl: existingBusinessWithUrl.googleMapsUrl,
              normalizedGoogleMapsUrl: existingBusinessWithUrl.normalizedGoogleMapsUrl,
              googleMapsAboutUrl: existingBusinessWithUrl.googleMapsAboutUrl,
              businessLocation: existingBusinessWithUrl.businessLocation,
              aboutBusiness: existingBusinessWithUrl.aboutBusiness,
              brandLogo: existingBusinessWithUrl.brandLogo,
              generationCount: existingBusinessWithUrl.generationCount,
              isActive: existingBusinessWithUrl.isActive,
            };

            // Archive existing business: move to admin, mark inactive, store previous state
            await prisma.business.update({
              where: { id: existingBusinessWithUrl.id },
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
              businessId: existingBusinessWithUrl.id,
              userId: adminUser.id,
              action: "product_updated",
              entityType: "product",
              entityName: existingBusinessWithUrl.businessName,
              details: {
                action: "archived_due_to_duplicate",
                previousOwner: existingBusinessWithUrl.owner.email,
                archivedBy: user.email,
                reason: "Duplicate Google Maps URL detected during business update",
              },
            });
          }

          // Mark current business as inactive - we'll set this in updateData
        }
      }
    }

    // Update business basic info
    const updateData: any = {
      businessName: businessName || existingBusiness.businessName,
      businessType: businessType || existingBusiness.businessType,
      googleMapsAboutUrl:
        googleMapsAboutUrl !== undefined
          ? googleMapsAboutUrl
          : existingBusiness.googleMapsAboutUrl,
      businessLocation:
        body.businessLocation !== undefined
          ? body.businessLocation
          : existingBusiness.businessLocation,
      aboutBusiness:
        body.aboutBusiness !== undefined
          ? body.aboutBusiness
          : existingBusiness.aboutBusiness,
      brandLogo:
        body.brandLogo !== undefined
          ? body.brandLogo
          : existingBusiness.brandLogo,
    };

    // Update URL and normalized URL if provided
    if (googleMapsUrl) {
      const oldUrl = existingBusiness.googleMapsUrl;
      updateData.googleMapsUrl = googleMapsUrl.trim();
      updateData.normalizedGoogleMapsUrl =
        normalizeGoogleMapsUrl(googleMapsUrl);

      // If duplicate was detected, mark current business as inactive
      if (existingBusinessWithUrl && existingBusinessWithUrl.ownerId !== user.id) {
        // Store previous state before marking inactive
        const currentPreviousState = {
          ownerId: existingBusiness.ownerId,
          businessName: existingBusiness.businessName,
          businessType: existingBusiness.businessType,
          googleMapsUrl: existingBusiness.googleMapsUrl,
          normalizedGoogleMapsUrl: existingBusiness.normalizedGoogleMapsUrl,
          googleMapsAboutUrl: existingBusiness.googleMapsAboutUrl,
          businessLocation: existingBusiness.businessLocation,
          aboutBusiness: existingBusiness.aboutBusiness,
          brandLogo: existingBusiness.brandLogo,
          generationCount: existingBusiness.generationCount,
          isActive: existingBusiness.isActive,
        };
        
        updateData.isActive = false;
        updateData.deletedAt = new Date();
        updateData.archivedAt = new Date();
        updateData.previousState = JSON.stringify(currentPreviousState);
      }

      // Log Google Maps URL update activity
      await logBusinessActivity({
        businessId,
        userId: user.id,
        action: "product_updated", // Using existing action type, but for business URL
        entityType: "product", // Using existing entity type
        entityName: "Google Maps URL",
        details: {
          oldUrl: oldUrl,
          newUrl: googleMapsUrl.trim(),
          updatedBy: user.role === "superadmin" ? "admin" : "owner",
        },
      });
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    // Update products if provided
    if (products && Array.isArray(products)) {
      // Get existing products for comparison
      const existingProducts = await prisma.product.findMany({
        where: { businessId },
      });

      // Delete existing products
      await prisma.product.deleteMany({
        where: { businessId },
      });

      // Log deletion of removed products
      const newProductNames = products
        .filter((p: string) => p.trim() !== "")
        .map((p: string) => p.trim().toLowerCase());

      const removedProducts = existingProducts.filter(
        (existing) =>
          !newProductNames.includes(existing.name.trim().toLowerCase()),
      );

      for (const removed of removedProducts) {
        await logBusinessActivity({
          businessId,
          userId: user.id,
          action: "product_deleted",
          entityType: "product",
          entityName: removed.name,
          details: { previousName: removed.name },
        });
      }

      // Create new products
      const createdProducts = await prisma.product.createMany({
        data: products
          .filter((p: string) => p.trim() !== "")
          .map((productName: string) => ({
            businessId,
            name: productName,
            category: "General",
          })),
      });

      // Log creation of new products
      const existingProductNames = existingProducts.map((p) =>
        p.name.trim().toLowerCase(),
      );
      const newProducts = products
        .filter((p: string) => p.trim() !== "")
        .filter(
          (p: string) => !existingProductNames.includes(p.trim().toLowerCase()),
        );

      for (const productName of newProducts) {
        const created = await prisma.product.findFirst({
          where: { businessId, name: productName.trim() },
        });
        if (created) {
          await logBusinessActivity({
            businessId,
            userId: user.id,
            action: "product_created",
            entityType: "product",
            entityId: created.id,
            entityName: created.name,
            details: { name: created.name },
          });
        }
      }
    }

    // Update employees if provided
    if (employees && Array.isArray(employees)) {
      // Get existing employees for comparison
      const existingEmployees = await prisma.employee.findMany({
        where: { businessId },
      });

      // Delete existing employees
      await prisma.employee.deleteMany({
        where: { businessId },
      });

      // Log deletion of removed employees
      const newEmployeeNames = employees
        .filter((e: string) => e.trim() !== "")
        .map((e: string) => e.trim().toLowerCase());

      const removedEmployees = existingEmployees.filter(
        (existing) =>
          !newEmployeeNames.includes(existing.name.trim().toLowerCase()),
      );

      for (const removed of removedEmployees) {
        await logBusinessActivity({
          businessId,
          userId: user.id,
          action: "employee_deleted",
          entityType: "employee",
          entityName: removed.name,
          details: { previousName: removed.name },
        });
      }

      // Create new employees
      const createdEmployees = await prisma.employee.createMany({
        data: employees
          .filter((e: string) => e.trim() !== "")
          .map((employeeName: string) => ({
            businessId,
            name: employeeName,
          })),
      });

      // Log creation of new employees
      const existingEmployeeNames = existingEmployees.map((e) =>
        e.name.trim().toLowerCase(),
      );
      const newEmployees = employees
        .filter((e: string) => e.trim() !== "")
        .filter(
          (e: string) =>
            !existingEmployeeNames.includes(e.trim().toLowerCase()),
        );

      for (const employeeName of newEmployees) {
        const created = await prisma.employee.findFirst({
          where: { businessId, name: employeeName.trim() },
        });
        if (created) {
          await logBusinessActivity({
            businessId,
            userId: user.id,
            action: "employee_created",
            entityType: "employee",
            entityId: created.id,
            entityName: created.name,
            details: { name: created.name },
          });
        }
      }
    }

    // Fetch updated business with relations
    const finalBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: true,
        employees: true,
      },
    });

    return NextResponse.json({
      success: true,
      business: {
        id: finalBusiness!.id,
        businessName: finalBusiness!.businessName,
        businessType: finalBusiness!.businessType,
        googleMapsUrl: finalBusiness!.googleMapsUrl,
        googleMapsAboutUrl: finalBusiness!.googleMapsAboutUrl || null,
        businessLocation: finalBusiness!.businessLocation || null,
        aboutBusiness: finalBusiness!.aboutBusiness || null,
        brandLogo: finalBusiness!.brandLogo || null,
        products: finalBusiness!.products.map((p) => p.name),
        employees: finalBusiness!.employees.map((e) => e.name),
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

// DELETE business
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;

    // Check if business exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Delete business (cascades to products, employees, feedbacks, analytics)
    await prisma.business.delete({
      where: { id: businessId },
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
