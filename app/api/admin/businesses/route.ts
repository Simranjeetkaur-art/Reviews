import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get("ownerId");
    const tier = searchParams.get("tier");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    // IMPORTANT: Exclude admin businesses (businesses owned by superadmin)
    const where: any = {
      owner: {
        role: {
          not: "superadmin", // Exclude admin businesses
        },
      },
    };
    if (ownerId) {
      where.ownerId = ownerId;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      // SQLite doesn't support case-insensitive mode
      where.OR = [
        { businessName: { contains: search } },
        { businessType: { contains: search } },
      ];
    }

    // If filtering by tier, need to join with User
    if (tier && tier !== "all") {
      where.owner = {
        ...where.owner,
        subscriptionTier: tier,
        role: {
          not: "superadmin", // Still exclude admin businesses
        },
      };
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            },
          },
          _count: {
            select: { feedbacks: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      businesses: businesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        businessType: b.businessType,
        googleMapsUrl: b.googleMapsUrl,
        generationCount: b.generationCount,
        isActive: b.isActive,
        deletedAt: b.deletedAt,
        owner: {
          id: b.owner.id,
          email: b.owner.email,
          name: b.owner.name,
          subscriptionTier: b.owner.subscriptionTier,
          subscriptionStatus: b.owner.subscriptionStatus,
        },
        feedbackCount: b._count.feedbacks,
        createdAt: b.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
