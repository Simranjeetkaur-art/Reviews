import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const includeAdmin = searchParams.get("includeAdmin") === "true"; // For reassignment purposes
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    // Exclude admin users from regular user list unless includeAdmin=true
    const where: any = {};
    if (!includeAdmin) {
      where.role = {
        not: "superadmin", // Exclude admin users by default
      };
    }
    if (tier && tier !== "all") {
      where.subscriptionTier = tier;
    }
    if (status && status !== "all") {
      where.subscriptionStatus = status;
    }
    if (search) {
      // SQLite doesn't support case-insensitive mode, use Prisma's case-insensitive workaround
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: { businesses: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        subscriptionTier: u.subscriptionTier,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionStartDate: u.subscriptionStartDate,
        subscriptionEndDate: u.subscriptionEndDate,
        businessCount: u._count.businesses,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
