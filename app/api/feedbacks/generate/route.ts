import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFeedbacks } from "@/lib/ai";
import { invalidateFeedbackCache } from "@/lib/cache";
import {
  getCurrentUser,
  canGenerateFeedback,
  isSubscriptionActive,
} from "@/lib/auth";
import { scrapeGoogleMapsAbout } from "@/lib/google-maps-scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      businessName,
      businessType,
      products,
      employees,
      googleMapsAboutUrl,
    } = body;

    if (!businessId || !businessName || !businessType || !products) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Verify business exists and belongs to user
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            feedbacks: true,
          },
        },
      },
    });

    // Use googleMapsAboutUrl from request body, or fall back to business record
    const aboutUrl = googleMapsAboutUrl || business?.googleMapsAboutUrl || null;

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    if (business.ownerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Check subscription status
    if (!isSubscriptionActive(user)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your subscription has expired. Please renew to continue generating reviews.",
          requiresUpgrade: true,
          upgradeUrl: "/pricing",
        },
        { status: 403 },
      );
    }

    // For free tier: Check per-business limit (5 generations per business)
    // For pro/lifetime: Unlimited
    if (user.subscriptionTier === "free") {
      // Get the current generation count for this business
      const currentBusiness = await prisma.business.findUnique({
        where: { id: businessId },
        select: { generationCount: true },
      });

      const currentGenerationCount = currentBusiness?.generationCount || 0;

      // Check if this business has reached its limit (5 generations)
      if (currentGenerationCount >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: `You've reached your free tier limit of 5 feedback generations for ${business.businessName}. You've used ${currentGenerationCount}/5 generations. Please upgrade to Pro (₹9,999 / 6 months) to continue.`,
            requiresUpgrade: true,
            upgradeUrl: "/pricing",
            businessName: business.businessName,
            currentUsage: currentGenerationCount,
            limit: 5,
          },
          { status: 403 },
        );
      }
    }

    // Pro and Lifetime: Unlimited (no check needed)

    // Scrape Google Maps About page if URL is provided
    let aboutContent = null;
    if (aboutUrl) {
      try {
        aboutContent = await scrapeGoogleMapsAbout(aboutUrl);
        console.log("Scraped Google Maps About content:", aboutContent);
      } catch (error) {
        console.error("Error scraping Google Maps About page:", error);
        // Continue without about content if scraping fails
      }
    }

    // Generate feedbacks using AI
    const generatedFeedbacks = await generateFeedbacks({
      businessName,
      businessType,
      products: products.map((p: any) => p.name),
      employees: employees?.map((e: any) => e.name),
      aboutContent,
    });

    // Save feedbacks to database
    const savedFeedbacks = await prisma.feedback.createMany({
      data: generatedFeedbacks.map((feedback) => ({
        businessId,
        content: feedback.content,
        sentiment: feedback.sentiment,
        category: feedback.category,
        isActive: true,
      })),
    });

    // Increment generation count for this business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        generationCount: {
          increment: 1,
        },
      },
      select: {
        generationCount: true,
      },
    });

    // Invalidate cache
    await invalidateFeedbackCache(businessId);

    // Calculate usage info for response
    const limit =
      user.subscriptionTier === "free" && user.role !== "superadmin" ? 5 : -1;
    const newGenerationCount = updatedBusiness.generationCount;
    const remaining = limit === -1 ? -1 : limit - newGenerationCount;
    const percentageUsed =
      limit === -1 ? 0 : (newGenerationCount / limit) * 100;

    let status: "available" | "warning" | "limit_reached";
    if (limit === -1) {
      status = "available";
    } else if (newGenerationCount >= limit) {
      status = "limit_reached";
    } else if (percentageUsed >= 80) {
      status = "warning";
    } else {
      status = "available";
    }

    return NextResponse.json({
      success: true,
      count: savedFeedbacks.count,
      message: `Generated ${savedFeedbacks.count} feedback templates`,
      usage: {
        generationCount: newGenerationCount,
        limit: limit,
        remaining: remaining,
        percentageUsed: Math.round(percentageUsed * 10) / 10,
        status: status,
      },
    });
  } catch (error: any) {
    console.error("Error generating feedbacks:", error);

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
        errorType: "GENERATION_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}
