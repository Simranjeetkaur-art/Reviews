import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedFeedbacks, setCachedFeedbacks } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const getAll = searchParams.get("all") === "true";

    // Only use cache if we're not requesting all feedbacks
    if (!getAll) {
      const cached = await getCachedFeedbacks(businessId);
      if (cached) {
        return NextResponse.json({
          success: true,
          feedbacks: cached.feedbacks,
          business: cached.business,
          fromCache: true,
        });
      }
    }

    // Get business data
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        googleMapsUrl: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Get active feedbacks with load balancing (least used first)
    const feedbacks = await prisma.feedback.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: {
        usageCount: "asc", // Load balancing: show least used feedbacks first
      },
      take: getAll ? undefined : 12, // Get all if requested, otherwise limit to 12
      select: {
        id: true,
        content: true,
        sentiment: true,
        category: true,
      },
    });

    // Shuffle to add randomness while maintaining load balancing (only for limited results)
    const shuffled = getAll
      ? feedbacks
      : feedbacks.sort(() => Math.random() - 0.5);

    // Cache the results (only for limited results, not when getting all)
    if (!getAll) {
      await setCachedFeedbacks(
        businessId,
        {
          feedbacks: shuffled,
          business,
        },
        1800,
      ); // Cache for 30 minutes
    }

    return NextResponse.json({
      success: true,
      feedbacks: shuffled,
      business,
      fromCache: false,
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
