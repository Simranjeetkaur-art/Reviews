import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            businesses: true,
          },
        },
        businesses: {
          select: {
            _count: {
              select: {
                feedbacks: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      subscriptionTier: u.subscriptionTier,
      subscriptionStatus: u.subscriptionStatus,
      businessCount: u._count.businesses,
      feedbackCount: u.businesses.reduce(
        (acc, b) => acc + b._count.feedbacks,
        0,
      ),
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
