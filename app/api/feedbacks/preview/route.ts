import { NextRequest, NextResponse } from "next/server";
import { generateFeedbacks } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { scrapeGoogleMapsAbout } from "@/lib/google-maps-scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      products,
      employees,
      googleMapsAboutUrl,
    } = body;

    if (!businessName || !businessType || !products) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    // Scrape Google Maps About page if provided
    let aboutContent = null;
    if (googleMapsAboutUrl) {
      try {
        aboutContent = await scrapeGoogleMapsAbout(googleMapsAboutUrl);
      } catch (error) {
        console.error("Error scraping Google Maps About page:", error);
      }
    }

    // Generate full feedbacks (100)
    const allFeedbacks = await generateFeedbacks({
      businessName,
      businessType,
      products: products.map((p: any) => p.name || p),
      employees: employees?.map((e: any) => e.name || e),
      aboutContent,
    });

    // Return only a preview (10 feedbacks - mix of positive and neutral)
    const positiveFeedbacks = allFeedbacks.filter(
      (f) => f.sentiment === "positive",
    );
    const neutralFeedbacks = allFeedbacks.filter(
      (f) => f.sentiment === "neutral",
    );

    // Take 7 positive and 3 neutral for preview
    const previewFeedbacks = [
      ...positiveFeedbacks.slice(0, 7),
      ...neutralFeedbacks.slice(0, 3),
    ].slice(0, 10);

    return NextResponse.json({
      success: true,
      preview: previewFeedbacks,
      totalCount: allFeedbacks.length,
      positiveCount: positiveFeedbacks.length,
      neutralCount: neutralFeedbacks.length,
      message:
        "Preview generated successfully. This is a sample of 10 feedbacks out of 100 total.",
    });
  } catch (error: any) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate preview",
      },
      { status: 500 },
    );
  }
}
