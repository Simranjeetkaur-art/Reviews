"use client";

import { useState, useEffect } from "react";
import { Activity, Package, Users, Trash2, Plus, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: any;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface BusinessActivityLogProps {
  businessId: string;
  isAdmin?: boolean;
}

export function BusinessActivityLog({
  businessId,
  isAdmin = false,
}: BusinessActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [businessId, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/activity?page=${page}&limit=${isAdmin ? 50 : 10}`,
      );
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string, entityType: string) => {
    if (action.includes("delete"))
      return <Trash2 className="w-4 h-4 text-red-400" />;
    if (action.includes("create"))
      return <Plus className="w-4 h-4 text-green-400" />;
    if (action.includes("update"))
      return <Edit className="w-4 h-4 text-blue-400" />;
    return entityType === "product" ? (
      <Package className="w-4 h-4" />
    ) : (
      <Users className="w-4 h-4" />
    );
  };

  const getActionText = (
    action: string,
    entityType: string,
    entityName?: string,
  ) => {
    const entity = entityType === "product" ? "product" : "employee";
    const name = entityName || "item";

    if (action.includes("create")) return `Created ${entity} "${name}"`;
    if (action.includes("update")) return `Updated ${entity} "${name}"`;
    if (action.includes("delete")) return `Deleted ${entity} "${name}"`;
    return `${action} on ${entity}`;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            Loading activity logs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity {!isAdmin && "(Last 10)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-slate-400 text-center py-4">
            No activity logs yet
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700"
              >
                <div className="mt-0.5">
                  {getActionIcon(log.action, log.entityType)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    {getActionText(log.action, log.entityType, log.entityName)}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    by {log.user.name || log.user.email} •{" "}
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdmin && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
