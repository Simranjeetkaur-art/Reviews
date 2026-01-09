import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required",
        },
        { status: 400 },
      );
    }

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userWithPassword) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Verify current password
    const isValid = await verifyPassword(
      currentPassword,
      userWithPassword.passwordHash,
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
