import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const businesses = await prisma.business.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        googleMapsUrl: true,
        generationCount: true,
        isActive: true,
        previousState: true,
        archivedAt: true,
        deletedAt: true,
        createdAt: true,
        _count: {
          select: {
            feedbacks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Debug logging
    console.log(`[my-businesses] User ${user.id} has ${businesses.length} businesses`);
    businesses.forEach((b) => {
      console.log(`[my-businesses] Business: ${b.businessName}, isActive: ${b.isActive}, deletedAt: ${b.deletedAt}`);
    });

    // Transform the data
    const formattedBusinesses = businesses.map((b) => ({
      id: b.id,
      businessName: b.businessName,
      businessType: b.businessType,
      googleMapsUrl: b.googleMapsUrl,
      feedbackCount: b._count.feedbacks,
      generationCount: b.generationCount,
      isActive: b.isActive,
      previousState: b.previousState,
      archivedAt: b.archivedAt,
      deletedAt: b.deletedAt,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
