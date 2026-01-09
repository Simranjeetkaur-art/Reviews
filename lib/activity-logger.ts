import { prisma } from "@/lib/prisma";

export type ActivityAction =
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "employee_created"
  | "employee_updated"
  | "employee_deleted";

export type ActivityEntityType = "product" | "employee";

interface LogActivityParams {
  businessId: string;
  userId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
}

export async function logBusinessActivity({
  businessId,
  userId,
  action,
  entityType,
  entityId,
  entityName,
  details,
}: LogActivityParams) {
  try {
    await prisma.businessActivityLog.create({
      data: {
        businessId,
        userId,
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging should not break main operations
  }
}
