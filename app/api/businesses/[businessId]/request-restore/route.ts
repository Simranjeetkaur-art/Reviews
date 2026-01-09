import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST - Request admin to restore business
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { businessId } = await params;

    // Get the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Verify user owns this business or it's archived
    if (business.ownerId !== user.id && business.isActive) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Check if business has previous state
    if (!business.previousState) {
      return NextResponse.json(
        { success: false, error: "No previous state found to restore" },
        { status: 400 },
      );
    }

    // Create or update reassignment request for restore
    const restoreRequest = await prisma.reassignmentRequest.upsert({
      where: {
        businessId: businessId,
      },
      update: {
        status: "pending",
        reason: "Request to restore business with previous unique Google Maps URL registration",
        updatedAt: new Date(),
      },
      create: {
        businessId: businessId,
        requestedBy: user.id,
        requestedFor: user.id, // Requesting to restore to themselves
        status: "pending",
        reason: "Request to restore business with previous unique Google Maps URL registration",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Restore request created successfully. Admin will review your request.",
      request: {
        id: restoreRequest.id,
        status: restoreRequest.status,
      },
    });
  } catch (error) {
    console.error("Error creating restore request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
