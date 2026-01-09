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
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Get admin details for each log
    const adminIds = [...new Set(logs.map((log) => log.adminId))];
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true, name: true },
    });

    const adminMap = new Map(admins.map((a) => [a.id, a]));

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        admin: adminMap.get(log.adminId) || {
          email: "Unknown",
          name: "Unknown",
        },
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details ? JSON.parse(log.details) : null,
        timestamp: log.timestamp,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
