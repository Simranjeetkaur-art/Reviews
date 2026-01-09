import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Fetch admin businesses (businesses owned by superadmin)
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
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const archived = searchParams.get("archived"); // New filter for archived businesses
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause - only admin businesses
    const where: any = {
      owner: {
        role: "superadmin",
      },
    };

    if (archived === "true") {
      // Show only archived businesses (inactive with previousState)
      where.isActive = false;
      where.previousState = { not: null };
    } else if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { businessType: { contains: search } },
      ];
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
        previousState: b.previousState,
        archivedAt: b.archivedAt,
        owner: {
          id: b.owner.id,
          email: b.owner.email,
          name: b.owner.name,
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
    console.error("Error fetching admin businesses:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
