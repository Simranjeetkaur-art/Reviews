import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIP } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, eventType, feedbackId } = body;

    if (!businessId || !eventType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user agent and IP for analytics (hashed for privacy)
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const ipHash = hashIP(ip);

    // Create analytics event
    await prisma.analytics.create({
      data: {
        businessId,
        eventType,
        feedbackId: feedbackId || null,
        userAgent,
        ipHash,
      },
    });

    // If feedback was selected, increment usage count
    if (eventType === "feedback_selected" && feedbackId) {
      await prisma.feedback.update({
        where: { id: feedbackId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
