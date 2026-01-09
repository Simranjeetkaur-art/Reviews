import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Get user profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        ownerName: true,
        primaryContact: true,
        secondaryContact: true,
        address: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: userData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, ownerName, primaryContact, secondaryContact, address } = body;

    // Validate phone numbers if provided
    if (primaryContact && !/^[\d\s\-\+\(\)]+$/.test(primaryContact)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid primary contact number format",
        },
        { status: 400 },
      );
    }

    if (secondaryContact && !/^[\d\s\-\+\(\)]+$/.test(secondaryContact)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid secondary contact number format",
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : undefined,
        ownerName: ownerName !== undefined ? ownerName : undefined,
        primaryContact:
          primaryContact !== undefined ? primaryContact : undefined,
        secondaryContact:
          secondaryContact !== undefined ? secondaryContact : undefined,
        address: address !== undefined ? address : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        ownerName: true,
        primaryContact: true,
        secondaryContact: true,
        address: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
