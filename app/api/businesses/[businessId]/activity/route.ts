import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Get activity logs for a business
export async function GET(
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

    // Verify business exists and user has access
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Check access (owner or admin)
    if (business.ownerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit =
      user.role === "superadmin"
        ? parseInt(searchParams.get("limit") || "50")
        : 10; // Individual users see max 10
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const where: any = { businessId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.businessActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip,
      }),
      prisma.businessActivityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        details: log.details ? JSON.parse(log.details) : null,
        timestamp: log.timestamp,
        user: log.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
