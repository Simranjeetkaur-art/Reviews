import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if superadmin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "superadmin" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: "Super admin already exists",
        email: existingAdmin.email,
      });
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || "Super Admin",
        role: "superadmin",
        subscriptionTier: "admin",
        subscriptionStatus: "active",
        businessLimit: -1,
        feedbackLimit: -1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Super admin created successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Error creating superadmin:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
